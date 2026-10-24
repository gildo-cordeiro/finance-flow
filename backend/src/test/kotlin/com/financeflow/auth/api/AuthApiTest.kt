package com.financeflow.auth.api

import com.financeflow.auth.application.SessionService
import com.financeflow.auth.domain.UserRegistered
import com.financeflow.shared.security.CurrentUser
import com.financeflow.support.ApiTest
import com.nimbusds.jose.jwk.source.ImmutableSecret
import com.nimbusds.jose.proc.SecurityContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.test.context.event.ApplicationEvents
import org.springframework.test.context.event.RecordApplicationEvents
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.time.Instant
import java.util.UUID
import javax.crypto.spec.SecretKeySpec
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

@RecordApplicationEvents
@Import(AuthApiTest.MeController::class)
class AuthApiTest : ApiTest() {

    @Autowired
    private lateinit var events: ApplicationEvents

    @Autowired
    private lateinit var jwtEncoder: JwtEncoder

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `cadastro válido cria o usuário e devolve access token e cookie de refresh`() {
        val email = uniqueEmail()
        val result = register(email = "  ${email.uppercase()} ").andExpect {
            status { isCreated() }
            jsonPath("$.accessToken") { isNotEmpty() }
            jsonPath("$.expiresIn") { value(900) }
            jsonPath("$.user.id") { isNotEmpty() }
            jsonPath("$.user.name") { value("Maria") }
            jsonPath("$.user.email") { value(email) }
        }.andReturn()

        val cookie = result.response.getHeader("Set-Cookie")!!
        assertTrue(cookie.startsWith("refresh_token="), cookie)
        listOf("HttpOnly", "Secure", "SameSite=Strict", "Path=/api/v1/auth", "Max-Age=2592000").forEach {
            assertTrue(cookie.contains(it), "cookie sem $it: $cookie")
        }

        val userId = UUID.fromString(read(result.response.contentAsString, "/user/id"))
        val user = jdbc.queryForMap("SELECT * FROM users WHERE id = ?", userId)
        assertEquals(email, user["email"])
        assertTrue((user["password_hash"] as String).startsWith("$2a$12$"))
        assertEquals("2026-10", user["privacy_version"])
        assertTrue(user["privacy_accepted_at"] != null)
        assertEquals(listOf(UserRegistered(userId)), events.stream(UserRegistered::class.java).toList())
    }

    @Test
    fun `access token do cadastro autentica em rota protegida`() {
        val body = register().andReturn().response.contentAsString
        mockMvc.get("/test/me") { header("Authorization", "Bearer ${read(body, "/accessToken")}") }.andExpect {
            status { isOk() }
            content { string(read(body, "/user/id")) }
        }
    }

    @Test
    fun `refresh token é guardado só como hash`() {
        val result = register().andReturn()
        val token = refreshCookieValue(result.response.getHeader("Set-Cookie")!!)
        val userId = UUID.fromString(read(result.response.contentAsString, "/user/id"))

        val hashes = jdbc.queryForList("SELECT token_hash FROM refresh_tokens WHERE user_id = ?", String::class.java, userId)
        assertEquals(listOf(SessionService.hash(token)), hashes)
        assertNotEquals(token, hashes.single())
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE token_hash = ?", Int::class.java, token))
    }

