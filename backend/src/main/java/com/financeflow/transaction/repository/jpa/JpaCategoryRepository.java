package com.financeflow.transaction.repository.jpa;

import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaCategoryRepository implements CategoryRepository {

    private final SpringCategoryRepository springRepo;

    public JpaCategoryRepository(SpringCategoryRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public List<CategoryEntity> findAllByUserId(UUID userId) {
        return springRepo.findAllByUserIdOrUserIdIsNull(userId);
    }

    @Override
    public Optional<CategoryEntity> findById(UUID id) {
        return springRepo.findById(id);
    }

    @Override
    public CategoryEntity save(CategoryEntity category) {
        return springRepo.save(category);
    }

    @Override
    public void delete(CategoryEntity category) {
        springRepo.delete(category);
    }

    @Override
    public boolean existsByUserIdAndNameAndParentId(UUID userId, String name, UUID parentId) {
        return springRepo.existsByUserIdAndNameAndParentId(userId, name, parentId);
    }

    @Override
    public boolean existsByUserIdAndNameAndParentIdIsNull(UUID userId, String name) {
        return springRepo.existsByUserIdAndNameAndParentIdIsNull(userId, name);
    }

    @Override
    public boolean existsByUserIdAndNameAndParentIdAndIdNot(UUID userId, String name, UUID parentId, UUID id) {
        return springRepo.existsByUserIdAndNameAndParentIdAndIdNot(userId, name, parentId, id);
    }

    @Override
    public boolean existsByUserIdAndNameAndParentIdIsNullAndIdNot(UUID userId, String name, UUID id) {
        return springRepo.existsByUserIdAndNameAndParentIdIsNullAndIdNot(userId, name, id);
    }
}
