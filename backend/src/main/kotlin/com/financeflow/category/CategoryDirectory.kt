package com.financeflow.category

import com.financeflow.category.application.CategoryService
import com.financeflow.category.domain.CategoryType
import org.springframework.stereotype.Service
import java.util.UUID

/** O que outros módulos sabem de uma categoria do usuário autenticado. */
data class CategoryInfo(
    val id: UUID,
    val name: String,
    val income: Boolean,
    val archived: Boolean,
)

@Service
class CategoryDirectory(private val categoryService: CategoryService) {

    /** Nulo quando a categoria não existe ou é de outro usuário (ADR-0012). */
    fun find(id: UUID): CategoryInfo? = categoryService.lookup(id)?.let {
        CategoryInfo(it.id, it.name, it.type == CategoryType.INCOME, it.archived)
    }
}
