package com.financeflow.category.domain

import java.util.UUID

/** O que as regras de hierarquia precisam saber de uma categoria. */
data class CategoryNode(
    val id: UUID,
    val type: CategoryType,
    val parentId: UUID?,
    val archived: Boolean,
)

/** Regras de RF-012 e ADR-0013: dois níveis e o mesmo tipo entre pai e filha. */
object CategoryHierarchy {

    /** Devolve a mensagem da regra violada por `parent` como pai de uma categoria `type`, ou `null`. */
    fun parentViolation(type: CategoryType, parent: CategoryNode): String? = when {
        parent.parentId != null -> "Subcategoria não pode ter subcategorias"
        parent.type != type -> "A subcategoria precisa ser do mesmo tipo da categoria pai"
        parent.archived -> "A categoria pai está arquivada"
        else -> null
    }

    /** Devolve a mensagem da regra violada ao mesclar `source` em `target`, ou `null`. */
    fun mergeViolation(source: CategoryNode, target: CategoryNode, sourceHasSubcategories: Boolean): String? = when {
        source.id == target.id -> "Escolha outra categoria como destino"
        source.type != target.type -> "Só é possível mesclar categorias do mesmo tipo"
        target.archived -> "A categoria de destino está arquivada"
        // As subcategorias ficariam sem lugar: um terceiro nível ou outro tipo
        sourceHasSubcategories -> "Mescle ou exclua as subcategorias antes de mesclar a categoria"
        else -> null
    }
}
