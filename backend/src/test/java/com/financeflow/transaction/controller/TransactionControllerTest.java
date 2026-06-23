package com.financeflow.transaction.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.service.JwtService;
import com.financeflow.transaction.dto.TransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.service.CreateTransactionUseCase;
import com.financeflow.transaction.service.ListTransactionsUseCase;
import java.math.BigDecimal;
import java.time.LocalDate;
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

@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ListTransactionsUseCase listTransactionsUseCase;

    @MockitoBean
    private CreateTransactionUseCase createTransactionUseCase;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void shouldListTransactionsSuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 30);

        TransactionResponse response = new TransactionResponse(
            UUID.randomUUID(), userId, accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            null, TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        when(listTransactionsUseCase.execute(userId, start, end, categoryId, accountId))
            .thenReturn(List.of(response));

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/transactions")
                .principal(auth)
                .param("startDate", "2026-06-01")
                .param("endDate", "2026-06-30")
                .param("categoryId", categoryId.toString())
                .param("accountId", accountId.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].description").value("Lunch"))
            .andExpect(jsonPath("$[0].amount").value(50.00));
    }

    @Test
    void shouldCreateTransactionSuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        TransactionRequest request = new TransactionRequest(
            accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, null, LocalDate.of(2026, 6, 10), null,
            TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        TransactionResponse response = new TransactionResponse(
            UUID.randomUUID(), userId, accountId, categoryId, "Lunch", new BigDecimal("50.00"),
            TransactionType.EXPENSE, LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 10),
            null, TransactionStatus.PENDING, TransactionVisibility.PERSONAL
        );

        when(createTransactionUseCase.execute(eq(userId), any(TransactionRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/transactions")
                .with(csrf())
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.description").value("Lunch"))
            .andExpect(jsonPath("$.amount").value(50.00));
    }
}
