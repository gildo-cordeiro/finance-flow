package com.financeflow.cashflow.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.financeflow.auth.service.JwtService;
import com.financeflow.cashflow.dto.CashFlowResponse;
import com.financeflow.cashflow.service.GetCashFlowUseCase;
import java.time.LocalDate;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CashFlowController.class, excludeAutoConfiguration = {
    org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration.class,
    org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration.class
})
class CashFlowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetCashFlowUseCase getCashFlowUseCase;

    @MockitoBean
    private JwtService jwtService; // Needed for Security Filter Chain dependency injection

    @Test
    void shouldReturnCashFlowWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 3);

        CashFlowResponse mockResponse = new CashFlowResponse(
            Collections.emptyList(),
            Collections.emptyList()
        );

        when(getCashFlowUseCase.execute(
            org.mockito.ArgumentMatchers.eq(userId),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.eq(from),
            org.mockito.ArgumentMatchers.eq(to)
        )).thenReturn(mockResponse);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/cashflow")
                .principal(auth)
                .param("from", "2026-06-01")
                .param("to", "2026-06-03"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dailyPoints").isArray())
            .andExpect(jsonPath("$.tightnessPeriods").isArray());
    }
}
