package com.financeflow

import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

/**
 * Base dos testes de integração: PostgreSQL real, um contêiner para toda a suíte (ADR-0023).
 * Exige Docker.
 */
abstract class IntegrationTest {

    companion object {
        const val JWT_SECRET = "segredo-de-teste-com-mais-de-32-bytes"

        private val postgres = PostgreSQLContainer("postgres:16-alpine").apply { start() }

        @JvmStatic
        @DynamicPropertySource
        fun datasourceProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("app.auth.jwt-secret") { JWT_SECRET }
        }
    }
}
