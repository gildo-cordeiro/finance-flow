package com.financeflow.shared.config

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.HandlerExceptionResolver

/**
 * Base de segurança sem estado (ADR-0005). Por enquanto só o health check é público;
 * o filtro JWT e as rotas de autenticação entram com o módulo `auth`.
 */
@Configuration
class SecurityConfig(
    // Repassa 401/403 do filtro ao GlobalExceptionHandler, para saírem em Problem Details (ADR-0027)
    @Qualifier("handlerExceptionResolver") private val exceptionResolver: HandlerExceptionResolver,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .exceptionHandling {
                it.authenticationEntryPoint { request, response, ex ->
                    exceptionResolver.resolveException(request, response, null, ex)
                }
                it.accessDeniedHandler { request, response, ex ->
                    exceptionResolver.resolveException(request, response, null, ex)
                }
            }
            .authorizeHttpRequests {
                it.requestMatchers("/actuator/health").permitAll()
                it.anyRequest().authenticated()
            }
            .build()
}
