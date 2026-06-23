package com.financeflow.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.service.GetUserProfileUseCase;
import com.financeflow.auth.service.UpdateProfileUseCase;
import com.financeflow.auth.service.JwtService;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GetUserProfileUseCase getUserProfileUseCase;

    @MockitoBean
    private UpdateProfileUseCase updateProfileUseCase;

    @MockitoBean
    private JwtService jwtService; // Required because of JwtAuthenticationFilter dependency

    @Test
    void shouldReturnProfileWhenUserIsAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse response = new UserResponse(
            userId, "test@test.com", "John Doe", "America/Sao_Paulo", "BRL", 5
        );

        when(getUserProfileUseCase.execute(userId)).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/users/me")
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(userId.toString()))
            .andExpect(jsonPath("$.email").value("test@test.com"))
            .andExpect(jsonPath("$.name").value("John Doe"));
    }

    @Test
    void shouldUpdateProfileWhenUserIsAuthenticatedAndRequestIsValid() throws Exception {
        UUID userId = UUID.randomUUID();
        UpdateProfileRequest request = new UpdateProfileRequest("Jane Doe", "UTC", "USD", 10);
        UserResponse response = new UserResponse(
            userId, "test@test.com", "Jane Doe", "UTC", "USD", 10
        );

        when(updateProfileUseCase.execute(eq(userId), any(UpdateProfileRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/users/me")
                .principal(auth)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Jane Doe"))
            .andExpect(jsonPath("$.timeZone").value("UTC"))
            .andExpect(jsonPath("$.currency").value("USD"))
            .andExpect(jsonPath("$.budgetClosingDay").value(10));
    }
}
