package com.financeflow.transaction.repository.jpa;

import com.financeflow.transaction.model.entity.CategoryEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringCategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    @Query("SELECT c FROM CategoryEntity c WHERE c.userId = :userId OR c.userId IS NULL ORDER BY c.name ASC")
    List<CategoryEntity> findAllByUserIdOrUserIdIsNull(@Param("userId") UUID userId);

    boolean existsByUserIdAndNameAndParentId(UUID userId, String name, UUID parentId);
    
    boolean existsByUserIdAndNameAndParentIdIsNull(UUID userId, String name);

    boolean existsByUserIdAndNameAndParentIdAndIdNot(UUID userId, String name, UUID parentId, UUID id);

    boolean existsByUserIdAndNameAndParentIdIsNullAndIdNot(UUID userId, String name, UUID id);
}
