package com.financeflow.goals.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.financeflow.couple.repository.CoupleRepository;
import com.financeflow.goals.dto.GoalContributionResponse;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.repository.GoalContributionRepository;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetGoalDetailUseCaseTest {

    private GetGoalDetailUseCase getGoalDetailUseCase;

    @BeforeEach
    void setUp() {
        GoalRepository goalRepository = mock(GoalRepository.class);
        GoalContributionRepository contributionRepository = mock(GoalContributionRepository.class);
        CoupleRepository coupleRepository = mock(CoupleRepository.class);

        getGoalDetailUseCase = new GetGoalDetailUseCase(
            goalRepository,
            contributionRepository,
            coupleRepository
        );
    }

    @Test
    void shouldReturnNullWhenGoalIsArchived() {
        Goal goal = new Goal(
            UUID.randomUUID(),
            UUID.randomUUID(),
            null,
            "Viagem",
            "Férias",
            BigDecimal.valueOf(1000),
            BigDecimal.valueOf(100),
            LocalDate.now().plusMonths(5),
            GoalStatus.ARCHIVED,
            Instant.now(),
            Instant.now()
        );

        LocalDate result = getGoalDetailUseCase.calculateProjectedCompletionDate(goal, List.of());
        assertThat(result).isNull();
    }

    @Test
    void shouldReturnLastContributionDateWhenGoalIsAlreadyCompleted() {
        Goal goal = new Goal(
            UUID.randomUUID(),
            UUID.randomUUID(),
            null,
            "Reserva",
            null,
            BigDecimal.valueOf(1000),
            BigDecimal.valueOf(1000),
            LocalDate.now().plusMonths(5),
            GoalStatus.COMPLETED,
            Instant.now(),
            Instant.now()
        );

        LocalDate contributionDate = LocalDate.now().minusDays(2);
        List<GoalContributionResponse> contributions = List.of(
            new GoalContributionResponse(
                UUID.randomUUID(),
                goal.id(),
                goal.userId(),
                BigDecimal.valueOf(1000),
                "Completo",
                contributionDate,
                "MANUAL",
                Instant.now()
            )
        );

        LocalDate result = getGoalDetailUseCase.calculateProjectedCompletionDate(goal, contributions);
        assertThat(result).isEqualTo(contributionDate);
    }

    @Test
    void shouldReturnNullWhenNoContributionsExist() {
        Goal goal = new Goal(
            UUID.randomUUID(),
            UUID.randomUUID(),
            null,
            "Carro",
            null,
            BigDecimal.valueOf(50000),
            BigDecimal.ZERO,
            LocalDate.now().plusYears(1),
            GoalStatus.ACTIVE,
            Instant.now(),
            Instant.now()
        );

        LocalDate result = getGoalDetailUseCase.calculateProjectedCompletionDate(goal, List.of());
        assertThat(result).isNull();
    }

    @Test
    void shouldCalculateProjectionBasedOnRecentContributionWhenNoHistoryInLast3Months() {
        Goal goal = new Goal(
            UUID.randomUUID(),
            UUID.randomUUID(),
            null,
            "Notebook",
            null,
            BigDecimal.valueOf(6000),
            BigDecimal.valueOf(1000),
            LocalDate.now().plusMonths(6),
            GoalStatus.ACTIVE,
            Instant.now(),
            Instant.now()
        );

        // Contribution is 4 months ago (outside the 3 months window)
        LocalDate oldContributionDate = LocalDate.now().minusMonths(4);
        List<GoalContributionResponse> contributions = List.of(
            new GoalContributionResponse(
                UUID.randomUUID(),
                goal.id(),
                goal.userId(),
                BigDecimal.valueOf(1000), // Recent contribution amount
                "Notebook contrib",
                oldContributionDate,
                "MANUAL",
                Instant.now()
            )
        );

        LocalDate result = getGoalDetailUseCase.calculateProjectedCompletionDate(goal, contributions);

        // Remaining amount = 5000.
        // Monthly rate = 1000 (from the most recent contribution).
        // Months needed = 5.
        // Days needed = 150.
        LocalDate expected = LocalDate.now().plusDays(150);
        assertThat(result).isEqualTo(expected);
    }

    @Test
    void shouldCalculateProjectionBasedOnAverageOfLast3Months() {
        Goal goal = new Goal(
            UUID.randomUUID(),
            UUID.randomUUID(),
            null,
            "Casamento",
            null,
            BigDecimal.valueOf(12000),
            BigDecimal.valueOf(3000),
            LocalDate.now().plusMonths(12),
            GoalStatus.ACTIVE,
            Instant.now(),
            Instant.now()
        );

        // Contributions in the last 3 months
        List<GoalContributionResponse> contributions = List.of(
            new GoalContributionResponse(
                UUID.randomUUID(), goal.id(), goal.userId(), BigDecimal.valueOf(1500), "Mes 1", LocalDate.now().minusMonths(1), "MANUAL", Instant.now()
            ),
            new GoalContributionResponse(
                UUID.randomUUID(), goal.id(), goal.userId(), BigDecimal.valueOf(1500), "Mes 2", LocalDate.now().minusMonths(2), "MANUAL", Instant.now()
            )
        );

        LocalDate result = getGoalDetailUseCase.calculateProjectedCompletionDate(goal, contributions);

        // Total in last 3 months = 3000.
        // Monthly rate = 3000 / 3 = 1000.
        // Remaining = 9000.
        // Months needed = 9.
        // Days needed = 270.
        LocalDate expected = LocalDate.now().plusDays(270);
        assertThat(result).isEqualTo(expected);
    }
}