    @Test
    fun `e-mail repetido, mesmo com maiúsculas diferentes, retorna 409`() {
        val email = uniqueEmail()
        register(email = email).andExpect { status { isCreated() } }
        register(email = email.uppercase()).andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("EMAIL_ALREADY_USED") }
        }
    }

    @Test
    fun `cadastro sem aceite da política de privacidade retorna 422`() {
        register(privacyVersion = null).andExpect {
            status { isEqualTo(422) }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors[0].field") { value("acceptedPrivacyVersion") }
        }
    }

    @Test
    fun `aceite de versão diferente da vigente retorna 422`() {
        register(privacyVersion = "2020-01").andExpect {
            status { isEqualTo(422) }
            jsonPath("$.errors[0].field") { value("acceptedPrivacyVersion") }
        }
    }

    @Test
    fun `senha fora da política retorna 422`() {
        register(password = "somenteletras").andExpect {
            status { isEqualTo(422) }
            jsonPath("$.errors[0].field") { value("password") }
            jsonPath("$.errors[0].message") { value("A senha precisa ter ao menos um número") }
        }
    }

    @Test
    fun `e-mail inválido retorna 422`() {
        register(email = "nao-e-email").andExpect {
            status { isEqualTo(422) }
            jsonPath("$.errors[0].field") { value("email") }
        }
    }

    @Test
    fun `login válido devolve tokens, com o e-mail normalizado`() {
        val email = uniqueEmail()
        register(email = email)
        login("  ${email.uppercase()}", PASSWORD).andExpect {
            status { isOk() }
            jsonPath("$.accessToken") { isNotEmpty() }
            jsonPath("$.user.email") { value(email) }
            header { string("Set-Cookie", org.hamcrest.Matchers.startsWith("refresh_token=")) }
        }
    }

    @Test
    fun `senha errada e e-mail inexistente recebem a mesma resposta 401`() {
        val email = uniqueEmail()
        register(email = email)

        val wrongPassword = login(email, "outra-senha-1").andExpect { status { isUnauthorized() } }
            .andReturn().response
        val unknownEmail = login(uniqueEmail(), PASSWORD).andExpect { status { isUnauthorized() } }
            .andReturn().response

        assertEquals("INVALID_CREDENTIALS", read(wrongPassword.contentAsString, "/code"))
        assertEquals(wrongPassword.contentAsString, unknownEmail.contentAsString)
        assertEquals(null, wrongPassword.getHeader("Set-Cookie"))
    }

    @Test
    fun `senha acima de 72 bytes no login retorna 401`() {
        val email = uniqueEmail()
        register(email = email)
        login(email, PASSWORD + "x".repeat(80)).andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_CREDENTIALS") }
        }
    }

    @Test
    fun `rota protegida sem token retorna 401`() {
        mockMvc.get("/test/me").andExpectUnauthorized()
    }

    @Test
    fun `token expirado retorna 401`() {
        val issuedAt = Instant.now().minus(Duration.ofHours(1))
        val token = encode(jwtEncoder, UUID.randomUUID(), issuedAt, issuedAt.plus(Duration.ofMinutes(15)))
        mockMvc.get("/test/me") { header("Authorization", "Bearer $token") }.andExpectUnauthorized()
    }

    @Test
    fun `token adulterado retorna 401`() {
        val (header, _, signature) = createUser().accessToken.split(".")
        val otherPayload = encode(jwtEncoder, UUID.randomUUID()).split(".")[1]
        mockMvc.get("/test/me") { header("Authorization", "Bearer $header.$otherPayload.$signature") }
            .andExpectUnauthorized()
    }

    @Test
    fun `token assinado com outra chave retorna 401`() {
        val otherKey = SecretKeySpec("outro-segredo-com-mais-de-32-bytes!!".toByteArray(), "HmacSHA256")
        val token = encode(NimbusJwtEncoder(ImmutableSecret<SecurityContext>(otherKey)), UUID.randomUUID())
        mockMvc.get("/test/me") { header("Authorization", "Bearer $token") }.andExpectUnauthorized()
    }

    private fun ResultActionsDsl.andExpectUnauthorized() = andExpect {
        status { isUnauthorized() }
        jsonPath("$.code") { value("UNAUTHORIZED") }
    }

    private fun register(
        email: String = uniqueEmail(),
        password: String = PASSWORD,
        privacyVersion: String? = "2026-10",
    ): ResultActionsDsl {
        val body = buildMap {
            put("name", "Maria")
            put("email", email)
            put("password", password)
            if (privacyVersion != null) put("acceptedPrivacyVersion", privacyVersion)
        }
        return mockMvc.post("/api/v1/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(body)
        }
    }

    // IP aleatório para os testes não esbarrarem no rate limiting do login
    private fun login(email: String, password: String) = mockMvc.post("/api/v1/auth/login") {
        with { it.remoteAddr = randomIp(); it }
        contentType = MediaType.APPLICATION_JSON
        content = objectMapper.writeValueAsString(mapOf("email" to email, "password" to password))
    }

    private fun read(json: String, pointer: String): String = objectMapper.readTree(json).at(pointer).asString()

    private fun refreshCookieValue(setCookie: String) = setCookie.substringAfter("refresh_token=").substringBefore(";")

    private fun uniqueEmail() = "${UUID.randomUUID()}@example.com"

    private fun randomIp() = "10.${(0..255).random()}.${(0..255).random()}.${(0..255).random()}"

    private fun encode(
        encoder: JwtEncoder,
        userId: UUID,
        issuedAt: Instant = Instant.now(),
        expiresAt: Instant = issuedAt.plus(Duration.ofMinutes(15)),
    ): String {
        val claims = JwtClaimsSet.builder().subject(userId.toString()).issuedAt(issuedAt).expiresAt(expiresAt).build()
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).tokenValue
    }

    @RestController
    class MeController(private val currentUser: CurrentUser) {

        @GetMapping("/test/me")
        fun me(): String = currentUser.id().toString()
    }

    companion object {
        private const val PASSWORD = "senha-forte-1"
    }
}
