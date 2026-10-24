package com.financeflow.schema

import com.financeflow.IntegrationTest
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

@SpringBootTest
@Transactional
class SchemaV1Test(
    @Autowired private val jdbc: JdbcTemplate,
    @Autowired private val flyway: Flyway,
) : IntegrationTest() {

    @Test
    fun `flyway valida e não reaplica as migrations numa segunda inicialização`() {
        flyway.validate()
        assertEquals(0, flyway.migrate().migrationsExecuted)
        assertEquals(flyway.info().all().last().version, flyway.info().current().version)
    }

    @Test
    fun `aceita linhas válidas`() {
        val user = insertUser()
        val card = insertAccount(user, type = "CREDIT_CARD", closingDay = 28, dueDay = 5)
        val category = insertCategory(user)
        val subcategory = insertCategory(user, parentId = category)
        val invoice = UUID.randomUUID()
        jdbc.update(
            """
            INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month)
            VALUES (?, ?, ?, ?, ?)
            """.trimIndent(),
            invoice, card, LocalDate.of(2026, 6, 28), LocalDate.of(2026, 7, 5), LocalDate.of(2026, 6, 1),
        )
        val group = UUID.randomUUID()
        for (n in 1..3) {
            insertTransaction(
                user, card, subcategory,
                installmentGroupId = group, installmentNumber = n, totalInstallments = 3,
                invoiceId = invoice.takeIf { n == 1 },
            )
        }
        insertTransaction(user, card, category, status = "PAID", paymentDate = LocalDate.of(2026, 7, 5))
        jdbc.update(
            "INSERT INTO budgets (id, user_id, category_id, month, planned_amount) VALUES (?, ?, ?, ?, ?)",
            UUID.randomUUID(), user, category, LocalDate.of(2026, 6, 1), "500.00".toBigDecimal(),
        )

        assertEquals(4, count("transactions", user))
        assertEquals("PRIVATE", jdbc.queryForObject(
            "SELECT DISTINCT visibility FROM transactions WHERE user_id = ?", String::class.java, user,
        ))
        assertEquals("BRL", jdbc.queryForObject("SELECT currency FROM users WHERE id = ?", String::class.java, user))
    }

    @Test
    fun `recusa transação PAID sem payment_date`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        assertThrows<DataIntegrityViolationException> {
            insertTransaction(user, account, category, status = "PAID", paymentDate = null)
        }
    }

    @Test
    fun `recusa transação não paga com payment_date`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        assertThrows<DataIntegrityViolationException> {
            insertTransaction(user, account, category, status = "PENDING", paymentDate = LocalDate.of(2026, 6, 10))
        }
    }

    @Test
    fun `recusa competência fora do dia 1`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        assertThrows<DataIntegrityViolationException> {
            insertTransaction(user, account, category, competenceDate = LocalDate.of(2026, 6, 15))
        }
    }

    @Test
    fun `recusa parcela fora do intervalo`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        assertThrows<DataIntegrityViolationException> {
            insertTransaction(
                user, account, category,
                installmentGroupId = UUID.randomUUID(), installmentNumber = 4, totalInstallments = 3,
            )
        }
    }

    @Test
    fun `recusa parcela com campos incompletos`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        assertThrows<DataIntegrityViolationException> {
            insertTransaction(user, account, category, installmentGroupId = UUID.randomUUID())
        }
    }

    @Test
    fun `recusa excluir categoria com transações`() {
        val user = insertUser()
        val account = insertAccount(user)
        val category = insertCategory(user)
        insertTransaction(user, account, category)
        assertThrows<DataIntegrityViolationException> {
            jdbc.update("DELETE FROM categories WHERE id = ?", category)
        }
    }

    @Test
    fun `recusa cartão sem closing_day`() {
        val user = insertUser()
        assertThrows<DataIntegrityViolationException> {
            insertAccount(user, type = "CREDIT_CARD", closingDay = null, dueDay = 5)
        }
    }

    @Test
    fun `recusa e-mail repetido com outra caixa`() {
        insertUser(email = "Ana@Example.com")
        assertThrows<DataIntegrityViolationException> {
            insertUser(email = "ana@example.com")
        }
    }

    @Test
    fun `excluir usuário remove as linhas dele em cascata`() {
        val user = insertUser()
        val other = insertUser()
        val card = insertAccount(user, type = "CREDIT_CARD", closingDay = 28, dueDay = 5)
        val category = insertCategory(user)
        val subcategory = insertCategory(user, parentId = category)
        val invoice = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month) VALUES (?, ?, ?, ?, ?)",
            invoice, card, LocalDate.of(2026, 6, 28), LocalDate.of(2026, 7, 5), LocalDate.of(2026, 6, 1),
        )
        insertTransaction(user, card, subcategory, invoiceId = invoice)
        jdbc.update(
            "INSERT INTO budgets (id, user_id, category_id, month, planned_amount) VALUES (?, ?, ?, ?, ?)",
            UUID.randomUUID(), user, category, LocalDate.of(2026, 6, 1), "100".toBigDecimal(),
        )
        jdbc.update(
            "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, now())",
            UUID.randomUUID(), user, "hash-${UUID.randomUUID()}",
        )
        jdbc.update(
            "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, now())",
            UUID.randomUUID(), user, "hash-${UUID.randomUUID()}",
        )
        jdbc.update(
            "INSERT INTO notifications (id, user_id, type, payload) VALUES (?, ?, 'BUDGET_ALERT', '{}'::jsonb)",
            UUID.randomUUID(), user,
        )
        val otherTransaction = insertTransaction(other, insertAccount(other), insertCategory(other), updatedBy = user)

        jdbc.update("DELETE FROM users WHERE id = ?", user)

        for (table in listOf(
            "accounts", "categories", "transactions", "budgets",
            "refresh_tokens", "password_reset_tokens", "notifications",
        )) {
            assertEquals(0, count(table, user), "linhas restantes em $table")
        }
        assertEquals(0, jdbc.queryForObject(
            "SELECT count(*) FROM invoices WHERE id = ?", Int::class.java, invoice,
        ))
        assertEquals(null, jdbc.queryForObject(
            "SELECT updated_by FROM transactions WHERE id = ?", UUID::class.java, otherTransaction,
        ))
    }

    private fun count(table: String, userId: UUID): Int =
        jdbc.queryForObject("SELECT count(*) FROM $table WHERE user_id = ?", Int::class.java, userId)!!

    private fun insertUser(email: String = "${UUID.randomUUID()}@example.com"): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash', 'Teste')",
            id, email,
        )
        return id
    }

    private fun insertAccount(
        userId: UUID,
        type: String = "CHECKING",
        closingDay: Int? = null,
        dueDay: Int? = null,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Conta', ?, ?, ?)",
            id, userId, type, closingDay, dueDay,
        )
        return id
    }

    private fun insertCategory(userId: UUID, parentId: UUID? = null): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO categories (id, user_id, parent_id, name, type) VALUES (?, ?, ?, ?, 'EXPENSE')",
            id, userId, parentId, "Categoria $id",
        )
        return id
    }

    private fun insertTransaction(
        userId: UUID,
        accountId: UUID,
        categoryId: UUID,
        status: String = "PENDING",
        paymentDate: LocalDate? = null,
        competenceDate: LocalDate = LocalDate.of(2026, 6, 1),
        installmentGroupId: UUID? = null,
        installmentNumber: Int? = null,
        totalInstallments: Int? = null,
        invoiceId: UUID? = null,
        updatedBy: UUID? = null,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            """
            INSERT INTO transactions (
                id, user_id, account_id, category_id, invoice_id, description, amount, type, status,
                competence_date, due_date, payment_date,
                installment_group_id, installment_number, total_installments, created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, 'Mercado', ?, 'EXPENSE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            id, userId, accountId, categoryId, invoiceId, "120.50".toBigDecimal(), status,
            competenceDate, LocalDate.of(2026, 7, 5), paymentDate,
            installmentGroupId, installmentNumber, totalInstallments, userId, updatedBy ?: userId,
        )
        return id
    }
}
