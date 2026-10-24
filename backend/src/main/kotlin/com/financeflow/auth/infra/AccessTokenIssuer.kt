package com.financeflow.auth.infra

import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwsHeader
import org.springframework.security.oauth2.jwt.JwtClaimsSet
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoderParameters
import org.springframework.stereotype.Component
import java.time.Clock
import java.util.UUID

data class AccessToken(val value: String, val expiresInSeconds: Long)

@Component
class AccessTokenIssuer(
    private val encoder: JwtEncoder,
    private val properties: AuthProperties,
    private val clock: Clock,
) {

    fun issue(userId: UUID): AccessToken {
        val now = clock.instant()
        val claims = JwtClaimsSet.builder()
            .subject(userId.toString())
            .issuedAt(now)
            .expiresAt(now.plus(properties.accessTokenTtl))
            .build()
        val header = JwsHeader.with(MacAlgorithm.HS256).build()
        val token = encoder.encode(JwtEncoderParameters.from(header, claims)).tokenValue
        return AccessToken(token, properties.accessTokenTtl.toSeconds())
    }
}
