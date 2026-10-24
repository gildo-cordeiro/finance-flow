package com.financeflow.shared.ratelimit

import com.financeflow.shared.error.TooManyRequestsException
import com.github.benmanes.caffeine.cache.Caffeine
import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.concurrent.TimeUnit

/** Limite de `capacity` tentativas por `period`, identificado por `name` (ex.: `login-ip`). */
data class RateLimit(val name: String, val capacity: Long, val period: Duration)

/**
 * Rate limiting em memória com Bucket4j (ADR-0006). Com mais de uma instância do backend,
 * o limite passa a valer por instância: esse é o gatilho para levar os baldes para o Redis.
 */
@Component
class RateLimiter {

    private val buckets = Caffeine.newBuilder()
        .expireAfterAccess(Duration.ofHours(2))
        .maximumSize(100_000)
        .build<String, Bucket>()

    /** Consome uma tentativa ou lança [TooManyRequestsException] com o tempo de espera. */
    fun consume(limit: RateLimit, key: String) {
        val bucket = buckets.get("${limit.name}:$key") { newBucket(limit) }
        val probe = bucket.tryConsumeAndReturnRemaining(1)
        if (!probe.isConsumed) {
            val seconds = TimeUnit.NANOSECONDS.toSeconds(probe.nanosToWaitForRefill + 999_999_999)
            throw TooManyRequestsException(seconds.coerceAtLeast(1))
        }
    }

    private fun newBucket(limit: RateLimit): Bucket =
        Bucket.builder()
            .addLimit(Bandwidth.builder().capacity(limit.capacity).refillIntervally(limit.capacity, limit.period).build())
            .build()
}
