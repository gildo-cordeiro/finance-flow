package com.financeflow.budget.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.time.LocalDate
import java.util.UUID

class BudgetApiTest : ApiTest() {

    @Test
    fun `realizado conta todos os status da competência e o quanto já foi pago`() {
        val user = createUser()
        val account = createAccount(user)
        val moradia = createCategory(user, "Moradia")
        val aluguel = createCategory(user, "Aluguel", parent = moradia)
        val energia = createCategory(user, "Energia", parent = moradia)
        insertTransaction(user, account, aluguel, "1750.00", competence = "2026-06-01", status = "PAID", paid = "2026-06-05")
        insertTransaction(user, account, energia, "212.40", competence = "2026-06-01", status = "OVERDUE")
        insertTransaction(user, account, energia, "100.00", competence = "2026-06-01", status = "PLANNED")
        insertTransaction(user, account, energia, "999.00", competence = "2026-07-01", status = "PENDING")
        setPlanned(user, "2026-06", aluguel, "1750.00")
        setPlanned(user, "2026-06", energia, "250.00")

        get(user, "2026-06").andExpect {
            status { isOk() }
            jsonPath("$.month") { value("2026-06") }
            jsonPath("$.categories[0].name") { value("Moradia") }
            jsonPath("$.categories[0].planned") { value(2000.0) }
            jsonPath("$.categories[0].directPlanned") { doesNotExist() }
            jsonPath("$.categories[0].realized") { value(2062.4) }
            jsonPath("$.categories[0].realizedPaid") { value(1750.0) }
            jsonPath("$.categories[0].remaining") { value(-62.4) }
            jsonPath("$.categories[0].percentUsed") { value(103) }
            jsonPath("$.categories[0].children[1].name") { value("Energia") }
            jsonPath("$.categories[0].children[1].realized") { value(312.4) }
            jsonPath("$.totals.expense.planned") { value(2000.0) }
            jsonPath("$.totals.expense.realized") { value(2062.4) }
        }
    }

    @Test
    fun `compra no cartão entra no realizado do mês da competência, não do vencimento da fatura`() {
        val user = createUser()
        val category = createCategory(user, "Mercado")
        val card = UUID.randomUUID()
        jdbc.update(
            """
            INSERT INTO accounts (id, user_id, name, type, closing_day, due_day, competence_offset)
            VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 28, 5, 1)
            """,
            card, user.id,
        )
        insertTransaction(user, card, category, "320.00", competence = "2026-06-01", due = "2026-07-05")

        get(user, "2026-06").andExpect { jsonPath("$.categories[0].realized") { value(320.0) } }
        get(user, "2026-07").andExpect { jsonPath("$.categories[0].realized") { value(0.0) } }
    }

