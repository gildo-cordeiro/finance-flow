package com.financeflow.account.controller;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.service.ArchiveAccountUseCase;
import com.financeflow.account.service.CloseAccountUseCase;
import com.financeflow.account.service.CreateAccountUseCase;
import com.financeflow.account.service.DeleteAccountUseCase;
import com.financeflow.account.service.ListAccountsUseCase;
import com.financeflow.account.service.UnarchiveAccountUseCase;
import com.financeflow.account.service.UpdateAccountUseCase;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final ListAccountsUseCase listAccountsUseCase;
    private final CreateAccountUseCase createAccountUseCase;
    private final UpdateAccountUseCase updateAccountUseCase;
    private final ArchiveAccountUseCase archiveAccountUseCase;
    private final UnarchiveAccountUseCase unarchiveAccountUseCase;
    private final CloseAccountUseCase closeAccountUseCase;
    private final DeleteAccountUseCase deleteAccountUseCase;

    public AccountController(
        ListAccountsUseCase listAccountsUseCase,
        CreateAccountUseCase createAccountUseCase,
        UpdateAccountUseCase updateAccountUseCase,
        ArchiveAccountUseCase archiveAccountUseCase,
        UnarchiveAccountUseCase unarchiveAccountUseCase,
        CloseAccountUseCase closeAccountUseCase,
        DeleteAccountUseCase deleteAccountUseCase
    ) {
        this.listAccountsUseCase = listAccountsUseCase;
        this.createAccountUseCase = createAccountUseCase;
        this.updateAccountUseCase = updateAccountUseCase;
        this.archiveAccountUseCase = archiveAccountUseCase;
        this.unarchiveAccountUseCase = unarchiveAccountUseCase;
        this.closeAccountUseCase = closeAccountUseCase;
        this.deleteAccountUseCase = deleteAccountUseCase;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> listAccounts(
        Authentication authentication,
        @RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext
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

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody @Validated UpdateAccountRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        AccountResponse response = updateAccountUseCase.execute(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveAccount(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        archiveAccountUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<Void> unarchiveAccount(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        unarchiveAccountUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Void> closeAccount(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        closeAccountUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteAccountUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }
}
