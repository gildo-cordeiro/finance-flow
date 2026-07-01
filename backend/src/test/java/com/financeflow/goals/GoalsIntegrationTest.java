package com.financeflow.goals;

import static org.assertj.core.api.Assertions.assertThat;

import com.financeflow.goals.dto.CreateGoalRequest;
import com.financeflow.goals.dto.GoalResponse;
import com.financeflow.goals.dto.GoalContributionRequest;
import com.financeflow.goals.dto.GoalContributionResponse;
import com.financeflow.goals.dto.GoalDetailResponse;
import com.financeflow.goals.model.domain.GoalStatus;
import com.financeflow.goals.service.CreateGoalUseCase;
import com.financeflow.goals.service.ListGoalsUseCase;
import com.financeflow.goals.service.GetGoalDetailUseCase;
import com.financeflow.goals.service.AddContributionUseCase;
import com.financeflow.goals.service.DeleteGoalUseCase;
import com.financeflow.goals.service.DeleteContributionUseCase;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class GoalsIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.url", postgres::getJdbcUrl);
        registry.add("spring.flyway.user", postgres::getUsername);
        registry.add("spring.flyway.password", postgres::getPassword);
    }

    @Autowired
    private CreateGoalUseCase createGoalUseCase;

    @Autowired
    private ListGoalsUseCase listGoalsUseCase;

    @Autowired
    private GetGoalDetailUseCase getGoalDetailUseCase;

    @Autowired
    private AddContributionUseCase addContributionUseCase;

    @Autowired
    private DeleteGoalUseCase deleteGoalUseCase;

    @Autowired
    private DeleteContributionUseCase deleteContributionUseCase;

    @Autowired
    private com.financeflow.goals.service.UnarchiveGoalUseCase unarchiveGoalUseCase;

    @Autowired
    private UserRepository userRepository;

    private UUID userId;

    @BeforeEach
    void setUp() {
        // Create a test user
        UserEntity user = new UserEntity(
            UUID.randomUUID(),
            "test-" + UUID.randomUUID() + "@test.com",
            "password",
            "Test User",
            "America/Sao_Paulo",
            "BRL",
            10,
            Instant.now(),
            Instant.now()
        );
        userRepository.save(user);
        userId = user.getId();
    }

    @Test
    void shouldPerformGoalLifecycle() {
        // 1. Create a goal
        CreateGoalRequest createRequest = new CreateGoalRequest(
            "Viagem Orlando",
            "Férias com a família",
            BigDecimal.valueOf(10000.00),
            LocalDate.now().plusMonths(6),
            false,
            BigDecimal.valueOf(1000.00) // initial amount
        );

        GoalResponse created = createGoalUseCase.execute(userId, createRequest);
        assertThat(created.id()).isNotNull();
        assertThat(created.name()).isEqualTo("Viagem Orlando");
        assertThat(created.targetAmount()).isEqualByComparingTo(BigDecimal.valueOf(10000.00));
        assertThat(created.currentAmount()).isEqualByComparingTo(BigDecimal.valueOf(1000.00));
        assertThat(created.status()).isEqualTo(GoalStatus.ACTIVE);

        // 2. List goals
        List<GoalResponse> goals = listGoalsUseCase.execute(userId, "PERSONAL");
        assertThat(goals).isNotEmpty();
        assertThat(goals.stream().anyMatch(g -> g.id().equals(created.id()))).isTrue();

        // 3. Add manual contribution
        GoalContributionRequest contribRequest = new GoalContributionRequest(
            BigDecimal.valueOf(4000.00),
            "Poupado décimo terceiro",
            LocalDate.now()
        );
        GoalContributionResponse contribResponse = addContributionUseCase.execute(userId, created.id(), contribRequest);
        assertThat(contribResponse.id()).isNotNull();
        assertThat(contribResponse.amount()).isEqualByComparingTo(BigDecimal.valueOf(4000.00));

        // 4. Detail goal (and verify projection)
        GoalDetailResponse detail = getGoalDetailUseCase.execute(userId, created.id());
        assertThat(detail.goal().currentAmount()).isEqualByComparingTo(BigDecimal.valueOf(5000.00));
        assertThat(detail.contributions()).hasSize(2); // Initial (1000) + New (4000)

        // 5. Complete goal automatically
        GoalContributionRequest finalRequest = new GoalContributionRequest(
            BigDecimal.valueOf(5000.00),
            "Faltante",
            LocalDate.now()
        );
        addContributionUseCase.execute(userId, created.id(), finalRequest);

        GoalDetailResponse completedDetail = getGoalDetailUseCase.execute(userId, created.id());
        assertThat(completedDetail.goal().currentAmount()).isEqualByComparingTo(BigDecimal.valueOf(10000.00));
        assertThat(completedDetail.goal().status()).isEqualTo(GoalStatus.COMPLETED);

        // 6. Delete (archive) goal
        deleteGoalUseCase.execute(userId, created.id());
        GoalDetailResponse archivedDetail = getGoalDetailUseCase.execute(userId, created.id());
        assertThat(archivedDetail.goal().status()).isEqualTo(GoalStatus.ARCHIVED);

        // 7. Unarchive goal
        unarchiveGoalUseCase.execute(userId, created.id());
        GoalDetailResponse activeDetail = getGoalDetailUseCase.execute(userId, created.id());
        assertThat(activeDetail.goal().status()).isEqualTo(GoalStatus.COMPLETED);
    }
}
