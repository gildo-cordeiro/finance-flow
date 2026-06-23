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

class CreateCategoryUseCaseTest {

    private CategoryRepository categoryRepository;
    private CreateCategoryUseCase createCategoryUseCase;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);
    }

    @Test
    void shouldCreateRootCategorySuccessfully() {
        UUID userId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Transport", null);

        when(categoryRepository.existsByUserIdAndNameAndParentIdIsNull(userId, "Transport")).thenReturn(false);
        when(categoryRepository.save(any(CategoryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response = createCategoryUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.name()).isEqualTo("Transport");
        assertThat(response.parentId()).isNull();
    }

    @Test
    void shouldCreateSubcategorySuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber", parentId);

        CategoryEntity parentEntity = new CategoryEntity(parentId, userId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentEntity));
        when(categoryRepository.existsByUserIdAndNameAndParentId(userId, "Uber", parentId)).thenReturn(false);
        when(categoryRepository.save(any(CategoryEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response = createCategoryUseCase.execute(userId, request);

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("Uber");
        assertThat(response.parentId()).isEqualTo(parentId);
    }

    @Test
    void shouldThrowExceptionWhenParentDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber", parentId);

        when(categoryRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> createCategoryUseCase.execute(userId, request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Category not found");
    }

    @Test
    void shouldThrowExceptionWhenParentBelongsToAnotherUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber", parentId);

        CategoryEntity parentEntity = new CategoryEntity(parentId, otherUserId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentEntity));

        assertThatThrownBy(() -> createCategoryUseCase.execute(userId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Invalid parent category ownership");
    }

    @Test
    void shouldThrowExceptionWhenDuplicateRootCategoryNameExists() {
        UUID userId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Transport", null);

        when(categoryRepository.existsByUserIdAndNameAndParentIdIsNull(userId, "Transport")).thenReturn(true);

        assertThatThrownBy(() -> createCategoryUseCase.execute(userId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Category with this name already exists");
    }

    @Test
    void shouldThrowExceptionWhenDuplicateSubcategoryNameExists() {
        UUID userId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber", parentId);

        CategoryEntity parentEntity = new CategoryEntity(parentId, userId, "Transport", null, Instant.now(), Instant.now());

        when(categoryRepository.findById(parentId)).thenReturn(Optional.of(parentEntity));
        when(categoryRepository.existsByUserIdAndNameAndParentId(userId, "Uber", parentId)).thenReturn(true);

        assertThatThrownBy(() -> createCategoryUseCase.execute(userId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Category with this name already exists in this parent group");
    }
}
