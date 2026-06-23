package com.financeflow.transaction.service;

import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.mapper.CategoryMapper;
import com.financeflow.transaction.repository.CategoryRepository;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ListCategoriesUseCase {

    private static final Logger log = LoggerFactory.getLogger(ListCategoriesUseCase.class);

    private final CategoryRepository categoryRepository;

    public ListCategoriesUseCase(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> execute(UUID userId) {
        log.info("Listing categories for user={}", userId);
        return categoryRepository.findAllByUserId(userId).stream()
            .map(CategoryMapper::toDomain)
            .map(c -> new CategoryResponse(c.id(), c.userId(), c.name(), c.parentId()))
            .toList();
    }
}
