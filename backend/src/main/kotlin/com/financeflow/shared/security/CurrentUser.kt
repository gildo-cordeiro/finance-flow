package com.financeflow.shared.security

import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class CurrentUser {

    fun id(): UUID {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication == null || authentication is AnonymousAuthenticationToken || !authentication.isAuthenticated) {
            throw AuthenticationCredentialsNotFoundException("Nenhum usuário autenticado")
        }
        return try {
            UUID.fromString(authentication.name)
        } catch (ex: IllegalArgumentException) {
            throw AuthenticationCredentialsNotFoundException("Identificador de usuário inválido", ex)
        }
    }
}
