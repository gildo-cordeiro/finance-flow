package com.financeflow.dashboard.controller;

import com.financeflow.dashboard.dto.DashboardSummaryResponse;
import com.financeflow.dashboard.service.GetDashboardSummaryUseCase;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final GetDashboardSummaryUseCase getDashboardSummaryUseCase;

    public DashboardController(GetDashboardSummaryUseCase getDashboardSummaryUseCase) {
        this.getDashboardSummaryUseCase = getDashboardSummaryUseCase;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext,
        @RequestParam(required = false) String month
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        DashboardSummaryResponse response = getDashboardSummaryUseCase.execute(userId, viewContext, month);
        return ResponseEntity.ok(response);
    }
}
