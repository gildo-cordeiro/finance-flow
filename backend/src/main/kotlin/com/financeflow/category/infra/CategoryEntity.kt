package com.financeflow.category.infra

import com.financeflow.category.domain.CategoryType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "categories")
class CategoryEntity(
    @Id
    val id: UUID,

    @Column(name = "user_id", nullable = false, updatable = false)
    val userId: UUID,

    @Column(name = "parent_id", updatable = false)
    val parentId: UUID?,

    @Column(nullable = false)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    val type: CategoryType,

    @Column(nullable = false)
    var archived: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,
)
