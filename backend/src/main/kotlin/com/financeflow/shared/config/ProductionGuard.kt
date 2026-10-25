package com.financeflow.shared.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

/**
 * Com o perfil `prod`, recusa na inicialização o que só serve para desenvolvimento: o segredo JWT do
 * `application.yml`, que é público, e o e-mail `log`, que grava links com token no log (ADR-0031).
 */
@Configuration
@Profile("prod")
class ProductionGuard(
    @Value("\${app.auth.jwt-secret}") jwtSecret: String,
    @Value("\${app.email.provider}") emailProvider: String,
) {

    init {
        check(jwtSecret != DEV_JWT_SECRET) { "APP_JWT_SECRET está com o valor de desenvolvimento" }
        check(emailProvider != "log") { "APP_EMAIL_PROVIDER=log grava links com token no log; configure o provedor real" }
    }

    companion object {
        const val DEV_JWT_SECRET = "dev-secret-local-nao-usar-em-producao"
    }
}
