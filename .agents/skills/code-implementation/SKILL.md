---
name: code-implementation
description: >
  Guia completo e detalhado para implementar código de forma profissional e sustentável no FinanceFlow.
  Use esta skill SEMPRE que o usuário pedir para escrever, criar, refatorar, revisar ou implementar qualquer trecho
  de código — desde um simples script até sistemas complexos. Cobre a stack oficial do FinanceFlow:
  (1) Java 21 + Spring Boot 4 no back-end (SEM Lombok), com Spring Security + JWT com rotação de refresh token,
  PostgreSQL (Supabase), Flyway para migrations e Redis (Upstash) para cache;
  (2) React 18 + Vite + TypeScript no front-end com Tailwind CSS v3 (travado em ^3.4.17 — NÃO atualizar para v4),
  React Query (TanStack Query), React Router v6, Recharts e date-fns.
  Acione também quando o usuário mencionar "boas práticas", "código limpo", "refatorar", "como implementar",
  "estrutura de projeto", "padrões de projeto", "componente React", "endpoint Spring", "controller", "service",
  "repository", "hook", "tailwind", "use case", "mapper", "entity", "domain" etc.
---

# Skill: Code Implementation

Guia de referência para produzir código de alta qualidade, legível, testável e sustentável no FinanceFlow.

## Stack Tecnológica

### Backend (API REST)
- **Linguagem & Framework:** Java 21 + Spring Boot 4 — **sem Lombok, zero exceções**
- **Segurança:** Spring Security 6 + JWT (stateless) com rotação de refresh token (RTR)
- **Persistência:** PostgreSQL (Supabase) + Spring Data JPA / Hibernate
- **Migrations:** Flyway (arquivos imutáveis após deploy)
- **Cache:** Redis (Upstash) com TTL explícito

### Frontend (SPA)
- **Framework UI:** React 18 + Vite + TypeScript (strict mode)
- **Estilização:** Tailwind CSS v3.4.x — travado em `^3.4.17` (**NÃO atualizar para v4**)
- **Estado & Cache:** TanStack Query (React Query)
- **Roteamento:** React Router v6 (com proteção de rotas privadas)
- **Gráficos:** Recharts
- **Datas:** `date-fns` (lógica de ciclos e competências)

---

## 1. Fluxo de Implementação (sempre seguir esta ordem)

```
ENTENDER → PLANEJAR → ESTRUTURAR → IMPLEMENTAR → VALIDAR → DOCUMENTAR
```

### 1.1 Entender
- Clarificar **o que** o código deve fazer (comportamento externo, não implementação interna)
- Identificar **entradas, saídas e invariantes**
- Levantar **edge cases** antes de escrever uma linha
- Confirmar **contexto técnico**: linguagem, framework, restrições de performance

### 1.2 Planejar
- Esboçar a solução em pseudocódigo ou comentários antes de codificar
- Identificar **dependências externas** necessárias
- Pensar nos **pontos de falha** e como tratá-los
- Escolher o **padrão de design** adequado (ver `references/design-patterns.md`)

### 1.3 Estruturar
- Definir a estrutura de arquivos/pacotes antes de implementar
- Separar responsabilidades (SRP)
- Decidir interfaces/contratos antes das implementações

### 1.4 Implementar
- Seguir as convenções da linguagem (ver seção 3)
- Escrever em pequenos incrementos verificáveis
- Não otimizar prematuramente — clareza primeiro

### 1.5 Validar
- Cobrir os edge cases identificados no passo 1.1
- Escrever ao menos um teste por comportamento público
- Revisar contra o checklist de qualidade (seção 8)

### 1.6 Documentar
- Comentar **por quê**, não **o quê**
- Manter README/docstring atualizados

---

## 2. Princípios Fundamentais

### SOLID aplicado na prática

