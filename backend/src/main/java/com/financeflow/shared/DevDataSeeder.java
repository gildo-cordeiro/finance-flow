package com.financeflow.shared;

import com.financeflow.account.dto.AccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.model.domain.AccountType;
import com.financeflow.account.service.CreateAccountUseCase;
import com.financeflow.auth.dto.RegisterRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.auth.service.RegisterUseCase;
import com.financeflow.budget.dto.UpdateBudgetRequest;
import com.financeflow.budget.service.UpdateBudgetUseCase;
import com.financeflow.goals.dto.CreateGoalRequest;
import com.financeflow.goals.service.CreateGoalUseCase;
import com.financeflow.transaction.dto.CategoryRequest;
import com.financeflow.transaction.dto.TransactionRequest;
import com.financeflow.transaction.model.domain.TransactionStatus;
import com.financeflow.transaction.model.domain.TransactionType;
import com.financeflow.transaction.model.domain.TransactionVisibility;
import com.financeflow.transaction.model.entity.CategoryEntity;
import com.financeflow.transaction.repository.CategoryRepository;
import com.financeflow.transaction.service.CreateCategoryUseCase;
import com.financeflow.transaction.service.CreateTransactionUseCase;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder de dados de desenvolvimento executado exclusivamente com o profile "dev".
 * Totalmente idempotente: caso o usuário de teste já exista, nenhuma ação é executada.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    public static final String DEV_USER_EMAIL = "dev@financeflow.local";
    public static final String DEV_USER_PASSWORD = "password123";

    // UUIDs conhecidos das categorias padrão criadas pela migration Flyway V3
    private static final UUID CAT_SALARIO = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000001");
    private static final UUID CAT_SUPERMERCADO = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000003");
    private static final UUID CAT_RESTAURANTES = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000004");
    private static final UUID CAT_ALUGUEL = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000005");
    private static final UUID CAT_LUZ = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000006");
    private static final UUID CAT_INTERNET = UUID.fromString("b2c2d2e2-0000-0000-0000-000000000007");
    private static final UUID CAT_TRANSPORTE = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000004");
    private static final UUID CAT_LAZER = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000005");
    private static final UUID CAT_SAUDE = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000006");
    private static final UUID CAT_EDUCACAO = UUID.fromString("a1b1c1d1-0000-0000-0000-000000000007");

    private final UserRepository userRepository;
    private final RegisterUseCase registerUseCase;
    private final CreateAccountUseCase createAccountUseCase;
    private final CategoryRepository categoryRepository;
    private final CreateCategoryUseCase createCategoryUseCase;
    private final CreateTransactionUseCase createTransactionUseCase;
    private final UpdateBudgetUseCase updateBudgetUseCase;
    private final CreateGoalUseCase createGoalUseCase;

    public DevDataSeeder(
        UserRepository userRepository,
        RegisterUseCase registerUseCase,
        CreateAccountUseCase createAccountUseCase,
        CategoryRepository categoryRepository,
        CreateCategoryUseCase createCategoryUseCase,
        CreateTransactionUseCase createTransactionUseCase,
        UpdateBudgetUseCase updateBudgetUseCase,
        CreateGoalUseCase createGoalUseCase
    ) {
        this.userRepository = userRepository;
        this.registerUseCase = registerUseCase;
        this.createAccountUseCase = createAccountUseCase;
        this.categoryRepository = categoryRepository;
        this.createCategoryUseCase = createCategoryUseCase;
        this.createTransactionUseCase = createTransactionUseCase;
        this.updateBudgetUseCase = updateBudgetUseCase;
        this.createGoalUseCase = createGoalUseCase;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking if dev data seed is needed...");

        if (userRepository.findByEmail(DEV_USER_EMAIL).isPresent()) {
            log.info("Dev seed user ({}) already exists. Skipping data seeding.", DEV_USER_EMAIL);
            return;
        }

        log.info("Starting dev data seeding for email={}", DEV_USER_EMAIL);
        seedData();
        log.info("Dev data seeding completed successfully.");
    }

    private void seedData() {
        // 1. Criar usuário de teste
        UserResponse user = registerUseCase.execute(new RegisterRequest(
            DEV_USER_EMAIL,
            DEV_USER_PASSWORD,
            "Usuário Desenvolvedor",
            "America/Sao_Paulo",
            "BRL",
            25,
            "dd/MM/yyyy"
        ));
        UUID userId = user.id();

        // 2. Criar 2 contas bancárias
        AccountResponse checkingAccount = createAccountUseCase.execute(userId, new AccountRequest(
            "Nubank Conta Principal",
            AccountType.CHECKING,
            "Nubank",
            new BigDecimal("5450.00"),
            null,
            null,
            null,
            null
        ));

        AccountResponse savingsAccount = createAccountUseCase.execute(userId, new AccountRequest(
            "Itaú Reserva de Emergência",
            AccountType.SAVINGS,
            "Itaú",
            new BigDecimal("18500.00"),
            null,
            null,
            null,
            null
        ));

        // 3. Criar 2 cartões de crédito (com dia de fechamento e vencimento reais)
        AccountResponse nubankCard = createAccountUseCase.execute(userId, new AccountRequest(
            "Nubank Mastercard Platinum",
            AccountType.CREDIT_CARD,
            "Nubank",
            BigDecimal.ZERO,
            new BigDecimal("8000.00"),
            18,
            16,
            checkingAccount.id()
        ));

        AccountResponse itauCard = createAccountUseCase.execute(userId, new AccountRequest(
            "Itaú Uniclass Black",
            AccountType.CREDIT_CARD,
            "Itaú",
            BigDecimal.ZERO,
            new BigDecimal("15000.00"),
            3,
            5,
            savingsAccount.id()
        ));

        // 4. Criar categorias e subcategorias complementares (totalizando cerca de 12+ categorias com subcategorias)
        UUID transporteParentId = resolveCategory(userId, "Transporte", CAT_TRANSPORTE);
        UUID catCombustivel = createOrFindCategory(userId, "Combustível", transporteParentId);
        UUID catUber = createOrFindCategory(userId, "Transporte por Aplicativo", transporteParentId);

        UUID lazerParentId = resolveCategory(userId, "Lazer", CAT_LAZER);
        UUID catStreaming = createOrFindCategory(userId, "Streaming & Assinaturas", lazerParentId);
        UUID catCinema = createOrFindCategory(userId, "Cinema & Passeios", lazerParentId);

        UUID saudeParentId = resolveCategory(userId, "Saúde", CAT_SAUDE);
        UUID catFarmacia = createOrFindCategory(userId, "Farmácia", saudeParentId);
        createOrFindCategory(userId, "Consultas & Exames", saudeParentId);

        UUID educacaoParentId = resolveCategory(userId, "Educação", CAT_EDUCACAO);
        UUID catCursos = createOrFindCategory(userId, "Cursos & Certificações", educacaoParentId);
        UUID catLivros = createOrFindCategory(userId, "Livros & Material", educacaoParentId);

        // Categorias pai personalizadas do usuário
        UUID catCuidadosPessoais = createOrFindCategory(userId, "Cuidados Pessoais", null);
        UUID catAcademia = createOrFindCategory(userId, "Academia", catCuidadosPessoais);
        createOrFindCategory(userId, "Barbearia & Salão", catCuidadosPessoais);

        UUID catRendaExtra = createOrFindCategory(userId, "Outros Rendimentos", null);
        UUID catFreelance = createOrFindCategory(userId, "Freelance", catRendaExtra);
        createOrFindCategory(userId, "Rendimentos Extras", catRendaExtra);

        // 5. Criar cerca de 30 lançamentos distribuídos nos últimos 3 meses (incluindo parcelados e pendentes)
        LocalDate today = LocalDate.now();
        LocalDate m0 = today;
        LocalDate m1 = today.minusMonths(1);
        LocalDate m2 = today.minusMonths(2);

        // --- Mês -2 (2 meses atrás) ---
        seedSingleTransaction(userId, checkingAccount.id(), CAT_SALARIO, "Salário Mensal", new BigDecimal("6500.00"), TransactionType.INCOME, safeDate(m2, 5), safeDate(m2, 5), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_ALUGUEL, "Aluguel Apartamento", new BigDecimal("2200.00"), TransactionType.EXPENSE, safeDate(m2, 10), safeDate(m2, 10), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_LUZ, "Energia Elétrica", new BigDecimal("180.50"), TransactionType.EXPENSE, safeDate(m2, 12), safeDate(m2, 12), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_INTERNET, "Internet Fibra", new BigDecimal("149.90"), TransactionType.EXPENSE, safeDate(m2, 15), safeDate(m2, 15), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), CAT_SUPERMERCADO, "Supermercado Mensal", new BigDecimal("850.00"), TransactionType.EXPENSE, safeDate(m2, 8), safeDate(m2, 8), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catFarmacia, "Farmácia Medicamentos", new BigDecimal("120.00"), TransactionType.EXPENSE, safeDate(m2, 14), safeDate(m2, 14), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), CAT_RESTAURANTES, "Restaurante Rodízio", new BigDecimal("210.00"), TransactionType.EXPENSE, safeDate(m2, 20), safeDate(m2, 20), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catCombustivel, "Posto de Combustível", new BigDecimal("240.00"), TransactionType.EXPENSE, safeDate(m2, 22), safeDate(m2, 22), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), catStreaming, "Netflix & Spotify", new BigDecimal("79.90"), TransactionType.EXPENSE, safeDate(m2, 25), safeDate(m2, 25), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catAcademia, "Mensalidade Academia", new BigDecimal("139.90"), TransactionType.EXPENSE, safeDate(m2, 26), safeDate(m2, 26), TransactionStatus.PAID);

        // --- Mês -1 (1 mês atrás) ---
        seedSingleTransaction(userId, checkingAccount.id(), CAT_SALARIO, "Salário Mensal", new BigDecimal("6500.00"), TransactionType.INCOME, safeDate(m1, 5), safeDate(m1, 5), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), catFreelance, "Projeto Freelance Website", new BigDecimal("1800.00"), TransactionType.INCOME, safeDate(m1, 18), safeDate(m1, 18), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_ALUGUEL, "Aluguel Apartamento", new BigDecimal("2200.00"), TransactionType.EXPENSE, safeDate(m1, 10), safeDate(m1, 10), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_LUZ, "Energia Elétrica", new BigDecimal("195.30"), TransactionType.EXPENSE, safeDate(m1, 12), safeDate(m1, 12), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_INTERNET, "Internet Fibra", new BigDecimal("149.90"), TransactionType.EXPENSE, safeDate(m1, 15), safeDate(m1, 15), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), CAT_SUPERMERCADO, "Supermercado Mensal", new BigDecimal("920.40"), TransactionType.EXPENSE, safeDate(m1, 7), safeDate(m1, 7), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), CAT_RESTAURANTES, "Jantar Italiano", new BigDecimal("185.00"), TransactionType.EXPENSE, safeDate(m1, 16), safeDate(m1, 16), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catCombustivel, "Posto de Combustível", new BigDecimal("250.00"), TransactionType.EXPENSE, safeDate(m1, 21), safeDate(m1, 21), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), catLivros, "Livros Técnicos Arquitetura", new BigDecimal("160.00"), TransactionType.EXPENSE, safeDate(m1, 23), safeDate(m1, 23), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), catStreaming, "Netflix & Spotify", new BigDecimal("79.90"), TransactionType.EXPENSE, safeDate(m1, 25), safeDate(m1, 25), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catAcademia, "Mensalidade Academia", new BigDecimal("139.90"), TransactionType.EXPENSE, safeDate(m1, 26), safeDate(m1, 26), TransactionStatus.PAID);

        // --- Transações Parceladas (3 parcelas cada) ---
        // Monitor Dell em 3x no Nubank Card (iniciado em M-1)
        createTransactionUseCase.execute(userId, new TransactionRequest(
            nubankCard.id(),
            catLivros,
            "Monitor Ultrawide Dell",
            new BigDecimal("2100.00"),
            TransactionType.EXPENSE,
            safeDate(m1, 10).withDayOfMonth(1),
            safeDate(m1, 10),
            safeDate(m1, 10),
            TransactionStatus.PAID,
            TransactionVisibility.PERSONAL,
            3,
            false,
            null
        ));

        // Curso Especialização em 3x no Itaú Card (iniciado em M-2)
        createTransactionUseCase.execute(userId, new TransactionRequest(
            itauCard.id(),
            catCursos,
            "Curso Especialização Cloud",
            new BigDecimal("1050.00"),
            TransactionType.EXPENSE,
            safeDate(m2, 15).withDayOfMonth(1),
            safeDate(m2, 15),
            safeDate(m2, 15),
            TransactionStatus.PAID,
            TransactionVisibility.PERSONAL,
            3,
            false,
            null
        ));

        // --- Mês Atual (M0) ---
        seedSingleTransaction(userId, checkingAccount.id(), CAT_SALARIO, "Salário Mensal", new BigDecimal("6500.00"), TransactionType.INCOME, safeDate(m0, 5), safeDate(m0, 5), TransactionStatus.PAID);
        seedSingleTransaction(userId, checkingAccount.id(), CAT_ALUGUEL, "Aluguel Apartamento", new BigDecimal("2200.00"), TransactionType.EXPENSE, safeDate(m0, 10), safeDate(m0, 10), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), CAT_SUPERMERCADO, "Supermercado Semanal", new BigDecimal("430.20"), TransactionType.EXPENSE, today.minusDays(3), today.minusDays(3), TransactionStatus.PAID);
        seedSingleTransaction(userId, nubankCard.id(), catUber, "Uber Viagens", new BigDecimal("68.50"), TransactionType.EXPENSE, today.minusDays(2), today.minusDays(2), TransactionStatus.PAID);
        seedSingleTransaction(userId, itauCard.id(), catFarmacia, "Farmácia Vitamina C", new BigDecimal("55.00"), TransactionType.EXPENSE, today.minusDays(1), today.minusDays(1), TransactionStatus.PAID);

        // Lançamento PENDENTE vencendo hoje na conta corrente
        createTransactionUseCase.execute(userId, new TransactionRequest(
            checkingAccount.id(),
            CAT_LUZ,
            "Conta de Luz",
            new BigDecimal("185.00"),
            TransactionType.EXPENSE,
            today.withDayOfMonth(1),
            today,
            null,
            TransactionStatus.PENDING,
            TransactionVisibility.PERSONAL
        ));

        // Lançamentos PLANEJADOS para o decorrer do mês
        createTransactionUseCase.execute(userId, new TransactionRequest(
            checkingAccount.id(),
            CAT_INTERNET,
            "Internet Fibra",
            new BigDecimal("149.90"),
            TransactionType.EXPENSE,
            today.withDayOfMonth(1),
            today.plusDays(7),
            null,
            TransactionStatus.PLANNED,
            TransactionVisibility.PERSONAL
        ));

        seedSingleTransaction(userId, itauCard.id(), catStreaming, "Netflix & Spotify", new BigDecimal("79.90"), TransactionType.EXPENSE, today.plusDays(12), null, TransactionStatus.PLANNED);
        seedSingleTransaction(userId, nubankCard.id(), catAcademia, "Mensalidade Academia", new BigDecimal("139.90"), TransactionType.EXPENSE, today.plusDays(14), null, TransactionStatus.PLANNED);

        // 6. Criar 1 orçamento com limites por categoria para o mês atual
        String currentMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        updateBudgetUseCase.execute(userId, currentMonth, CAT_SUPERMERCADO, new UpdateBudgetRequest(new BigDecimal("1500.00")));
        updateBudgetUseCase.execute(userId, currentMonth, CAT_RESTAURANTES, new UpdateBudgetRequest(new BigDecimal("500.00")));
        updateBudgetUseCase.execute(userId, currentMonth, CAT_ALUGUEL, new UpdateBudgetRequest(new BigDecimal("2200.00")));
        updateBudgetUseCase.execute(userId, currentMonth, CAT_LUZ, new UpdateBudgetRequest(new BigDecimal("250.00")));
        updateBudgetUseCase.execute(userId, currentMonth, CAT_INTERNET, new UpdateBudgetRequest(new BigDecimal("160.00")));
        updateBudgetUseCase.execute(userId, currentMonth, catCombustivel, new UpdateBudgetRequest(new BigDecimal("400.00")));
        updateBudgetUseCase.execute(userId, currentMonth, catStreaming, new UpdateBudgetRequest(new BigDecimal("100.00")));
        updateBudgetUseCase.execute(userId, currentMonth, catFarmacia, new UpdateBudgetRequest(new BigDecimal("200.00")));
        updateBudgetUseCase.execute(userId, currentMonth, catAcademia, new UpdateBudgetRequest(new BigDecimal("150.00")));
        updateBudgetUseCase.execute(userId, currentMonth, catCursos, new UpdateBudgetRequest(new BigDecimal("400.00")));

        // 7. Criar 3 metas (sendo uma com prazo vencido)
        createGoalUseCase.execute(userId, new CreateGoalRequest(
            "Reserva de Emergência",
            "6 meses de despesas fixas em CDB de liquidez diária",
            new BigDecimal("25000.00"),
            today.plusMonths(12),
            false,
            new BigDecimal("12000.00")
        ));

        createGoalUseCase.execute(userId, new CreateGoalRequest(
            "Viagem para Buenos Aires",
            "Passagens, hospedagem e passeios nas férias",
            new BigDecimal("8000.00"),
            today.plusMonths(6),
            false,
            new BigDecimal("3500.00")
        ));

        createGoalUseCase.execute(userId, new CreateGoalRequest(
            "Upgrade de Setup",
            "Novo monitor ultrawide e periféricos para home office",
            new BigDecimal("4500.00"),
            today.minusDays(15), // Prazo vencido
            false,
            new BigDecimal("1800.00")
        ));
    }

    private void seedSingleTransaction(
        UUID userId,
        UUID accountId,
        UUID categoryId,
        String description,
        BigDecimal amount,
        TransactionType type,
        LocalDate dueDate,
        LocalDate paymentDate,
        TransactionStatus status
    ) {
        createTransactionUseCase.execute(userId, new TransactionRequest(
            accountId,
            categoryId,
            description,
            amount,
            type,
            dueDate.withDayOfMonth(1),
            dueDate,
            paymentDate,
            status,
            TransactionVisibility.PERSONAL
        ));
    }

    private UUID resolveCategory(UUID userId, String name, UUID defaultId) {
        return categoryRepository.findAllByUserId(userId).stream()
            .filter(c -> c.getName().equalsIgnoreCase(name))
            .findFirst()
            .map(CategoryEntity::getId)
            .orElse(defaultId);
    }

    private UUID createOrFindCategory(UUID userId, String name, UUID parentId) {
        return categoryRepository.findAllByUserId(userId).stream()
            .filter(c -> c.getName().equalsIgnoreCase(name) && Objects.equals(c.getParentId(), parentId))
            .findFirst()
            .map(CategoryEntity::getId)
            .orElseGet(() -> createCategoryUseCase.execute(userId, new CategoryRequest(name, parentId)).id());
    }

    private LocalDate safeDate(LocalDate monthRef, int day) {
        int maxDay = monthRef.lengthOfMonth();
        return LocalDate.of(monthRef.getYear(), monthRef.getMonthValue(), Math.min(day, maxDay));
    }
}
