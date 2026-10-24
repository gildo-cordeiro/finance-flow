package com.financeflow.invoice.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.util.UUID
import kotlin.test.assertEquals

class InvoiceApiTest : ApiTest() {

    @Test
    fun `compra no dia do fechamento cai na fatura do mês e a do dia seguinte na próxima`() {
        val user = createUser()
        val card = createCard(user, closingDay = 25, dueDay = 5)
        val category = createCategory(user)

        purchase(user, card, category, date = "2026-06-25").andExpect {
            status { isCreated() }
            jsonPath("$.length()") { value(1) }
            jsonPath("$[0].dueDate") { value("2026-07-05") }
            jsonPath("$[0].competenceMonth") { value("2026-06") }
        }
        purchase(user, card, category, date = "2026-06-26").andExpect {
            jsonPath("$[0].dueDate") { value("2026-08-05") }
            jsonPath("$[0].competenceMonth") { value("2026-07") }
        }

        mockMvc.get("/api/v1/cards/$card/invoices") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(2) }
            jsonPath("$[0].closingDate") { value("2026-06-25") }
            jsonPath("$[0].dueDate") { value("2026-07-05") }
            jsonPath("$[0].competenceMonth") { value("2026-06") }
            jsonPath("$[1].closingDate") { value("2026-07-25") }
        }
    }

    @Test
    fun `parcelado em 3x cai em três faturas consecutivas com os centavos na última`() {
        val user = createUser()
        val card = createCard(user, closingDay = 25, dueDay = 5)
        val category = createCategory(user)

        purchase(user, card, category, date = "2026-06-10", amount = "100.00", installments = 3).andExpect {
            jsonPath("$.length()") { value(3) }
            jsonPath("$[0].amount") { value(33.33) }
            jsonPath("$[1].amount") { value(33.33) }
            jsonPath("$[2].amount") { value(33.34) }
            jsonPath("$[0].dueDate") { value("2026-07-05") }
            jsonPath("$[1].dueDate") { value("2026-08-05") }
            jsonPath("$[2].dueDate") { value("2026-09-05") }
        }

        mockMvc.get("/api/v1/cards/$card/invoices") { with(user.auth()) }.andExpect {
            jsonPath("$[*].closingDate") {
                value(org.hamcrest.Matchers.contains("2026-06-25", "2026-07-25", "2026-08-25"))
            }
            jsonPath("$[2].total") { value(33.34) }
        }
        val third = invoiceId(user, card, "2026-08-25")
        mockMvc.get("/api/v1/invoices/$third") { with(user.auth()) }.andExpect {
            jsonPath("$.items[0].description") { value("Compra") }
            jsonPath("$.items[0].installmentNumber") { value(3) }
            jsonPath("$.items[0].totalInstallments") { value(3) }
            jsonPath("$.items[0].purchaseDate") { value("2026-06-10") }
            jsonPath("$.nextInvoiceId") { value(null) }
            jsonPath("$.previousInvoiceId") { value(invoiceId(user, card, "2026-07-25").toString()) }
        }
    }

    @Test
    fun `total da fatura é a soma dos itens`() {
        val user = createUser()
        val card = createCard(user)
        val category = createCategory(user)
        purchase(user, card, category, date = "2026-03-02", amount = "120.40")
        purchase(user, card, category, date = "2026-03-10", amount = "79.65")
        purchase(user, card, category, date = "2026-03-20", amount = "0.95")

        val invoice = invoiceId(user, card, "2026-03-25")
        mockMvc.get("/api/v1/invoices/$invoice") { with(user.auth()) }.andExpect {
            jsonPath("$.invoice.total") { value(201.0) }
            jsonPath("$.invoice.itemCount") { value(3) }
            jsonPath("$.cardName") { value("Cartão") }
            jsonPath("$.items[*].purchaseDate") {
                value(org.hamcrest.Matchers.contains("2026-03-20", "2026-03-10", "2026-03-02"))
            }
        }
    }

    @Test
    fun `compra no cartão entra na listagem de transações, mas é alterada pela fatura`() {
        val user = createUser()
        val card = createCard(user)
        val category = createCategory(user)
        val item = itemId(purchase(user, card, category, date = "2026-06-25"))

        mockMvc.get("/api/v1/transactions/$item") { with(user.auth()) }.andExpect {
            jsonPath("$.accountId") { value(card.toString()) }
            jsonPath("$.purchaseDate") { value("2026-06-25") }
            jsonPath("$.invoiceId") { value(invoiceId(user, card, "2026-06-25").toString()) }
            jsonPath("$.competenceMonth") { value("2026-06") }
            jsonPath("$.competenceInformed") { value(false) }
        }
        mockMvc.delete("/api/v1/transactions/$item") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("TRANSACTION_NOT_EDITABLE_HERE") }
        }
    }

    @Test
    fun `mostra a fatura de uma data sem gravar nada`() {
        val user = createUser()
        val card = createCard(user, closingDay = 3, dueDay = 10)

        mockMvc.get("/api/v1/cards/$card/invoices/preview?purchaseDate=2026-10-24") { with(user.auth()) }.andExpect {
            jsonPath("$.closingDate") { value("2026-11-03") }
            jsonPath("$.dueDate") { value("2026-11-10") }
            jsonPath("$.competenceMonth") { value("2026-10") }
        }
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM invoices WHERE account_id = ?", Int::class.java, card))
    }

    @Test
    fun `fatura atual sem compras vem sem id e com total zero`() {
        val user = createUser()
        val card = createCard(user)

        mockMvc.get("/api/v1/cards/$card/invoices/current") { with(user.auth()) }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(null) }
            jsonPath("$.total") { value(0) }
            jsonPath("$.status") { value("OPEN") }
        }
    }

    @Test
    fun `fatura passada aparece fechada`() {
        val user = createUser()
        val card = createCard(user)
        purchase(user, card, createCategory(user), date = "2025-01-10")

        mockMvc.get("/api/v1/cards/$card/invoices") { with(user.auth()) }.andExpect {
            jsonPath("$[0].status") { value("CLOSED") }
        }
    }

    @Test
    fun `mudar o fechamento não move a fatura já criada`() {
        val user = createUser()
        val card = createCard(user, closingDay = 25, dueDay = 5)
        val category = createCategory(user)
        purchase(user, card, category, date = "2026-06-10")

        mockMvc.put("/api/v1/cards/$card") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Cartão", "creditLimit": 5000, "closingDay": 10, "dueDay": 20}"""
        }.andExpect { status { isOk() } }

        purchase(user, card, category, date = "2026-06-20").andExpect { jsonPath("$[0].dueDate") { value("2026-07-05") } }
        purchase(user, card, category, date = "2026-06-26").andExpect { jsonPath("$[0].dueDate") { value("2026-07-20") } }
    }

    @Test
    fun `exclui a compra inteira e some com as faturas vazias`() {
        val user = createUser()
        val card = createCard(user)
        val category = createCategory(user)
        purchase(user, card, category, date = "2026-02-10", amount = "50.00")
        val item = itemId(purchase(user, card, category, date = "2026-02-11", amount = "300.00", installments = 3))

        mockMvc.delete("/api/v1/card-purchases/$item") { with(user.auth()) }.andExpect { status { isNoContent() } }

        mockMvc.get("/api/v1/cards/$card/invoices") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(1) }
            jsonPath("$[0].total") { value(50.0) }
        }
    }

    @Test
    fun `compra com parcela paga não é excluída`() {
        val user = createUser()
        val card = createCard(user)
        val item = itemId(purchase(user, card, createCategory(user), date = "2026-02-10", installments = 2))
        jdbc.update("UPDATE transactions SET status = 'PAID', payment_date = DATE '2026-03-05' WHERE id = ?", item)

        mockMvc.delete("/api/v1/card-purchases/$item") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("PURCHASE_HAS_PAID_ITEMS") }
        }
    }

    @Test
    fun `cartão arquivado não recebe compras`() {
        val user = createUser()
        val card = createCard(user)
        mockMvc.post("/api/v1/cards/$card/archive") { with(user.auth()) }

        purchase(user, card, createCategory(user), date = "2026-02-10").andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CARD_ARCHIVED") }
        }
    }

    @Test
    fun `categoria de receita, conta comum e dados inválidos respondem 422`() {
        val user = createUser()
        val card = createCard(user)

        purchase(user, card, createCategory(user, type = "INCOME"), date = "2026-02-10").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("categoryId") }
        }
        mockMvc.post("/api/v1/cards/$card/purchases") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"description": "", "amount": 0, "installments": 49}"""
        }.andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[*].field") {
                value(org.hamcrest.Matchers.hasItems("description", "amount", "categoryId", "purchaseDate", "installments"))
            }
        }
    }

    @Test
    fun `fatura e compras de outro usuário não são visíveis`() {
        val maria = createUser()
        val joao = createUser()
        val card = createCard(maria)
        val item = itemId(purchase(maria, card, createCategory(maria), date = "2026-02-10"))
        val invoice = invoiceId(maria, card, "2026-02-25")
        val joaoCategory = createCategory(joao)

        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/invoices/$invoice") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/cards/$card/invoices") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/cards/$card/invoices/current") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.get("/api/v1/cards/$card/invoices/preview?purchaseDate=2026-02-10") }
        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.post("/api/v1/cards/$card/purchases").contentType(MediaType.APPLICATION_JSON)
                .content(purchaseBody(joaoCategory, "2026-02-10", "10.00", 1))
        }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.delete("/api/v1/card-purchases/$item") }
        assertNotListedFor(joao, item) { MockMvcRequestBuilders.get("/api/v1/transactions?from=2026-01-01&to=2026-12-31") }
    }

    @Test
    fun `categoria de outro usuário na compra responde 422`() {
        val user = createUser()
        val card = createCard(user)

        purchase(user, card, createCategory(createUser()), date = "2026-02-10").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("categoryId") }
        }
    }

    private fun purchaseBody(category: UUID, date: String, amount: String, installments: Int) =
        """{"description": "Compra", "amount": $amount, "categoryId": "$category", "purchaseDate": "$date",
            "installments": $installments}"""

    private fun purchase(
        user: TestUser,
        card: UUID,
        category: UUID,
        date: String,
        amount: String = "10.00",
        installments: Int = 1,
    ) = mockMvc.post("/api/v1/cards/$card/purchases") {
        with(user.auth())
        contentType = MediaType.APPLICATION_JSON
        content = purchaseBody(category, date, amount, installments)
    }

    private fun itemId(result: ResultActionsDsl): UUID =
        UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(result.andReturn().response.contentAsString)!!.groupValues[1])

    private fun invoiceId(user: TestUser, card: UUID, closingDate: String): UUID = jdbc.queryForObject(
        "SELECT i.id FROM invoices i JOIN accounts a ON a.id = i.account_id WHERE i.account_id = ? AND a.user_id = ? " +
            "AND i.closing_date = CAST(? AS DATE)",
        UUID::class.java, card, user.id, closingDate,
    )!!

    private fun createCard(user: TestUser, closingDay: Int = 25, dueDay: Int = 5): UUID {
        val body = mockMvc.post("/api/v1/cards") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Cartão", "creditLimit": 5000, "closingDay": $closingDay, "dueDay": $dueDay}"""
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        return UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(body)!!.groupValues[1])
    }

    private fun createCategory(user: TestUser, type: String = "EXPENSE"): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)",
            id, user.id, "Categoria $id", type,
        )
        return id
    }
}
