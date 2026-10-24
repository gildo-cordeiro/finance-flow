package com.financeflow.transaction.api

import com.financeflow.support.ApiTest
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.get
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import kotlin.system.measureTimeMillis
import kotlin.test.assertTrue

/** RNF-03 e F1-11: listagem com 12 meses e cerca de 2.000 transações em menos de 2 s. */
class TransactionListPerformanceTest : ApiTest() {

    @Test
    fun `lista um mês e um ano inteiro com 2 mil transações em menos de 2 segundos`() {
        val user = createUser()
        val account = UUID.randomUUID()
        val category = UUID.randomUUID()
        jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, 'Conta', 'CHECKING')", account, user.id)
        jdbc.update("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, 'Moradia', 'EXPENSE')", category, user.id)
        val start = LocalDate.of(2098, 1, 1)
        val rows = (0 until 2_000).map { i ->
            val due = start.plusDays((i % 365).toLong())
            arrayOf<Any>(UUID.randomUUID(), user.id, account, category, BigDecimal("10.00"), due.withDayOfMonth(1), due)
        }
        jdbc.batchUpdate(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, description, amount, type, status,
                                      competence_date, due_date)
            VALUES (?, ?, ?, ?, 'Gasto', ?, 'EXPENSE', 'PENDING', ?, ?)
            """,
            rows,
        )

        // Aquece o contexto e o plano de consulta antes de medir
        mockMvc.get("/api/v1/transactions?from=2098-01-01&to=2098-01-31") { with(user.auth()) }

        val month = measureTimeMillis {
            mockMvc.get("/api/v1/transactions?from=2098-06-01&to=2098-06-30") { with(user.auth()) }
                .andExpect { status { isOk() } }
        }
        val year = measureTimeMillis {
            mockMvc.get("/api/v1/transactions?from=2098-01-01&to=2098-12-31&dateField=DUE&size=200") { with(user.auth()) }
                .andExpect {
                    status { isOk() }
                    jsonPath("$.totals.count") { value(2_000) }
                }
        }
        println("Listagem com 2.000 transações: mês em $month ms, ano em $year ms")
        assertTrue(month < 2_000, "listagem do mês levou $month ms")
        assertTrue(year < 2_000, "listagem do ano levou $year ms")
    }
}
