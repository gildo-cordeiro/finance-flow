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
import java.util.UUID

/** V2: lado da transferência (ADR-0035). */
@SpringBootTest
@Transactional
class SchemaV2Test(@Autowired private val jdbc: JdbcTemplate) : IntegrationTest() {

    private val user = UUID.randomUUID().also {
        jdbc.update("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, 'hash', 'Teste')", it, "$it@example.com")
    }
    private val account = UUID.randomUUID().also {
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", it, user)
    }

    @Test
    fun `transferência aceita OUT e IN`() {
        val group = UUID.randomUUID()
        assertDoesNotThrow {
            insert("TRANSFER", "OUT", group)
            insert("TRANSFER", "IN", group)
        }
    }

    @Test
    fun `transferência exige o lado`() {
        assertThrows<DataIntegrityViolationException> { insert("TRANSFER", null, UUID.randomUUID()) }
    }

    @Test
    fun `despesa não tem lado`() {
        assertThrows<DataIntegrityViolationException> { insert("EXPENSE", "OUT") }
    }

    @Test
    fun `receita não tem lado`() {
        assertThrows<DataIntegrityViolationException> { insert("INCOME", "IN") }
    }

    @Test
    fun `lado fora de OUT e IN é recusado`() {
        assertThrows<DataIntegrityViolationException> { insert("TRANSFER", "XX", UUID.randomUUID()) }
    }

    private fun insert(type: String, direction: String?, group: UUID? = null) {
        jdbc.update(
            """
            INSERT INTO transactions (id, user_id, account_id, description, amount, type, status, competence_date,
                                      transfer_group_id, transfer_direction)
            VALUES (?, ?, ?, 'teste', 10, ?, 'PENDING', DATE '2026-10-01', ?, ?)
            """.trimIndent(),
            UUID.randomUUID(), user, account, type, group, direction,
        )
    }
}