    @Test
    fun `transferências não entram no realizado`() {
        val user = createUser()
        val account = createAccount(user)
        val category = createCategory(user, "Moradia")
        insertTransaction(user, account, category, "100.00", competence = "2026-06-01")
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      due_date, transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'Para a poupança', 500, 'TRANSFER', 'PENDING', '2026-06-01', '2026-06-10', ?, 'OUT')
            """,
            UUID.randomUUID(), user.id, account, UUID.randomUUID(),
        )

        get(user, "2026-06").andExpect {
            jsonPath("$.totals.expense.realized") { value(100.0) }
            jsonPath("$.totals.income.realized") { value(0.0) }
        }
    }

    @Test
    fun `planejado zero remove o valor e categoria arquivada não recebe planejado`() {
        val user = createUser()
        val category = createCategory(user, "Lazer")
        setPlanned(user, "2026-06", category, "300.00").andExpect {
            status { isOk() }
            jsonPath("$.categories[0].directPlanned") { value(300.0) }
        }
        setPlanned(user, "2026-06", category, "0").andExpect { jsonPath("$.categories[0].planned") { doesNotExist() } }
        assertBudgetRows(user, 0)

        setPlanned(user, "2026-06", category, "-1").andExpect { status { isUnprocessableContent() } }

        jdbc.update("UPDATE categories SET archived = TRUE WHERE id = ?", category)
        setPlanned(user, "2026-06", category, "10").andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CATEGORY_ARCHIVED") }
        }
    }

    @Test
    fun `copia do mês anterior sem sobrescrever, a menos que peça`() {
        val user = createUser()
        val aluguel = createCategory(user, "Aluguel")
        val lazer = createCategory(user, "Lazer")
        val antiga = createCategory(user, "Antiga")
        setPlanned(user, "2026-05", aluguel, "1700.00")
        setPlanned(user, "2026-05", lazer, "300.00")
        setPlanned(user, "2026-05", antiga, "50.00")
        jdbc.update("UPDATE categories SET archived = TRUE WHERE id = ?", antiga)
        setPlanned(user, "2026-06", aluguel, "1750.00")

        get(user, "2026-06").andExpect { jsonPath("$.previousMonthPlanned") { value(2050.0) } }

        copy(user, "2026-06").andExpect {
            status { isOk() }
            jsonPath("$.categories[?(@.name == 'Aluguel')].planned") { value(1750.0) }
            jsonPath("$.categories[?(@.name == 'Lazer')].planned") { value(300.0) }
        }
        assertBudgetRows(user, 2 + 3)

        copy(user, "2026-06", overwrite = true).andExpect {
            jsonPath("$.categories[?(@.name == 'Aluguel')].planned") { value(1700.0) }
        }
    }

    @Test
    fun `copiar sem orçamento no mês anterior responde 409`() {
        val user = createUser()
        copy(user, "2026-06").andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("NO_PREVIOUS_BUDGET") }
        }
    }

    @Test
    fun `mês inválido responde 400`() {
        val user = createUser()
        get(user, "2026-13").andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("BAD_REQUEST") }
        }
    }

    @Test
    fun `orçamento e categorias de outro usuário não aparecem`() {
        val alice = createUser()
        val bob = createUser()
        val category = createCategory(alice, "Moradia")
        setPlanned(alice, "2026-06", category, "100.00")

        assertNotListedFor(bob, category) { MockMvcRequestBuilders.get("/api/v1/budgets/2026-06") }
        assertNotVisibleTo(bob) {
            MockMvcRequestBuilders.put("/api/v1/budgets/2026-06/categories/$category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"plannedAmount": 1}""")
        }
        mockMvc.get("/api/v1/budgets/2026-06").andExpect { status { isUnauthorized() } }
    }

    private fun createAccount(user: TestUser): UUID {
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", id, user.id)
        return id
    }

    private fun createCategory(user: TestUser, name: String, type: String = "EXPENSE", parent: UUID? = null): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO categories (id, user_id, parent_id, name, type) VALUES (?, ?, ?, ?, ?)",
            id, user.id, parent, name, type,
        )
        return id
    }

    private fun insertTransaction(
        user: TestUser,
        account: UUID,
        category: UUID,
        amount: String,
        competence: String,
        status: String = "PENDING",
        paid: String? = null,
        due: String = competence,
    ) {
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, description, amount, type, status,
                                      competence_date, due_date, payment_date)
            VALUES (?, ?, ?, ?, 'Lançamento', ?, 'EXPENSE', ?, ?, ?, ?)
            """,
            UUID.randomUUID(), user.id, account, category, amount.toBigDecimal(), status,
            LocalDate.parse(competence), LocalDate.parse(due), paid?.let(LocalDate::parse),
        )
    }

    private fun assertBudgetRows(user: TestUser, expected: Int) {
        val count = jdbc.queryForObject("SELECT COUNT(*) FROM budgets WHERE user_id = ?", Int::class.java, user.id)
        kotlin.test.assertEquals(expected, count)
    }

    private fun get(user: TestUser, month: String) = mockMvc.get("/api/v1/budgets/$month") { with(user.auth()) }

    private fun setPlanned(user: TestUser, month: String, category: UUID, amount: String) =
        mockMvc.put("/api/v1/budgets/$month/categories/$category") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"plannedAmount": $amount}"""
        }

    private fun copy(user: TestUser, month: String, overwrite: Boolean = false) =
        mockMvc.post("/api/v1/budgets/$month/copy-from-previous?overwrite=$overwrite") { with(user.auth()) }
}
