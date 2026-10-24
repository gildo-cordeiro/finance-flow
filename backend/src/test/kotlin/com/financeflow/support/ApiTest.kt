package com.financeflow.support

import com.financeflow.IntegrationTest
import com.financeflow.auth.infra.AccessTokenIssuer
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID
import kotlin.test.assertFalse

@SpringBootTest
@AutoConfigureMockMvc
@Import(FakeEmailSender::class)
abstract class ApiTest : IntegrationTest() {

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var jdbc: JdbcTemplate

    @Autowired
    protected lateinit var emailSender: FakeEmailSender

    @Autowired
    private lateinit var accessTokens: AccessTokenIssuer

    protected fun createUser(name: String = "Usuário de teste"): TestUser {
        val id = UUID.randomUUID()
        val email = "$id@example.com"
        jdbc.update(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash-de-teste', ?)",
            id, email, name,
        )
        return TestUser(id, email, accessTokens.issue(id).value)
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

data class TestUser(val id: UUID, val email: String, val accessToken: String) {

    fun auth(): RequestPostProcessor = RequestPostProcessor {
        it.addHeader("Authorization", "Bearer $accessToken")
        it
    }
}
