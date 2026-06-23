package com.financeflow.auth.controller;

import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.service.GetUserProfileUseCase;
import com.financeflow.auth.service.UpdateProfileUseCase;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
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

    public UserController(
        GetUserProfileUseCase getUserProfileUseCase,
        UpdateProfileUseCase updateProfileUseCase
    ) {
        this.getUserProfileUseCase = getUserProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
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
}
