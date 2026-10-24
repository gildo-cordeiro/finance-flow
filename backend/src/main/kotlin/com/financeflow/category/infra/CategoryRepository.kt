package com.financeflow.category.infra

import com.financeflow.category.domain.CategoryType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

/**
 * As consultas em `transactions` e `budgets` ficam aqui enquanto esses módulos não existem (F1-11, F1-17):
 * a mesclagem precisa movê-los na mesma transação de banco.
 */
interface CategoryRepository : JpaRepository<CategoryEntity, UUID> {

    fun findByIdAndUserId(id: UUID, userId: UUID): CategoryEntity?

    fun findByUserId(userId: UUID): List<CategoryEntity>

    fun findByUserIdAndType(userId: UUID, type: CategoryType): List<CategoryEntity>

    fun findByParentIdAndUserId(parentId: UUID, userId: UUID): List<CategoryEntity>

    fun existsByParentIdAndUserId(parentId: UUID, userId: UUID): Boolean

    @Query(
        """
        SELECT EXISTS (
            SELECT 1 FROM categories
            WHERE user_id = :userId
              AND COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
                = COALESCE(CAST(:parentId AS uuid), '00000000-0000-0000-0000-000000000000'::uuid)
              AND lower(name) = lower(:name)
              AND id <> :exceptId
        )
        """,
        nativeQuery = true,
    )
    fun nameTaken(userId: UUID, parentId: UUID?, name: String, exceptId: UUID): Boolean

    @Query(
        """
        SELECT EXISTS (SELECT 1 FROM transactions WHERE category_id = :categoryId)
            OR EXISTS (SELECT 1 FROM budgets WHERE category_id = :categoryId)
        """,
        nativeQuery = true,
    )
    fun isInUse(categoryId: UUID): Boolean

    @Modifying
    @Query(
        """
        UPDATE transactions SET category_id = :targetId, updated_at = now()
        WHERE category_id = :sourceId AND user_id = :userId
        """,
        nativeQuery = true,
    )
    fun moveTransactions(userId: UUID, sourceId: UUID, targetId: UUID): Int

    // Orçamento é único por categoria e mês: no mês em que os dois têm orçamento, os valores somam
    @Modifying
    @Query(
        """
        UPDATE budgets target SET planned_amount = target.planned_amount + source.planned_amount, updated_at = now()
        FROM budgets source
        WHERE source.user_id = :userId AND source.category_id = :sourceId
          AND target.user_id = :userId AND target.category_id = :targetId
          AND target.month = source.month
        """,
        nativeQuery = true,
    )
    fun addBudgetsToTarget(userId: UUID, sourceId: UUID, targetId: UUID): Int

    @Modifying
    @Query(
        """
        DELETE FROM budgets source
        WHERE source.user_id = :userId AND source.category_id = :sourceId
          AND EXISTS (
              SELECT 1 FROM budgets target
              WHERE target.user_id = :userId AND target.category_id = :targetId AND target.month = source.month
          )
        """,
        nativeQuery = true,
    )
    fun deleteBudgetsAddedToTarget(userId: UUID, sourceId: UUID, targetId: UUID): Int

    @Modifying
    @Query(
        """
        UPDATE budgets SET category_id = :targetId, updated_at = now()
        WHERE category_id = :sourceId AND user_id = :userId
        """,
        nativeQuery = true,
    )
    fun moveBudgets(userId: UUID, sourceId: UUID, targetId: UUID): Int
}
