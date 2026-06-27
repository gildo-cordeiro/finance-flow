package com.financeflow.transaction.service;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.mapper.CategoryMapper;
import com.financeflow.transaction.repository.CategoryRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final CoupleRepository coupleRepository;

    public ListCategoriesUseCase(CategoryRepository categoryRepository, CoupleRepository coupleRepository) {
        this.categoryRepository = categoryRepository;
        this.coupleRepository = coupleRepository;
    }

    public List<CategoryResponse> execute(UUID userId) {
        return execute(userId, "PERSONAL");
    }

    public List<CategoryResponse> execute(UUID userId, String viewContext) {
        log.info("Listing categories for user={}, viewContext={}", userId, viewContext);

        List<CategoryEntity> categories;

        if ("COUPLE".equalsIgnoreCase(viewContext)) {
            Couple couple = coupleRepository.findActiveByUserId(userId).orElse(null);
            UUID partnerId = (couple != null) ? (couple.user1Id().equals(userId) ? couple.user2Id() : couple.user1Id()) : null;

            List<CategoryEntity> ownList = categoryRepository.findAllByUserId(userId);
            List<CategoryEntity> partnerList = partnerId != null ? categoryRepository.findAllByUserId(partnerId) : List.of();

            List<CategoryEntity> combined = new ArrayList<>();
            combined.addAll(ownList);
            combined.addAll(partnerList);

            Map<UUID, CategoryEntity> uniqueCategories = new LinkedHashMap<>();
            for (CategoryEntity c : combined) {
                if (c.getUserId() == null) {
                    uniqueCategories.putIfAbsent(c.getId(), c);
                } else if (c.getVisibility() == TransactionVisibility.SHARED) {
                    uniqueCategories.putIfAbsent(c.getId(), c);
                }
            }
            categories = new ArrayList<>(uniqueCategories.values());
        } else {
            List<CategoryEntity> ownList = categoryRepository.findAllByUserId(userId);
            categories = ownList.stream()
                .filter(c -> c.getUserId() == null || c.getVisibility() == TransactionVisibility.PERSONAL)
                .toList();
        }

        return categories.stream()
            .map(CategoryMapper::toDomain)
            .map(c -> new CategoryResponse(c.id(), c.userId(), c.name(), c.parentId(), c.visibility()))
            .toList();
    }
}
