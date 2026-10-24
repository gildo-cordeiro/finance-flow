package com.financeflow.invoice.infra

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

interface InvoiceRepository : JpaRepository<InvoiceEntity, UUID> {

    /** Só as faturas de cartões do usuário: `invoices` não tem `user_id`, o dono vem da conta (ADR-0012). */
    @Query(
        """
        SELECT i.* FROM invoices i JOIN accounts a ON a.id = i.account_id
        WHERE i.id = :id AND a.user_id = :userId
        """,
        nativeQuery = true,
    )
    fun findForUser(id: UUID, userId: UUID): InvoiceEntity?

    // Dois pagamentos ao mesmo tempo não podem passar do saldo em aberto (ADR-0039)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InvoiceEntity i WHERE i.id = :id")
    fun lockById(id: UUID): InvoiceEntity?

    /** Faturas não quitadas dos cartões do usuário que vencem até `until`, inclusive as já vencidas. */
    @Query(
        """
        SELECT i.* FROM invoices i JOIN accounts a ON a.id = i.account_id
        WHERE a.user_id = :userId AND i.status <> 'PAID' AND i.due_date <= :until
        ORDER BY i.due_date, a.name
        """,
        nativeQuery = true,
    )
    fun findUnpaidDueUntil(userId: UUID, until: LocalDate): List<InvoiceEntity>

    fun findByAccountIdOrderByClosingDate(accountId: UUID): List<InvoiceEntity>

    fun findByAccountIdAndClosingDate(accountId: UUID, closingDate: LocalDate): InvoiceEntity?

    // Duas compras ao mesmo tempo podem querer criar a mesma fatura; o índice único decide qual grava
    @Modifying
    @Query(
        """
        INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month, updated_at)
        VALUES (:id, :accountId, :closingDate, :dueDate, :competenceMonth, :now)
        ON CONFLICT (account_id, closing_date) DO NOTHING
        """,
        nativeQuery = true,
    )
    fun insertIfAbsent(
        id: UUID,
        accountId: UUID,
        closingDate: LocalDate,
        dueDate: LocalDate,
        competenceMonth: LocalDate,
        now: Instant,
    ): Int
}
