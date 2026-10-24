package com.financeflow.shared.ratelimit

import com.financeflow.shared.error.TooManyRequestsException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Duration
import kotlin.test.assertTrue

class RateLimiterTest {

    private val limiter = RateLimiter()
    private val limit = RateLimit("teste", 2, Duration.ofMinutes(1))

    @Test
    fun `bloqueia depois da capacidade e informa quanto esperar`() {
        limiter.consume(limit, "a")
        limiter.consume(limit, "a")
        val ex = assertThrows<TooManyRequestsException> { limiter.consume(limit, "a") }
        assertTrue(ex.retryAfterSeconds in 1..60, "retryAfter = ${ex.retryAfterSeconds}")
    }

    @Test
    fun `chaves e limites diferentes têm baldes separados`() {
        limiter.consume(limit, "a")
        limiter.consume(limit, "a")
        limiter.consume(limit, "b")
        limiter.consume(limit.copy(name = "outro"), "a")
    }
}
