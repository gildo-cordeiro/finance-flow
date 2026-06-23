package com.financeflow.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.dto.*;
import com.financeflow.auth.service.LoginUseCase;
import com.financeflow.auth.service.RefreshTokenUseCase;
import com.financeflow.auth.service.RegisterUseCase;
import com.financeflow.auth.service.JwtService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RegisterUseCase registerUseCase;

    @MockitoBean
    private LoginUseCase loginUseCase;

    @MockitoBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockitoBean
    private JwtService jwtService; // Required because JwtAuthenticationFilter depends on it

    @Test
    void shouldReturn201WhenRegisterIsSuccessful() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "test@test.com", "password123", "John Doe", "America/Sao_Paulo", "BRL", 5
        );
        UserResponse response = new UserResponse(
            UUID.randomUUID(), request.email(), request.name(), request.timeZone(), request.currency(), request.budgetClosingDay()
        );

        when(registerUseCase.execute(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value(request.email()))
            .andExpect(jsonPath("$.name").value(request.name()));
    }

    @Test
    void shouldReturn422WhenRegisterFieldsAreInvalid() throws Exception {
        // Missing name and password too short
        RegisterRequest request = new RegisterRequest(
            "invalid-email", "123", "", "America/Sao_Paulo", "BRL", 5
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void shouldReturn200WhenLoginIsSuccessful() throws Exception {
        LoginRequest request = new LoginRequest("test@test.com", "password123");
        TokenResponse response = new TokenResponse("access-token", "refresh-token");

        when(loginUseCase.execute(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    void shouldReturn200WhenRefreshIsSuccessful() throws Exception {
        RefreshRequest request = new RefreshRequest("refresh-token");
        TokenResponse response = new TokenResponse("new-access-token", "new-refresh-token");

        when(refreshTokenUseCase.execute(request.refreshToken())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("new-access-token"))
            .andExpect(jsonPath("$.refreshToken").value("new-refresh-token"));
    }
}
