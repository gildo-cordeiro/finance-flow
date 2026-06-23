package com.financeflow.transaction.service;

import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdateCategoryUseCase {

    private static final Logger log = LoggerFactory.getLogger(UpdateCategoryUseCase.class);

    private final CategoryRepository categoryRepository;

    public UpdateCategoryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public CategoryResponse execute(UUID userId, UUID id, CategoryRequest request) {
        log.info("Updating category id={} for user={} to name={}, parentId={}", id, userId, request.name(), request.parentId());

        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Category", id));

        if (entity.getUserId() == null) {
            throw new ValidationException("id", "Default categories cannot be modified");
        }

        if (!entity.getUserId().equals(userId)) {
            throw new NotFoundException("Category", id);
        }

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new ValidationException("parentId", "A category cannot be its own parent");
            }
            CategoryEntity parent = categoryRepository.findById(request.parentId())
                .orElseThrow(() -> new NotFoundException("Category", request.parentId()));

            if (parent.getUserId() != null && !parent.getUserId().equals(userId)) {
                throw new ValidationException("parentId", "Invalid parent category ownership");
            }

            if (categoryRepository.existsByUserIdAndNameAndParentIdAndIdNot(userId, request.name(), request.parentId(), id)) {
                throw new ValidationException("name", "Category with this name already exists in this parent group");
            }
        } else {
            if (categoryRepository.existsByUserIdAndNameAndParentIdIsNullAndIdNot(userId, request.name(), id)) {
                throw new ValidationException("name", "Category with this name already exists");
            }
        }

        entity.setName(request.name());
        entity.setParentId(request.parentId());
        entity.setUpdatedAt(Instant.now());

        CategoryEntity saved = categoryRepository.save(entity);
        log.info("Category updated successfully with id={}", saved.getId());

        return new CategoryResponse(
            saved.getId(),
            saved.getUserId(),
            saved.getName(),
            saved.getParentId()
        );
    }
}
