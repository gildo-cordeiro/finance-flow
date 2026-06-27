package com.financeflow.cashflow.controller;

import com.financeflow.cashflow.dto.CashFlowResponse;
import com.financeflow.cashflow.service.GetCashFlowUseCase;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cashflow")
public class CashFlowController {

    private final GetCashFlowUseCase getCashFlowUseCase;

    public CashFlowController(GetCashFlowUseCase getCashFlowUseCase) {
        this.getCashFlowUseCase = getCashFlowUseCase;
    }

    @GetMapping
    public ResponseEntity<CashFlowResponse> getCashFlow(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        CashFlowResponse response = getCashFlowUseCase.execute(userId, viewContext, from, to);
        return ResponseEntity.ok(response);
    }
}
