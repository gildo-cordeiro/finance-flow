package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ListCategoriesUseCaseTest {

    private CategoryRepository categoryRepository;
    private com.financeflow.couple.repository.CoupleRepository coupleRepository;
    private ListCategoriesUseCase listCategoriesUseCase;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        coupleRepository = mock(com.financeflow.couple.repository.CoupleRepository.class);
        listCategoriesUseCase = new ListCategoriesUseCase(categoryRepository, coupleRepository);
    }

    @Test
    void shouldListCategoriesSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID catId1 = UUID.randomUUID();
        UUID catId2 = UUID.randomUUID();

        CategoryEntity entity1 = new CategoryEntity(catId1, null, "Default Income", null, com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL, Instant.now(), Instant.now());
        CategoryEntity entity2 = new CategoryEntity(catId2, userId, "Custom Expense", null, com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL, Instant.now(), Instant.now());

        when(categoryRepository.findAllByUserId(userId)).thenReturn(List.of(entity1, entity2));

        List<CategoryResponse> response = listCategoriesUseCase.execute(userId);

        assertThat(response).hasSize(2);
        assertThat(response.get(0).name()).isEqualTo("Default Income");
        assertThat(response.get(0).userId()).isNull();
        assertThat(response.get(1).name()).isEqualTo("Custom Expense");
        assertThat(response.get(1).userId()).isEqualTo(userId);
    }
}
