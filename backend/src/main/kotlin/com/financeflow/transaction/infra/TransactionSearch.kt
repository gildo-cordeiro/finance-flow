package com.financeflow.transaction.infra

import com.financeflow.transaction.domain.CategoryTotal
import com.financeflow.transaction.domain.DateField
import com.financeflow.transaction.domain.InvoiceItemsTotal
import com.financeflow.transaction.domain.MonthTotals
import com.financeflow.transaction.domain.Payable
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

    fun totalsByCategory(userId: UUID, competence: LocalDate): List<CategoryTotal>

    fun monthTotals(userId: UUID, competence: LocalDate): MonthTotals

    fun payables(userId: UUID, today: LocalDate, until: LocalDate, limit: Int): List<Payable>

    fun countOverdue(userId: UUID, today: LocalDate): Long

    fun findByInvoice(userId: UUID, invoiceId: UUID): List<TransactionView>

    fun invoiceTotals(userId: UUID, invoiceIds: Collection<UUID>): List<InvoiceItemsTotal>
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

    override fun totalsByCategory(userId: UUID, competence: LocalDate): List<CategoryTotal> = jdbc.query(
        """
        SELECT t.category_id,
               SUM(t.amount) AS total,
               COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'PAID'), 0) AS paid
        FROM transactions t
        WHERE t.user_id = :userId AND t.competence_date = :competence
          AND t.type <> 'TRANSFER' AND t.category_id IS NOT NULL
        GROUP BY t.category_id
        """,
        MapSqlParameterSource().addValue("userId", userId).addValue("competence", competence),
    ) { rs, _ ->
        CategoryTotal(rs.getObject("category_id", UUID::class.java), rs.getBigDecimal("total"), rs.getBigDecimal("paid"))
    }

    override fun monthTotals(userId: UUID, competence: LocalDate): MonthTotals = jdbc.queryForObject(
        """
        SELECT COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0) AS income,
               COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME' AND status = 'PAID'), 0) AS income_paid,
               COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0) AS expense,
               COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE' AND status = 'PAID'), 0) AS expense_paid
        FROM transactions
        WHERE user_id = :userId AND competence_date = :competence
        """,
        MapSqlParameterSource().addValue("userId", userId).addValue("competence", competence),
    ) { rs, _ ->
        MonthTotals(
            rs.getBigDecimal("income"),
            rs.getBigDecimal("income_paid"),
            rs.getBigDecimal("expense"),
            rs.getBigDecimal("expense_paid"),
        )
    } ?: MonthTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)

    override fun payables(userId: UUID, today: LocalDate, until: LocalDate, limit: Int): List<Payable> = jdbc.query(
        """
        SELECT t.id, t.description, t.amount, a.name AS account_name, c.name AS category_name, t.due_date
        $FROM_VIEW
        WHERE t.user_id = :userId AND t.type = 'EXPENSE' AND t.status <> 'PAID' AND t.due_date <= :until
          AND a.type <> 'CREDIT_CARD'
        ORDER BY t.due_date, t.created_at, t.id
        LIMIT :limit
        """,
        MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("until", until)
            .addValue("limit", limit),
    ) { rs, _ ->
        val dueDate = rs.getObject("due_date", LocalDate::class.java)
        Payable(
            id = rs.getObject("id", UUID::class.java),
            description = rs.getString("description"),
            amount = rs.getBigDecimal("amount"),
            accountName = rs.getString("account_name"),
            categoryName = rs.getString("category_name"),
            dueDate = dueDate,
            overdue = dueDate.isBefore(today),
        )
    }

    override fun countOverdue(userId: UUID, today: LocalDate): Long = jdbc.queryForObject(
        """
        SELECT COUNT(*) FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE t.user_id = :userId AND t.type = 'EXPENSE' AND t.status <> 'PAID' AND t.due_date < :today
          AND a.type <> 'CREDIT_CARD'
        """,
        MapSqlParameterSource().addValue("userId", userId).addValue("today", today),
        Long::class.java,
    ) ?: 0

    override fun findByInvoice(userId: UUID, invoiceId: UUID): List<TransactionView> = jdbc.query(
        "$SELECT_VIEW WHERE t.user_id = :userId AND t.invoice_id = :invoiceId ORDER BY t.purchase_date DESC, t.created_at DESC, t.id",
        MapSqlParameterSource().addValue("userId", userId).addValue("invoiceId", invoiceId),
        VIEW_MAPPER,
    )

    override fun invoiceTotals(userId: UUID, invoiceIds: Collection<UUID>): List<InvoiceItemsTotal> {
        if (invoiceIds.isEmpty()) return emptyList()
        return jdbc.query(
            """
            SELECT invoice_id, SUM(amount) AS total, COUNT(*) AS items
            FROM transactions
            WHERE user_id = :userId AND invoice_id IN (:invoiceIds)
            GROUP BY invoice_id
            """,
            MapSqlParameterSource().addValue("userId", userId).addValue("invoiceIds", invoiceIds),
        ) { rs, _ ->
            InvoiceItemsTotal(rs.getObject("invoice_id", UUID::class.java), rs.getBigDecimal("total"), rs.getLong("items"))
        }
    }

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
                   t.competence_date, t.competence_informed, t.due_date, t.payment_date, t.purchase_date,
                   t.invoice_id, t.status, t.visibility,
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
                competenceInformed = rs.getBoolean("competence_informed"),
                dueDate = rs.getObject("due_date", LocalDate::class.java),
                paymentDate = rs.getObject("payment_date", LocalDate::class.java),
                purchaseDate = rs.getObject("purchase_date", LocalDate::class.java),
                invoiceId = rs.getObject("invoice_id", UUID::class.java),
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
