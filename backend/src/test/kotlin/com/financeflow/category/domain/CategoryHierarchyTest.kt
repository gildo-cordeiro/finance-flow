package com.financeflow.category.domain

import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CategoryHierarchyTest {

    private val food = node(CategoryType.EXPENSE)
    private val salary = node(CategoryType.INCOME)

    @Test
    fun `categoria de primeiro nível do mesmo tipo e ativa pode ser pai`() {
        assertNull(CategoryHierarchy.parentViolation(CategoryType.EXPENSE, food))
    }

    @Test
    fun `subcategoria não pode ser pai`() {
        val market = node(CategoryType.EXPENSE, parentId = food.id)
        assertEquals("Subcategoria não pode ter subcategorias", CategoryHierarchy.parentViolation(CategoryType.EXPENSE, market))
    }

    @Test
    fun `pai precisa ser do mesmo tipo e estar ativo`() {
        assertEquals(
            "A subcategoria precisa ser do mesmo tipo da categoria pai",
            CategoryHierarchy.parentViolation(CategoryType.INCOME, food),
        )
        assertEquals(
            "A categoria pai está arquivada",
            CategoryHierarchy.parentViolation(CategoryType.EXPENSE, food.copy(archived = true)),
        )
    }

    @Test
    fun `mescla exige outra categoria, do mesmo tipo e ativa`() {
        val leisure = node(CategoryType.EXPENSE)
        assertNull(CategoryHierarchy.mergeViolation(food, leisure, sourceHasSubcategories = false))
        assertEquals("Escolha outra categoria como destino", CategoryHierarchy.mergeViolation(food, food, false))
        assertEquals("Só é possível mesclar categorias do mesmo tipo", CategoryHierarchy.mergeViolation(food, salary, false))
        assertEquals(
            "A categoria de destino está arquivada",
            CategoryHierarchy.mergeViolation(food, leisure.copy(archived = true), false),
        )
    }

    @Test
    fun `categoria com subcategorias não é mesclada`() {
        assertEquals(
            "Mescle ou exclua as subcategorias antes de mesclar a categoria",
            CategoryHierarchy.mergeViolation(food, node(CategoryType.EXPENSE), sourceHasSubcategories = true),
        )
    }

    @Test
    fun `subcategoria pode ser mesclada em uma categoria de primeiro nível`() {
        val market = node(CategoryType.EXPENSE, parentId = food.id)
        assertNull(CategoryHierarchy.mergeViolation(market, food, sourceHasSubcategories = false))
    }

    private fun node(type: CategoryType, parentId: UUID? = null) = CategoryNode(UUID.randomUUID(), type, parentId, false)
}
