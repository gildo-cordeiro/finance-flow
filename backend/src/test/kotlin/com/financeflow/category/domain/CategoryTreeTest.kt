package com.financeflow.category.domain

import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals

class CategoryTreeTest {

    @Test
    fun `agrupa subcategorias sob o pai, em ordem alfabética com acentos`() {
        val food = item("Alimentação")
        val health = item("Saúde")
        val education = item("Educação")
        val items = listOf(
            health,
            item("Supermercado", food.id),
            education,
            item("Açougue", food.id),
            food,
        )

        val tree = CategoryTree.of(items)

        assertEquals(listOf("Alimentação", "Educação", "Saúde"), tree.map { it.category.name })
        assertEquals(listOf("Açougue", "Supermercado"), tree.first().subcategories.map { it.name })
        assertEquals(emptyList(), tree.last().subcategories)
    }

    @Test
    fun `subcategoria cujo pai não está na lista fica de fora`() {
        val tree = CategoryTree.of(listOf(item("Luz", UUID.randomUUID())))
        assertEquals(emptyList(), tree)
    }

    private fun item(name: String, parentId: UUID? = null) =
        CategoryItem(UUID.randomUUID(), name, CategoryType.EXPENSE, parentId, false)
}
