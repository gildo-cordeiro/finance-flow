package com.financeflow.shared.config

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.HandlerExceptionResolver

/**
 * Segurança sem estado com filtro JWT (ADR-0005): o `sub` do access token vira o id do usuário
 * no `SecurityContext`. Só o health check, o cadastro e o login são públicos.
 */
@Configuration
class SecurityConfig(
    @Qualifier("handlerExceptionResolver") private val exceptionResolver: HandlerExceptionResolver,
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val entryPoint = AuthenticationEntryPoint { request, response, ex ->
            exceptionResolver.resolveException(request, response, null, ex)
        }
        return http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .exceptionHandling {
                it.authenticationEntryPoint(entryPoint)
                it.accessDeniedHandler { request, response, ex ->
                    exceptionResolver.resolveException(request, response, null, ex)
                }
            }
            .oauth2ResourceServer {
                it.jwt(Customizer.withDefaults())
                it.authenticationEntryPoint(entryPoint)
            }
            .authorizeHttpRequests {
                it.requestMatchers("/actuator/health").permitAll()
                it.requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                it.anyRequest().authenticated()
            }
            .build()
    }
}
