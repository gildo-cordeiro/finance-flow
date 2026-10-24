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
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

/** V3: data da compra, competência informada (ADR-0038) e conta pagadora padrão (ADR-0009). */
@SpringBootTest
@Transactional
class SchemaV3Test(@Autowired private val jdbc: JdbcTemplate) : IntegrationTest() {

    private val user = UUID.randomUUID().also {
        jdbc.update("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash', 'Teste')", it, "$it@example.com")
    }
    private val card = UUID.randomUUID().also {
        jdbc.update(
            "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, 'Cartão', 'CREDIT_CARD', 25, 5)",
            it, user,
        )
    }
    private val invoice = UUID.randomUUID().also {
        jdbc.update(
            """
            INSERT INTO invoices (id, account_id, closing_date, due_date, competence_month)
            VALUES (?, ?, DATE '2026-06-25', DATE '2026-07-05', DATE '2026-06-01')
            """.trimIndent(),
            it, card,
        )
    }

    @Test
    fun `item de fatura exige a data da compra`() {
        assertDoesNotThrow { insert(invoiceId = invoice, purchaseDate = LocalDate.of(2026, 6, 20)) }
        assertThrows<DataIntegrityViolationException> { insert(invoiceId = invoice, purchaseDate = null) }
    }

    @Test
    fun `fora da fatura não há data da compra`() {
        assertDoesNotThrow { insert(invoiceId = null, purchaseDate = null) }
        assertThrows<DataIntegrityViolationException> { insert(invoiceId = null, purchaseDate = LocalDate.of(2026, 6, 20)) }
    }

    @Test
    fun `competência nasce sugerida`() {
        val id = insert(invoiceId = null, purchaseDate = null)
        assertEquals(false, jdbc.queryForObject("SELECT competence_informed FROM transactions WHERE id = ?", Boolean::class.java, id))
    }

    @Test
    fun `a mesma parcela não se repete no grupo`() {
        val group = UUID.randomUUID()
        insert(invoiceId = null, purchaseDate = null, group = group, number = 1)
        assertDoesNotThrow { insert(invoiceId = null, purchaseDate = null, group = group, number = 2) }
        assertThrows<DataIntegrityViolationException> { insert(invoiceId = null, purchaseDate = null, group = group, number = 2) }
    }

    @Test
    fun `excluir a conta pagadora limpa a sugestão do cartão`() {
        val account = UUID.randomUUID()
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", account, user)
        jdbc.update("UPDATE accounts SET default_payment_account_id = ? WHERE id = ?", account, card)

        jdbc.update("DELETE FROM accounts WHERE id = ?", account)

        assertNull(jdbc.queryForObject("SELECT default_payment_account_id FROM accounts WHERE id = ?", UUID::class.java, card))
    }

    private fun insert(invoiceId: UUID?, purchaseDate: LocalDate?, group: UUID? = null, number: Int? = null): UUID {
        val id = UUID.randomUUID()
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      invoice_id, purchase_date, installment_group_id, installment_number, total_installments)
            VALUES (?, ?, ?, 'teste', 10, 'EXPENSE', 'PENDING', DATE '2026-06-01', ?, ?, ?, ?, ?)
            """.trimIndent(),
            id, user, card, invoiceId, purchaseDate, group, number, if (group == null) null else 3,
        )
        return id
    }
}
