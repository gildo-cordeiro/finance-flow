package com.financeflow.auth.infra

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {

    fun findByEmail(email: String): UserEntity?

    fun existsByEmail(email: String): Boolean

    @Query("select u.timezone from UserEntity u where u.id = :id")
    fun findTimezoneById(id: UUID): String?
}
