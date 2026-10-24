package com.financeflow.auth.api

import com.financeflow.auth.application.OpaqueToken
import com.financeflow.auth.application.PasswordResetService
import com.financeflow.support.ApiTest
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MvcResult
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.post
import tools.jackson.databind.ObjectMapper
import java.sql.Timestamp
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PasswordResetApiTest : ApiTest() {

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var passwordResetService: PasswordResetService

    @Test
    fun `forgot responde igual para e-mail cadastrado e não cadastrado`() {
        val email = uniqueEmail()
        register(email)
        val unknown = uniqueEmail()

        val registered = forgot("  ${email.uppercase()} ").andExpect { status { isNoContent() } }.andReturn()
        val notRegistered = forgot(unknown).andExpect { status { isNoContent() } }.andReturn()

        assertEquals(registered.response.contentAsString, notRegistered.response.contentAsString)
        assertEquals(registered.response.headerNames, notRegistered.response.headerNames)
        assertEquals(1, emailSender.sentTo(email).size)
        assertTrue(emailSender.sentTo(unknown).isEmpty())
    }

    @Test
    fun `o e-mail traz o link do frontend com um token que vale por 1 hora`() {
        val email = uniqueEmail()
        register(email)
        val before = Instant.now()
        forgot(email)

        val message = emailSender.sentTo(email).single()
        assertTrue(message.body.contains("http://localhost:5173/redefinir-senha?token="), message.body)
        val expiresAt = jdbc.queryForObject(
            "SELECT expires_at FROM password_reset_tokens WHERE token_hash = ?",
            Timestamp::class.java, OpaqueToken.hash(lastToken(email)),
        )!!.toInstant()
        val ttl = Duration.between(before, expiresAt)
        assertTrue(ttl > Duration.ofMinutes(59) && ttl <= Duration.ofMinutes(61), "validade: $ttl")
    }

    @Test
    fun `reset troca a senha e revoga as sessões abertas`() {
        val email = uniqueEmail()
        val refreshToken = register(email).refreshToken()
        forgot(email)

        reset(lastToken(email), NEW_PASSWORD).andExpect { status { isNoContent() } }

        login(email, PASSWORD).andExpect { status { isUnauthorized() } }
        login(email, NEW_PASSWORD).andExpect { status { isOk() } }
        refresh(refreshToken).andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_REFRESH_TOKEN") }
        }
    }

    @Test
    fun `o link funciona uma única vez`() {
        val email = uniqueEmail()
        register(email)
        forgot(email)
        val token = lastToken(email)

        reset(token, NEW_PASSWORD).andExpect { status { isNoContent() } }
        reset(token, "outra-senha-2").andExpectInvalidResetToken()
        login(email, NEW_PASSWORD).andExpect { status { isOk() } }
    }

    @Test
    fun `link expirado ou desconhecido é recusado`() {
        val user = createUser()
        val token = OpaqueToken.generate()
        jdbc.update(
            "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
            UUID.randomUUID(), user.id, OpaqueToken.hash(token), Timestamp.from(Instant.now().minusSeconds(1)),
        )

        reset(token, NEW_PASSWORD).andExpectInvalidResetToken()
        reset("token-que-nao-existe", NEW_PASSWORD).andExpectInvalidResetToken()
    }

    @Test
    fun `pedir um link novo invalida os anteriores`() {
        val email = uniqueEmail()
        register(email)
        forgot(email)
        val first = lastToken(email)
        forgot(email)
        val second = lastToken(email)

        reset(first, NEW_PASSWORD).andExpectInvalidResetToken()
        reset(second, NEW_PASSWORD).andExpect { status { isNoContent() } }
    }

    @Test
    fun `senha nova fora da política é recusada e o link continua valendo`() {
        val email = uniqueEmail()
        register(email)
        forgot(email)
        val token = lastToken(email)

        reset(token, "curta").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors[0].field") { value("newPassword") }
        }
        reset(token, NEW_PASSWORD).andExpect { status { isNoContent() } }
    }

    @Test
    fun `o quarto pedido na hora para o mesmo e-mail recebe 429`() {
        val email = uniqueEmail()
        repeat(3) { forgot(email).andExpect { status { isNoContent() } } }
        forgot(email).andExpect {
            status { isTooManyRequests() }
            header { exists("Retry-After") }
        }
    }

    @Test
    fun `o décimo primeiro pedido na hora do mesmo IP recebe 429`() {
        val ip = randomIp()
        repeat(10) { forgot(uniqueEmail(), ip).andExpect { status { isNoContent() } } }
        forgot(uniqueEmail(), ip).andExpect { status { isTooManyRequests() } }
    }

    @Test
    fun `o valor puro do token não fica no banco`() {
        val email = uniqueEmail()
        register(email)
        forgot(email)
        val token = lastToken(email)

        val inDb = jdbc.queryForObject(
            "SELECT count(*) FROM password_reset_tokens WHERE token_hash = ?", Int::class.java, token,
        )
        assertEquals(0, inDb)
    }

    @Test
    fun `job apaga só os links expirados há mais de 30 dias`() {
        val user = createUser()
        val old = insertToken(user.id, Instant.now().minus(Duration.ofDays(31)))
        val recent = insertToken(user.id, Instant.now().minus(Duration.ofDays(29)))

        assertTrue(passwordResetService.deleteExpired() >= 1)

        val remaining = jdbc.queryForList(
            "SELECT id FROM password_reset_tokens WHERE user_id = ?", UUID::class.java, user.id,
        )
        assertEquals(listOf(recent), remaining)
        assertFalse(old in remaining)
    }

    private fun ResultActionsDsl.andExpectInvalidResetToken() = andExpect {
        status { isUnprocessableContent() }
        jsonPath("$.code") { value("INVALID_RESET_TOKEN") }
    }

    private fun lastToken(email: String): String =
        emailSender.sentTo(email).last().body.substringAfter("?token=").substringBefore("\n").trim()

    private fun register(email: String): MvcResult {
        val body = mapOf(
            "name" to "Maria", "email" to email, "password" to PASSWORD, "acceptedPrivacyVersion" to "2026-10",
        )
        return mockMvc.post("/api/v1/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(body)
        }.andExpect { status { isCreated() } }.andReturn()
    }

    private fun forgot(email: String, ip: String = randomIp()) = mockMvc.post("/api/v1/auth/password/forgot") {
        with { it.remoteAddr = ip; it }
        contentType = MediaType.APPLICATION_JSON
        content = objectMapper.writeValueAsString(mapOf("email" to email))
    }

    private fun reset(token: String, newPassword: String) = mockMvc.post("/api/v1/auth/password/reset") {
        contentType = MediaType.APPLICATION_JSON
        content = objectMapper.writeValueAsString(mapOf("token" to token, "newPassword" to newPassword))
    }

    private fun login(email: String, password: String) = mockMvc.post("/api/v1/auth/login") {
        with { it.remoteAddr = randomIp(); it }
        contentType = MediaType.APPLICATION_JSON
        content = objectMapper.writeValueAsString(mapOf("email" to email, "password" to password))
    }

    private fun refresh(token: String) = mockMvc.post("/api/v1/auth/refresh") {
        with { it.remoteAddr = randomIp(); it }
        cookie(Cookie("refresh_token", token))
    }

    private fun insertToken(userId: UUID, expiresAt: Instant): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
            id, userId, OpaqueToken.hash(OpaqueToken.generate()), Timestamp.from(expiresAt),
        )
        return id
    }

    private fun MvcResult.refreshToken(): String =
        response.getHeader("Set-Cookie")!!.substringAfter("refresh_token=").substringBefore(";")

    private fun uniqueEmail() = "${UUID.randomUUID()}@example.com"

    private fun randomIp() = "10.${(0..255).random()}.${(0..255).random()}.${(0..255).random()}"

    companion object {
        private const val PASSWORD = "senha-forte-1"
        private const val NEW_PASSWORD = "senha-nova-2"
    }
}
