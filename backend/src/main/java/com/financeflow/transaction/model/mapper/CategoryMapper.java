package com.financeflow.transaction.model.mapper;

import com.financeflow.transaction.model.domain.Category;
import com.financeflow.transaction.model.entity.CategoryEntity;

public final class CategoryMapper {

    private CategoryMapper() {
        // utility class
    }

    public static Category toDomain(CategoryEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Category(
            entity.getId(),
            entity.getUserId(),
            entity.getName(),
            entity.getParentId(),
            entity.getVisibility(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static CategoryEntity toEntity(Category domain) {
        if (domain == null) {
            return null;
        }
        return new CategoryEntity(
            domain.id(),
            domain.userId(),
            domain.name(),
            domain.parentId(),
            domain.visibility(),
            domain.createdAt(),
            domain.updatedAt()
        );
    }
}