| Princípio | Sinal de violação | Correção |
|---|---|---|
| **S** — Single Responsibility | Classe/função faz mais de uma coisa | Extrair responsabilidade |
| **O** — Open/Closed | Mudança de comportamento requer modificar código existente | Usar polimorfismo/strategy |
| **L** — Liskov Substitution | Subclasse quebra contrato da superclasse | Rever herança → usar composição |
| **I** — Interface Segregation | Interface com métodos que cliente não usa | Quebrar em interfaces menores |
| **D** — Dependency Inversion | Código depende de implementações concretas | Depender de abstrações/interfaces |

### Outros princípios críticos

- **DRY** — duplicação é dívida técnica; extraia lógica repetida
- **YAGNI** — não implemente o que não foi pedido agora
- **KISS** — prefira a solução mais simples que funcione
- **Fail Fast** — valide entradas cedo, lance exceções específicas, nunca engula erros silenciosamente
- **Código deve ser lido como prosa** — nomes revelam intenção, estrutura guia o leitor

---

## 3. Convenções por Stack

> Para regras detalhadas e exemplos extensos, consulte os arquivos de referência:
> - Back-end: `references/java-spring.md`
> - Front-end: `references/typescript-react-tailwind.md`

### 3.1 Java 21 + Spring Boot 4 (sem Lombok)

**Regra absoluta: ZERO Lombok.** Use Records para DTOs e builders manuais para entidades JPA.

```java
// ✅ BOM: Record para DTO imutável (Java 16+)
public record CreateTransactionRequest(
    @NotNull UUID accountId,
    @NotNull @Positive BigDecimal amount,
    @NotBlank String description,
    @NotNull LocalDate competenceDate
) {}

// ✅ BOM: Entidade com builder manual — sem Lombok
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    protected TransactionEntity() {} // JPA exige

    private TransactionEntity(Builder b) {
        this.userId = b.userId;
        this.amount = b.amount;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public BigDecimal getAmount() { return amount; }

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private UUID userId;
        private BigDecimal amount;

        public Builder userId(UUID v) { this.userId = v; return this; }
        public Builder amount(BigDecimal v) { this.amount = v; return this; }
        public TransactionEntity build() {
            Objects.requireNonNull(userId, "userId is required");
            Objects.requireNonNull(amount, "amount is required");
            return new TransactionEntity(this);
        }
    }
}

// ❌ PROIBIDO: qualquer anotação Lombok
// @Data, @Builder, @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor — NUNCA
```

**Estrutura de pacotes por Feature (canônica do FinanceFlow):**
```
com.financeflow.<modulo>/
├── controller/         # @RestController e endpoints REST
├── dto/                # Records de Request e Response
├── service/            # Use cases / lógica de negócio
├── repository/         # Interface de domínio (sem anotações de framework)
│   └── jpa/            # Implementação JPA + Spring Data interface
└── model/
    ├── domain/         # Java Records imutáveis — modelo de negócio puro
    ├── entity/         # Classes @Entity — mapeamento JPA
    └── mapper/         # Métodos estáticos de conversão domain ↔ entity
```

**Regras essenciais Spring:**
- `@Service`, `@Repository`, `@RestController` — injeção **sempre por construtor**, nunca `@Autowired` em campo
- `@Transactional` apenas na camada de **serviço**, nunca no controller ou repository
- `@RestControllerAdvice` para tratamento centralizado de exceções
- `@Validated` + Bean Validation (`@NotBlank`, `@NotNull`, `@Positive`) nos DTOs de entrada
- `ResponseEntity<T>` com status HTTP semântico em todos os controllers
- Um use case = uma classe = um método público `execute()`

### 3.2 TypeScript + React + Tailwind

