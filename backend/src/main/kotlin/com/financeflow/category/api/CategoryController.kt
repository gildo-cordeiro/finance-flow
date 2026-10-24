package com.financeflow.category.api

import com.financeflow.category.application.CategoryService
import com.financeflow.category.application.CreateCategoryCommand
import com.financeflow.category.domain.CategoryBranch
import com.financeflow.category.domain.CategoryItem
import com.financeflow.category.domain.CategoryType
import com.financeflow.shared.error.DocumentedError
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.util.UUID
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

@Tag(name = "Categorias", description = "Dois níveis, com tipo (RF-012, ADR-0013, ADR-0036).")
@RestController
@RequestMapping("/api/v1/categories")
class CategoryController(private val categoryService: CategoryService) {

    @Operation(summary = "Árvore de categorias com as subcategorias, em ordem alfabética")
    @GetMapping
    fun tree(
        @Parameter(description = "Filtra pelo tipo; sem ele, todas") @RequestParam(required = false) type: CategoryType?,
        @Parameter(description = "Inclui as arquivadas") @RequestParam(defaultValue = "false") includeArchived: Boolean,
    ) = categoryService.tree(type, includeArchived).map { it.toResponse() }

    @Operation(summary = "Cria categoria ou subcategoria", description = "A subcategoria tem o tipo do pai, que precisa ser de primeiro nível e ativo.")
    @DocumentedError(409, "CATEGORY_NAME_TAKEN", "Nome já usado no mesmo nível")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateCategoryRequest) =
        categoryService.create(CreateCategoryCommand(request.name, checkNotNull(request.type), request.parentId)).toResponse()

    @Operation(summary = "Renomeia a categoria")
    @DocumentedError(409, "CATEGORY_NAME_TAKEN", "Nome já usado no mesmo nível")
    @PutMapping("/{id}")
    fun rename(@PathVariable id: UUID, @Valid @RequestBody request: RenameCategoryRequest) =
        categoryService.rename(id, request.name).toResponse()

    @Operation(summary = "Arquiva a categoria e as subcategorias")
    @PostMapping("/{id}/archive")
    fun archive(@PathVariable id: UUID) = categoryService.archive(id).toResponse()

    @Operation(summary = "Desarquiva a categoria (não as subcategorias)")
    @DocumentedError(409, "PARENT_CATEGORY_ARCHIVED", "A categoria pai está arquivada")
    @PostMapping("/{id}/unarchive")
    fun unarchive(@PathVariable id: UUID) = categoryService.unarchive(id).toResponse()

    @Operation(summary = "Mescla na categoria de destino", description = "Move transações e orçamentos (somando o planejado do mesmo mês) e arquiva a origem.")
    @DocumentedError(409, "INVALID_CATEGORY_MERGE", "Destino igual, de outro tipo ou arquivado, ou origem com subcategorias")
    @PostMapping("/{id}/merge")
    fun merge(@PathVariable id: UUID, @Valid @RequestBody request: MergeCategoryRequest) =
        categoryService.merge(id, checkNotNull(request.targetId)).toResponse()

    @Operation(summary = "Exclui a categoria sem uso")
    @DocumentedError(409, "CATEGORY_IN_USE", "Tem transações ou orçamento; arquive ou mescle")
    @DocumentedError(409, "CATEGORY_HAS_SUBCATEGORIES", "Tem subcategorias")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = categoryService.delete(id)

    private fun CategoryBranch.toResponse() = category.toResponse(subcategories.map { it.toResponse() })

    private fun CategoryItem.toResponse(subcategories: List<CategoryResponse> = emptyList()) =
        CategoryResponse(id, name, type, parentId, archived, subcategories)
}
