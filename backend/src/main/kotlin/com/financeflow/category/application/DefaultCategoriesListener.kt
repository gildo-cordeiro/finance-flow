package com.financeflow.category.application

import com.financeflow.auth.UserRegistered
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/** Roda dentro da transação do cadastro: usuário e categorias padrão são gravados juntos. */
@Component
class DefaultCategoriesListener(private val categoryService: CategoryService) {

    @EventListener
    fun on(event: UserRegistered) = categoryService.createDefaults(event.userId)
}
