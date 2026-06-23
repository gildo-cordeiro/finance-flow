package com.financeflow.budget.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.service.JwtService;
import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.dto.UpdateBudgetRequest;
import com.financeflow.budget.service.CopyBudgetUseCase;
import com.financeflow.budget.service.GetBudgetUseCase;
import com.financeflow.budget.service.UpdateBudgetUseCase;
import java.math.BigDecimal;
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

@WebMvcTest(BudgetController.class)
class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GetBudgetUseCase getBudgetUseCase;

    @MockitoBean
    private UpdateBudgetUseCase updateBudgetUseCase;

    @MockitoBean
    private CopyBudgetUseCase copyBudgetUseCase;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void shouldGetBudgetSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";
        BudgetResponse response = new BudgetResponse(month, List.of(
            new BudgetItemResponse(UUID.randomUUID(), "Food", null, new BigDecimal("100.00"), new BigDecimal("50.00"))
        ));

        when(getBudgetUseCase.execute(userId, month)).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/budget/" + month)
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.month").value(month))
            .andExpect(jsonPath("$.items[0].categoryName").value("Food"))
            .andExpect(jsonPath("$.items[0].plannedAmount").value(100.0));
    }

    @Test
    void shouldUpdateBudgetSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";
        UUID categoryId = UUID.randomUUID();
        UpdateBudgetRequest request = new UpdateBudgetRequest(new BigDecimal("150.00"));
        BudgetItemResponse response = new BudgetItemResponse(categoryId, "Food", null, new BigDecimal("150.00"), BigDecimal.ZERO);

        when(updateBudgetUseCase.execute(eq(userId), eq(month), eq(categoryId), any(UpdateBudgetRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/budget/" + month + "/categories/" + categoryId)
                .with(csrf())
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.plannedAmount").value(150.0));
    }

    @Test
    void shouldCopyBudgetSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";
        BudgetResponse response = new BudgetResponse(month, List.of());

        when(copyBudgetUseCase.execute(userId, month)).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/budget/" + month + "/copy")
                .with(csrf())
                .principal(auth))
            .andExpect(status().isOk());
    }
}
