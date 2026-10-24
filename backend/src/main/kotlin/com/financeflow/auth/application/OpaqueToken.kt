package com.financeflow.auth.application

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import java.util.HexFormat

/** Tokens aleatórios de 32 bytes (refresh token, link de redefinição). O banco guarda só o [hash]. */
object OpaqueToken {

    private const val BYTES = 32
    private val random = SecureRandom()

    fun generate(): String {
        val bytes = ByteArray(BYTES).also(random::nextBytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    fun hash(token: String): String =
        HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.toByteArray(Charsets.UTF_8)))
}
