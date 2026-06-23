package com.financeflow.transaction.service;

import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.domain.Category;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.mapper.CategoryMapper;
import com.financeflow.transaction.repository.CategoryRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CreateCategoryUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateCategoryUseCase.class);

    private final CategoryRepository categoryRepository;

    public CreateCategoryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public CategoryResponse execute(UUID userId, CategoryRequest request) {
        log.info("Creating category for user={} with name={}, parentId={}", userId, request.name(), request.parentId());

        if (request.parentId() != null) {
            CategoryEntity parent = categoryRepository.findById(request.parentId())
                .orElseThrow(() -> new NotFoundException("Category", request.parentId()));

            if (parent.getUserId() != null && !parent.getUserId().equals(userId)) {
                throw new ValidationException("parentId", "Invalid parent category ownership");
            }

            if (categoryRepository.existsByUserIdAndNameAndParentId(userId, request.name(), request.parentId())) {
                throw new ValidationException("name", "Category with this name already exists in this parent group");
            }
        } else {
            if (categoryRepository.existsByUserIdAndNameAndParentIdIsNull(userId, request.name())) {
                throw new ValidationException("name", "Category with this name already exists");
            }
        }

        Category domainCategory = new Category(
            UUID.randomUUID(),
            userId,
            request.name(),
            request.parentId(),
            null,
            null
        );

        CategoryEntity entity = CategoryMapper.toEntity(domainCategory);
        CategoryEntity saved = categoryRepository.save(entity);

        log.info("Category created successfully with id={}", saved.getId());
        Category savedDomain = CategoryMapper.toDomain(saved);

        return new CategoryResponse(
            savedDomain.id(),
            savedDomain.userId(),
            savedDomain.name(),
            savedDomain.parentId()
        );
    }
}
