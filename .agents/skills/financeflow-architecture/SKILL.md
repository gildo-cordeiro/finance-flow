---
name: financeflow-architecture
description: >
  Stack tecnológica, arquitetura de monólito modular, estrutura de pacotes canônica, boas práticas de codificação
  (Clean Code, exceções, testes) e segurança no FinanceFlow.
  Use esta skill SEMPRE que o código envolver decisões de arquitetura, estrutura de pacotes, configuração de segurança,
  Flyway, Redis, JWT, ou quando houver dúvida sobre "onde esse código deve viver?" ou "como organizar esse módulo?".
  Acione também para perguntas sobre o monólito modular, desacoplamento entre módulos, eventos de domínio ou padrões
  de comunicação interna.
---

# Arquitetura e Boas Práticas (FinanceFlow Architecture & Standards)

Esta skill especifica a stack tecnológica, a estrutura de pacotes canônica, requisitos de segurança e diretrizes de
codificação do FinanceFlow.

## 1. Stack Tecnológica

### Backend (Java 21 + Spring Boot 3)

| Camada | Tecnologia | Notas |
|---|---|---|
| Linguagem | Java 21 | Records, sealed classes, pattern matching |
| Framework | Spring Boot 3 | **Sem Lombok** — zero exceções |
| Segurança | Spring Security 6 + JWT | Stateless, refresh token rotation (RTR) |
| Persistência | Spring Data JPA + Hibernate | PostgreSQL via Supabase |
| Migrations | Flyway | Imutáveis após deploy |
| Cache | Redis | Upstash (serverless Redis) |

### Frontend (React 18 + Vite + TypeScript)

| Camada | Tecnologia | Notas |
|---|---|---|
| Framework | React 18 + Vite | SPA, TypeScript strict |
| Estilização | **Tailwind CSS v3.4.x** | **Travado em `^3.4.17` — NÃO atualizar para v4** |
| Estado de servidor | TanStack Query (React Query) | Cache, otimistic updates |
| Roteamento | React Router v6 | Rotas privadas/protegidas |
| Gráficos | Recharts | Fluxo de caixa e orçamentos |
| Datas | date-fns | Tree-shakeable, lógica de ciclos/competências |

## 2. Estrutura de Pacotes Canônica (Package by Feature)

Esta é a **única** estrutura de pacotes autorizada. Toda nova feature deve seguir este layout.

### Backend — `com.financeflow.<modulo>/`

```
com.financeflow/
├── auth/
│   ├── controller/         # @RestController — só orquestra HTTP
│   ├── dto/                # Records de Request e Response
│   ├── service/            # Lógica de negócio e use cases
│   ├── repository/         # Interface de domínio (sem anotações de framework)
│   │   └── jpa/            # Implementação JPA + Spring Data interface
│   └── model/
│       ├── domain/         # Java Records imutáveis — modelo de negócio puro
│       ├── entity/         # Classes @Entity — mapeamento JPA
│       └── mapper/         # Métodos estáticos de conversão domain ↔ entity
│
├── account/                # Contas bancárias e cartões de crédito
├── transaction/            # Transações e lançamentos
├── budget/                 # Planejamento e orçamentos
├── cashflow/               # Fluxo de caixa e projeções
├── couple/                 # Gestão de casal
├── goals/                  # Metas financeiras
├── travel/                 # Planejamento de viagens
└── shared/                 # Utilitários globais, exception handler, configs
    ├── exception/          # DomainException, NotFoundException, BusinessException
    ├── handler/            # GlobalExceptionHandler (@RestControllerAdvice)
    └── security/           # JWT filter, SecurityConfig
```

### Frontend — `src/`

```
src/
├── components/             # Componentes globais reutilizáveis (Button, Input, Modal)
├── features/               # Módulos por domínio
│   ├── auth/
│   ├── transactions/
│   │   ├── components/     # Componentes exclusivos da feature
│   │   ├── hooks/          # Hooks do React Query (useTransactions, useCreateTransaction)
│   │   └── api/            # Funções de chamada HTTP exclusivas
│   ├── budget/
│   ├── cashflow/
│   └── couple/
├── routes/                 # Definição e proteção de rotas
├── lib/                    # Helpers: cn.ts (clsx + tailwind-merge)
└── utils/                  # Funções puras utilitárias (date-fns helpers)
```

## 3. Separação domain / entity / mapper

**Regra central para eliminar boilerplate sem Lombok:**

```java
// model/domain/Transaction.java — Java Record: imutável, sem boilerplate
public record Transaction(
    UUID id,
    UUID userId,
    BigDecimal amount,
    LocalDate competenceDate,
    LocalDate dueDate,
    LocalDate paymentDate,
    TransactionStatus status,
    Visibility visibility
) {}

// model/entity/TransactionEntity.java — @Entity: mapeamento JPA
@Entity
@Table(name = "transactions")
public class TransactionEntity {
    @Id private UUID id;
    @Column(name = "user_id") private UUID userId;
    private BigDecimal amount;
    @Column(name = "competence_date") private LocalDate competenceDate;
    // ... demais campos com getters manuais + builder
}

// model/mapper/TransactionMapper.java — conversão estática
public final class TransactionMapper {
    private TransactionMapper() {}

    public static Transaction toDomain(TransactionEntity e) {
        return new Transaction(e.getId(), e.getUserId(), e.getAmount(),
            e.getCompetenceDate(), e.getDueDate(), e.getPaymentDate(),
            e.getStatus(), e.getVisibility());
    }

    public static TransactionEntity toEntity(Transaction d) {
        return TransactionEntity.builder()
            .id(d.id()).userId(d.userId()).amount(d.amount())
            .competenceDate(d.competenceDate()).dueDate(d.dueDate())
            .paymentDate(d.paymentDate()).status(d.status())
            .visibility(d.visibility()).build();
    }
}
```

