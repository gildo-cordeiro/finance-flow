package com.financeflow.auth.infra

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties("app.auth")
data class AuthProperties(
    val jwtSecret: String,
    val privacyVersion: String,
    val accessTokenTtl: Duration,
    val refreshTokenTtl: Duration,
) {
    init {
        require(jwtSecret.toByteArray(Charsets.UTF_8).size >= MIN_SECRET_BYTES) {
            "APP_JWT_SECRET precisa ter ao menos $MIN_SECRET_BYTES bytes"
        }
        require(privacyVersion.isNotBlank()) { "APP_PRIVACY_VERSION não pode ser vazio" }
    }

    companion object {
        const val MIN_SECRET_BYTES = 32
    }
}
