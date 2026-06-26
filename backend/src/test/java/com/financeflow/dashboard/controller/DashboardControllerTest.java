package com.financeflow.dashboard.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.financeflow.auth.service.JwtService;
import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.dashboard.service.GetDashboardSummaryUseCase;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = DashboardController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GetDashboardSummaryUseCase getDashboardSummaryUseCase;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void shouldGetDashboardSummarySuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        String month = "2026-06";
        DashboardSummaryResponse response = new DashboardSummaryResponse(
            new BigDecimal("5000.00"),
            new BigDecimal("1500.00"),
            new BigDecimal("3500.00"),
            new BigDecimal("2000.00"),
            new BigDecimal("1400.00")
        );

        when(getDashboardSummaryUseCase.execute(eq(userId), eq(month))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/dashboard/summary")
                .param("month", month)
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRevenue").value(5000.0))
            .andExpect(jsonPath("$.totalExpenses").value(1500.0))
            .andExpect(jsonPath("$.balance").value(3500.0))
            .andExpect(jsonPath("$.budgetPlanned").value(2000.0))
            .andExpect(jsonPath("$.budgetRealized").value(1400.0));
    }

    @Test
    void shouldGetDashboardSummaryWithDefaultMonth() throws Exception {
        UUID userId = UUID.randomUUID();
        DashboardSummaryResponse response = new DashboardSummaryResponse(
            new BigDecimal("5000.00"),
            new BigDecimal("1500.00"),
            new BigDecimal("3500.00"),
            new BigDecimal("2000.00"),
            new BigDecimal("1400.00")
        );

        when(getDashboardSummaryUseCase.execute(eq(userId), any())).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/dashboard/summary")
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRevenue").value(5000.0))
            .andExpect(jsonPath("$.totalExpenses").value(1500.0));
    }
}
