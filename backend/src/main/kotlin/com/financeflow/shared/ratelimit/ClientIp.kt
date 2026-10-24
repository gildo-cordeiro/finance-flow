package com.financeflow.shared.ratelimit

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component

/**
 * IP de quem fez a requisição. O `X-Forwarded-For` só é considerado quando a conexão vem de um
 * proxy confiável; nesse caso vale o endereço mais à direita que não é de um proxy confiável,
 * porque os da esquerda podem ter sido forjados pelo cliente.
 */
@Component
class ClientIp(properties: RateLimitProperties) {

    private val trustedProxies = properties.trustedProxies.toSet()

    fun of(request: HttpServletRequest): String {
        val remote = request.remoteAddr
        if (remote !in trustedProxies) return remote
        val forwarded = request.getHeader("X-Forwarded-For")
            ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
            .orEmpty()
        return forwarded.lastOrNull { it !in trustedProxies } ?: forwarded.firstOrNull() ?: remote
    }
}