```tsx
// ✅ BOM: Props tipadas, componente puro, Tailwind Dark Premium
interface TransactionCardProps {
  description: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PLANNED';
  onEdit?: () => void;
}

export function TransactionCard({ description, amount, status, onEdit }: TransactionCardProps) {
  return (
    <div className="glassmorphism rounded-2xl p-4 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{description}</h3>
          <p className="text-xs text-zinc-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
          </p>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium border',
          status === 'PAID'    && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          status === 'PENDING' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          status === 'OVERDUE' && 'bg-red-500/10 text-red-400 border-red-500/20',
          status === 'PLANNED' && 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
        )}>
          {status}
        </span>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="mt-3.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          Editar
        </button>
      )}
    </div>
  );
}

// ❌ RUIM: any, inline style, props sem tipo
function Card(props: any) {
  return <div style={{padding: 16}}>{props.description}</div>;
}
```

**Regras essenciais React/TS:**
- **Tailwind CSS v3.4.x** — arquivos `tailwind.config.js` e `postcss.config.js` tradicionais. **Não atualizar para v4.**
- **Tema Visual Dark Premium obrigatório**: containers com `.glassmorphism` ou `.auth-card`, gradientes `.gradient-bg`, fundos `bg-zinc-900/60`, bordas `border-zinc-800`, textos `text-zinc-100`/`text-zinc-400`, destaques `violet-600`
- **Nunca use `any`** — prefira `unknown` com type guard
- Componentes: arquivos `.tsx`, exportação nomeada, props sempre tipadas via `interface`
- Um componente por arquivo; nome do arquivo = nome do componente (`TransactionCard.tsx`)
- Hooks customizados em `hooks/use*.ts`; lógica de dados **fora** de componentes visuais
- Use `cn()` (clsx + tailwind-merge) para classes condicionais
- Proibido `!important` e `style={{}}` inline — Tailwind resolve tudo

---

## 4. Estrutura de Projeto

### Back-end (Java 21 + Spring Boot 4)

```
src/main/java/com/financeflow/
├── auth/
│   ├── controller/
│   ├── dto/
│   ├── service/
│   ├── repository/
│   │   └── jpa/
│   └── model/
│       ├── domain/
│       ├── entity/
│       └── mapper/
├── transaction/            # mesma estrutura
├── budget/                 # mesma estrutura
├── cashflow/               # mesma estrutura
├── account/                # mesma estrutura
├── couple/                 # mesma estrutura
├── goals/                  # mesma estrutura
├── travel/                 # mesma estrutura
└── shared/
    ├── exception/          # DomainException, NotFoundException, BusinessException
    ├── handler/            # GlobalExceptionHandler (@RestControllerAdvice)
    └── security/           # JwtAuthFilter, SecurityConfig, JwtService
```

### Front-end (TypeScript + React)

```
src/
├── components/             # Componentes globais reutilizáveis (Button, Input, Modal)
├── features/               # Módulos por domínio
│   ├── auth/
│   ├── transactions/
│   │   ├── components/
│   │   ├── hooks/          # useTransactions.ts, useCreateTransaction.ts
│   │   └── api/            # transactionApi.ts
│   ├── budget/
│   ├── cashflow/
│   └── couple/
├── routes/                 # Rotas privadas/protegidas
├── lib/
│   └── cn.ts               # clsx + tailwind-merge
└── utils/                  # Funções puras (date-fns helpers, formatters)
```

### Regras de dependência

```
Back-end:  shared ← [qualquer módulo]
           Um módulo nunca importa outro módulo diretamente — usa eventos ou interfaces públicas

Front-end: api ← hooks ← components ← features ← routes
```

---

## 5. Tratamento de Erros

### Back-end (Java 21 + Spring Boot 4)

```java
// 1. Exceções de domínio (em shared/exception/)
public class DomainException extends RuntimeException {
    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }
}

public class NotFoundException extends DomainException {
    public NotFoundException(String entity, Object id) {
        super("NOT_FOUND", entity + " not found: " + id);
    }
}

public class BusinessException extends DomainException {
    public BusinessException(String code, String message) {
        super(code, message);
    }
}

public class ForbiddenException extends DomainException {
    public ForbiddenException(String message) {
        super("FORBIDDEN", message);
    }
}

// 2. Handler centralizado (em shared/handler/)
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse("VALIDATION_ERROR", "Validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}

// 3. Response record
public record ErrorResponse(String code, String message, List<FieldError> errors) {
    public ErrorResponse(String code, String message) { this(code, message, List.of()); }
    public record FieldError(String field, String message) {}
}
```

