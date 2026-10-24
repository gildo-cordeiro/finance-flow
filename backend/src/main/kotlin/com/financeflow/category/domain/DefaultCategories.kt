package com.financeflow.category.domain

data class DefaultCategory(val name: String, val type: CategoryType, val subcategories: List<String> = emptyList())

/**
 * Conjunto copiado para cada usuário no cadastro (RF-012, ADR-0013, ADR-0037), a partir do seed da `V3` do projeto
 * anterior. Os nomes de primeiro nível não se repetem entre os tipos: o índice único é por pai e nome.
 * Mudanças valem só para quem se cadastrar depois.
 */
object DefaultCategories {

    val ALL: List<DefaultCategory> = listOf(
        DefaultCategory("Receitas", CategoryType.INCOME, listOf("Salário", "Investimentos")),
        DefaultCategory("Outras receitas", CategoryType.INCOME),
        DefaultCategory("Alimentação", CategoryType.EXPENSE, listOf("Supermercado", "Restaurantes")),
        DefaultCategory("Moradia", CategoryType.EXPENSE, listOf("Aluguel", "Luz", "Internet")),
        DefaultCategory("Transporte", CategoryType.EXPENSE),
        DefaultCategory("Lazer", CategoryType.EXPENSE),
        DefaultCategory("Saúde", CategoryType.EXPENSE),
        DefaultCategory("Educação", CategoryType.EXPENSE),
        DefaultCategory("Outras despesas", CategoryType.EXPENSE),
    )
}
