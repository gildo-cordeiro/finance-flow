package com.financeflow.shared.time

import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.YearMonth
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CompetenceTest {

    @Test
    fun `fatura com vencimento em 05-07 e deslocamento 1 tem competência junho`() {
        assertEquals(YearMonth.of(2026, 6), Competence.suggest(LocalDate.of(2026, 7, 5), 1))
    }

    @Test
    fun `salário recebido no 5º dia útil de julho com deslocamento 1 tem competência junho`() {
        assertEquals(YearMonth.of(2026, 6), Competence.suggest(LocalDate.of(2026, 7, 7), 1))
    }

    @Test
    fun `deslocamento 0 usa o mês da data de referência`() {
        assertEquals(YearMonth.of(2026, 10), Competence.suggest(LocalDate.of(2026, 10, 31), 0))
    }

    @Test
    fun `deslocamento atravessa a virada do ano`() {
        assertEquals(YearMonth.of(2025, 12), Competence.suggest(LocalDate.of(2026, 1, 10), 1))
    }

    @Test
    fun `referência é o vencimento e, sem ele, o pagamento`() {
        val due = LocalDate.of(2026, 10, 5)
        val paid = LocalDate.of(2026, 9, 30)
        assertEquals(due, Competence.referenceDate(due, paid))
        assertEquals(paid, Competence.referenceDate(null, paid))
        assertNull(Competence.referenceDate(null, null))
    }
}
