package com.financeflow.transaction.service;

import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteCategoryUseCase {

    private static final Logger log = LoggerFactory.getLogger(DeleteCategoryUseCase.class);

    private final CategoryRepository categoryRepository;

    public DeleteCategoryUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public void execute(UUID userId, UUID id) {
        log.info("Deleting category id={} for user={}", id, userId);

        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Category", id));

        if (entity.getUserId() == null) {
            throw new ValidationException("id", "Default categories cannot be deleted");
        }

        if (!entity.getUserId().equals(userId)) {
            throw new NotFoundException("Category", id);
        }

        categoryRepository.delete(entity);
        log.info("Category deleted successfully with id={}", id);
    }
}
