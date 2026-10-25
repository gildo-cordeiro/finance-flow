package com.financeflow.shared.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.boot.env.YamlPropertySourceLoader
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.core.io.ClassPathResource
import org.springframework.mock.env.MockEnvironment
import kotlin.test.assertEquals

class ProductionGuardTest {

    private val runner = ApplicationContextRunner()
        .withUserConfiguration(ProductionGuard::class.java)
        .withPropertyValues("app.auth.jwt-secret=segredo-de-producao-com-mais-de-32-bytes", "app.email.provider=smtp")

    @Test
    fun `com o perfil prod e valores de produção a aplicação sobe`() {
        runner.withPropertyValues("spring.profiles.active=prod").run { context ->
            assertThat(context).hasNotFailed().hasSingleBean(ProductionGuard::class.java)
        }
    }

    @Test
    fun `com o perfil prod o segredo JWT de desenvolvimento impede a inicialização`() {
        runner.withPropertyValues("spring.profiles.active=prod", "app.auth.jwt-secret=${ProductionGuard.DEV_JWT_SECRET}")
            .run { context ->
                assertThat(context).hasFailed()
                assertThat(context.startupFailure).rootCause().hasMessageContaining("APP_JWT_SECRET")
            }
    }

    @Test
    fun `com o perfil prod o e-mail por log impede a inicialização`() {
        runner.withPropertyValues("spring.profiles.active=prod", "app.email.provider=log").run { context ->
            assertThat(context).hasFailed()
            assertThat(context.startupFailure).rootCause().hasMessageContaining("APP_EMAIL_PROVIDER")
        }
    }

    @Test
    fun `fora do perfil prod os valores de desenvolvimento valem`() {
        runner.withPropertyValues("app.auth.jwt-secret=${ProductionGuard.DEV_JWT_SECRET}", "app.email.provider=log")
            .run { context ->
                assertThat(context).hasNotFailed().doesNotHaveBean(ProductionGuard::class.java)
            }
    }

    @Test
    fun `o perfil prod não tem padrão para segredo, e-mail, link do frontend e banco`() {
        val environment = prodEnvironment()
        listOf(
            "app.auth.jwt-secret",
            "app.auth.frontend-url",
            "app.email.provider",
            "spring.datasource.url",
            "spring.datasource.username",
            "spring.datasource.password",
        ).forEach { key ->
            assertThrows<IllegalArgumentException>(key) { environment.getRequiredProperty(key) }
        }
    }

    @Test
    fun `o perfil prod desliga o contrato da API e o Swagger UI por padrão`() {
        val environment = prodEnvironment()
        assertEquals("false", environment.getProperty("springdoc.api-docs.enabled"))
        assertEquals("false", environment.getProperty("springdoc.swagger-ui.enabled"))
    }

    // MockEnvironment não lê variáveis do sistema: só o que está no application-prod.yml
    private fun prodEnvironment() = MockEnvironment().apply {
        YamlPropertySourceLoader().load("prod", ClassPathResource("application-prod.yml"))
            .forEach { propertySources.addFirst(it) }
    }
}
