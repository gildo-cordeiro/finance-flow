package com.financeflow.category.domain

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DefaultCategoriesTest {

    @Test
    fun `nomes de primeiro nível não se repetem, nem entre tipos`() {
        val names = DefaultCategories.ALL.map { it.name.lowercase() }
        assertEquals(names.size, names.toSet().size)
    }

    @Test
    fun `subcategorias não se repetem dentro do pai`() {
        DefaultCategories.ALL.forEach { assertEquals(it.subcategories.size, it.subcategories.toSet().size, it.name) }
    }

    @Test
    fun `há receitas e despesas, com um Outros em cada tipo`() {
        val byType = DefaultCategories.ALL.groupBy { it.type }
        assertTrue(byType.getValue(CategoryType.INCOME).any { it.name == "Outras receitas" })
        assertTrue(byType.getValue(CategoryType.EXPENSE).any { it.name == "Outras despesas" })
    }
}
