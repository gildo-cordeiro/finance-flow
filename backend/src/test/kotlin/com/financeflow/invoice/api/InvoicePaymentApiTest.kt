package com.financeflow.invoice.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.math.BigDecimal
import java.util.UUID

class InvoicePaymentApiTest : ApiTest() {

    @Test
    fun `pagar a fatura inteira tira da conta, quita os itens e não muda o orçamento`() {
        val user = createUser()
        val card = createCard(user)
        val bank = createAccount(user, initial = "1000.00")
        val category = createCategory(user)
        purchase(user, card, category, "2026-06-10", "120.00")
        purchase(user, card, category, "2026-06-20", "80.00")
        val invoice = invoiceId(user, card, "2026-06-25")

        pay(user, invoice, bank, "200.00", "2026-07-05").andExpect {
            status { isCreated() }
            jsonPath("$.amount") { value(200.0) }
            jsonPath("$.fromAccountName") { value("Conta") }
            jsonPath("$.paymentDate") { value("2026-07-05") }
        }

        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.status") { value("PAID") }
            jsonPath("$.invoice.paidAmount") { value(200.0) }
            jsonPath("$.invoice.openAmount") { value(0.0) }
            jsonPath("$.items[*].paid") { value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.`is`(true))) }
            jsonPath("$.payments.length()") { value(1) }
        }
        mockMvc.get("/api/v1/accounts/$bank") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(800.0) } }
        mockMvc.get("/api/v1/accounts/$card") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(0.0) } }
        mockMvc.get("/api/v1/budgets/2026-06") { with(user.auth()) }.andExpect {
            jsonPath("$.totals.expense.realized") { value(200.0) }
        }
        mockMvc.get("/api/v1/budgets/2026-07") { with(user.auth()) }.andExpect {
            jsonPath("$.totals.expense.realized") { value(0.0) }
        }
        mockMvc.get("/api/v1/transactions?from=2026-07-01&to=2026-07-31") { with(user.auth()) }.andExpect {
            jsonPath("$.items.length()") { value(2) }
            jsonPath("$.items[*].type") { value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.`is`("TRANSFER"))) }
            jsonPath("$.totals.expense") { value(0.0) }
        }
    }

    @Test
    fun `pagamento parcial deixa a fatura em parte paga e o resto a quita`() {
        val user = createUser()
        val card = createCard(user)
        val bank = createAccount(user)
        purchase(user, card, createCategory(user), "2026-06-10", "300.00")
        val invoice = invoiceId(user, card, "2026-06-25")

        pay(user, invoice, bank, "100.00", "2026-07-05").andExpect { status { isCreated() } }
        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.status") { value("PARTIALLY_PAID") }
            jsonPath("$.invoice.openAmount") { value(200.0) }
            jsonPath("$.items[0].paid") { value(false) }
        }

        pay(user, invoice, bank, "200.00", "2026-07-10").andExpect { status { isCreated() } }
        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.status") { value("PAID") }
            jsonPath("$.items[0].paid") { value(true) }
        }
        val item = jdbc.queryForObject("SELECT payment_date FROM transactions WHERE invoice_id = ?", String::class.java, invoice)
        kotlin.test.assertEquals("2026-07-10", item)
    }

    @Test
    fun `estorno reabre a fatura e devolve o saldo à conta`() {
        val user = createUser()
        val card = createCard(user)
        val bank = createAccount(user, initial = "500.00")
        purchase(user, card, createCategory(user), "2026-06-10", "150.00")
        val invoice = invoiceId(user, card, "2026-06-25")
        val payment = idOf(pay(user, invoice, bank, "150.00", "2026-07-05").andReturn().response.contentAsString)

        mockMvc.delete("/api/v1/invoices/$invoice/payments/$payment") { with(user.auth()) }
            .andExpect { status { isNoContent() } }

        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.status") { value("CLOSED") }
            jsonPath("$.invoice.paidAmount") { value(0.0) }
            jsonPath("$.items[0].paid") { value(false) }
            jsonPath("$.payments.length()") { value(0) }
        }
        mockMvc.get("/api/v1/accounts/$bank") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(500.0) } }
        val status = jdbc.queryForObject("SELECT status FROM transactions WHERE invoice_id = ?", String::class.java, invoice)
        kotlin.test.assertEquals("OVERDUE", status)
    }

    @Test
    fun `valor acima do saldo em aberto e conta que não paga fatura respondem 422`() {
        val user = createUser()
        val card = createCard(user)
        val bank = createAccount(user)
        purchase(user, card, createCategory(user), "2026-06-10", "100.00")
        val invoice = invoiceId(user, card, "2026-06-25")

        pay(user, invoice, bank, "100.01").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("amount") }
        }
        pay(user, invoice, card, "10.00").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("fromAccountId") }
        }
        pay(user, invoice, createAccount(createUser()), "10.00").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("fromAccountId") }
        }
        mockMvc.post("/api/v1/invoices/$invoice/payments") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"amount": 0}"""
        }.andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[*].field") { value(org.hamcrest.Matchers.hasItems("fromAccountId", "amount")) }
        }
        pay(user, invoice, bank, "100.00").andExpect { status { isCreated() } }
        pay(user, invoice, bank, "1.00").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("amount") }
        }
    }

    @Test
    fun `compra nova numa fatura paga a deixa em parte paga`() {
        val user = createUser()
        val card = createCard(user)
        val category = createCategory(user)
        purchase(user, card, category, "2026-06-10", "100.00")
        val invoice = invoiceId(user, card, "2026-06-25")
        pay(user, invoice, createAccount(user), "100.00", "2026-06-24")

        purchase(user, card, category, "2026-06-24", "40.00")

        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.status") { value("PARTIALLY_PAID") }
            jsonPath("$.invoice.openAmount") { value(40.0) }
        }
    }

    @Test
    fun `compra de fatura com pagamento só sai depois do estorno`() {
        val user = createUser()
        val card = createCard(user)
        val response = purchase(user, card, createCategory(user), "2026-06-10", "100.00").andReturn().response.contentAsString
        val item = idOf(response)
        val invoice = invoiceId(user, card, "2026-06-25")
        pay(user, invoice, createAccount(user), "30.00")

        mockMvc.delete("/api/v1/card-purchases/$item") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("INVOICE_HAS_PAYMENTS") }
        }
    }

    @Test
    fun `limite usado conta as parcelas futuras e volta com o pagamento`() {
        val user = createUser()
        val card = createCard(user)
        purchase(user, card, createCategory(user), "2026-06-10", "300.00", installments = 3)

        mockMvc.get("/api/v1/cards/$card") { with(user.auth()) }.andExpect {
            jsonPath("$.creditLimit") { value(5000.0) }
            jsonPath("$.used") { value(300.0) }
            jsonPath("$.available") { value(4700.0) }
        }

        val first = invoiceId(user, card, "2026-06-25")
        val bank = createAccount(user)
        pay(user, first, bank, "40.00")
        mockMvc.get("/api/v1/cards") { with(user.auth()) }.andExpect { jsonPath("$[0].used") { value(260.0) } }
        pay(user, first, bank, "60.00")
        mockMvc.get("/api/v1/cards/$card") { with(user.auth()) }.andExpect {
            jsonPath("$.used") { value(200.0) }
            jsonPath("$.available") { value(4800.0) }
        }
    }

    @Test
    fun `pagamento de fatura de outro usuário não é visível`() {
        val maria = createUser()
        val joao = createUser()
        val card = createCard(maria)
        purchase(maria, card, createCategory(maria), "2026-06-10", "100.00")
        val invoice = invoiceId(maria, card, "2026-06-25")
        val payment = idOf(pay(maria, invoice, createAccount(maria), "50.00").andReturn().response.contentAsString)
        val joaoBank = createAccount(joao)

        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.post("/api/v1/invoices/$invoice/payments").contentType(MediaType.APPLICATION_JSON)
                .content("""{"fromAccountId": "$joaoBank", "amount": 10}""")
        }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.delete("/api/v1/invoices/$invoice/payments/$payment") }
        assertNotListedFor(joao, payment) { MockMvcRequestBuilders.get("/api/v1/transactions?from=2026-01-01&to=2026-12-31") }
        mockMvc.delete("/api/v1/invoices/$invoice/payments/${UUID.randomUUID()}") { with(maria.auth()) }
            .andExpect { status { isNotFound() } }
    }

    private fun pay(user: TestUser, invoice: UUID, from: UUID, amount: String, date: String? = null) =
        mockMvc.post("/api/v1/invoices/$invoice/payments") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"fromAccountId": "$from", "amount": $amount${date?.let { ", \"paymentDate\": \"$it\"" } ?: ""}}"""
        }

    private fun idOf(body: String): UUID =
        UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(body)!!.groupValues[1])

    private fun purchase(user: TestUser, card: UUID, category: UUID, date: String, amount: String, installments: Int = 1) =
        mockMvc.post("/api/v1/cards/$card/purchases") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"description": "Compra", "amount": $amount, "categoryId": "$category", "purchaseDate": "$date",
                "installments": $installments}"""
        }.andExpect { status { isCreated() } }

    private fun invoiceId(user: TestUser, card: UUID, closingDate: String): UUID = jdbc.queryForObject(
        "SELECT i.id FROM invoices i JOIN accounts a ON a.id = i.account_id WHERE i.account_id = ? AND a.user_id = ? " +
            "AND i.closing_date = CAST(? AS DATE)",
        UUID::class.java, card, user.id, closingDate,
    )!!

    private fun createCard(user: TestUser): UUID {
        val body = mockMvc.post("/api/v1/cards") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Cartão", "creditLimit": 5000, "closingDay": 25, "dueDay": 5}"""
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        return idOf(body)
    }

    private fun createAccount(user: TestUser, initial: String = "0"): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, initial_balance) VALUES (?, ?, 'Conta', 'CHECKING', ?)",
            id, user.id, BigDecimal(initial),
        )
        return id
    }

    private fun createCategory(user: TestUser): UUID {
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, 'EXPENSE')", id, user.id, "Categoria $id")
        return id
    }
}
