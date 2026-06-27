package com.financeflow.transaction.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.service.JwtService;
import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.CategoryResponse;
import com.financeflow.transaction.service.CreateCategoryUseCase;
import com.financeflow.transaction.service.DeleteCategoryUseCase;
import com.financeflow.transaction.service.ListCategoriesUseCase;
import com.financeflow.transaction.service.UpdateCategoryUseCase;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CategoryController.class, excludeAutoConfiguration = {
    org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration.class,
    org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration.class
})
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ListCategoriesUseCase listCategoriesUseCase;

    @MockitoBean
    private CreateCategoryUseCase createCategoryUseCase;

    @MockitoBean
    private UpdateCategoryUseCase updateCategoryUseCase;

    @MockitoBean
    private DeleteCategoryUseCase deleteCategoryUseCase;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void shouldListCategoriesSuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        CategoryResponse response = new CategoryResponse(UUID.randomUUID(), userId, "Transport", null, com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL);

        when(listCategoriesUseCase.execute(eq(userId), any())).thenReturn(List.of(response));

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/categories")
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Transport"));
    }

    @Test
    void shouldCreateCategorySuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber", null);
        CategoryResponse response = new CategoryResponse(UUID.randomUUID(), userId, "Uber", null, com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL);

        when(createCategoryUseCase.execute(eq(userId), any(), any(CategoryRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/categories")
                .with(csrf())
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Uber"));
    }

    @Test
    void shouldUpdateCategorySuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CategoryRequest request = new CategoryRequest("Uber Moto", null);
        CategoryResponse response = new CategoryResponse(categoryId, userId, "Uber Moto", null, com.financeflow.transaction.model.domain.TransactionVisibility.PERSONAL);

        when(updateCategoryUseCase.execute(eq(userId), eq(categoryId), any(CategoryRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/categories/" + categoryId)
                .with(csrf())
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Uber Moto"));
    }

    @Test
    void shouldDeleteCategorySuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        doNothing().when(deleteCategoryUseCase).execute(userId, categoryId);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(delete("/api/v1/categories/" + categoryId)
                .with(csrf())
                .principal(auth))
            .andExpect(status().isNoContent());
    }
}
