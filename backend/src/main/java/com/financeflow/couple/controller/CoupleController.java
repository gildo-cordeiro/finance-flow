package com.financeflow.couple.controller;

import com.financeflow.couple.dto.AcceptInviteRequest;
import com.financeflow.couple.dto.CoupleResponse;
import com.financeflow.couple.dto.InvitePartnerRequest;
import com.financeflow.couple.service.AcceptInviteUseCase;
import com.financeflow.couple.service.DeclineInviteUseCase;
import com.financeflow.couple.service.DissolveCoupleUseCase;
import com.financeflow.couple.service.GetCoupleStatusUseCase;
import com.financeflow.couple.service.InvitePartnerUseCase;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/couple")
public class CoupleController {

    private final InvitePartnerUseCase invitePartnerUseCase;
    private final AcceptInviteUseCase acceptInviteUseCase;
    private final DeclineInviteUseCase declineInviteUseCase;
    private final DissolveCoupleUseCase dissolveCoupleUseCase;
    private final GetCoupleStatusUseCase getCoupleStatusUseCase;

    public CoupleController(
        InvitePartnerUseCase invitePartnerUseCase,
        AcceptInviteUseCase acceptInviteUseCase,
        DeclineInviteUseCase declineInviteUseCase,
        DissolveCoupleUseCase dissolveCoupleUseCase,
        GetCoupleStatusUseCase getCoupleStatusUseCase
    ) {
        this.invitePartnerUseCase = invitePartnerUseCase;
        this.acceptInviteUseCase = acceptInviteUseCase;
        this.declineInviteUseCase = declineInviteUseCase;
        this.dissolveCoupleUseCase = dissolveCoupleUseCase;
        this.getCoupleStatusUseCase = getCoupleStatusUseCase;
    }

    @GetMapping
    public ResponseEntity<CoupleResponse> getCoupleStatus(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        CoupleResponse response = getCoupleStatusUseCase.execute(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invite")
    public ResponseEntity<Void> invitePartner(
        Authentication authentication,
        @RequestBody @Validated InvitePartnerRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        invitePartnerUseCase.execute(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept")
    public ResponseEntity<Void> acceptInvite(
        Authentication authentication,
        @RequestBody @Validated AcceptInviteRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        acceptInviteUseCase.execute(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/decline")
    public ResponseEntity<Void> declineInvite(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        declineInviteUseCase.execute(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> dissolveCouple(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        dissolveCoupleUseCase.execute(userId);
        return ResponseEntity.noContent().build();
    }
}
