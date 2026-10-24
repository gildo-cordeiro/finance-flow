package com.financeflow.category.application

import com.financeflow.category.domain.CategoryBranch
import com.financeflow.category.domain.CategoryHierarchy
import com.financeflow.category.domain.CategoryItem
import com.financeflow.category.domain.CategoryNode
import com.financeflow.category.domain.CategoryTree
import com.financeflow.category.domain.CategoryType
import com.financeflow.category.domain.DefaultCategories
import com.financeflow.category.infra.CategoryEntity
import com.financeflow.category.infra.CategoryRepository
import com.financeflow.shared.error.BusinessRuleException
import com.financeflow.shared.error.NotFoundException
import com.financeflow.shared.error.ValidationException
import com.financeflow.shared.security.CurrentUser
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

data class CreateCategoryCommand(val name: String, val type: CategoryType, val parentId: UUID?)

/** Categorias e subcategorias do usuário (RF-012, ADR-0013). */
@Service
class CategoryService(
    private val categories: CategoryRepository,
    private val currentUser: CurrentUser,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun tree(type: CategoryType?, includeArchived: Boolean): List<CategoryBranch> {
        val userId = currentUser.id()
        val found = if (type == null) categories.findByUserId(userId) else categories.findByUserIdAndType(userId, type)
        return CategoryTree.of(found.filter { includeArchived || !it.archived }.map { it.toItem() })
    }

    @Transactional
    fun createDefaults(userId: UUID) {
        val now = clock.instant()
        val entities = DefaultCategories.ALL.flatMap { default ->
            val parent = CategoryEntity(UUID.randomUUID(), userId, null, default.name, default.type, updatedAt = now)
            listOf(parent) + default.subcategories.map {
                CategoryEntity(UUID.randomUUID(), userId, parent.id, it, default.type, updatedAt = now)
            }
        }
        categories.saveAll(entities)
    }

    @Transactional
    fun create(command: CreateCategoryCommand): CategoryItem {
        val userId = currentUser.id()
        if (command.parentId != null) {
            val parent = categories.findByIdAndUserId(command.parentId, userId)
                ?: throw ValidationException("parentId", "Categoria pai não encontrada")
            CategoryHierarchy.parentViolation(command.type, parent.toNode())
                ?.let { throw ValidationException("parentId", it) }
        }
        val name = command.name.trim()
        requireNameAvailable(userId, command.parentId, name, exceptId = null)
        val category = CategoryEntity(UUID.randomUUID(), userId, command.parentId, name, command.type, updatedAt = clock.instant())
        saveUnique { categories.saveAndFlush(category) }
        return category.toItem()
    }

    @Transactional
    fun rename(id: UUID, name: String): CategoryItem {
        val category = find(id)
        val trimmed = name.trim()
        requireNameAvailable(category.userId, category.parentId, trimmed, exceptId = category.id)
        category.name = trimmed
        category.updatedAt = clock.instant()
        saveUnique { categories.flush() }
        return category.toItem()
    }

    /** Arquivar a categoria arquiva também as subcategorias. */
    @Transactional
    fun archive(id: UUID): CategoryItem {
        val category = find(id)
        (listOf(category) + categories.findByParentIdAndUserId(category.id, category.userId))
            .filter { !it.archived }
            .forEach { it.markArchived(true) }
        return category.toItem()
    }

    @Transactional
    fun unarchive(id: UUID): CategoryItem {
        val category = find(id)
        val parent = category.parentId?.let { categories.findByIdAndUserId(it, category.userId) }
        if (parent?.archived == true) {
            throw BusinessRuleException("PARENT_CATEGORY_ARCHIVED", "Desarquive a categoria pai primeiro")
        }
        if (category.archived) category.markArchived(false)
        return category.toItem()
    }

    /** Só sem transações nem orçamento; com eles, arquive ou mescle (RF-012). */
    @Transactional
    fun delete(id: UUID) {
        val category = find(id)
        if (categories.existsByParentIdAndUserId(category.id, category.userId)) {
            throw BusinessRuleException("CATEGORY_HAS_SUBCATEGORIES", "Exclua as subcategorias primeiro")
        }
        if (categories.isInUse(category.id)) throw categoryInUse()
        try {
            categories.delete(category)
            categories.flush()
        } catch (ex: DataIntegrityViolationException) {
            throw categoryInUse()
        }
    }

    /** Move transações e orçamentos para `targetId` e arquiva a origem, tudo numa transação de banco. */
    @Transactional
    fun merge(id: UUID, targetId: UUID): CategoryItem {
        val source = find(id)
        val target = categories.findByIdAndUserId(targetId, source.userId)
            ?: throw ValidationException("targetId", "Categoria de destino não encontrada")
        val hasSubcategories = categories.existsByParentIdAndUserId(source.id, source.userId)
        CategoryHierarchy.mergeViolation(source.toNode(), target.toNode(), hasSubcategories)
            ?.let { throw BusinessRuleException("INVALID_CATEGORY_MERGE", it) }

        categories.moveTransactions(source.userId, source.id, target.id)
        categories.addBudgetsToTarget(source.userId, source.id, target.id)
        categories.deleteBudgetsAddedToTarget(source.userId, source.id, target.id)
        categories.moveBudgets(source.userId, source.id, target.id)
        if (!source.archived) source.markArchived(true)
        return source.toItem()
    }

    private fun find(id: UUID) = categories.findByIdAndUserId(id, currentUser.id()) ?: throw NotFoundException()

    private fun requireNameAvailable(userId: UUID, parentId: UUID?, name: String, exceptId: UUID?) {
        // Sem id para excluir da busca, qualquer UUID que não exista serve
        if (categories.nameTaken(userId, parentId, name, exceptId ?: UUID(0, 0))) throw nameTaken()
    }

    private fun saveUnique(save: () -> Unit) {
        try {
            save()
        } catch (ex: DataIntegrityViolationException) {
            throw nameTaken()
        }
    }

    private fun CategoryEntity.markArchived(value: Boolean) {
        archived = value
        updatedAt = clock.instant()
    }

    private fun CategoryEntity.toNode() = CategoryNode(id, type, parentId, archived)

    private fun CategoryEntity.toItem() = CategoryItem(id, name, type, parentId, archived)

    private fun nameTaken() =
        BusinessRuleException("CATEGORY_NAME_TAKEN", "Já existe uma categoria com esse nome neste nível")

    private fun categoryInUse() =
        BusinessRuleException("CATEGORY_IN_USE", "A categoria tem transações ou orçamento. Arquive ou mescle")
}
