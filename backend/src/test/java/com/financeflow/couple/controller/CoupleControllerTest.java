package com.financeflow.couple.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.financeflow.auth.service.JwtService;
import com.financeflow.couple.dto.AcceptInviteRequest;
import com.financeflow.couple.dto.CoupleResponse;
import com.financeflow.couple.dto.InvitePartnerRequest;
import com.financeflow.couple.service.AcceptInviteUseCase;
import com.financeflow.couple.service.DeclineInviteUseCase;
import com.financeflow.couple.service.DissolveCoupleUseCase;
import com.financeflow.couple.service.GetCoupleStatusUseCase;
import com.financeflow.couple.service.InvitePartnerUseCase;
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

@WebMvcTest(controllers = CoupleController.class, excludeAutoConfiguration = {
    org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration.class,
    org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration.class
})
class CoupleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private InvitePartnerUseCase invitePartnerUseCase;

    @MockitoBean
    private AcceptInviteUseCase acceptInviteUseCase;

    @MockitoBean
    private DeclineInviteUseCase declineInviteUseCase;

    @MockitoBean
    private DissolveCoupleUseCase dissolveCoupleUseCase;

    @MockitoBean
    private GetCoupleStatusUseCase getCoupleStatusUseCase;

    @MockitoBean
    private JwtService jwtService; // Required because of JwtAuthenticationFilter dependency

    @Test
    void shouldReturnCoupleStatusSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        CoupleResponse response = new CoupleResponse("ACTIVE", null, "partner@test.com", "Partner", null);

        when(getCoupleStatusUseCase.execute(userId)).thenReturn(response);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/couple")
                .principal(auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andExpect(jsonPath("$.partnerEmail").value("partner@test.com"))
            .andExpect(jsonPath("$.partnerName").value("Partner"));
    }

    @Test
    void shouldInvitePartnerSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        InvitePartnerRequest request = new InvitePartnerRequest("partner@test.com");

        doNothing().when(invitePartnerUseCase).execute(eq(userId), any(InvitePartnerRequest.class));

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/couple/invite")
                .principal(auth)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());
    }

    @Test
    void shouldAcceptInviteSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        AcceptInviteRequest request = new AcceptInviteRequest("token");

        doNothing().when(acceptInviteUseCase).execute(eq(userId), any(AcceptInviteRequest.class));

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/couple/accept")
                .principal(auth)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());
    }

    @Test
    void shouldDeclineInviteSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();

        doNothing().when(declineInviteUseCase).execute(userId);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/couple/decline")
                .principal(auth)
                .with(csrf()))
            .andExpect(status().isOk());
    }

    @Test
    void shouldDissolveCoupleSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();

        doNothing().when(dissolveCoupleUseCase).execute(userId);

        Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

        mockMvc.perform(delete("/api/v1/couple")
                .principal(auth)
                .with(csrf()))
            .andExpect(status().isNoContent());
    }
}
