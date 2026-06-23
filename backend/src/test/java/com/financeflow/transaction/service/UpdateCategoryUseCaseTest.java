package com.financeflow.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateCategoryUseCaseTest {

    private CategoryRepository categoryRepository;
    private UpdateCategoryUseCase updateCategoryUseCase;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository);
    }

    @Test
    void shouldUpdateCategorySuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("New Transport", null);

        CategoryEntity entity = new CategoryEntity(categoryId, userId, "Old Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));
        when(categoryRepository.existsByUserIdAndNameAndParentIdIsNullAndIdNot(userId, "New Transport", categoryId)).thenReturn(false);
        when(categoryRepository.save(any(CategoryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response = updateCategoryUseCase.execute(userId, categoryId, request);

        assertThat(response.id()).isEqualTo(categoryId);
        assertThat(response.name()).isEqualTo("New Transport");
    }

    @Test
    void shouldThrowExceptionWhenModifyingDefaultCategory() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("New Transport", null);

        CategoryEntity entity = new CategoryEntity(categoryId, null, "Default Category", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> updateCategoryUseCase.execute(userId, categoryId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Default categories cannot be modified");
    }

    @Test
    void shouldThrowExceptionWhenCategoryBelongsToAnotherUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("New Transport", null);

        CategoryEntity entity = new CategoryEntity(categoryId, otherUserId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> updateCategoryUseCase.execute(userId, categoryId, request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Category not found");
    }

    @Test
    void shouldThrowExceptionWhenSelfReferentialParent() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Transport", categoryId);

        CategoryEntity entity = new CategoryEntity(categoryId, userId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> updateCategoryUseCase.execute(userId, categoryId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("A category cannot be its own parent");
    }
}
