package com.financeflow.transaction.controller;

import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.service.CreateCategoryUseCase;
import com.financeflow.transaction.service.DeleteCategoryUseCase;
import com.financeflow.transaction.service.ListCategoriesUseCase;
import com.financeflow.transaction.service.UpdateCategoryUseCase;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final ListCategoriesUseCase listCategoriesUseCase;
    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final DeleteCategoryUseCase deleteCategoryUseCase;

    public CategoryController(
        ListCategoriesUseCase listCategoriesUseCase,
        CreateCategoryUseCase createCategoryUseCase,
        UpdateCategoryUseCase updateCategoryUseCase,
        DeleteCategoryUseCase deleteCategoryUseCase
    ) {
        this.listCategoriesUseCase = listCategoriesUseCase;
        this.createCategoryUseCase = createCategoryUseCase;
        this.updateCategoryUseCase = updateCategoryUseCase;
        this.deleteCategoryUseCase = deleteCategoryUseCase;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listCategories(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<CategoryResponse> response = listCategoriesUseCase.execute(userId, viewContext);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext,
        @RequestBody @Validated CategoryRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        CategoryResponse response = createCategoryUseCase.execute(userId, viewContext, request);
        URI location = URI.create("/api/v1/categories/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody @Validated CategoryRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        CategoryResponse response = updateCategoryUseCase.execute(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(Authentication authentication, @PathVariable UUID id) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteCategoryUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }
}
