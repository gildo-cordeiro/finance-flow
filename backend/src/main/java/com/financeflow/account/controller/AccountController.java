package com.financeflow.account.controller;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.service.CreateAccountUseCase;
import com.financeflow.account.service.ListAccountsUseCase;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final ListAccountsUseCase listAccountsUseCase;
    private final CreateAccountUseCase createAccountUseCase;

    public AccountController(
        ListAccountsUseCase listAccountsUseCase,
        CreateAccountUseCase createAccountUseCase
    ) {
        this.listAccountsUseCase = listAccountsUseCase;
        this.createAccountUseCase = createAccountUseCase;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> listAccounts(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<AccountResponse> response = listAccountsUseCase.execute(userId, viewContext);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
        Authentication authentication,
        @RequestBody @Validated AccountRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        AccountResponse response = createAccountUseCase.execute(userId, request);
        URI location = URI.create("/api/v1/accounts/" + response.id());
        return ResponseEntity.created(location).body(response);
    }
}
