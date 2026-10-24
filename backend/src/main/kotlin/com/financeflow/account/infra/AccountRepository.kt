package com.financeflow.account.infra

import com.financeflow.account.domain.CardUsage
import com.financeflow.account.domain.PaidTotals
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface AccountRepository : JpaRepository<AccountEntity, UUID> {

    fun findByIdAndUserId(id: UUID, userId: UUID): AccountEntity?

    fun findByUserId(userId: UUID): List<AccountEntity>

    // O lado da transferência vem de transfer_direction (ADR-0036)
    @Query(
        """
        SELECT t.account_id AS "accountId",
               COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'INCOME' OR t.transfer_direction = 'IN'), 0) AS "inflow",
               COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE' OR t.transfer_direction = 'OUT'), 0) AS "outflow"
        FROM transactions t
        WHERE t.user_id = :userId AND t.status = 'PAID' AND t.account_id IN (:accountIds)
        GROUP BY t.account_id
        """,
        nativeQuery = true,
    )
    fun paidTotals(userId: UUID, accountIds: Collection<UUID>): List<PaidTotals>

    // ADR-0039: as compras de faturas não quitadas, menos o que já foi pago de cada uma
    @Query(
        """
        SELECT i.account_id AS "cardId",
               COALESCE(SUM(GREATEST(COALESCE(t.total, 0) - i.paid_amount, 0)), 0) AS "used"
        FROM invoices i
        JOIN accounts a ON a.id = i.account_id AND a.user_id = :userId
        LEFT JOIN (SELECT invoice_id, SUM(amount) AS total FROM transactions GROUP BY invoice_id) t
               ON t.invoice_id = i.id
        WHERE i.status <> 'PAID' AND i.account_id IN (:cardIds)
        GROUP BY i.account_id
        """,
        nativeQuery = true,
    )
    fun cardUsage(userId: UUID, cardIds: Collection<UUID>): List<CardUsage>

    @Query("SELECT EXISTS (SELECT 1 FROM transactions WHERE account_id = :accountId)", nativeQuery = true)
    fun hasTransactions(accountId: UUID): Boolean
}
