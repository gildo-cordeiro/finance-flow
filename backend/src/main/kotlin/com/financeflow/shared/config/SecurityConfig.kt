package com.financeflow.shared.config

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.HandlerExceptionResolver

/**
 * Segurança sem estado com filtro JWT (ADR-0005): o `sub` do access token vira o id do usuário
 * no `SecurityContext`. Só o health check, a documentação da API e as rotas de `/api/v1/auth` que
 * não dependem do access token (cadastro, login, refresh, logout, recuperação de senha e versão da
 * política de privacidade) são públicos.
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
                it.bearerTokenResolver(bearerTokenResolver())
                it.jwt(Customizer.withDefaults())
                it.authenticationEntryPoint(entryPoint)
            }
            .authorizeHttpRequests {
                it.requestMatchers("/actuator/health").permitAll()
                // Só respondem com APP_API_DOCS_ENABLED=true (ADR-0038)
                it.requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                it.requestMatchers(HttpMethod.POST, *PUBLIC_AUTH_ROUTES.toTypedArray()).permitAll()
                it.requestMatchers(HttpMethod.GET, *PUBLIC_GET_ROUTES.toTypedArray()).permitAll()
                it.anyRequest().authenticated()
            }
            .build()
    }

    // Nas rotas públicas de autenticação o access token é ignorado: um token vencido enviado junto
    // com o refresh não pode impedir justamente a renovação da sessão.
    private fun bearerTokenResolver(): BearerTokenResolver {
        val default = DefaultBearerTokenResolver()
        return BearerTokenResolver { request ->
            val uri = request.requestURI
            if (uri in PUBLIC_AUTH_ROUTES || uri in PUBLIC_GET_ROUTES) null else default.resolve(request)
        }
    }

    companion object {
        private val PUBLIC_AUTH_ROUTES = setOf(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/password/forgot",
            "/api/v1/auth/password/reset",
        )
        private val PUBLIC_GET_ROUTES = setOf("/api/v1/auth/privacy-policy")
    }
}
