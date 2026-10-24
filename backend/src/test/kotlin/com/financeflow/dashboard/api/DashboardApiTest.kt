package com.financeflow.dashboard.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.util.UUID

class DashboardApiTest : ApiTest() {

    private val today = LocalDate.now(ZoneId.of("America/Sao_Paulo"))

    @Test
    fun `resume receitas, despesas e resultado da competência, sem transferências`() {
        val user = createUser()
        val account = createAccount(user, "Nubank", initial = "1000.00")
        val salario = createCategory(user, "Salário", "INCOME")
        val moradia = createCategory(user, "Moradia")
        insert(user, account, salario, "INCOME", "8000.00", "2026-06-01", status = "PAID", paid = "2026-06-05")
        insert(user, account, salario, "INCOME", "1200.00", "2026-06-01")
        insert(user, account, moradia, "EXPENSE", "1750.00", "2026-06-01", status = "PAID", paid = "2026-06-05")
        insert(user, account, moradia, "EXPENSE", "250.00", "2026-06-01")
        insert(user, account, moradia, "EXPENSE", "999.00", "2026-07-01")
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      due_date, payment_date, transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'Reserva', 500, 'TRANSFER', 'PAID', '2026-06-01', '2026-06-10', '2026-06-10', ?, 'OUT')
            """,
            UUID.randomUUID(), user.id, account, UUID.randomUUID(),
        )
        jdbc.update(
            "INSERT INTO budgets (id, user_id, category_id, month, planned_amount) VALUES (?, ?, ?, '2026-06-01', 1800)",
            UUID.randomUUID(), user.id, moradia,
        )

        summary(user, "?month=2026-06").andExpect {
            status { isOk() }
            jsonPath("$.month") { value("2026-06") }
            jsonPath("$.income.realized") { value(9200.0) }
            jsonPath("$.income.paid") { value(8000.0) }
            jsonPath("$.income.pending") { value(1200.0) }
            jsonPath("$.expense.realized") { value(2000.0) }
            jsonPath("$.expense.pending") { value(250.0) }
            jsonPath("$.balance") { value(7200.0) }
            // 1000 inicial + 8000 recebidos − 1750 pagos − 500 transferidos
            jsonPath("$.accountsBalance") { value(6750.0) }
            jsonPath("$.accounts[0].name") { value("Nubank") }
            jsonPath("$.budget.planned") { value(1800.0) }
            jsonPath("$.budget.realized") { value(2000.0) }
            jsonPath("$.budget.percentUsed") { value(111) }
            jsonPath("$.budget.topCategories[0].name") { value("Moradia") }
        }
    }

    @Test
    fun `sem mês usa a competência corrente`() {
        val user = createUser()
        summary(user, "").andExpect {
            status { isOk() }
            jsonPath("$.month") { value(YearMonth.from(today).toString()) }
        }
    }

    @Test
    fun `a pagar traz atrasadas e os próximos 7 dias, sem pagas, receitas nem compras no cartão`() {
        val user = createUser()
        val account = createAccount(user, "Itaú")
        val moradia = createCategory(user, "Moradia")
        val competence = today.withDayOfMonth(1).toString()
        insert(user, account, moradia, "EXPENSE", "212.40", competence, due = today.minusDays(3), description = "Luz")
        insert(user, account, moradia, "EXPENSE", "119.90", competence, due = today.plusDays(2), description = "Internet")
        insert(user, account, moradia, "EXPENSE", "680.00", competence, due = today.plusDays(20), description = "Condomínio")
        insert(user, account, moradia, "EXPENSE", "50.00", competence, due = today.minusDays(1), status = "PAID", paid = today.toString(), description = "Paga")
        insert(user, account, createCategory(user, "Salário", "INCOME"), "INCOME", "100.00", competence, due = today, description = "Receita")
        val card = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 5, 12)",
            card, user.id,
        )
        insert(user, card, moradia, "EXPENSE", "30.00", competence, due = today.minusDays(5), description = "No cartão")

        summary(user, "").andExpect {
            jsonPath("$.payables.overdueCount") { value(1) }
            jsonPath("$.payables.items.length()") { value(2) }
            jsonPath("$.payables.items[0].description") { value("Luz") }
            jsonPath("$.payables.items[0].overdue") { value(true) }
            jsonPath("$.payables.items[0].accountName") { value("Itaú") }
            jsonPath("$.payables.items[1].description") { value("Internet") }
            jsonPath("$.payables.items[1].overdue") { value(false) }
            jsonPath("$.accounts.length()") { value(1) }
        }
    }

    @Test
    fun `faturas a vencer trazem só as com saldo em aberto nos próximos 30 dias`() {
        val user = createUser()
        val card = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Nubank', 'CREDIT_CARD', 1, 10)",
            card, user.id,
        )
        val category = createCategory(user, "Mercado")
        val open = invoice(card, today.plusDays(10))
        cardItem(user, card, category, open, "250.00")
        jdbc.update("UPDATE invoices SET status = 'PARTIALLY_PAID', paid_amount = 50 WHERE id = ?", open)
        cardItem(user, card, category, invoice(card, today.minusDays(2)), "90.00")
        cardItem(user, card, category, invoice(card, today.plusDays(40)), "70.00")
        val paid = invoice(card, today.plusDays(5))
        cardItem(user, card, category, paid, "30.00")
        jdbc.update("UPDATE invoices SET status = 'PAID', paid_amount = 30 WHERE id = ?", paid)

        summary(user, "").andExpect {
            jsonPath("$.upcomingInvoices.length()") { value(2) }
            jsonPath("$.upcomingInvoices[0].cardName") { value("Nubank") }
            jsonPath("$.upcomingInvoices[0].overdue") { value(true) }
            jsonPath("$.upcomingInvoices[0].openAmount") { value(90.0) }
            jsonPath("$.upcomingInvoices[1].id") { value(open.toString()) }
            jsonPath("$.upcomingInvoices[1].total") { value(250.0) }
            jsonPath("$.upcomingInvoices[1].openAmount") { value(200.0) }
            jsonPath("$.upcomingInvoices[1].partiallyPaid") { value(true) }
        }
        summary(createUser(), "").andExpect { jsonPath("$.upcomingInvoices.length()") { value(0) } }
    }

    @Test
    fun `dados de outro usuário não entram no resumo`() {
        val alice = createUser()
        val bob = createUser()
        val account = createAccount(alice, "Conta da Alice")
        insert(alice, account, createCategory(alice, "Moradia"), "EXPENSE", "10.00", today.withDayOfMonth(1).toString(), due = today)

        assertNotListedFor(bob, account) { MockMvcRequestBuilders.get("/api/v1/dashboard/summary") }
        summary(bob, "").andExpect {
            jsonPath("$.expense.realized") { value(0.0) }
            jsonPath("$.payables.items.length()") { value(0) }
        }
        mockMvc.get("/api/v1/dashboard/summary").andExpect { status { isUnauthorized() } }
    }

    private fun summary(user: TestUser, query: String) = mockMvc.get("/api/v1/dashboard/summary$query") { with(user.auth()) }

    private fun createAccount(user: TestUser, name: String, initial: String = "0"): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, initial_balance) VALUES (?, ?, ?, 'CHECKING', ?)",
            id, user.id, name, BigDecimal(initial),
        )
        return id
    }

    private fun invoice(card: UUID, due: LocalDate): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month) VALUES (?, ?, ?, ?, ?)",
            id, card, due.minusDays(9), due, due.withDayOfMonth(1),
        )
        return id
    }

    private fun cardItem(user: TestUser, card: UUID, category: UUID, invoice: UUID, amount: String) {
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, invoice_id, purchase_date, description, amount,
                                      type, status, competence_date)
            VALUES (?, ?, ?, ?, ?, DATE '2026-01-01', 'Compra', ?, 'EXPENSE', 'PENDING', DATE '2026-01-01')
            """,
            UUID.randomUUID(), user.id, card, category, invoice, BigDecimal(amount),
        )
    }

    private fun createCategory(user: TestUser, name: String, type: String = "EXPENSE"): UUID {
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)", id, user.id, name, type)
        return id
    }

    private fun insert(
        user: TestUser,
        account: UUID,
        category: UUID,
        type: String,
        amount: String,
        competence: String,
        status: String = "PENDING",
        paid: String? = null,
        due: LocalDate = LocalDate.parse(competence),
        description: String = "Lançamento",
    ) {
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, description, amount, type, status,
                                      competence_date, due_date, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            UUID.randomUUID(), user.id, account, category, description, BigDecimal(amount), type, status,
            LocalDate.parse(competence), due, paid?.let(LocalDate::parse),
        )
    }
}
