package com.financeflow.auth.api

import com.financeflow.auth.application.OpaqueToken
import com.financeflow.auth.application.SessionService
import com.financeflow.support.ApiTest
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.system.CapturedOutput
import org.springframework.boot.test.system.OutputCaptureExtension
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import tools.jackson.databind.ObjectMapper
import java.sql.Timestamp
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@ExtendWith(OutputCaptureExtension::class)
class SessionApiTest : ApiTest() {

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var sessionService: SessionService

    @Test
    fun `refresh válido devolve um par novo e o refresh antigo deixa de funcionar`() {
        val old = register().refreshToken()

        val result = refresh(old).andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { isNotEmpty() }
            jsonPath("$.expiresIn") { value(900) }
        }.andReturn()
        val new = result.refreshToken()
        assertNotEquals(old, new)
        assertTrue(result.response.getHeader("Set-Cookie")!!.contains("Path=/api/v1/auth"))

        val oldRow = jdbc.queryForMap("SELECT * FROM refresh_tokens WHERE token_hash = ?", OpaqueToken.hash(old))
        val newId = jdbc.queryForObject(
            "SELECT id FROM refresh_tokens WHERE token_hash = ?", UUID::class.java, OpaqueToken.hash(new),
        )
        assertNotNull(oldRow["revoked_at"])
        assertEquals(newId, oldRow["replaced_by"])

