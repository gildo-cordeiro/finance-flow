package com.financeflow.transaction.repository;

import com.financeflow.transaction.model.entity.CategoryEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {
    List<CategoryEntity> findAllByUserId(UUID userId);
    Optional<CategoryEntity> findById(UUID id);
    CategoryEntity save(CategoryEntity category);
    void delete(CategoryEntity category);
    boolean existsByUserIdAndNameAndParentId(UUID userId, String name, UUID parentId);
    boolean existsByUserIdAndNameAndParentIdIsNull(UUID userId, String name);
    boolean existsByUserIdAndNameAndParentIdAndIdNot(UUID userId, String name, UUID parentId, UUID id);
    boolean existsByUserIdAndNameAndParentIdIsNullAndIdNot(UUID userId, String name, UUID id);
}
