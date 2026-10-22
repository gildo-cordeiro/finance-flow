package com.financeflow

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class HealthCheckTest(@Autowired private val mockMvc: MockMvc) : IntegrationTest() {

    @Test
    fun `health check é público e responde UP`() {
        mockMvc.get("/actuator/health").andExpect {
            status { isOk() }
            jsonPath("$.status") { value("UP") }
        }
    }

    @Test
    fun `demais rotas exigem autenticação`() {
        mockMvc.get("/api/v1/qualquer-coisa").andExpect {
            status { isUnauthorized() }
        }
    }
}
