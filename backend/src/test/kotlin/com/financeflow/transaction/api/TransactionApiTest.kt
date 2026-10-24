package com.financeflow.transaction.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.util.UUID

class TransactionApiTest : ApiTest() {

    @Test
    fun `cria despesa com a competência sugerida pelo vencimento e pelo deslocamento da conta`() {
        val user = createUser()
        val account = createAccount(user, offset = 1)
        val category = createCategory(user, "Moradia")

        create(user, body(account, category, dueDate = "2099-07-05")).andExpect {
            status { isCreated() }
            jsonPath("$.description") { value("Aluguel") }
            jsonPath("$.amount") { value(1750.0) }
            jsonPath("$.competenceMonth") { value("2099-06") }
            jsonPath("$.dueDate") { value("2099-07-05") }
            jsonPath("$.paymentDate") { doesNotExist() }
            jsonPath("$.status") { value("PENDING") }
            jsonPath("$.visibility") { value("PRIVATE") }
            jsonPath("$.accountName") { value("Conta") }
            jsonPath("$.categoryName") { value("Moradia") }
        }
    }

    @Test
    fun `competência informada vale sobre a sugestão`() {
        val user = createUser()
        val account = createAccount(user)
        val category = createCategory(user, "Moradia")

        create(user, body(account, category, dueDate = "2099-07-05", extra = """, "competenceMonth": "2099-09"""")).andExpect {
            jsonPath("$.competenceMonth") { value("2099-09") }
        }
    }

    @Test
    fun `data de pagamento sem status vira pago e vencimento passado vira atrasado`() {
        val user = createUser()
        val account = createAccount(user)
        val category = createCategory(user, "Moradia")

        create(user, body(account, category, dueDate = "2020-01-10", extra = """, "paymentDate": "2020-01-09"""")).andExpect {
            jsonPath("$.status") { value("PAID") }
            jsonPath("$.paymentDate") { value("2020-01-09") }
        }
        create(user, body(account, category, dueDate = "2020-01-10")).andExpect {
            jsonPath("$.status") { value("OVERDUE") }
        }
    }

    @Test
    fun `regras de validação respondem 422`() {
        val user = createUser()
        val account = createAccount(user)
        val expense = createCategory(user, "Moradia")
        val income = createCategory(user, "Salário", type = "INCOME")

        create(user, body(account, expense, extra = """, "status": "PAID"""")).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("paymentDate") }
        }
        create(user, body(account, expense, extra = """, "status": "PENDING", "paymentDate": "2099-01-01"""")).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("paymentDate") }
        }
        create(user, body(account, income)).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("categoryId") }
        }
        create(user, body(account, expense, dueDate = null)).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("dueDate") }
        }
        create(user, body(account, expense, type = "TRANSFER")).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("type") }
        }
        create(user, """{"type": "EXPENSE", "description": " ", "amount": 0, "accountId": "$account", "categoryId": "$expense"}""")
            .andExpect { status { isUnprocessableContent() } }
    }

    @Test
    fun `cartão, conta arquivada e categoria arquivada são recusados`() {
        val user = createUser()
        val category = createCategory(user, "Moradia")
        val card = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 5, 12)",
            card, user.id,
        )
        create(user, body(card, category)).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.code") { value("USE_CARD_ENDPOINT") }
        }

        val archived = createAccount(user)
        jdbc.update("UPDATE accounts SET archived = TRUE WHERE id = ?", archived)
        create(user, body(archived, category)).andExpect { jsonPath("$.errors[0].field") { value("accountId") } }

        val account = createAccount(user)
        val oldCategory = createCategory(user, "Antiga")
        jdbc.update("UPDATE categories SET archived = TRUE WHERE id = ?", oldCategory)
        create(user, body(account, oldCategory)).andExpect { jsonPath("$.errors[0].field") { value("categoryId") } }
    }

    @Test
    fun `lista com filtros combinados e totais da seleção inteira`() {
        val user = createUser()
        val nubank = createAccount(user, name = "Nubank")
        val itau = createAccount(user, name = "Itaú")
        val moradia = createCategory(user, "Moradia")
        val aluguel = createCategory(user, "Aluguel", parent = moradia)
        val salario = createCategory(user, "Salário", type = "INCOME")

        val rent = id(create(user, body(nubank, aluguel, description = "Aluguel", amount = "1000.00", dueDate = "2099-10-05")))
        val light = id(create(user, body(itau, moradia, description = "Luz", amount = "200.50", dueDate = "2099-10-20")))
        val pay = id(create(user, body(nubank, salario, type = "INCOME", description = "Salário", amount = "5000.00", dueDate = "2099-10-05", extra = """, "paymentDate": "2099-10-05"""")))
        create(user, body(nubank, moradia, description = "Fora do mês", dueDate = "2099-11-05"))

        list(user, "from=2099-10-01&to=2099-10-31").andExpect {
            jsonPath("$.items.length()") { value(3) }
            jsonPath("$.totals.count") { value(3) }
            jsonPath("$.totals.income") { value(5000.0) }
            jsonPath("$.totals.expense") { value(1200.5) }
            jsonPath("$.totals.balance") { value(3799.5) }
        }
        list(user, "from=2099-10-01&to=2099-10-31&size=1").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.totals.count") { value(3) }
        }
        list(user, "from=2099-10-01&to=2099-10-31&categoryId=$moradia").andExpect {
            jsonPath("$.items.length()") { value(2) }
            jsonPath("$.items[?(@.id == '$rent')].parentCategoryName") { value("Moradia") }
        }
        list(user, "from=2099-10-01&to=2099-10-31&accountId=$itau").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(light.toString()) }
        }
        list(user, "from=2099-10-01&to=2099-10-31&status=PAID&type=INCOME").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(pay.toString()) }
        }
        list(user, "from=2099-10-01&to=2099-10-31&status=PAID&status=PENDING&q=LUZ").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(light.toString()) }
        }
        list(user, "from=2099-10-04&to=2099-10-06&dateField=PAYMENT").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(pay.toString()) }
        }
        list(user, "from=2099-10-20&to=2099-10-20&dateField=DUE").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(light.toString()) }
        }
    }

    @Test
    fun `transferências aparecem na lista mas ficam fora dos totais`() {
        val user = createUser()
        val account = createAccount(user)
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      payment_date, transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'Reserva', 300, 'TRANSFER', 'PAID', '2099-10-01', '2099-10-10', ?, 'OUT')
            """,
            UUID.randomUUID(), user.id, account, UUID.randomUUID(),
        )
        list(user, "from=2099-10-01&to=2099-10-31").andExpect {
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].transferDirection") { value("OUT") }
            jsonPath("$.totals.income") { value(0) }
            jsonPath("$.totals.expense") { value(0) }
        }
    }

    @Test
    fun `edita, paga, desfaz o pagamento e exclui`() {
        val user = createUser()
        val account = createAccount(user)
        val category = createCategory(user, "Moradia")
        val id = id(create(user, body(account, category, dueDate = "2099-10-05")))

        mockMvc.put("/api/v1/transactions/$id") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = body(account, category, description = "Aluguel novo", amount = "1800.00", dueDate = "2099-11-05")
        }.andExpect {
            status { isOk() }
            jsonPath("$.description") { value("Aluguel novo") }
            jsonPath("$.competenceMonth") { value("2099-11") }
        }

        mockMvc.post("/api/v1/transactions/$id/pay") {
            with(user.auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentDate": "2099-11-04"}"""
        }.andExpect {
            jsonPath("$.status") { value("PAID") }
            jsonPath("$.paymentDate") { value("2099-11-04") }
        }
        mockMvc.get("/api/v1/accounts/$account") { with(user.auth()) }.andExpect { jsonPath("$.balance") { value(-1800.0) } }

        mockMvc.post("/api/v1/transactions/$id/unpay") { with(user.auth()) }.andExpect {
            jsonPath("$.status") { value("PENDING") }
            jsonPath("$.paymentDate") { doesNotExist() }
        }

        mockMvc.delete("/api/v1/transactions/$id") { with(user.auth()) }.andExpect { status { isNoContent() } }
        mockMvc.get("/api/v1/transactions/$id") { with(user.auth()) }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `pagar sem data usa hoje`() {
        val user = createUser()
        val id = id(create(user, body(createAccount(user), createCategory(user, "Moradia"))))
        mockMvc.post("/api/v1/transactions/$id/pay") { with(user.auth()) }.andExpect {
            jsonPath("$.status") { value("PAID") }
            jsonPath("$.paymentDate") { isNotEmpty() }
        }
    }

    @Test
    fun `transferência não é alterada por aqui`() {
        val user = createUser()
        val id = UUID.randomUUID()
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'Reserva', 300, 'TRANSFER', 'PENDING', '2099-10-01', ?, 'OUT')
            """,
            id, user.id, createAccount(user), UUID.randomUUID(),
        )
        mockMvc.delete("/api/v1/transactions/$id") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("TRANSACTION_NOT_EDITABLE_HERE") }
        }
    }

    @Test
    fun `sugere a competência pela conta`() {
        val user = createUser()
        val account = createAccount(user, offset = 1)
        mockMvc.get("/api/v1/transactions/competence-suggestion?accountId=$account&date=2099-01-10") { with(user.auth()) }
            .andExpect { jsonPath("$.competenceMonth") { value("2098-12") } }
    }

    @Test
    fun `transação de outro usuário não é visível, listada nem alterável`() {
        val owner = createUser()
        val other = createUser()
        val account = createAccount(owner)
        val category = createCategory(owner, "Moradia")
        val id = id(create(owner, body(account, category, dueDate = "2099-10-05")))

        assertNotVisibleTo(other) { MockMvcRequestBuilders.get("/api/v1/transactions/$id") }
        assertNotVisibleTo(other) {
            MockMvcRequestBuilders.put("/api/v1/transactions/$id")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(account, category))
        }
        assertNotVisibleTo(other) { MockMvcRequestBuilders.delete("/api/v1/transactions/$id") }
        assertNotVisibleTo(other) { MockMvcRequestBuilders.post("/api/v1/transactions/$id/pay") }
        assertNotVisibleTo(other) { MockMvcRequestBuilders.post("/api/v1/transactions/$id/unpay") }
        assertNotVisibleTo(other) {
            MockMvcRequestBuilders.get("/api/v1/transactions/competence-suggestion?accountId=$account&date=2099-01-10")
        }
        assertNotListedFor(other, id) { MockMvcRequestBuilders.get("/api/v1/transactions?from=2099-10-01&to=2099-10-31") }

        val otherCategory = createCategory(other, "Moradia")
        create(other, body(account, otherCategory)).andExpect { jsonPath("$.errors[0].field") { value("accountId") } }
        create(other, body(createAccount(other), category)).andExpect { jsonPath("$.errors[0].field") { value("categoryId") } }
    }

    @Test
    fun `sem autenticação responde 401`() {
        mockMvc.get("/api/v1/transactions?from=2099-10-01&to=2099-10-31").andExpect { status { isUnauthorized() } }
    }

    private fun createAccount(user: TestUser, name: String = "Conta", offset: Int = 0): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, competence_offset) VALUES (?, ?, ?, 'CHECKING', ?)",
            id, user.id, name, offset,
        )
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

    private fun body(
        accountId: UUID,
        categoryId: UUID,
        type: String = "EXPENSE",
        description: String = "Aluguel",
        amount: String = "1750.00",
        dueDate: String? = "2099-10-05",
        extra: String = "",
    ): String {
        val due = dueDate?.let { """, "dueDate": "$it"""" }.orEmpty()
        return """{"type": "$type", "description": "$description", "amount": $amount, "accountId": "$accountId", "categoryId": "$categoryId"$due$extra}"""
    }

    private fun create(user: TestUser, body: String) = mockMvc.post("/api/v1/transactions") {
        with(user.auth())
        contentType = MediaType.APPLICATION_JSON
        content = body
    }

    private fun list(user: TestUser, query: String) = mockMvc.get("/api/v1/transactions?$query") { with(user.auth()) }

    private fun id(result: org.springframework.test.web.servlet.ResultActionsDsl): UUID =
        UUID.fromString(Regex("\"id\":\"([^\"]+)\"").find(result.andReturn().response.contentAsString)!!.groupValues[1])
}
