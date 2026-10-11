package com.financeflow.shared;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.budget.repository.BudgetRepository;
import com.financeflow.goals.model.domain.Goal;
import com.financeflow.goals.repository.GoalRepository;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.model.entity.TransactionEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.repository.TransactionRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
@ActiveProfiles("dev")
class DevDataSeederIntegrationTest {

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
    private DevDataSeeder devDataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Test
    void shouldSeedAllDataSuccessfullyOnStartup() {
        // 1. Validar usuário de teste
        Optional<UserEntity> userOpt = userRepository.findByEmail(DevDataSeeder.DEV_USER_EMAIL);
        assertThat(userOpt).isPresent();
        UUID userId = userOpt.get().getId();

        // 2. Validar contas e cartões (2 contas e 2 cartões)
        List<AccountEntity> accounts = accountRepository.findAllByUserId(userId);
        assertThat(accounts).hasSize(4);

        List<AccountEntity> bankAccounts = accounts.stream()
            .filter(a -> a.getType() == AccountType.CHECKING || a.getType() == AccountType.SAVINGS)
            .toList();
        assertThat(bankAccounts).hasSize(2);

        List<AccountEntity> creditCards = accounts.stream()
            .filter(a -> a.getType() == AccountType.CREDIT_CARD)
            .toList();
        assertThat(creditCards).hasSize(2);
        assertThat(creditCards).allMatch(c -> c.getClosingDay() != null && c.getDueDay() != null);

        // 3. Validar categorias (categorias do sistema + criadas para o usuário)
        List<CategoryEntity> allCategories = categoryRepository.findAllByUserId(userId);
        assertThat(allCategories.size()).isGreaterThanOrEqualTo(12);

        // 4. Validar transações (cerca de 30 lançamentos, incluindo parcelados e pendentes)
        List<TransactionEntity> transactions = transactionRepository.findAllFiltered(userId, null, null, null, null);
        assertThat(transactions.size()).isGreaterThanOrEqualTo(30);

        boolean hasInstallments = transactions.stream()
            .anyMatch(t -> t.getTotalInstallments() != null && t.getTotalInstallments() > 1);
        assertThat(hasInstallments).isTrue();

        boolean hasPending = transactions.stream()
            .anyMatch(t -> t.getStatus() == TransactionStatus.PENDING);
        assertThat(hasPending).isTrue();

        // 5. Validar orçamento para o mês corrente
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        List<?> budgetItems = budgetRepository.findAllByUserIdAndMonth(userId, currentMonth);
        assertThat(budgetItems).isNotEmpty();

        // 6. Validar metas (3 metas, sendo uma com prazo vencido)
        List<Goal> goals = goalRepository.findAllByUserId(userId);
        assertThat(goals).hasSize(3);

        boolean hasOverdueGoal = goals.stream()
            .anyMatch(g -> g.deadline().isBefore(LocalDate.now()));
        assertThat(hasOverdueGoal).isTrue();
    }

    @Test
    void shouldBeIdempotentWhenRunAgain() {
        Optional<UserEntity> userOpt = userRepository.findByEmail(DevDataSeeder.DEV_USER_EMAIL);
        assertThat(userOpt).isPresent();
        UUID userId = userOpt.get().getId();

        int initialAccounts = accountRepository.findAllByUserId(userId).size();
        int initialTransactions = transactionRepository.findAllFiltered(userId, null, null, null, null).size();
        int initialGoals = goalRepository.findAllByUserId(userId).size();

        // Executar o seeder novamente
        assertThatCode(() -> devDataSeeder.run())
            .doesNotThrowAnyException();

        // Quantidades devem permanecer idênticas
        assertThat(accountRepository.findAllByUserId(userId)).hasSize(initialAccounts);
        assertThat(transactionRepository.findAllFiltered(userId, null, null, null, null)).hasSize(initialTransactions);
        assertThat(goalRepository.findAllByUserId(userId)).hasSize(initialGoals);
    }
}