### Front-end (TypeScript + React)

```typescript
interface ApiError {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
}

// Hook de mutação com React Query
function useCreateTransaction() {
  return useMutation<TransactionResponse, ApiError, CreateTransactionRequest>({
    mutationFn: (data) => transactionApi.create(data),
    onError: (error) => {
      // Tratar erro de validação separado de erro de API
      if (error.code === 'VALIDATION_ERROR') {
        toast.error('Verifique os campos e tente novamente');
      } else {
        toast.error(error.message ?? 'Erro inesperado');
      }
    },
  });
}
```

### Regras de ouro para erros

1. **Back:** nunca exponha stack trace, mensagem de SQL ou path interno na resposta HTTP
2. **Back:** log com contexto no ponto de origem — nunca relogue na cadeia de chamada
3. **Front:** nunca `catch` silencioso — sempre trate ou propague com contexto
4. **Front:** erros de validação de formulário são distintos de erros de API — trate separado
5. **Ambos:** erros de programação (NPE, ClassCast) → deixe subir para o handler global

---

## 6. Testes

### Pirâmide de testes

```
        /\
       /E2E\        ← poucos (Testcontainers + MockMvc / Playwright)
      /------\
     /Integração\   ← moderados (@DataJpaTest, @WebMvcTest)
    /------------\
   / Unit Tests   \ ← muitos, rápidos, sem Spring context
  /______________\
```

### Back-end (JUnit 5 + Mockito — sem Lombok nos testes também)

```java
// Teste de use case: sem Spring, sem banco
class CreateTransactionUseCaseTest {

    private TransactionRepository transactionRepository;
    private CreateTransactionUseCase useCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        useCase = new CreateTransactionUseCase(transactionRepository);
    }

    @Test
    void shouldCreateTransactionSuccessfully() {
        UUID userId = UUID.randomUUID();
        CreateTransactionRequest request = new CreateTransactionRequest(
            UUID.randomUUID(), new BigDecimal("150.00"), "Mercado", LocalDate.now()
        );
        given(transactionRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        TransactionResponse result = useCase.execute(userId, request);

        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("150.00"));
        verify(transactionRepository).save(any());
    }

    @Test
    void shouldThrowValidationExceptionWhenAmountIsNegative() {
        CreateTransactionRequest request = new CreateTransactionRequest(
            UUID.randomUUID(), new BigDecimal("-1.00"), "Inválido", LocalDate.now()
        );
        assertThatThrownBy(() -> useCase.execute(UUID.randomUUID(), request))
            .isInstanceOf(ValidationException.class);
    }
}

// Teste de controller: sem banco, Spring slice
@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private CreateTransactionUseCase createTransactionUseCase;

    @Test
    void shouldReturn201WhenTransactionIsCreated() throws Exception {
        UUID txId = UUID.randomUUID();
        given(createTransactionUseCase.execute(any(), any()))
            .willReturn(new TransactionResponse(txId, new BigDecimal("150.00"), "Mercado"));

        mockMvc.perform(post("/api/v1/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new CreateTransactionRequest(UUID.randomUUID(), new BigDecimal("150.00"), "Mercado", LocalDate.now())
                )))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.id").value(txId.toString()));
    }

    @Test
    void shouldReturn422WhenAmountIsNull() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\": null, \"description\": \"X\"}"))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
```

### Front-end (Vitest + Testing Library)

```tsx
describe('TransactionCard', () => {
  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<TransactionCard description="Mercado" amount={150} status="PAID" onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('should not render edit button when onEdit is not provided', () => {
    render(<TransactionCard description="Mercado" amount={150} status="PLANNED" />);
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });
});

// Teste de hook com servidor mockado (MSW)
it('should return error state when API returns 422', async () => {
  server.use(http.post('/api/v1/transactions', () =>
    HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Validation failed' }, { status: 422 })
  ));

  const { result } = renderHook(() => useCreateTransaction(), { wrapper: QueryClientWrapper });
  await act(() => result.current.mutate({ amount: -1, description: '' }));

  expect(result.current.error?.code).toBe('VALIDATION_ERROR');
});
```

