package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DeleteCategoryUseCaseTest {

    private CategoryRepository categoryRepository;
    private DeleteCategoryUseCase deleteCategoryUseCase;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository);
    }

    @Test
    void shouldDeleteCategorySuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        CategoryEntity entity = new CategoryEntity(categoryId, userId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        deleteCategoryUseCase.execute(userId, categoryId);

        verify(categoryRepository).delete(entity);
    }

    @Test
    void shouldThrowExceptionWhenDeletingDefaultCategory() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        CategoryEntity entity = new CategoryEntity(categoryId, null, "Default Category", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> deleteCategoryUseCase.execute(userId, categoryId))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Default categories cannot be deleted");
    }

    @Test
    void shouldThrowExceptionWhenCategoryBelongsToAnotherUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        CategoryEntity entity = new CategoryEntity(categoryId, otherUserId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> deleteCategoryUseCase.execute(userId, categoryId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Category not found");
    }
}