        refresh(old).andExpectInvalidRefreshToken()
    }

    @Test
    fun `access token do refresh autentica em rota protegida`() {
        val body = refresh(register().refreshToken()).andReturn().response.contentAsString
        val token = objectMapper.readTree(body).at("/accessToken").asString()
        // Rota inexistente: 404 em vez de 401 mostra que o token foi aceito
        mockMvc.get("/api/v1/qualquer-coisa") { header("Authorization", "Bearer $token") }
            .andExpect { status { isNotFound() } }
    }

    @Test
    fun `reapresentar um refresh já usado revoga todas as sessões do usuário`() {
        val email = uniqueEmail()
        val first = register(email).refreshToken()
        val second = login(email).andExpect { status { isOk() } }.andReturn().refreshToken()

        val rotated = refresh(first).andExpect { status { isOk() } }.andReturn().refreshToken()
        refresh(first).andExpectInvalidRefreshToken()

        refresh(rotated).andExpectInvalidRefreshToken()
        refresh(second).andExpectInvalidRefreshToken()
    }

    @Test
    fun `logout faz o refresh seguinte falhar e apaga o cookie`() {
        val token = register().refreshToken()

        val cookie = mockMvc.post("/api/v1/auth/logout") { cookie(Cookie("refresh_token", token)) }
            .andExpect { status { isNoContent() } }
            .andReturn().response.getHeader("Set-Cookie")!!
        assertTrue(cookie.startsWith("refresh_token=;"), cookie)
        assertTrue(cookie.contains("Max-Age=0"), cookie)
        assertTrue(cookie.contains("Path=/api/v1/auth"), cookie)

        refresh(token).andExpectInvalidRefreshToken()
    }

    @Test
    fun `logout sem cookie responde 204`() {
        mockMvc.post("/api/v1/auth/logout").andExpect { status { isNoContent() } }
    }

    @Test
    fun `refresh sem cookie ou com token desconhecido retorna 401`() {
        mockMvc.post("/api/v1/auth/refresh") { with { it.remoteAddr = randomIp(); it } }
            .andExpectInvalidRefreshToken()
        refresh("token-que-nao-existe").andExpectInvalidRefreshToken()
    }

    @Test
    fun `refresh expirado retorna 401`() {
        val user = createUser()
        val token = "token-expirado-${UUID.randomUUID()}"
        insertToken(user.id, token, expiresAt = Instant.now().minusSeconds(60))
        refresh(token).andExpectInvalidRefreshToken()
    }

    @Test
    fun `access token vencido enviado junto não impede o refresh`() {
        val token = register().refreshToken()
        mockMvc.post("/api/v1/auth/refresh") {
            with { it.remoteAddr = randomIp(); it }
            header("Authorization", "Bearer token.vencido.qualquer")
            cookie(Cookie("refresh_token", token))
        }.andExpect { status { isOk() } }
    }

    @Test
    fun `a sexta tentativa de login no mesmo minuto e do mesmo IP recebe 429 com Retry-After`() {
        val ip = randomIp()
        repeat(5) {
            login(uniqueEmail(), ip).andExpect { status { isUnauthorized() } }
        }
        login(uniqueEmail(), ip).andExpect {
            status { isTooManyRequests() }
            jsonPath("$.code") { value("TOO_MANY_REQUESTS") }
            header { exists("Retry-After") }
        }
    }

    @Test
    fun `a décima primeira tentativa de login na hora para o mesmo e-mail recebe 429`() {
        val email = uniqueEmail()
        repeat(10) { login(email).andExpect { status { isUnauthorized() } } }
        login(email).andExpect { status { isTooManyRequests() } }
    }

    @Test
    fun `o trigésimo primeiro refresh no mesmo minuto e do mesmo IP recebe 429`() {
        val ip = randomIp()
        repeat(30) { refresh("desconhecido", ip).andExpect { status { isUnauthorized() } } }
        refresh("desconhecido", ip).andExpect {
            status { isTooManyRequests() }
            header { exists("Retry-After") }
        }
    }

    @Test
    fun `job apaga só os refresh tokens expirados há mais de 30 dias`() {
        val user = createUser()
        val old = insertToken(user.id, "antigo-${UUID.randomUUID()}", Instant.now().minus(Duration.ofDays(31)))
        val recent = insertToken(user.id, "recente-${UUID.randomUUID()}", Instant.now().minus(Duration.ofDays(29)))

        assertTrue(sessionService.deleteExpired() >= 1)

        val remaining = jdbc.queryForList("SELECT id FROM refresh_tokens WHERE user_id = ?", UUID::class.java, user.id)
        assertEquals(listOf(recent), remaining)
        assertFalse(old in remaining)
    }

    @Test
    fun `o valor puro do refresh token não aparece em log nem no banco`(output: CapturedOutput) {
        val email = uniqueEmail()
        val tokens = mutableListOf(register(email).refreshToken())
        tokens += refresh(tokens.last()).andReturn().refreshToken()
        refresh(tokens.first()).andExpectInvalidRefreshToken() // reuso gera log de alerta
        tokens += login(email).andReturn().refreshToken()
        mockMvc.post("/api/v1/auth/logout") { cookie(Cookie("refresh_token", tokens.last())) }

        tokens.forEach { token ->
            assertFalse(output.all.contains(token), "token apareceu no log")
            val inDb = jdbc.queryForObject(
                "SELECT count(*) FROM refresh_tokens WHERE token_hash = ? OR id::text = ?", Int::class.java, token, token,
            )
            assertEquals(0, inDb)
        }
    }

    private fun ResultActionsDsl.andExpectInvalidRefreshToken() = andExpect {
        status { isUnauthorized() }
        jsonPath("$.code") { value("INVALID_REFRESH_TOKEN") }
    }

    private fun register(email: String = uniqueEmail()): MvcResult {
        val body = mapOf(
            "name" to "Maria", "email" to email, "password" to PASSWORD, "acceptedPrivacyVersion" to "2026-10",
        )
        return mockMvc.post("/api/v1/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(body)
        }.andExpect { status { isCreated() } }.andReturn()
    }

    private fun login(email: String, ip: String = randomIp()) = mockMvc.post("/api/v1/auth/login") {
        with { it.remoteAddr = ip; it }
        contentType = MediaType.APPLICATION_JSON
        content = objectMapper.writeValueAsString(mapOf("email" to email, "password" to PASSWORD))
    }

    private fun refresh(token: String, ip: String = randomIp()) = mockMvc.post("/api/v1/auth/refresh") {
        with { it.remoteAddr = ip; it }
        cookie(Cookie("refresh_token", token))
    }

    private fun insertToken(userId: UUID, token: String, expiresAt: Instant): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
            id, userId, OpaqueToken.hash(token), Timestamp.from(expiresAt),
        )
        return id
    }

    private fun MvcResult.refreshToken(): String =
        response.getHeader("Set-Cookie")!!.substringAfter("refresh_token=").substringBefore(";")

    private fun uniqueEmail() = "${UUID.randomUUID()}@example.com"

    private fun randomIp() = "10.${(0..255).random()}.${(0..255).random()}.${(0..255).random()}"

    companion object {
        private const val PASSWORD = "senha-forte-1"
    }
}
