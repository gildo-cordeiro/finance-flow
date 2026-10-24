package com.financeflow.auth.domain

import java.util.UUID

/** Publicado ao final do cadastro. A F1-09 usa para criar as categorias padrão. */
data class UserRegistered(val userId: UUID)
