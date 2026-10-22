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

@SpringBootTest
@AutoConfigureMockMvc
abstract class ApiTest : IntegrationTest() {

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var jdbc: JdbcTemplate

    protected fun createUser(name: String = "Usuário de teste"): TestUser {
        val user = TestUser(UUID.randomUUID(), "${UUID.randomUUID()}@example.com")
        jdbc.update(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash-de-teste', ?)",
            user.id, user.email, name,
        )
        return user
    }

    protected fun assertNotVisibleTo(other: TestUser, request: () -> MockHttpServletRequestBuilder) {
        mockMvc.perform(request().with(other.auth()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOT_FOUND"))
    }

    protected fun assertNotListedFor(other: TestUser, resourceId: UUID, request: () -> MockHttpServletRequestBuilder) {
        val body = mockMvc.perform(request().with(other.auth()))
            .andExpect(status().is2xxSuccessful)
            .andReturn().response.contentAsString
        assertFalse(body.contains(resourceId.toString()), "a resposta para outro usuário contém $resourceId")
    }
}

data class TestUser(val id: UUID, val email: String) {

    fun auth(): RequestPostProcessor = SecurityMockMvcRequestPostProcessors.user(id.toString())
}
