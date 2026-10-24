package com.financeflow.category.api

import com.financeflow.category.application.CategoryService
import com.financeflow.category.application.CreateCategoryCommand
import com.financeflow.category.domain.CategoryBranch
import com.financeflow.category.domain.CategoryItem
import com.financeflow.category.domain.CategoryType
import com.financeflow.shared.error.ProblemResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
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

@Tag(name = "Categorias", description = "Categorias de receita e despesa, em dois níveis.")
@RestController
@RequestMapping("/api/v1/categories")
class CategoryController(private val categoryService: CategoryService) {

    @Operation(summary = "Lista as categorias em árvore")
    @GetMapping
    fun tree(
        @RequestParam(required = false) type: CategoryType?,
        @RequestParam(defaultValue = "false") includeArchived: Boolean,
    ) = categoryService.tree(type, includeArchived).map { it.toResponse() }

    @Operation(summary = "Cria uma categoria ou subcategoria")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(409, "CATEGORY_NAME_TAKEN")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateCategoryRequest) =
        categoryService.create(CreateCategoryCommand(request.name, checkNotNull(request.type), request.parentId)).toResponse()

    @Operation(summary = "Renomeia uma categoria")
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "CATEGORY_NAME_TAKEN")
    @PutMapping("/{id}")
    fun rename(@PathVariable id: UUID, @Valid @RequestBody request: RenameCategoryRequest) =
        categoryService.rename(id, request.name).toResponse()

    @Operation(summary = "Arquiva uma categoria e as subcategorias")
    @ProblemResponse(404, "NOT_FOUND")
    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = categoryService.archive(id).toResponse()

    @Operation(summary = "Desarquiva uma categoria")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "PARENT_CATEGORY_ARCHIVED")
    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = categoryService.unarchive(id).toResponse()

    @Operation(
        summary = "Mescla a categoria em outra",
        description = "Move transações e orçamentos para `targetId` e arquiva a categoria de origem.",
    )
    @ProblemResponse(422, "VALIDATION_FAILED")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "INVALID_CATEGORY_MERGE")
    @PostMapping("/{id}/merge")
    fun merge(@PathVariable id: UUID, @Valid @RequestBody request: MergeCategoryRequest) =
        categoryService.merge(id, checkNotNull(request.targetId)).toResponse()

    @Operation(summary = "Exclui uma categoria sem uso")
    @ProblemResponse(404, "NOT_FOUND")
    @ProblemResponse(409, "CATEGORY_IN_USE", "CATEGORY_HAS_SUBCATEGORIES")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = categoryService.delete(id)

    private fun CategoryBranch.toResponse() = category.toResponse(subcategories.map { it.toResponse() })

    private fun CategoryItem.toResponse(subcategories: List<CategoryResponse> = emptyList()) =
        CategoryResponse(id, name, type, parentId, archived, subcategories)
}
