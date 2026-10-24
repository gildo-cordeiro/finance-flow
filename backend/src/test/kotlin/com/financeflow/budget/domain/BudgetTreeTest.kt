package com.financeflow.budget.domain

import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

class BudgetTreeTest {

    private val moradia = category("Moradia")
    private val aluguel = category("Aluguel", parent = moradia)
    private val energia = category("Energia", parent = moradia)
    private val lazer = category("Lazer")
    private val salario = category("Salário", income = true)

    @Test
    fun `planejado e realizado da mãe somam o valor direto e o das subcategorias`() {
        val lines = BudgetTree.build(
            listOf(moradia, aluguel, energia, lazer),
            planned = mapOf(moradia.id to money("100"), aluguel.id to money("1750"), energia.id to money("250")),
            realized = mapOf(aluguel.id to Realized(money("1750"), money("1750")), energia.id to Realized(money("212.40"), money("0"))),
        )

        val line = lines.first { it.category == moradia }
        assertEquals(money("100"), line.directPlanned)
        assertEquals(money("2100"), line.planned)
        assertEquals(money("1962.40"), line.realized.total)
        assertEquals(money("1750"), line.realized.paid)
        assertEquals(money("137.60"), line.remaining)
        assertEquals(93, line.percentUsed)
        assertEquals(listOf(aluguel, energia), line.children.map { it.category })
    }

    @Test
    fun `sem planejado, saldo e percentual ficam nulos`() {
        val line = BudgetTree.build(listOf(lazer), emptyMap(), mapOf(lazer.id to Realized(money("245"), money("245")))).single()

        assertNull(line.planned)
        assertNull(line.remaining)
        assertNull(line.percentUsed)
    }

    @Test
    fun `planejado zero não tem percentual, mas tem saldo`() {
        val line = BudgetTree.build(listOf(lazer), mapOf(lazer.id to money("0")), mapOf(lazer.id to Realized(money("10"), money("0")))).single()

        assertEquals(money("-10"), line.remaining)
        assertNull(line.percentUsed)
    }

    @Test
    fun `categoria arquivada só aparece com planejado ou realizado no mês`() {
        val antiga = category("Antiga", archived = true)
        val usada = category("Usada", archived = true)
        val filhaAntiga = category("Filha antiga", parent = moradia, archived = true)

        val lines = BudgetTree.build(
            listOf(moradia, filhaAntiga, antiga, usada),
            planned = emptyMap(),
            realized = mapOf(usada.id to Realized(money("5"), money("5"))),
        )

        assertEquals(listOf(moradia, usada), lines.map { it.category })
        assertEquals(emptyList(), lines.first().children)
    }

    @Test
    fun `totais separam receitas e despesas e somam só as linhas de topo`() {
        val lines = BudgetTree.build(
            listOf(moradia, aluguel, lazer, salario),
            planned = mapOf(aluguel.id to money("1750"), lazer.id to money("300"), salario.id to money("8000")),
            realized = mapOf(aluguel.id to Realized(money("1750"), money("1750")), salario.id to Realized(money("8000"), money("8000"))),
        )

        val expense = BudgetTree.totals(lines, income = false)
        assertEquals(money("2050"), expense.planned)
        assertEquals(money("1750"), expense.realized.total)
        assertEquals(money("300"), expense.remaining)
        assertEquals(money("8000"), BudgetTree.totals(lines, income = true).planned)
    }

    private fun category(name: String, parent: BudgetCategory? = null, income: Boolean = false, archived: Boolean = false) =
        BudgetCategory(UUID.randomUUID(), name, income, archived, parent?.id)

    private fun money(value: String) = BigDecimal(value)

    private fun assertEquals(expected: BigDecimal?, actual: BigDecimal?) {
        assertEquals(0, expected!!.compareTo(actual!!), "esperado $expected, veio $actual")
    }
}
