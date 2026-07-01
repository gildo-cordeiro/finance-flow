package com.financeflow.goals.controller;

import com.financeflow.goals.dto.CreateGoalRequest;
import com.financeflow.goals.dto.GoalContributionRequest;
import com.financeflow.goals.dto.GoalContributionResponse;
import com.financeflow.goals.dto.GoalDetailResponse;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.dto.UpdateGoalRequest;
import com.financeflow.goals.service.AddContributionUseCase;
import com.financeflow.goals.service.CreateGoalUseCase;
import com.financeflow.goals.service.DeleteContributionUseCase;
import com.financeflow.goals.service.DeleteGoalUseCase;
import com.financeflow.goals.service.GetGoalDetailUseCase;
import com.financeflow.goals.service.ListGoalsUseCase;
import com.financeflow.goals.service.UpdateGoalUseCase;
import com.financeflow.goals.service.UnarchiveGoalUseCase;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final ListGoalsUseCase listGoalsUseCase;
    private final CreateGoalUseCase createGoalUseCase;
    private final GetGoalDetailUseCase getGoalDetailUseCase;
    private final UpdateGoalUseCase updateGoalUseCase;
    private final DeleteGoalUseCase deleteGoalUseCase;
    private final AddContributionUseCase addContributionUseCase;
    private final DeleteContributionUseCase deleteContributionUseCase;
    private final UnarchiveGoalUseCase unarchiveGoalUseCase;

    public GoalController(
        ListGoalsUseCase listGoalsUseCase,
        CreateGoalUseCase createGoalUseCase,
        GetGoalDetailUseCase getGoalDetailUseCase,
        UpdateGoalUseCase updateGoalUseCase,
        DeleteGoalUseCase deleteGoalUseCase,
        AddContributionUseCase addContributionUseCase,
        DeleteContributionUseCase deleteContributionUseCase,
        UnarchiveGoalUseCase unarchiveGoalUseCase
    ) {
        this.listGoalsUseCase = listGoalsUseCase;
        this.createGoalUseCase = createGoalUseCase;
        this.getGoalDetailUseCase = getGoalDetailUseCase;
        this.updateGoalUseCase = updateGoalUseCase;
        this.deleteGoalUseCase = deleteGoalUseCase;
        this.addContributionUseCase = addContributionUseCase;
        this.deleteContributionUseCase = deleteContributionUseCase;
        this.unarchiveGoalUseCase = unarchiveGoalUseCase;
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> listGoals(
        Authentication authentication,
        @org.springframework.web.bind.annotation.RequestHeader(value = "X-View-Context", required = false, defaultValue = "PERSONAL") String viewContext
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<GoalResponse> response = listGoalsUseCase.execute(userId, viewContext);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
        Authentication authentication,
        @RequestBody @Validated CreateGoalRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        GoalResponse response = createGoalUseCase.execute(userId, request);
        URI location = URI.create("/api/v1/goals/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalDetailResponse> getGoalDetail(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        GoalDetailResponse response = getGoalDetailUseCase.execute(userId, id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody @Validated UpdateGoalRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        GoalResponse response = updateGoalUseCase.execute(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteGoalUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contributions")
    public ResponseEntity<GoalContributionResponse> addContribution(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody @Validated GoalContributionRequest request
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        GoalContributionResponse response = addContributionUseCase.execute(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/contributions/{contributionId}")
    public ResponseEntity<Void> deleteContribution(
        Authentication authentication,
        @PathVariable UUID id,
        @PathVariable UUID contributionId
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        deleteContributionUseCase.execute(userId, id, contributionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/unarchive")
    public ResponseEntity<Void> unarchiveGoal(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        unarchiveGoalUseCase.execute(userId, id);
        return ResponseEntity.noContent().build();
    }
}
