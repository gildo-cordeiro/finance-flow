package com.financeflow.category.api.dto

import com.financeflow.category.domain.CategoryType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateCategoryRequest(
    @field:NotBlank @field:Size(max = 100)
    val name: String = "",
    @field:NotNull
    val type: CategoryType? = null,
    val parentId: UUID? = null,
)

data class RenameCategoryRequest(
    @field:NotBlank @field:Size(max = 100)
    val name: String = "",
)

data class MergeCategoryRequest(
    @field:NotNull
    val targetId: UUID? = null,
)

data class CategoryResponse(
    val id: UUID,
    val name: String,
    val type: CategoryType,
    val parentId: UUID?,
    val archived: Boolean,
    val subcategories: List<CategoryResponse> = emptyList(),
)
