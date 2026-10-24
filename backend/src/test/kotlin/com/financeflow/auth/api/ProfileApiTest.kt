package com.financeflow.auth.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import kotlin.test.assertEquals

class ProfileApiTest : ApiTest() {

    @Test
    fun `GET me devolve o perfil do usuário autenticado`() {
        val user = createUser("Maria Silva")
        jdbc.update("UPDATE users SET privacy_version = 'v1', privacy_accepted_at = now() WHERE id = ?", user.id)

        mockMvc.get("/api/v1/me") { with(user.auth()) }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(user.id.toString()) }
            jsonPath("$.name") { value("Maria Silva") }
            jsonPath("$.email") { value(user.email) }
            jsonPath("$.timezone") { value("America/Sao_Paulo") }
            jsonPath("$.currency") { value("BRL") }
            jsonPath("$.privacyVersion") { value("v1") }
            jsonPath("$.passwordHash") { doesNotExist() }
        }
    }

    @Test
    fun `PUT me altera nome e fuso`() {
        val user = createUser()

        update(user, """{"name": "  Maria Souza  ", "timezone": "America/Manaus"}""").andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Maria Souza") }
            jsonPath("$.timezone") { value("America/Manaus") }
            jsonPath("$.currency") { value("BRL") }
        }

        val row = jdbc.queryForMap("SELECT name, timezone FROM users WHERE id = ?", user.id)
        assertEquals("Maria Souza", row["name"])
        assertEquals("America/Manaus", row["timezone"])
    }

    @Test
    fun `fuso que não é ID IANA responde 422 no campo timezone`() {
        val user = createUser()

        for (timezone in listOf("America/Atlantida", "-03:00", "UTC-3")) {
            update(user, """{"name": "Maria", "timezone": "$timezone"}""").andExpect {
                status { isUnprocessableContent() }
                jsonPath("$.code") { value("VALIDATION_FAILED") }
                jsonPath("$.errors[0].field") { value("timezone") }
            }
        }
        assertEquals(
            "America/Sao_Paulo",
            jdbc.queryForObject("SELECT timezone FROM users WHERE id = ?", String::class.java, user.id),
        )
    }

    @Test
    fun `nome vazio ou longo demais responde 422 no campo name`() {
        val user = createUser()

        for (name in listOf("   ", "a".repeat(121))) {
            update(user, """{"name": "$name", "timezone": "America/Sao_Paulo"}""").andExpect {
                status { isUnprocessableContent() }
                jsonPath("$.errors[0].field") { value("name") }
            }
        }
    }

    @Test
    fun `me nunca devolve nem altera outro usuário`() {
        val maria = createUser("Maria")
        val joao = createUser("João")

        update(maria, """{"name": "Maria", "timezone": "Asia/Tokyo"}""").andExpect { status { isOk() } }

        assertNotListedFor(joao, maria.id) { MockMvcRequestBuilders.get("/api/v1/me") }
        mockMvc.get("/api/v1/me") { with(joao.auth()) }.andExpect {
            jsonPath("$.id") { value(joao.id.toString()) }
            jsonPath("$.name") { value("João") }
            jsonPath("$.timezone") { value("America/Sao_Paulo") }
        }
    }

    @Test
    fun `sem autenticação responde 401`() {
        mockMvc.get("/api/v1/me").andExpect { status { isUnauthorized() } }
        mockMvc.put("/api/v1/me") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Maria", "timezone": "America/Sao_Paulo"}"""
        }.andExpect { status { isUnauthorized() } }
    }

    private fun update(user: TestUser, body: String) = mockMvc.put("/api/v1/me") {
        with(user.auth())
        contentType = MediaType.APPLICATION_JSON
        content = body
    }
}
