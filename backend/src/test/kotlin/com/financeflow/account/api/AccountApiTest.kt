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
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

class AccountApiTest : ApiTest() {

    @Test
    fun `cria conta corrente com deslocamento padrão 0 e saldo igual ao inicial`() {
        val user = createUser()

        mockMvc.post("/api/v1/accounts") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "  Nubank  ", "type": "CHECKING", "bank": " Nu Pagamentos ", "initialBalance": 1500.50}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { isNotEmpty() }
            jsonPath("$.name") { value("Nubank") }
            jsonPath("$.type") { value("CHECKING") }
            jsonPath("$.bank") { value("Nu Pagamentos") }
            jsonPath("$.initialBalance") { value(1500.50) }
            jsonPath("$.competenceOffset") { value(0) }
            jsonPath("$.archived") { value(false) }
            jsonPath("$.balance") { value(1500.50) }
        }
    }

    @Test
    fun `saldo é o inicial mais receitas pagas menos despesas pagas`() {
        val user = createUser()
        val id = createAccount(user, initialBalance = "1000.00")

        mockMvc.get("/api/v1/accounts/$id") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(1000.0) } }

        insertTransaction(user, id, "INCOME", "500.00", "PAID")
        insertTransaction(user, id, "EXPENSE", "200.25", "PAID")
        insertTransaction(user, id, "EXPENSE", "999.00", "PENDING")
        insertTransaction(user, id, "INCOME", "999.00", "PLANNED")
        insertTransaction(user, id, "EXPENSE", "999.00", "OVERDUE")

        mockMvc.get("/api/v1/accounts/$id") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(1299.75) } }
        mockMvc.get("/api/v1/accounts") { with(user.auth()) }.andExpect {
            jsonPath("$[?(@.id == '$id')].balance") { value(1299.75) }
        }
    }

    @Test
    fun `transferência paga sai da conta de origem e entra na de destino`() {
        val user = createUser()
        val origem = createAccount(user, initialBalance = "1000.00")
        val destino = createAccount(user, initialBalance = "0")
        val group = UUID.randomUUID()
        insertTransaction(user, origem, "TRANSFER", "300.00", "PAID", transferGroup = group, direction = "OUT")
        insertTransaction(user, destino, "TRANSFER", "300.00", "PAID", transferGroup = group, direction = "IN")
        val pendente = UUID.randomUUID()
        insertTransaction(user, origem, "TRANSFER", "50.00", "PENDING", transferGroup = pendente, direction = "OUT")
        insertTransaction(user, destino, "TRANSFER", "50.00", "PENDING", transferGroup = pendente, direction = "IN")

        mockMvc.get("/api/v1/accounts/$origem") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(700.0) } }
        mockMvc.get("/api/v1/accounts/$destino") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(300.0) } }
    }

    @Test
    fun `lista em ordem alfabética e esconde arquivadas, a menos que pedidas`() {
        val user = createUser()
        val poupanca = createAccount(user, name = "Poupança", type = "SAVINGS")
        val banco = createAccount(user, name = "Banco do Brasil")
        val antiga = createAccount(user, name = "Antiga")
        insertTransaction(user, antiga, "INCOME", "10.00", "PAID")

        mockMvc.post("/api/v1/accounts/$antiga/archive") { with(user.auth()) }.andExpect {
            status { isOk() }
            jsonPath("$.archived") { value(true) }
            jsonPath("$.balance") { value(10.0) }
        }

        mockMvc.get("/api/v1/accounts") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(2) }
            jsonPath("$[0].id") { value(banco.toString()) }
            jsonPath("$[1].id") { value(poupanca.toString()) }
        }
        mockMvc.get("/api/v1/accounts?includeArchived=true") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(3) }
            jsonPath("$[0].id") { value(antiga.toString()) }
            jsonPath("$[0].balance") { value(10.0) }
        }

        mockMvc.post("/api/v1/accounts/$antiga/unarchive") { with(user.auth()) }.andExpect {
            jsonPath("$.archived") { value(false) }
        }
        mockMvc.get("/api/v1/accounts") { with(user.auth()) }.andExpect { jsonPath("$.length()") { value(3) } }
    }

    @Test
    fun `edita os dados da conta`() {
        val user = createUser()
        val id = createAccount(user)

        save(user, "/api/v1/accounts/$id", """{"name": "Reserva", "type": "SAVINGS", "bank": "", "initialBalance": 20, "competenceOffset": 1}""", put = true)
            .andExpect {
                status { isOk() }
                jsonPath("$.name") { value("Reserva") }
                jsonPath("$.type") { value("SAVINGS") }
                jsonPath("$.bank") { doesNotExist() }
                jsonPath("$.competenceOffset") { value(1) }
                jsonPath("$.balance") { value(20.0) }
            }

        val row = jdbc.queryForMap("SELECT name, type, bank, competence_offset FROM accounts WHERE id = ?", id)
        assertEquals("Reserva", row["name"])
        assertEquals("SAVINGS", row["type"])
        assertEquals(null, row["bank"])
        assertEquals(1, (row["competence_offset"] as Number).toInt())
    }

    @Test
    fun `dados inválidos respondem 422 no campo`() {
        val user = createUser()
        val cases = mapOf(
            """{"name": " ", "type": "CHECKING", "initialBalance": 0}""" to "name",
            """{"name": "Conta", "initialBalance": 0}""" to "type",
            """{"name": "Conta", "type": "CHECKING"}""" to "initialBalance",
            """{"name": "Conta", "type": "CHECKING", "initialBalance": 0.001}""" to "initialBalance",
            """{"name": "Conta", "type": "CHECKING", "initialBalance": 0, "competenceOffset": -1}""" to "competenceOffset",
            """{"name": "Conta", "type": "CREDIT_CARD", "initialBalance": 0}""" to "type",
        )
        for ((body, field) in cases) {
            save(user, "/api/v1/accounts", body).andExpect {
                status { isUnprocessableContent() }
                jsonPath("$.code") { value("VALIDATION_FAILED") }
                jsonPath("$.errors[0].field") { value(field) }
            }
        }
    }

    @Test
    fun `cartão de crédito não é alterado por aqui`() {
        val user = createUser()
        val card = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 5, 12)",
            card, user.id,
        )

        mockMvc.post("/api/v1/accounts/$card/archive") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("ACCOUNT_IS_CREDIT_CARD") }
        }
    }

    @Test
    fun `exclui conta sem transações e recusa com 409 se houver`() {
        val user = createUser()
        val vazia = createAccount(user)
        val usada = createAccount(user)
        insertTransaction(user, usada, "EXPENSE", "10.00", "PENDING")

        mockMvc.delete("/api/v1/accounts/$vazia") { with(user.auth()) }.andExpect { status { isNoContent() } }
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM accounts WHERE id = ?", Int::class.java, vazia))

        mockMvc.delete("/api/v1/accounts/$usada") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("ACCOUNT_IN_USE") }
        }
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM accounts WHERE id = ?", Int::class.java, usada))
    }

    @Test
    fun `conta de outro usuário não é visível nem alterável`() {
        val maria = createUser()
        val joao = createUser()
        val id = createAccount(maria)
        val body = """{"name": "Invadida", "type": "CHECKING", "initialBalance": 0}"""

        assertNotListedFor(joao, id) { MockMvcRequestBuilders.get("/api/v1/accounts?includeArchived=true") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/accounts/$id") }
        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.put("/api/v1/accounts/$id").contentType(MediaType.APPLICATION_JSON).content(body)
        }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/accounts/$id/archive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/accounts/$id/unarchive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.delete("/api/v1/accounts/$id") }

        val row = jdbc.queryForMap("SELECT name, archived FROM accounts WHERE id = ?", id)
        assertEquals("Conta", row["name"])
        assertEquals(false, row["archived"])
    }

    @Test
    fun `transações de outro usuário não entram no saldo`() {
        val maria = createUser()
        val id = createAccount(maria, initialBalance = "50.00")
        // Inconsistente de propósito: a consulta do saldo também filtra pelo usuário
        insertTransaction(createUser(), id, "INCOME", "1000.00", "PAID")

        mockMvc.get("/api/v1/accounts/$id") { with(maria.auth()) }.andExpect { jsonPath("$.balance") { value(50.0) } }
    }

    @Test
    fun `sem autenticação responde 401`() {
        mockMvc.get("/api/v1/accounts").andExpect { status { isUnauthorized() } }
    }

    private fun createAccount(
        user: TestUser,
        name: String = "Conta",
        type: String = "CHECKING",
        initialBalance: String = "0",
    ): UUID {
        val body = save(user, "/api/v1/accounts", """{"name": "$name", "type": "$type", "initialBalance": $initialBalance}""")
            .andExpect { status { isCreated() } }
            .andReturn().response.contentAsString
        return UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(body)!!.groupValues[1])
    }

    private fun save(user: TestUser, path: String, body: String, put: Boolean = false) =
        if (put) {
            mockMvc.put(path) { with(user.auth()); contentType = MediaType.APPLICATION_JSON; content = body }
        } else {
            mockMvc.post(path) { with(user.auth()); contentType = MediaType.APPLICATION_JSON; content = body }
        }

    private fun insertTransaction(
        user: TestUser,
        accountId: UUID,
        type: String,
        amount: String,
        status: String,
        transferGroup: UUID? = null,
        direction: String? = null,
    ) {
        val today = LocalDate.of(2026, 10, 10)
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      payment_date, transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'teste', ?, ?, ?, ?, ?, ?, ?)
            """,
            UUID.randomUUID(), user.id, accountId, BigDecimal(amount), type, status,
            today.withDayOfMonth(1), if (status == "PAID") today else null, transferGroup, direction,
        )
    }
}
