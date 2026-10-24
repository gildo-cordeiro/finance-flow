package com.financeflow.auth.infra

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, UUID> {

    // Trava a linha para dois refresh simultâneos com o mesmo token não rotacionarem os dois
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    fun findByTokenHash(tokenHash: String): RefreshTokenEntity?

    @Modifying
    @Query("UPDATE RefreshTokenEntity t SET t.revokedAt = :now WHERE t.userId = :userId AND t.revokedAt IS NULL")
    fun revokeAllByUserId(userId: UUID, now: Instant): Int

    @Modifying
    @Query("DELETE FROM RefreshTokenEntity t WHERE t.expiresAt < :before")
    fun deleteExpiredBefore(before: Instant): Int
}