## 4. Comunicação entre Módulos (Desacoplamento)

**Nunca** acesse diretamente o repositório de outro módulo. Use uma dessas estratégias:

| Cenário | Estratégia |
|---|---|
| Lógica síncrona necessária de outro módulo | Interface pública de `Service` exposta pelo módulo alvo |
| Reação a ação de negócio (recalcular orçamento após nova transação) | `ApplicationEventPublisher` → evento de domínio |
| Integração com sistema externo (Open Finance) | Adapter na camada `shared/` ou no próprio módulo |

```java
// Exemplo: TransactionService publica evento após criar transação
@Service
@Transactional
public class TransactionService {

    private final ApplicationEventPublisher eventPublisher;

    public TransactionResponse create(UUID userId, CreateTransactionRequest request) {
        // ... persiste transação
        eventPublisher.publishEvent(new TransactionCreatedEvent(saved.id(), saved.competenceDate()));
        return toResponse(saved);
    }
}

// BudgetModule ouve o evento sem acoplamento direto
@Component
public class BudgetCompetenceListener {

    @EventListener
    public void onTransactionCreated(TransactionCreatedEvent event) {
        budgetService.recalculate(event.userId(), event.competenceMonth());
    }
}
```

## 5. Segurança

### JWT + Refresh Token Rotation

- **Access Token**: JWT, expiração 15 min, contém `userId` e roles.
- **Refresh Token**: UUID opaco, 30 dias, persistido no banco com suporte a revogação.
- **Rotação (RTR)**: a cada refresh, o token antigo é revogado e um novo par é emitido.
- **Detecção de reuso**: se token já revogado for usado, revogar TODOS os tokens ativos do usuário (indício de roubo).

### Outras Regras de Segurança

- BCrypt com fator de custo `12` para hash de senhas.
- Dados bancários e tokens Open Finance: criptografados em repouso com **AES-256** via `@Convert` do JPA.
- Logs: NUNCA inclua CPF, e-mail, senha ou tokens em logs (`log.info("user={}", userId)` — só o ID).
- SQL: sempre Prepared Statements / JPA — nunca concatenação de String em queries.
- Properties secretas: apenas via variáveis de ambiente ou secrets manager — nunca hardcoded.

## 6. Migrations Flyway

```
src/main/resources/db/migration/
├── V1__init_auth_schema.sql
├── V2__create_transactions_table.sql
├── V3__create_budget_table.sql
└── V4__create_couples_table.sql
```

**Regras:**
1. Arquivos são **imutáveis** após deploy — nunca edite um arquivo existente.
2. Correções devem ser novos arquivos (`V5__fix_transactions_index.sql`).
3. Use `IF NOT EXISTS` para tornar scripts robustos.
4. Views e procedures reutilizáveis: prefixo `R__` (repetível).

## 7. Cache Redis (Upstash)

```java
// Habilitar no config
@EnableCaching
@Configuration
public class CacheConfig { ... }

// Usar na camada de serviço — NUNCA no controller ou repository
@Cacheable(value = "cashflow", key = "#userId + '-' + #month")
public CashFlowResponse getMonthlyCashFlow(UUID userId, String month) { ... }

@CacheEvict(value = "cashflow", key = "#userId + '-' + #month")
public void invalidateAfterTransaction(UUID userId, String month) { ... }
```

**Regras:**
- TTL explícito sempre — nunca cache sem expiração definida.
- Invalide proativamente no `@EventListener` de criação/atualização de transação.
- Cache apenas de dados que mudam pouco (orçamento de mês anterior, perfil de usuário).

## 8. Endpoints da API REST

Base: `/api/v1` — todos exigem `Authorization: Bearer <access_token>`, exceto auth.

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Cadastro |
| `POST` | `/api/v1/auth/login` | Login (retorna access + refresh token) |
| `POST` | `/api/v1/auth/refresh` | Troca refresh token por novo par |
| `GET` | `/api/v1/accounts` | Contas bancárias e cartões |
| `GET` | `/api/v1/transactions` | Listagem paginada de transações |
| `POST` | `/api/v1/transactions` | Criar transação |
| `PATCH` | `/api/v1/transactions/{id}` | Atualizar transação |
| `GET` | `/api/v1/budget/{year}/{month}` | Orçamento mensal |
| `GET` | `/api/v1/cashflow` | Fluxo de caixa parametrizado |
| `POST` | `/api/v1/couple/invite` | Convidar parceiro |
| `POST` | `/api/v1/couple/accept/{coupleId}` | Aceitar convite |
| `GET` | `/api/v1/goals` | Listar metas |
| `GET` | `/api/v1/travels` | Listar viagens |

## 9. Padrões Proibidos (Anti-patterns)

| ❌ Proibido | ✅ Correto |
|---|---|
| Qualquer anotação Lombok | Records para DTOs, builder manual para entidades |
| `@Autowired` em campo | Injeção por construtor sempre |
| `@Transactional` no Controller | `@Transactional` apenas no Service |
| Lógica de negócio no Controller | Controller só orquestra HTTP e delega ao Service |
| Acesso direto ao repositório de outro módulo | Interface de Service pública ou ApplicationEvent |
| Tailwind v4 | Travado em `^3.4.17` — problemas de compilação com Node |
| `any` no TypeScript | `unknown` com type guard, ou tipo explícito |
| Secrets no código | Variáveis de ambiente / secrets manager |
