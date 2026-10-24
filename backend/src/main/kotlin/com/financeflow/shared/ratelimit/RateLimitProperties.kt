package com.financeflow.shared.ratelimit

import org.springframework.boot.context.properties.ConfigurationProperties

/** `trustedProxies`: IPs dos proxies cujo `X-Forwarded-For` é confiável (ex.: o load balancer da hospedagem). */
@ConfigurationProperties("app.rate-limit")
data class RateLimitProperties(
    val trustedProxies: List<String> = emptyList(),
)
