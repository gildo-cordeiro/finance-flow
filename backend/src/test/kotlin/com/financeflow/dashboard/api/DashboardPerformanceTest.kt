package com.financeflow.dashboard.api

import com.financeflow.support.ApiTest
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.get
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import kotlin.system.measureTimeMillis
import kotlin.test.assertTrue

/** RF-050 e RNF-03: painel com 12 meses de dados (cerca de 3.000 transações e 3 cartões) em menos de 2 s. */
class DashboardPerformanceTest : ApiTest() {

    @Test
    fun `resumo do mês com 12 meses de dados responde em menos de 2 segundos`() {
        val user = createUser()
        val accounts = (1..3).map { n ->
            UUID.randomUUID().also {
                jdbc.update("INSERT INTO accounts (id, user_id, name, type) VALUES (?, ?, ?, 'CHECKING')", it, user.id, "Conta $n")
            }
        }
        val cards = (1..3).map { n ->
            UUID.randomUUID().also {
                jdbc.update(
                    "INSERT INTO accounts (id, user_id, name, type, closing_day, due_day) VALUES (?, ?, ?, 'CREDIT_CARD', 5, 12)",
                    it, user.id, "Cartão $n",
                )
            }
        }
        val categories = (1..15).map { n ->
            UUID.randomUUID().also {
                jdbc.update("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, 'EXPENSE')", it, user.id, "Categoria $n")
            }
        }
        val start = LocalDate.of(2097, 1, 1)
        val rows = (0 until 3_000).map { i ->
            val due = start.plusDays((i % 365).toLong())
            val paid = i % 3 != 0
            arrayOf<Any>(
                UUID.randomUUID(), user.id, (accounts + cards)[i % 6], categories[i % 15], BigDecimal("25.00"),
                if (paid) "PAID" else "PENDING", due.withDayOfMonth(1), due, paid, due,
            )
        }
        jdbc.batchUpdate(
            """
            INSERT INTO transactions (id, user_id, account_id, category_id, description, amount, type, status,
                                      competence_date, due_date, payment_date)
            VALUES (?, ?, ?, ?, 'Gasto', ?, 'EXPENSE', ?, ?, ?, CASE WHEN ? THEN ?::date END)
            """,
            rows,
        )
        categories.forEach {
            jdbc.update(
                "INSERT INTO budgets (id, user_id, category_id, month, planned_amount) VALUES (?, ?, ?, '2097-06-01', 100)",
                UUID.randomUUID(), user.id, it,
            )
        }

        // Aquece o contexto e o plano de consulta antes de medir
        mockMvc.get("/api/v1/dashboard/summary?month=2097-01") { with(user.auth()) }

        val elapsed = measureTimeMillis {
            mockMvc.get("/api/v1/dashboard/summary?month=2097-06") { with(user.auth()) }
                .andExpect {
                    status { isOk() }
                    jsonPath("$.budget.topCategories.length()") { value(5) }
                }
        }
        println("Resumo do painel com 3.000 transações: $elapsed ms")
        assertTrue(elapsed < 2_000, "resumo do painel levou $elapsed ms")
    }
}
