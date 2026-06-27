package com.financeflow.transaction.controller;

import com.financeflow.transaction.dto.TransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.service.CreateTransactionUseCase;
import com.financeflow.transaction.service.ListTransactionsUseCase;
import com.financeflow.transaction.service.UpdateTransactionUseCase;
import com.financeflow.transaction.service.DeleteTransactionUseCase;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final ListTransactionsUseCase listTransactionsUseCase;
    private final CreateTransactionUseCase createTransactionUseCase;
    private final UpdateTransactionUseCase updateTransactionUseCase;
    private final DeleteTransactionUseCase deleteTransactionUseCase;

    public TransactionController(
        ListTransactionsUseCase listTransactionsUseCase,
        CreateTransactionUseCase createTransactionUseCase,
        UpdateTransactionUseCase updateTransactionUseCase,
        DeleteTransactionUseCase deleteTransactionUseCase
    ) {
        this.listTransactionsUseCase = listTransactionsUseCase;
        this.createTransactionUseCase = createTransactionUseCase;
        this.updateTransactionUseCase = updateTransactionUseCase;
        this.deleteTransactionUseCase = deleteTransactionUseCase;
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> listTransactions(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) UUID accountId
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<TransactionResponse> response = listTransactionsUseCase.execute(
            userId, viewContext, startDate, endDate, categoryId, accountId
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
        Authentication authentication,
        @RequestBody @Validated TransactionRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        TransactionResponse response = createTransactionUseCase.execute(userId, request);
        URI location = URI.create("/api/v1/transactions/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody @Validated TransactionRequest request,
        @RequestParam(required = false, defaultValue = "ONLY_THIS") String mode
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        TransactionResponse response = updateTransactionUseCase.execute(userId, id, request, mode);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestParam(required = false, defaultValue = "ONLY_THIS") String mode
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteTransactionUseCase.execute(userId, id, mode);
        return ResponseEntity.noContent().build();
    }
}
