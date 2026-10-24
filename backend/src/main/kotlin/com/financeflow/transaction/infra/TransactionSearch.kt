package com.financeflow.transaction.infra

import com.financeflow.transaction.domain.DateField
import com.financeflow.transaction.domain.TransactionFilter
import com.financeflow.transaction.domain.TransactionStatus
import com.financeflow.transaction.domain.TransactionTotals
import com.financeflow.transaction.domain.TransactionType
import com.financeflow.transaction.domain.TransactionView
import com.financeflow.transaction.domain.Visibility
import org.springframework.jdbc.core.RowMapper
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

interface TransactionSearch {

    fun search(userId: UUID, filter: TransactionFilter, limit: Int, offset: Long): List<TransactionView>

    fun totals(userId: UUID, filter: TransactionFilter): TransactionTotals

    fun findView(userId: UUID, id: UUID): TransactionView?
}

/** SQL montado conforme os filtros presentes; nomes da conta e da categoria vêm no mesmo SELECT. */
class TransactionSearchImpl(private val jdbc: NamedParameterJdbcTemplate) : TransactionSearch {

    override fun search(userId: UUID, filter: TransactionFilter, limit: Int, offset: Long): List<TransactionView> {
        val (where, params) = where(userId, filter)
        val column = dateColumn(filter.dateField)
        params.addValue("limit", limit).addValue("offset", offset)
        return jdbc.query(
            """
            $SELECT_VIEW
            WHERE $where
            ORDER BY $column DESC NULLS LAST, t.due_date DESC NULLS LAST, t.created_at DESC, t.id
            LIMIT :limit OFFSET :offset
            """,
            params,
            VIEW_MAPPER,
        )
    }

    override fun totals(userId: UUID, filter: TransactionFilter): TransactionTotals {
        val (where, params) = where(userId, filter)
        return jdbc.queryForObject(
            """
            SELECT COUNT(*) AS total,
                   COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0) AS income,
                   COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE'), 0) AS expense
            $FROM_VIEW
            WHERE $where
            """,
            params,
        ) { rs, _ -> TransactionTotals(rs.getLong("total"), rs.getBigDecimal("income"), rs.getBigDecimal("expense")) }
            ?: TransactionTotals(0, BigDecimal.ZERO, BigDecimal.ZERO)
    }

    override fun findView(userId: UUID, id: UUID): TransactionView? = jdbc.query(
        "$SELECT_VIEW WHERE t.user_id = :userId AND t.id = :id",
        MapSqlParameterSource().addValue("userId", userId).addValue("id", id),
        VIEW_MAPPER,
    ).firstOrNull()

    private fun where(userId: UUID, filter: TransactionFilter): Pair<String, MapSqlParameterSource> {
        val column = dateColumn(filter.dateField)
        val conditions = mutableListOf("t.user_id = :userId", "$column BETWEEN :from AND :to")
        val params = MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("from", filter.from)
            .addValue("to", filter.to)
        filter.accountId?.let {
            conditions += "t.account_id = :accountId"
            params.addValue("accountId", it)
        }
        // Filtrar por uma categoria pai inclui as subcategorias dela
        filter.categoryId?.let {
            conditions += "(t.category_id = :categoryId OR c.parent_id = :categoryId)"
            params.addValue("categoryId", it)
        }
        if (filter.statuses.isNotEmpty()) {
            conditions += "t.status IN (:statuses)"
            params.addValue("statuses", filter.statuses.map { it.name })
        }
        filter.type?.let {
            conditions += "t.type = :type"
            params.addValue("type", it.name)
        }
        filter.text?.trim()?.takeIf { it.isNotEmpty() }?.let {
            conditions += "t.description ILIKE :text ESCAPE '\\'"
            params.addValue("text", "%" + it.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%")
        }
        return conditions.joinToString(" AND ") to params
    }

    private fun dateColumn(field: DateField) = when (field) {
        DateField.COMPETENCE -> "t.competence_date"
        DateField.DUE -> "t.due_date"
        DateField.PAYMENT -> "t.payment_date"
    }

    private companion object {
        const val FROM_VIEW = """
            FROM transactions t
            JOIN accounts a ON a.id = t.account_id
            LEFT JOIN categories c ON c.id = t.category_id
            LEFT JOIN categories p ON p.id = c.parent_id
        """

        const val SELECT_VIEW = """
            SELECT t.id, t.type, t.description, t.amount, t.account_id, a.name AS account_name,
                   t.category_id, c.name AS category_name, p.name AS parent_category_name,
                   t.competence_date, t.due_date, t.payment_date, t.status, t.visibility,
                   t.installment_number, t.total_installments, t.transfer_group_id, t.transfer_direction,
                   t.recurrence_id
            $FROM_VIEW
        """

        val VIEW_MAPPER = RowMapper { rs, _ ->
            TransactionView(
                id = rs.getObject("id", UUID::class.java),
                type = TransactionType.valueOf(rs.getString("type")),
                description = rs.getString("description"),
                amount = rs.getBigDecimal("amount"),
                accountId = rs.getObject("account_id", UUID::class.java),
                accountName = rs.getString("account_name"),
                categoryId = rs.getObject("category_id", UUID::class.java),
                categoryName = rs.getString("category_name"),
                parentCategoryName = rs.getString("parent_category_name"),
                competenceDate = rs.getObject("competence_date", LocalDate::class.java),
                dueDate = rs.getObject("due_date", LocalDate::class.java),
                paymentDate = rs.getObject("payment_date", LocalDate::class.java),
                status = TransactionStatus.valueOf(rs.getString("status")),
                visibility = Visibility.valueOf(rs.getString("visibility")),
                installmentNumber = (rs.getObject("installment_number") as? Number)?.toInt(),
                totalInstallments = (rs.getObject("total_installments") as? Number)?.toInt(),
                transferGroupId = rs.getObject("transfer_group_id", UUID::class.java),
                transferDirection = rs.getString("transfer_direction"),
                recurring = rs.getObject("recurrence_id") != null,
            )
        }
    }
}
