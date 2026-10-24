package com.financeflow.docs

import com.financeflow.support.ApiTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.ObjectMapper
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** ADR-0033: o `docs/api.md` é gerado do OpenAPI e este teste falha quando ele fica desatualizado. */
class ApiDocsTest : ApiTest() {

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `docs api md acompanha o contrato gerado do codigo`() {
        val json = mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString
        @Suppress("UNCHECKED_CAST")
        val spec = objectMapper.readValue(json, Map::class.java) as Map<String, Any?>
        val expected = ApiMarkdown(spec).render()

        val file = File("../docs/api.md")
        if (System.getenv("UPDATE_API_DOCS") == "true") file.writeText(expected)

        assertTrue(file.exists(), "docs/api.md não existe. $HOW_TO_UPDATE")
        assertEquals(expected, file.readText(), "docs/api.md está desatualizado. $HOW_TO_UPDATE")
    }

    @Test
    fun `swagger ui abre sem autenticacao`() {
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk)
    }

    private companion object {
        const val HOW_TO_UPDATE =
            "Gere de novo com: UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'"
    }
}
