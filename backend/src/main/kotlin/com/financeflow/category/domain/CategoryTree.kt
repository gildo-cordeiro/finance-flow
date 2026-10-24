package com.financeflow.category.domain

import java.text.Collator
import java.util.Locale
import java.util.UUID

data class CategoryItem(
    val id: UUID,
    val name: String,
    val type: CategoryType,
    val parentId: UUID?,
    val archived: Boolean,
)

data class CategoryBranch(val category: CategoryItem, val subcategories: List<CategoryItem>)

object CategoryTree {

    private val byName = Collator.getInstance(Locale.of("pt", "BR"))

    /** Monta a árvore em ordem alfabética. Subcategorias sem o pai na lista ficam de fora. */
    fun of(items: List<CategoryItem>): List<CategoryBranch> {
        val children = items.filter { it.parentId != null }.groupBy { it.parentId }
        return items.filter { it.parentId == null }
            .sortedWith(compareBy(byName) { it.name })
            .map { CategoryBranch(it, children[it.id].orEmpty().sortedWith(compareBy(byName) { child -> child.name })) }
    }
}
