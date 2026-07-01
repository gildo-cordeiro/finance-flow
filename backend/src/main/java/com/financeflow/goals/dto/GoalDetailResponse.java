package com.financeflow.goals.dto;

import java.time.LocalDate;
import java.util.List;

public record GoalDetailResponse(
    GoalResponse goal,
    List<GoalContributionResponse> contributions,
    LocalDate projectedCompletionDate
) {}
