package com.financeflow.support

import com.financeflow.IntegrationTest
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID
import kotlin.test.assertFalse

/**
 * Base dos testes de API: contexto completo, MockMvc e PostgreSQL real.
 *
 * ```
 * val alice = createUser()
 * mockMvc.get("/api/v1/accounts") { with(alice.auth()) }
 * assertNotVisibleTo(bob) { get("/api/v1/accounts/$id") }
 * ```
 */
@SpringBootTest
@AutoConfigureMockMvc
abstract class ApiTest : IntegrationTest() {

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var jdbc: JdbcTemplate

    /**
     * Cria um usuário direto no banco. Cada chamada gera um e-mail único, então os testes
     * não precisam limpar a tabela.
     */
    protected fun createUser(name: String = "Usuário de teste"): TestUser {
        val user = TestUser(UUID.randomUUID(), "${UUID.randomUUID()}@example.com")
        jdbc.update(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash-de-teste', ?)",
            user.id, user.email, name,
        )
        return user
    }

    /**
     * Garante que [other] recebe 404 `NOT_FOUND` ao acessar o recurso: recurso de outro
     * usuário não existe para ele (ADR-0012). Usar em toda rota que recebe um id.
     */
    protected fun assertNotVisibleTo(other: TestUser, request: () -> MockHttpServletRequestBuilder) {
        mockMvc.perform(request().with(other.auth()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOT_FOUND"))
    }

    /**
     * Garante que a resposta de uma listagem para [other] não menciona [resourceId].
     * Usar em toda rota de listagem ou busca.
     */
    protected fun assertNotListedFor(other: TestUser, resourceId: UUID, request: () -> MockHttpServletRequestBuilder) {
        val body = mockMvc.perform(request().with(other.auth()))
            .andExpect(status().is2xxSuccessful)
            .andReturn().response.contentAsString
        assertFalse(body.contains(resourceId.toString()), "a resposta para outro usuário contém $resourceId")
    }
}

data class TestUser(val id: UUID, val email: String) {

    /**
     * Autentica a requisição como este usuário. Até a F1-04 a autenticação é montada pelo
     * spring-security-test; depois, passa a enviar um access token real, sem mudar os testes.
     */
    fun auth(): RequestPostProcessor = SecurityMockMvcRequestPostProcessors.user(id.toString())
}
