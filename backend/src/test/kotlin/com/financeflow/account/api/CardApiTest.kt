package com.financeflow.account.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.math.BigDecimal
import java.util.UUID
import kotlin.test.assertEquals

class CardApiTest : ApiTest() {

    @Test
    fun `cria cartão com deslocamento padrão 1`() {
        val user = createUser()

        mockMvc.post("/api/v1/cards") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": " Nubank ", "brand": "Mastercard", "creditLimit": 8000, "closingDay": 25, "dueDay": 5}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("Nubank") }
            jsonPath("$.brand") { value("Mastercard") }
            jsonPath("$.creditLimit") { value(8000) }
            jsonPath("$.closingDay") { value(25) }
            jsonPath("$.dueDay") { value(5) }
            jsonPath("$.competenceOffset") { value(1) }
            jsonPath("$.defaultPaymentAccountId") { value(null) }
            jsonPath("$.archived") { value(false) }
        }
    }

    @Test
    fun `lista só cartões e o cartão aparece também entre as contas`() {
        val user = createUser()
        val account = createAccount(user)
        val card = createCard(user)

        mockMvc.get("/api/v1/cards") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(1) }
            jsonPath("$[0].id") { value(card.toString()) }
        }
        mockMvc.get("/api/v1/accounts") { with(user.auth()) }.andExpect {
            jsonPath("$[?(@.id == '$card')].type") { value("CREDIT_CARD") }
            jsonPath("$[?(@.id == '$account')].type") { value("CHECKING") }
        }
    }

    @Test
    fun `altera dias, limite e conta pagadora padrão`() {
        val user = createUser()
        val card = createCard(user)
        val account = createAccount(user)

        mockMvc.put("/api/v1/cards/$card") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """
                {"name": "Nubank Ultravioleta", "creditLimit": 12000.50, "closingDay": 3, "dueDay": 10,
                 "competenceOffset": 0, "defaultPaymentAccountId": "$account"}
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Nubank Ultravioleta") }
            jsonPath("$.brand") { value(null) }
            jsonPath("$.creditLimit") { value(12000.50) }
            jsonPath("$.closingDay") { value(3) }
            jsonPath("$.dueDay") { value(10) }
            jsonPath("$.competenceOffset") { value(0) }
            jsonPath("$.defaultPaymentAccountId") { value(account.toString()) }
        }
    }

    @Test
    fun `dados inválidos respondem 422 no campo`() {
        val user = createUser()

        mockMvc.post("/api/v1/cards") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "", "creditLimit": -1, "closingDay": 0, "dueDay": 32, "competenceOffset": 13}"""
        }.andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors[*].field") {
                value(org.hamcrest.Matchers.hasItems("name", "creditLimit", "closingDay", "dueDay", "competenceOffset"))
            }
        }
    }

    @Test
    fun `conta pagadora padrão precisa ser conta corrente ou poupança do usuário`() {
        val user = createUser()
        val otherCard = createCard(user)
        val strangerAccount = createAccount(createUser())

        listOf(otherCard, strangerAccount).forEach { accountId ->
            mockMvc.post("/api/v1/cards") {
                with(user.auth())
                contentType = MediaType.APPLICATION_JSON
                content = cardBody(defaultPaymentAccountId = accountId)
            }.andExpect {
                status { isUnprocessableContent() }
                jsonPath("$.errors[0].field") { value("defaultPaymentAccountId") }
            }
        }
    }

    @Test
    fun `cartão não é alterado pelas rotas de conta nem conta pelas de cartão`() {
        val user = createUser()
        val card = createCard(user)
        val account = createAccount(user)

        mockMvc.put("/api/v1/accounts/$card") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "x", "type": "CHECKING", "initialBalance": 0}"""
        }.andExpect { jsonPath("$.code") { value("ACCOUNT_IS_CREDIT_CARD") } }
        mockMvc.get("/api/v1/cards/$account") { with(user.auth()) }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `arquiva, desarquiva e lista arquivados só quando pedido`() {
        val user = createUser()
        val card = createCard(user)

        mockMvc.post("/api/v1/cards/$card/archive") { with(user.auth()) }.andExpect { jsonPath("$.archived") { value(true) } }
        mockMvc.get("/api/v1/cards") { with(user.auth()) }.andExpect { jsonPath("$.length()") { value(0) } }
        mockMvc.get("/api/v1/cards?includeArchived=true") { with(user.auth()) }.andExpect { jsonPath("$.length()") { value(1) } }
        mockMvc.post("/api/v1/cards/$card/unarchive") { with(user.auth()) }.andExpect { jsonPath("$.archived") { value(false) } }
    }

    @Test
    fun `exclui cartão sem compras e recusa com 409 se houver`() {
        val user = createUser()
        val vazio = createCard(user)
        val usado = createCard(user)
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date)
            VALUES (?, ?, ?, 'teste', ?, 'EXPENSE', 'PENDING', DATE '2026-10-01')
            """.trimIndent(),
            UUID.randomUUID(), user.id, usado, BigDecimal.TEN,
        )

        mockMvc.delete("/api/v1/cards/$vazio") { with(user.auth()) }.andExpect { status { isNoContent() } }
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM accounts WHERE id = ?", Int::class.java, vazio))
        mockMvc.delete("/api/v1/cards/$usado") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("ACCOUNT_IN_USE") }
        }
    }

    @Test
    fun `cartão de outro usuário não é visível nem alterável`() {
        val maria = createUser()
        val joao = createUser()
        val card = createCard(maria)

        assertNotListedFor(joao, card) { MockMvcRequestBuilders.get("/api/v1/cards?includeArchived=true") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/cards/$card") }
        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.put("/api/v1/cards/$card").contentType(MediaType.APPLICATION_JSON).content(cardBody())
        }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/cards/$card/archive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/cards/$card/unarchive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.delete("/api/v1/cards/$card") }
    }

    @Test
    fun `sem autenticação responde 401`() {
        mockMvc.get("/api/v1/cards").andExpect { status { isUnauthorized() } }
    }

    private fun cardBody(defaultPaymentAccountId: UUID? = null) =
        """{"name": "Cartão", "creditLimit": 5000, "closingDay": 25, "dueDay": 5,
            "defaultPaymentAccountId": ${defaultPaymentAccountId?.let { "\"$it\"" } ?: "null"}}"""

    private fun createCard(user: TestUser): UUID {
        val body = mockMvc.post("/api/v1/cards") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = cardBody()
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        return UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(body)!!.groupValues[1])
    }

    private fun createAccount(user: TestUser): UUID {
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", id, user.id)
        return id
    }
}
