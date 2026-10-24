package com.financeflow.invoice.infra

import org.springframework.data.jpa.repository.JpaRepository
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
