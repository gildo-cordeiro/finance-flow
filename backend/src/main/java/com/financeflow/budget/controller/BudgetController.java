package com.financeflow.budget.controller;

import com.financeflow.budget.dto.BudgetItemResponse;
import com.financeflow.budget.dto.BudgetResponse;
import com.financeflow.budget.dto.UpdateBudgetRequest;
import com.financeflow.budget.service.CopyBudgetUseCase;
import com.financeflow.budget.service.GetBudgetUseCase;
import com.financeflow.budget.service.UpdateBudgetUseCase;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/budget")
public class BudgetController {

    private final GetBudgetUseCase getBudgetUseCase;
    private final UpdateBudgetUseCase updateBudgetUseCase;
    private final CopyBudgetUseCase copyBudgetUseCase;

    public BudgetController(
        GetBudgetUseCase getBudgetUseCase,
        UpdateBudgetUseCase updateBudgetUseCase,
        CopyBudgetUseCase copyBudgetUseCase
    ) {
        this.getBudgetUseCase = getBudgetUseCase;
        this.updateBudgetUseCase = updateBudgetUseCase;
        this.copyBudgetUseCase = copyBudgetUseCase;
    }

    @GetMapping("/{month}")
    public ResponseEntity<BudgetResponse> getBudget(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext,
        @PathVariable String month
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        BudgetResponse response = getBudgetUseCase.execute(userId, viewContext, month);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{month}/categories/{id}")
    public ResponseEntity<BudgetItemResponse> updateBudget(
        Authentication authentication,
        @PathVariable String month,
        @PathVariable("id") UUID categoryId,
        @RequestBody @Validated UpdateBudgetRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        BudgetItemResponse response = updateBudgetUseCase.execute(userId, month, categoryId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{month}/copy")
    public ResponseEntity<BudgetResponse> copyBudget(
        Authentication authentication,
        @PathVariable String month
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        BudgetResponse response = copyBudgetUseCase.execute(userId, month);
        return ResponseEntity.ok(response);
    }
}
