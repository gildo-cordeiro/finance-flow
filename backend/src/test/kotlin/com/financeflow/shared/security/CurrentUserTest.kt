package com.financeflow.shared.security

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.AuthorityUtils
import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID
import kotlin.test.assertEquals

class CurrentUserTest {

    private val currentUser = CurrentUser()

    @AfterEach
    fun clear() = SecurityContextHolder.clearContext()

    @Test
    fun `devolve o id do usuário autenticado`() {
        val id = UUID.randomUUID()
        authenticate(UsernamePasswordAuthenticationToken.authenticated(id.toString(), null, emptyList()))
        assertEquals(id, currentUser.id())
    }

    @Test
    fun `sem autenticação lança erro de credencial`() {
        assertThrows<AuthenticationCredentialsNotFoundException> { currentUser.id() }
    }

    @Test
    fun `usuário anônimo lança erro de credencial`() {
        authenticate(AnonymousAuthenticationToken("chave", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")))
        assertThrows<AuthenticationCredentialsNotFoundException> { currentUser.id() }
    }

    @Test
    fun `nome que não é UUID lança erro de credencial`() {
        authenticate(UsernamePasswordAuthenticationToken.authenticated("alice", null, emptyList()))
        assertThrows<AuthenticationCredentialsNotFoundException> { currentUser.id() }
    }

    private fun authenticate(authentication: org.springframework.security.core.Authentication) {
        SecurityContextHolder.getContext().authentication = authentication
    }
}
