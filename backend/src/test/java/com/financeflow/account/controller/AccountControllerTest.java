package com.financeflow.account.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.service.CreateAccountUseCase;
import com.financeflow.account.service.ListAccountsUseCase;
import com.financeflow.auth.service.JwtService;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AccountController.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ListAccountsUseCase listAccountsUseCase;

    @MockitoBean
    private CreateAccountUseCase createAccountUseCase;

    @MockitoBean
    private JwtService jwtService; // Needed for Security Filter Chain dependency injection

    @Test
    void shouldReturnAccountsWhenUserIsAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        AccountResponse response1 = new AccountResponse(
            UUID.randomUUID(), userId, "My Account", AccountType.CHECKING, "Bank A",
            new BigDecimal("150.00"), null, null, null
        );

        when(listAccountsUseCase.execute(userId)).thenReturn(List.of(response1));

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/accounts")
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("My Account"))
            .andExpect(jsonPath("$[0].type").value("CHECKING"))
            .andExpect(jsonPath("$[0].balance").value(150.00));
    }

    @Test
    void shouldCreateAccountSuccessfullyWhenAuthenticated() throws Exception {
        UUID userId = UUID.randomUUID();
        AccountRequest request = new AccountRequest(
            "My New Card", AccountType.CREDIT_CARD, "Bank B", new BigDecimal("0.00"),
            new BigDecimal("2000.00"), 10, 20
        );
        AccountResponse response = new AccountResponse(
            UUID.randomUUID(), userId, "My New Card", AccountType.CREDIT_CARD, "Bank B",
            new BigDecimal("0.00"), new BigDecimal("2000.00"), 10, 20
        );

        when(createAccountUseCase.execute(eq(userId), any(AccountRequest.class))).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/accounts")
                .with(csrf())
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("My New Card"))
            .andExpect(jsonPath("$.type").value("CREDIT_CARD"))
            .andExpect(jsonPath("$.creditLimit").value(2000.00));
    }
}
