package com.financeflow.shared.error

import com.financeflow.shared.security.CurrentUser
import com.financeflow.support.ApiTest
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import org.junit.jupiter.api.Test
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Import(GlobalExceptionHandlerTest.ErrorTestController::class)
class GlobalExceptionHandlerTest : ApiTest() {

    @Test
    fun `NotFoundException vira 404 com code`() {
        expectProblem("/test/errors/not-found", 404, "NOT_FOUND", "Conta não encontrada")
    }

    @Test
    fun `BusinessRuleException vira 409 com o code informado`() {
        expectProblem("/test/errors/business-rule", 409, "CATEGORY_IN_USE", "Categoria em uso")
    }

    @Test
    fun `ValidationException vira 422 com a lista de campos`() {
        mockMvc.get("/test/errors/validation") { with(createUser().auth()) }.andExpect {
            status { isEqualTo(422) }
            content { contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON) }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors[0].field") { value("timezone") }
            jsonPath("$.errors[0].message") { value("Fuso horário inválido") }
        }
    }

    @Test
    fun `ForbiddenException vira 403 com code`() {
        expectProblem("/test/errors/forbidden", 403, "FORBIDDEN", "Acesso negado")
    }

    @Test
    fun `erro inesperado vira 500 sem vazar a mensagem interna`() {
        mockMvc.get("/test/errors/unexpected") { with(createUser().auth()) }.andExpect {
            status { isInternalServerError() }
            jsonPath("$.code") { value("INTERNAL_ERROR") }
            jsonPath("$.detail") { value("Erro inesperado") }
        }
    }

    @Test
    fun `validação de bean no corpo retorna 422 com os campos`() {
        mockMvc.post("/test/errors/body") {
            with(createUser().auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": " ", "amount": -1}"""
        }.andExpect {
            status { isEqualTo(422) }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors.length()") { value(2) }
            jsonPath("$.errors[?(@.field == 'name')]") { exists() }
            jsonPath("$.errors[?(@.field == 'amount')]") { exists() }
        }
    }

    @Test
    fun `validação de bean em parâmetro retorna 422 com o campo`() {
        mockMvc.get("/test/errors/param?page=0") { with(createUser().auth()) }.andExpect {
            status { isEqualTo(422) }
            jsonPath("$.code") { value("VALIDATION_FAILED") }
            jsonPath("$.errors[0].field") { value("page") }
        }
    }

    @Test
    fun `corpo válido passa pela desserialização Kotlin`() {
        mockMvc.post("/test/errors/body") {
            with(createUser().auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Mercado", "amount": 10}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Mercado") }
        }
    }

    @Test
    fun `JSON malformado retorna 400`() {
        mockMvc.post("/test/errors/body") {
            with(createUser().auth())
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "Mercado", """
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("MALFORMED_REQUEST") }
        }
    }

    @Test
    fun `erros do Spring MVC também recebem code`() {
        mockMvc.post("/test/errors/not-found") { with(createUser().auth()) }.andExpect {
            status { isMethodNotAllowed() }
            jsonPath("$.code") { value("METHOD_NOT_ALLOWED") }
        }
    }

    @Test
    fun `requisição sem autenticação retorna 401 em Problem Details`() {
        mockMvc.get("/test/errors/not-found").andExpect {
            status { isUnauthorized() }
            content { contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON) }
            jsonPath("$.code") { value("UNAUTHORIZED") }
        }
    }

    @Test
    fun `recurso de outro usuário responde 404 e não aparece na listagem`() {
        val alice = createUser()
        val bob = createUser()
        val id = mockMvc.post("/test/owned") { with(alice.auth()) }
            .andReturn().response.contentAsString.trim('"')

        mockMvc.get("/test/owned/$id") { with(alice.auth()) }.andExpect { status { isOk() } }
        assertNotVisibleTo(bob) { MockMvcRequestBuilders.get("/test/owned/$id") }
        assertNotListedFor(bob, UUID.fromString(id)) { MockMvcRequestBuilders.get("/test/owned") }
    }

    private fun expectProblem(path: String, status: Int, code: String, detail: String) {
        mockMvc.get(path) { with(createUser().auth()) }.andExpect {
            status { isEqualTo(status) }
            content { contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON) }
            jsonPath("$.status") { value(status) }
            jsonPath("$.title") { exists() }
            jsonPath("$.code") { value(code) }
            jsonPath("$.detail") { value(detail) }
        }
    }

    data class Body(
        @field:NotBlank val name: String,
        @field:Positive val amount: Int,
    )

    /** Rotas só para teste; classe aninhada fica fora do component scan e entra pelo @Import. */
    @RestController
    @RequestMapping("/test")
    class ErrorTestController(private val currentUser: CurrentUser) {

        private val owners = ConcurrentHashMap<UUID, UUID>()

        @GetMapping("/errors/not-found")
        fun notFound(): Nothing = throw NotFoundException("Conta não encontrada")

        @GetMapping("/errors/business-rule")
        fun businessRule(): Nothing = throw BusinessRuleException("CATEGORY_IN_USE", "Categoria em uso")

        @GetMapping("/errors/validation")
        fun validation(): Nothing = throw ValidationException("timezone", "Fuso horário inválido")

        @GetMapping("/errors/forbidden")
        fun forbidden(): Nothing = throw ForbiddenException()

        @GetMapping("/errors/unexpected")
        fun unexpected(): Nothing = throw IllegalStateException("detalhe interno que não deve vazar")

        @PostMapping("/errors/body")
        fun body(@Valid @RequestBody body: Body): Body = body

        @GetMapping("/errors/param")
        fun param(@RequestParam @Min(1) page: Int): Int = page

        @PostMapping("/owned")
        fun create(): UUID = UUID.randomUUID().also { owners[it] = currentUser.id() }

        @GetMapping("/owned/{id}")
        fun get(@PathVariable id: UUID): UUID =
            id.takeIf { owners[it] == currentUser.id() } ?: throw NotFoundException()

        @GetMapping("/owned")
        fun list(): List<UUID> = owners.filterValues { it == currentUser.id() }.keys.toList()
    }
}
