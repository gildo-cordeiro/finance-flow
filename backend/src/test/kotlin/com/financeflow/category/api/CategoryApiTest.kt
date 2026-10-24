package com.financeflow.category.api

import com.financeflow.support.ApiTest
import com.financeflow.support.TestUser
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import tools.jackson.databind.ObjectMapper
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

class CategoryApiTest : ApiTest() {

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `cadastro cria as categorias padrão, sem compartilhar entre usuários`() {
        val maria = register()
        val joao = register()

        val body = mockMvc.get("/api/v1/categories") { with(maria.auth()) }
            .andExpect { status { isOk() } }
            .andReturn().response.getContentAsString(Charsets.UTF_8)
        val tree: Map<String, List<String>> = objectMapper.readTree(body).values().associate { node ->
            "${node["type"].asString()} ${node["name"].asString()}" to node["subcategories"].values().map { it["name"].asString() }
        }
        assertEquals(listOf("Restaurantes", "Supermercado"), tree["EXPENSE Alimentação"])
        assertEquals(listOf("Aluguel", "Internet", "Luz"), tree["EXPENSE Moradia"])
        assertEquals(listOf("Investimentos", "Salário"), tree["INCOME Receitas"])
        assertEquals(emptyList<String>(), tree["INCOME Outras receitas"])
        assertEquals(emptyList<String>(), tree["EXPENSE Outras despesas"])
        assertEquals(9, tree.size)

        val count = "SELECT count(*) FROM categories WHERE user_id = ?"
        assertEquals(16, jdbc.queryForObject(count, Int::class.java, maria.id))
        assertEquals(16, jdbc.queryForObject(count, Int::class.java, joao.id))
        val shared = jdbc.queryForObject(
            "SELECT count(*) FROM categories a JOIN categories b ON a.id = b.id WHERE a.user_id = ? AND b.user_id = ?",
            Int::class.java, maria.id, joao.id,
        )
        assertEquals(0, shared)
    }

    @Test
    fun `lista em árvore filtrada por tipo`() {
        val user = createUser()
        val salario = create(user, "Salário", "INCOME")
        val casa = create(user, "Casa", "EXPENSE")
        val luz = create(user, "Luz", "EXPENSE", parentId = casa)

        mockMvc.get("/api/v1/categories?type=EXPENSE") { with(user.auth()) }.andExpect {
            jsonPath("$.length()") { value(1) }
            jsonPath("$[0].id") { value(casa.toString()) }
            jsonPath("$[0].parentId") { doesNotExist() }
            jsonPath("$[0].subcategories[0].id") { value(luz.toString()) }
            jsonPath("$[0].subcategories[0].parentId") { value(casa.toString()) }
        }
        mockMvc.get("/api/v1/categories?type=INCOME") { with(user.auth()) }.andExpect {
            jsonPath("$[0].id") { value(salario.toString()) }
            jsonPath("$[0].subcategories.length()") { value(0) }
        }
    }

    @Test
    fun `subcategoria precisa de pai de primeiro nível, do mesmo tipo`() {
        val user = createUser()
        val casa = create(user, "Casa", "EXPENSE")
        val luz = create(user, "Luz", "EXPENSE", parentId = casa)

        for ((type, parentId) in listOf("INCOME" to casa, "EXPENSE" to luz, "EXPENSE" to UUID.randomUUID())) {
            post(user, "/api/v1/categories", """{"name": "Nova", "type": "$type", "parentId": "$parentId"}""").andExpect {
                status { isUnprocessableContent() }
                jsonPath("$.errors[0].field") { value("parentId") }
            }
        }
    }

