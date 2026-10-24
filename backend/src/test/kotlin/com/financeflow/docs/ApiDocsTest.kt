package com.financeflow.docs

import com.financeflow.support.ApiTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.web.servlet.get
import tools.jackson.databind.ObjectMapper
import java.io.File
import kotlin.test.assertEquals

/**
 * O `docs/api.md` versionado precisa bater com o OpenAPI gerado do código (ADR-0033, ADR-0038).
 * Para atualizar: `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`.
 */
class ApiDocsTest : ApiTest() {

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private val file = File("../docs/api.md")

    @Test
    fun `docs api md está atualizado`() {
        val spec = mockMvc.get("/v3/api-docs")
            .andExpect { status { isOk() } }
            .andReturn().response.getContentAsString(Charsets.UTF_8)
        val markdown = OpenApiMarkdown.render(objectMapper.readTree(spec))

        if (System.getenv("UPDATE_API_DOCS") == "true") file.writeText(markdown)

        assertEquals(
            markdown,
            file.takeIf { it.exists() }?.readText(),
            "docs/api.md está desatualizado. Rode: UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'",
        )
    }

    @Test
    fun `Swagger UI responde em desenvolvimento`() {
        mockMvc.get("/swagger-ui/index.html").andExpect { status { isOk() } }
    }
}
