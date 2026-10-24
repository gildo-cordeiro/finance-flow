package com.financeflow.shared.ratelimit

import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import kotlin.test.assertEquals

class ClientIpTest {

    private val clientIp = ClientIp(RateLimitProperties(trustedProxies = listOf("10.0.0.1", "10.0.0.2")))

    @Test
    fun `sem proxy confiável ignora o X-Forwarded-For`() {
        assertEquals("203.0.113.9", clientIp.of(request("203.0.113.9", "1.1.1.1")))
    }

    @Test
    fun `vindo do proxy confiável usa o endereço mais à direita que não é proxy`() {
        assertEquals("198.51.100.7", clientIp.of(request("10.0.0.1", "1.1.1.1, 198.51.100.7, 10.0.0.2")))
    }

    @Test
    fun `vindo do proxy confiável sem X-Forwarded-For usa o endereço da conexão`() {
        assertEquals("10.0.0.1", clientIp.of(request("10.0.0.1", null)))
    }

    private fun request(remote: String, forwardedFor: String?) = MockHttpServletRequest().apply {
        remoteAddr = remote
        if (forwardedFor != null) addHeader("X-Forwarded-For", forwardedFor)
    }
}