    @Test
    fun `nome é único por pai, sem diferenciar maiúsculas`() {
        val user = createUser()
        val casa = create(user, "Casa", "EXPENSE")
        val lazer = create(user, "Lazer", "EXPENSE")
        create(user, "Outros", "EXPENSE", parentId = casa)
        create(user, "Outros", "EXPENSE", parentId = lazer)

        post(user, "/api/v1/categories", """{"name": "casa ", "type": "INCOME"}""").andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CATEGORY_NAME_TAKEN") }
        }
        rename(user, lazer, "CASA").andExpect { jsonPath("$.code") { value("CATEGORY_NAME_TAKEN") } }
        rename(user, lazer, "Diversão").andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Diversão") }
        }
        rename(user, lazer, "diversão").andExpect { status { isOk() } }
    }

    @Test
    fun `arquivar esconde a categoria e as subcategorias, que continuam consultáveis`() {
        val user = createUser()
        val casa = create(user, "Casa", "EXPENSE")
        val luz = create(user, "Luz", "EXPENSE", parentId = casa)

        mockMvc.post("/api/v1/categories/$casa/archive") { with(user.auth()) }.andExpect {
            status { isOk() }
            jsonPath("$.archived") { value(true) }
        }
        assertEquals(true, jdbc.queryForObject("SELECT archived FROM categories WHERE id = ?", Boolean::class.java, luz))

        mockMvc.get("/api/v1/categories") { with(user.auth()) }.andExpect { jsonPath("$.length()") { value(0) } }
        mockMvc.get("/api/v1/categories?includeArchived=true") { with(user.auth()) }.andExpect {
            jsonPath("$[0].subcategories[0].archived") { value(true) }
        }

        mockMvc.post("/api/v1/categories/$luz/unarchive") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("PARENT_CATEGORY_ARCHIVED") }
        }
        mockMvc.post("/api/v1/categories/$casa/unarchive") { with(user.auth()) }.andExpect { status { isOk() } }
        mockMvc.post("/api/v1/categories/$luz/unarchive") { with(user.auth()) }.andExpect {
            jsonPath("$.archived") { value(false) }
        }
    }

    @Test
    fun `exclui categoria sem uso e recusa com 409 se tiver transações, orçamento ou subcategorias`() {
        val user = createUser()
        val account = createAccount(user)
        val livre = create(user, "Livre", "EXPENSE")
        val comTransacao = create(user, "Com transação", "EXPENSE")
        val comOrcamento = create(user, "Com orçamento", "EXPENSE")
        val pai = create(user, "Pai", "EXPENSE")
        create(user, "Filha", "EXPENSE", parentId = pai)
        insertTransaction(user, account, comTransacao)
        insertBudget(user, comOrcamento, LocalDate.of(2026, 10, 1), "100")

        mockMvc.delete("/api/v1/categories/$livre") { with(user.auth()) }.andExpect { status { isNoContent() } }
        for (id in listOf(comTransacao, comOrcamento)) {
            mockMvc.delete("/api/v1/categories/$id") { with(user.auth()) }.andExpect {
                status { isConflict() }
                jsonPath("$.code") { value("CATEGORY_IN_USE") }
            }
        }
        mockMvc.delete("/api/v1/categories/$pai") { with(user.auth()) }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CATEGORY_HAS_SUBCATEGORIES") }
        }
    }

    @Test
    fun `mesclar move transações e orçamentos para o destino e arquiva a origem`() {
        val user = createUser()
        val account = createAccount(user)
        val mercado = create(user, "Mercado", "EXPENSE")
        val supermercado = create(user, "Supermercado", "EXPENSE")
        val outubro = LocalDate.of(2026, 10, 1)
        val novembro = LocalDate.of(2026, 11, 1)
        repeat(2) { insertTransaction(user, account, mercado) }
        insertBudget(user, mercado, outubro, "100.00")
        insertBudget(user, mercado, novembro, "50.00")
        insertBudget(user, supermercado, outubro, "300.00")

        merge(user, mercado, supermercado).andExpect {
            status { isOk() }
            jsonPath("$.id") { value(mercado.toString()) }
            jsonPath("$.archived") { value(true) }
        }

        val byCategory = "SELECT count(*) FROM transactions WHERE category_id = ?"
        assertEquals(0, jdbc.queryForObject(byCategory, Int::class.java, mercado))
        assertEquals(2, jdbc.queryForObject(byCategory, Int::class.java, supermercado))
        val budgets = jdbc.queryForList(
            "SELECT month, planned_amount FROM budgets WHERE category_id = ? ORDER BY month", supermercado,
        )
        assertEquals(listOf(BigDecimal("400.0000"), BigDecimal("50.0000")), budgets.map { it["planned_amount"] })
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM budgets WHERE category_id = ?", Int::class.java, mercado))
    }

    @Test
    fun `mesclagem recusa destino de outro tipo, a própria categoria e origem com subcategorias`() {
        val user = createUser()
        val casa = create(user, "Casa", "EXPENSE")
        create(user, "Luz", "EXPENSE", parentId = casa)
        val lazer = create(user, "Lazer", "EXPENSE")
        val salario = create(user, "Salário", "INCOME")

        for ((source, target) in listOf(lazer to salario, lazer to lazer, casa to lazer)) {
            merge(user, source, target).andExpect {
                status { isConflict() }
                jsonPath("$.code") { value("INVALID_CATEGORY_MERGE") }
            }
        }
        assertEquals(false, jdbc.queryForObject("SELECT archived FROM categories WHERE id = ?", Boolean::class.java, lazer))
    }

    @Test
    fun `categoria de outro usuário não é visível, alterável nem destino de mesclagem`() {
        val maria = createUser()
        val joao = createUser()
        val id = create(maria, "Da Maria", "EXPENSE")
        val doJoao = create(joao, "Do João", "EXPENSE")
        val json = MediaType.APPLICATION_JSON

        assertNotListedFor(joao, id) { MockMvcRequestBuilders.get("/api/v1/categories?includeArchived=true") }
        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.put("/api/v1/categories/$id").contentType(json).content("""{"name": "Invadida"}""")
        }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/categories/$id/archive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.post("/api/v1/categories/$id/unarchive") }
        assertNotVisibleTo(joao) { MockMvcRequestBuilders.delete("/api/v1/categories/$id") }
        assertNotVisibleTo(joao) {
            MockMvcRequestBuilders.post("/api/v1/categories/$id/merge").contentType(json).content("""{"targetId": "$doJoao"}""")
        }

        merge(joao, doJoao, id).andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("targetId") }
        }
        post(joao, "/api/v1/categories", """{"name": "Sub", "type": "EXPENSE", "parentId": "$id"}""").andExpect {
            status { isUnprocessableContent() }
            jsonPath("$.errors[0].field") { value("parentId") }
        }
        val row = jdbc.queryForMap("SELECT name, archived FROM categories WHERE id = ?", id)
        assertEquals("Da Maria", row["name"])
        assertEquals(false, row["archived"])
    }

    @Test
    fun `sem autenticação responde 401`() {
        mockMvc.get("/api/v1/categories").andExpect { status { isUnauthorized() } }
    }

    private fun register(): TestUser {
        val email = "${UUID.randomUUID()}@example.com"
        val body = mockMvc.post("/api/v1/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Maria", "email": "$email", "password": "senha-forte-1", "acceptedPrivacyVersion": "2026-10"}"""
        }.andExpect { status { isCreated() } }.andReturn().response.contentAsString
        return TestUser(field(body, "id"), email, Regex("\"accessToken\":\"([^\"]+)\"").find(body)!!.groupValues[1])
    }

    private fun create(user: TestUser, name: String, type: String, parentId: UUID? = null): UUID {
        val parent = parentId?.let { """, "parentId": "$it"""" } ?: ""
        val body = post(user, "/api/v1/categories", """{"name": "$name", "type": "$type"$parent}""")
            .andExpect { status { isCreated() } }
            .andReturn().response.contentAsString
        return field(body, "id")
    }

    private fun rename(user: TestUser, id: UUID, name: String) = mockMvc.put("/api/v1/categories/$id") {
        with(user.auth())
        contentType = MediaType.APPLICATION_JSON
        content = """{"name": "$name"}"""
    }

    private fun merge(user: TestUser, id: UUID, targetId: UUID) =
        post(user, "/api/v1/categories/$id/merge", """{"targetId": "$targetId"}""")

    private fun post(user: TestUser, path: String, body: String) = mockMvc.post(path) {
        with(user.auth())
        contentType = MediaType.APPLICATION_JSON
        content = body
    }

    private fun field(body: String, name: String) = UUID.fromString(Regex("\"$name\":\"([^\"]+)\"").find(body)!!.groupValues[1])

    private fun createAccount(user: TestUser): UUID {
        val id = UUID.randomUUID()
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", id, user.id)
        return id
    }

    private fun insertTransaction(user: TestUser, accountId: UUID, categoryId: UUID) {
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, description, amount, type, status, competence_date)
            VALUES (?, ?, ?, ?, 'teste', 10, 'EXPENSE', 'PENDING', DATE '2026-10-01')
            """,
            UUID.randomUUID(), user.id, accountId, categoryId,
        )
    }

    private fun insertBudget(user: TestUser, categoryId: UUID, month: LocalDate, amount: String) {
        jdbc.update(
            "INSERT INTO budgets (id, user_id, category_id, month, planned_amount) VALUES (?, ?, ?, ?, ?)",
            UUID.randomUUID(), user.id, categoryId, month, BigDecimal(amount),
        )
    }
}
