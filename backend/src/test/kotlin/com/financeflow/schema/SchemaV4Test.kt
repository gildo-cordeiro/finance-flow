package com.financeflow.schema

import com.financeflow.IntegrationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID
import kotlin.test.assertEquals

/** V4: pagamentos de fatura (ADR-0039). */
@SpringBootTest
@Transactional
class SchemaV4Test(@Autowired private val jdbc: JdbcTemplate) : IntegrationTest() {

    private val user = UUID.randomUUID().also {
        jdbc.update("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash', 'Teste')", it, "$it@example.com")
    }
    private val bank = UUID.randomUUID().also {
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", it, user)
    }
    private val invoice = UUID.randomUUID().also {
        val card = UUID.randomUUID()
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 25, 5)",
            card, user,
        )
        jdbc.update(
            """
            INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month)
            VALUES (?, ?, DATE '2026-06-25', DATE '2026-07-05', DATE '2026-06-01')
            """.trimIndent(),
            it, card,
        )
    }

    @Test
    fun `pagamento tem valor positivo`() {
        assertDoesNotThrow { insert(BigDecimal("10.00")) }
        assertThrows<DataIntegrityViolationException> { insert(BigDecimal.ZERO) }
    }

    @Test
    fun `excluir o usuário apaga os pagamentos`() {
        insert(BigDecimal("10.00"))

        jdbc.update("DELETE FROM users WHERE id = ?", user)

        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM invoice_payments WHERE invoice_id = ?", Int::class.java, invoice))
    }

    private fun insert(amount: BigDecimal) = jdbc.update(
        "INSERT INTO invoice_payments (id, invoice_id, from_account_id, amount, payment_date) VALUES (?, ?, ?, ?, DATE '2026-07-05')",
        UUID.randomUUID(), invoice, bank, amount,
    )
}
