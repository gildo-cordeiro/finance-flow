package com.financeflow.auth.controller;

import com.financeflow.auth.dto.ChangePasswordRequest;
import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.service.ChangePasswordUseCase;
import com.financeflow.auth.service.DeleteUserUseCase;
import com.financeflow.auth.service.GetUserProfileUseCase;
import com.financeflow.auth.service.UpdateProfileUseCase;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final GetUserProfileUseCase getUserProfileUseCase;
    private final UpdateProfileUseCase updateProfileUseCase;
    private final ChangePasswordUseCase changePasswordUseCase;
    private final DeleteUserUseCase deleteUserUseCase;

    public UserController(
        GetUserProfileUseCase getUserProfileUseCase,
        UpdateProfileUseCase updateProfileUseCase,
        ChangePasswordUseCase changePasswordUseCase,
        DeleteUserUseCase deleteUserUseCase
    ) {
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
        this.changePasswordUseCase = changePasswordUseCase;
        this.deleteUserUseCase = deleteUserUseCase;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse response = getUserProfileUseCase.execute(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
        Authentication authentication,
        @RequestBody @Validated UpdateProfileRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        UserResponse response = updateProfileUseCase.execute(userId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
        Authentication authentication,
        @RequestBody @Validated ChangePasswordRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        changePasswordUseCase.execute(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteProfile(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteUserUseCase.execute(userId);
        return ResponseEntity.noContent().build();
    }
}

