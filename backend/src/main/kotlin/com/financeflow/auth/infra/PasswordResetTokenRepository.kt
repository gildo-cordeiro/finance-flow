package com.financeflow.auth.infra

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface PasswordResetTokenRepository : JpaRepository<PasswordResetTokenEntity, UUID> {

    // Trava a linha para dois resets simultâneos com o mesmo link não serem aceitos os dois
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    fun findByTokenHash(tokenHash: String): PasswordResetTokenEntity?

    @Modifying
    @Query("DELETE FROM PasswordResetTokenEntity t WHERE t.userId = :userId AND t.usedAt IS NULL")
    fun deleteUnusedByUserId(userId: UUID): Int

    @Modifying
    @Query("DELETE FROM PasswordResetTokenEntity t WHERE t.expiresAt < :before")
    fun deleteExpiredBefore(before: Instant): Int
}
