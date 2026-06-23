package com.financeflow.auth.controller;

import com.financeflow.auth.dto.*;
import com.financeflow.auth.service.LoginUseCase;
import com.financeflow.auth.service.RefreshTokenUseCase;
import com.financeflow.auth.service.RegisterUseCase;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegisterUseCase registerUseCase;
    private final LoginUseCase loginUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;

    public AuthController(
        RegisterUseCase registerUseCase,
        LoginUseCase loginUseCase,
        RefreshTokenUseCase refreshTokenUseCase
    ) {
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody @Validated RegisterRequest request) {
        UserResponse response = registerUseCase.execute(request);
        URI location = URI.create("/api/v1/users/me");
        return ResponseEntity.created(location).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody @Validated LoginRequest request) {
        TokenResponse response = loginUseCase.execute(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody @Validated RefreshRequest request) {
        TokenResponse response = refreshTokenUseCase.execute(request.refreshToken());
        return ResponseEntity.ok(response);
    }
}
