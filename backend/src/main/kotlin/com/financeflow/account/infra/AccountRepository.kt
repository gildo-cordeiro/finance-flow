package com.financeflow.account.infra

import com.financeflow.account.domain.PaidTotals
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface AccountRepository : JpaRepository<AccountEntity, UUID> {

    fun findByIdAndUserId(id: UUID, userId: UUID): AccountEntity?

    fun findByUserId(userId: UUID): List<AccountEntity>

    // Transferências entram com a F1-12, que define o lado de cada ponta
    @Query(
        """
        SELECT t.account_id AS "accountId",
               COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0) AS "income",
               COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE'), 0) AS "expense"
        FROM transactions t
        WHERE t.user_id = :userId AND t.status = 'PAID' AND t.account_id IN (:accountIds)
        GROUP BY t.account_id
        """,
        nativeQuery = true,
    )
    fun paidTotals(userId: UUID, accountIds: Collection<UUID>): List<PaidTotals>

    @Query("SELECT EXISTS (SELECT 1 FROM transactions WHERE account_id = :accountId)", nativeQuery = true)
    fun hasTransactions(accountId: UUID): Boolean
}
