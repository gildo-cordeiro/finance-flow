package com.financeflow.category

import com.financeflow.category.application.CategoryService
import com.financeflow.category.domain.CategoryItem
import com.financeflow.category.domain.CategoryType
import org.springframework.stereotype.Service
import java.util.UUID

/** O que outros módulos sabem de uma categoria do usuário autenticado. */
data class CategoryInfo(
    val id: UUID,
    val name: String,
    val income: Boolean,
    val archived: Boolean,
    val parentId: UUID?,
)

@Service
class CategoryDirectory(private val categoryService: CategoryService) {

    /** Nulo quando a categoria não existe ou é de outro usuário (ADR-0012). */
    fun find(id: UUID): CategoryInfo? = categoryService.lookup(id)?.toInfo()

    /** Todas as categorias do usuário, arquivadas inclusive, em ordem alfabética, cada mãe seguida das filhas. */
    fun all(): List<CategoryInfo> = categoryService.tree(type = null, includeArchived = true).flatMap { branch ->
        listOf(branch.category.toInfo()) + branch.subcategories.map { it.toInfo() }
    }

    private fun CategoryItem.toInfo() = CategoryInfo(id, name, type == CategoryType.INCOME, archived, parentId)
}