### Regras de teste

- Nome: **`should [comportamento] when [condição]`**
- **Não teste implementação** — teste comportamento observável
- Mocks só na fronteira (repositórios, APIs externas) — nunca mock de domínio puro
- Back: prefira `@WebMvcTest` / `@DataJpaTest` a `@SpringBootTest` — mais rápido
- Front: prefira `userEvent` a `fireEvent` — simula comportamento real do usuário
- Testes devem ser determinísticos e independentes de ordem de execução
- Cobertura mínima: **70% no backend**

---

## 7. Performance e Segurança

### Performance

- **Não otimize antes de medir** — use profiler, não intuição
- Identifique o gargalo real: I/O? CPU? Memória? Lock contention?
- Prefira operações em batch para DB (evite N+1 — use `FETCH JOIN` ou `@EntityGraph`)
- Use índices corretos no banco; analise query plan antes de ir para produção
- Cache Redis com TTL explícito e invalidação proativa — nunca cache sem estratégia de eviction

### Segurança

- **Nunca** hardcode credenciais, tokens ou secrets — use variáveis de ambiente
- Valide e sanitize toda entrada externa antes de usar
- SQL: sempre use JPA / Prepared Statements — nunca concatenação de string
- Logs: nunca logue PII (CPF, e-mail, telefone, senha) sem mascaramento
- Dependências: audite regularmente (`./gradlew dependencyCheckAnalyze`)

---

## 8. Code Review Checklist

Use antes de finalizar qualquer implementação:

```
CORRETUDE
[ ] Cobre todos os edge cases identificados?
[ ] Erros são tratados (não engolidos)?
[ ] Entradas externas são validadas com Bean Validation ou type guard?
[ ] Não há race conditions (se concorrente)?
[ ] Queries filtram por userId para evitar acesso cruzado?

LEGIBILIDADE
[ ] Nomes revelam intenção?
[ ] Funções têm < 20 linhas (regra geral)?
[ ] Sem comentários que explicam "o quê" (só "por quê")?
[ ] Sem código morto ou TODOs sem ticket?

DESIGN
[ ] SRP respeitado?
[ ] Estrutura de pacotes segue o padrão canônico (domain/entity/mapper)?
[ ] Módulos não se acoplam diretamente — usam eventos ou interfaces públicas?
[ ] Interfaces/contratos definidos antes das implementações?

TESTES
[ ] Todo comportamento público tem ao menos um teste?
[ ] Testes são independentes e sem ordem de execução?
[ ] Sem lógica condicional nos testes?
[ ] Cobertura ≥ 70% no backend?

SEGURANÇA & OBSERVABILIDADE
[ ] Sem secrets hardcoded?
[ ] Logs têm contexto suficiente para debug em produção?
[ ] PII protegido nos logs?
[ ] Migration Flyway criada se o schema foi alterado?
```

---

## 9. Referências Adicionais

Para contextos específicos, consulte:

- `references/java-spring.md` — Regras completas Java sem Lombok, Spring Boot, JPA, Security, testes
- `references/typescript-react-tailwind.md` — TypeScript strict, React patterns, Tailwind, forms, data fetching
- `references/design-patterns.md` — Catálogo de padrões (Strategy, Repository, Factory, etc.)
- `references/kafka-patterns.md` — Boas práticas para producers/consumers Kafka
- `references/api-design.md` — REST, contratos, paginação, Spec Driven Development

---

## Lembrete Final

> **Código é lido muito mais vezes do que é escrito.**
> Otimize para o próximo desenvolvedor que vai ler — incluindo você mesmo daqui a 6 meses.
> Clareza > Brevidade > Cleverness.
