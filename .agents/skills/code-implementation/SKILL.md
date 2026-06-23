---
name: code-implementation
description: >
  Guia completo e detalhado para implementar código de forma profissional e sustentável.
  Use esta skill SEMPRE que o usuário pedir para escrever, criar, refatorar, revisar ou implementar
  qualquer trecho de código — desde um simples script até sistemas complexos. Cobre a stack oficial
  do FinanceFlow: (1) Java 21 + Spring Boot 3 no back-end (SEM Lombok), com Spring Security + JWT com rotação
  de refresh token, PostgreSQL (Supabase), Flyway para migrations e Redis (Upstash) para cache; e (2) React 18 + Vite +
  TypeScript no front-end com Tailwind CSS, React Query (TanStack Query), React Router v6, Recharts e date-fns.
  Inclui princípios de design, estrutura de projeto, nomenclatura, tratamento de erros, testes, documentação,
  performance e segurança. Acione também quando o usuário mencionar "boas práticas", "código limpo",
  "refatorar", "como implementar", "estrutura de projeto", "padrões de projeto", "componente React",
  "endpoint Spring", "controller", "service", "repository", "hook", "tailwind", etc.
---

# Skill: Code Implementation

Guia de referência para produzir código de alta qualidade, legível, testável e sustentável.
A stack tecnológica do projeto é:

### Backend (API REST)
*   **Linguagem & Framework:** Java 21 + Spring Boot 3 — **sem Lombok**
*   **Segurança:** Spring Security + JWT (JSON Web Tokens) com rotação de refresh token
*   **Persistência:** PostgreSQL (Supabase) + Spring Data JPA / Hibernate
*   **Migrations:** Flyway
*   **Cache:** Redis (Upstash)

### Frontend (SPA)
*   **Framework UI:** React 18 + Vite + TypeScript
*   **Estilização:** Tailwind CSS v3 (travado em `^3.4.17` — NÃO atualizar para v4)
*   **Estado & Cache:** React Query (TanStack Query)
*   **Roteamento:** React Router v6 (com proteção de rotas privadas)
*   **Gráficos:** Recharts
*   **Datas:** `date-fns` (lógica de ciclos e competências)

---

## 1. Fluxo de Implementação (sempre seguir esta ordem)

```
ENTENDER → PLANEJAR → ESTRUTURAR → IMPLEMENTAR → VALIDAR → DOCUMENTAR
```

### 1.1 Entender
- Clarificar **o que** o código deve fazer (comportamento externo, não implementação interna)
- Identificar **entradas, saídas e invariantes**
- Levantar **edge cases** antes de escrever uma linha
- Confirmar **contexto técnico**: linguagem, framework, restrições de performance, sistema legado

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
- Revisar contra o checklist de qualidade (seção 7)

### 1.6 Documentar
- Comentar **por quê**, não **o quê**
- Manter README/docstring atualizados

---

## 2. Princípios Fundamentais

### SOLID aplicado na prática

| Princípio | Sinal de violação | Correção |
|-----------|-------------------|----------|
| **S** — Single Responsibility | Classe/função faz mais de uma coisa | Extrair responsabilidade |
| **O** — Open/Closed | Mudança de comportamento requer modificar código existente | Usar polimorfismo/strategy |
| **L** — Liskov Substitution | Subclasse quebra contrato da superclasse | Rever herança → usar composição |
| **I** — Interface Segregation | Interface com métodos que cliente não usa | Quebrar em interfaces menores |
| **D** — Dependency Inversion | Código depende de implementações concretas | Depender de abstrações/interfaces |

### Outros princípios críticos

- **DRY** (Don't Repeat Yourself): duplicação é uma dívida técnica; extraia lógica repetida
- **YAGNI** (You Aren't Gonna Need It): não implemente o que não foi pedido agora
- **KISS** (Keep It Simple, Stupid): prefira a solução mais simples que funcione
- **Fail Fast**: valide entradas cedo, lance exceções específicas, nunca engula erros silenciosamente
- **Código deve ser lido como prosa**: nomes revelam intenção, estrutura guia o leitor

---

## 3. Convenções por Stack

> Para regras detalhadas e exemplos extensos, consulte os arquivos de referência:
> - Back-end: `references/java-spring.md`
> - Front-end: `references/typescript-react-tailwind.md`

### 3.1 Java 21 + Spring Boot 3 (sem Lombok)

**Regra absoluta: ZERO Lombok.** Escreva getters, setters, construtores, builders e equals/hashCode manualmente ou via Records (Java 16+).

```java
// ✅ BOM: Record para DTO imutável (Java 16+)
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email
) {}

// ✅ BOM: Entidade com construtor explícito e builder manual
public class Order {
    private final UUID id;
    private final UUID customerId;
    private OrderStatus status;

    private Order(Builder builder) {
        this.id = builder.id;
        this.customerId = builder.customerId;
        this.status = builder.status;
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public OrderStatus getStatus() { return status; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID customerId;
        private OrderStatus status;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder customerId(UUID customerId) { this.customerId = customerId; return this; }
        public Builder status(OrderStatus status) { this.status = status; return this; }
        public Order build() { return new Order(this); }
    }
}

// ❌ PROIBIDO: qualquer anotação Lombok
// @Data, @Builder, @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor — NUNCA
```

**Estrutura de pacotes por Feature (Spring Boot):**
```
com.financeflow.modulo/
├── controller/         # @RestController e endpoints REST
├── dto/                # Records de Request e Response (DTOs)
├── service/            # Use cases / serviços com lógica de aplicação
├── repository/         # Interfaces do repositório de domínio
│   └── jpa/            # Implementações JPA de persistência e Spring Data Repositories
└── model/              # Modelagem de domínio e persistência
    ├── domain/         # Modelo de domínio puro (ex: Java Record imutável)
    ├── entity/         # Entidades de persistência anotadas com @Entity (JPA)
    └── mapper/         # Mappers estáticos de conversão entre Domain e Entity
```

**Separação entre Domínio e Entidade (Redução de Boilerplate):**
*   Prefira usar **Java Records** no pacote `domain/` para representar modelos de negócio imutáveis, eliminando getters, builders manuais e Lombok.
*   Deixe classes mutáveis mapeadas pelo JPA apenas no pacote `entity/`.
*   Converta entre as duas camadas usando métodos estáticos na classe `mapper/UserMapper`.

**Regras essenciais Spring (detalhes em `references/java-spring.md`):**
- `@Service`, `@Repository`, `@RestController` — injeção sempre por **construtor**, nunca `@Autowired` em campo
- `@ControllerAdvice` para tratamento centralizado de exceções
- `@Validated` + Bean Validation (`@NotBlank`, `@Email`, etc.) nos DTOs de entrada
- `ResponseEntity<T>` com status HTTP semântico em todos os controllers
- Transações: `@Transactional` apenas na camada de serviço, nunca no controller

### 3.2 TypeScript + React + Tailwind

```tsx
// ✅ BOM: Props tipadas, componente puro, Tailwind semântico integrado ao tema Dark Premium
interface UserCardProps {
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  onEdit?: () => void;
}

export function UserCard({ name, email, role, onEdit }: UserCardProps) {
  return (
    <div className="glassmorphism rounded-2xl p-4 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{name}</h3>
          <p className="text-xs text-zinc-400">{email}</p>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium border',
          role === 'admin'
            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
        )}>
          {role}
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
  return <div style={{padding: 16}}>{props.name}</div>
}
```

**Regras essenciais React/TS (detalhes em `references/typescript-react-tailwind.md`):**
- **Versão do Tailwind CSS:** É obrigatório o uso do Tailwind CSS v3.4.x com os arquivos tradicionais `tailwind.config.js` e `postcss.config.js`. **Não atualizar para o Tailwind v4**, pois ele exige compilação nativa com Rust que causa erros em alguns ambientes Node.
- **Tema Visual Premium (Dark Mode Obrigatório):** O sistema segue a identidade visual premium escura definida em `index.css`. Todos os novos componentes devem seguir este template (ex: containers com `.glassmorphism` ou `.auth-card`, gradientes com `.gradient-bg`, fundos escuros `bg-zinc-900/60` com bordas sutis `border-zinc-800`, textos em escalas `text-zinc-100` / `text-zinc-400` e destakes na cor violeta `violet-600`).
- **Nunca use `any`** — prefira `unknown` com type guard quando o tipo não é conhecido
- Componentes: arquivos `.tsx`, exportação nomeada, props sempre tipadas via `interface`
- Um componente por arquivo; nome do arquivo = nome do componente (`UserCard.tsx`)
- Hooks customizados em `hooks/use*.ts`; lógica de dados **fora** de componentes visuais
- Tailwind: use `cn()` (clsx + tailwind-merge) para classes condicionais
- Proibido `!important` e `style={{}}` inline — Tailwind resolve tudo

---

## 4. Estrutura de Projeto

### Back-end (Java 21 + Spring Boot 3)

```
src/main/java/com/empresa/projeto/
├── domain/
│   ├── model/              # Entidades de domínio (sem anotações de framework)
│   ├── repository/         # Interfaces (porta de saída)
│   └── exception/          # DomainException, NotFoundException, etc.
├── application/
│   └── usecase/            # Um arquivo por use case: CreateOrderUseCase.java
├── infrastructure/
│   ├── persistence/        # JpaRepository implementations, @Entity classes
│   └── config/             # SecurityConfig, OpenApiConfig, etc.
└── web/
    ├── controller/         # @RestController — só orquestra, sem lógica
    ├── dto/                # Records para Request e Response
    └── handler/            # GlobalExceptionHandler (@ControllerAdvice)
```

### Front-end (TypeScript + React)

```
src/
├── components/
│   ├── ui/                 # Componentes genéricos: Button, Input, Modal
│   └── feature/            # Componentes específicos de domínio: OrderCard, UserForm
├── pages/ (ou app/ se Next.js)
├── hooks/                  # use*.ts — lógica de estado e efeitos
├── services/               # Chamadas HTTP: userService.ts, orderService.ts
├── types/                  # Interfaces e types globais
├── utils/                  # Funções puras utilitárias (sem efeitos)
└── lib/
    └── cn.ts               # Helper clsx + tailwind-merge
```

### Regras de dependência

```
Back-end:  domain ← application ← infrastructure
                    application ← web
Front-end: services ← hooks ← components ← pages
```

---

## 5. Tratamento de Erros

### Back-end (Java 21 + Spring Boot 3)

```java
// 1. Exceções de domínio sem Lombok
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

public class ValidationException extends DomainException {
    public ValidationException(String field, String reason) {
        super("VALIDATION_ERROR", "Invalid " + field + ": " + reason);
    }
}

// 2. Handler centralizado
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse("VALIDATION_ERROR", "Validation failed", errors));
    }
}

// 3. Response record
public record ErrorResponse(String code, String message, List<FieldError> errors) {
    public ErrorResponse(String code, String message) {
        this(code, message, List.of());
    }
    public record FieldError(String field, String message) {}
}
```

### Front-end (TypeScript + React)

```typescript
// Tipo de erro tipado
interface ApiError {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
}

// Hook de mutação com React Query (TanStack Query)
import { useMutation } from '@tanstack/react-query';

function useCreateOrder() {
  return useMutation<OrderResponse, ApiError, CreateOrderRequest>({
    mutationFn: (data) => orderService.create(data),
  });
}
```

### Regras de ouro para erros

1. **Back:** nunca exponha stack trace, mensagem de SQL ou path interno na resposta HTTP
2. **Back:** log com contexto no ponto de origem — nunca relogue na cadeia de chamada
3. **Front:** nunca `catch` silencioso — sempre trate ou propague com contexto
4. **Front:** erros de validação do formulário são distintos de erros de API — trate separado
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
class CreateOrderUseCaseTest {

    private OrderRepository orderRepository;
    private CreateOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        orderRepository = Mockito.mock(OrderRepository.class);
        useCase = new CreateOrderUseCase(orderRepository);
    }

    @Test
    void shouldThrowValidationExceptionWhenCustomerIdIsNull() {
        // Arrange
        CreateOrderRequest request = new CreateOrderRequest(null, List.of());

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("customerId");
    }
}

// Teste de controller: sem banco, Spring slice
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CreateOrderUseCase createOrderUseCase;

    @Test
    void shouldReturn201WhenOrderIsCreated() throws Exception {
        UUID orderId = UUID.randomUUID();
        given(createOrderUseCase.execute(any())).willReturn(new OrderResponse(orderId));

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"customerId": "abc-123", "items": []}
                """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(orderId.toString()));
    }
}
```

### Front-end (Vitest + Testing Library)

```tsx
// Teste de componente: comportamento, não implementação
describe('UserCard', () => {
  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<UserCard name="Gildo" email="g@test.com" role="admin" onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('should not render edit button when onEdit is not provided', () => {
    render(<UserCard name="Gildo" email="g@test.com" role="viewer" />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });
});

// Teste de hook com servidor mockado
it('should return error state when API fails', async () => {
  server.use(http.post('/api/orders', () => HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 500 })));

  const { result } = renderHook(() => useCreateOrder());
  await act(() => result.current.execute({ customerId: '1', items: [] }));

  expect(result.current.error?.code).toBe('SERVER_ERROR');
});
```

### Regras de teste (ambos)

- Nome: **`should [comportamento] when [condição]`**
- **Não teste implementação**, teste comportamento observável
- Mocks só na fronteira (repositórios, APIs externas) — nunca mock de domínio puro
- Back: prefira `@WebMvcTest` / `@DataJpaTest` a `@SpringBootTest` — mais rápido
- Front: prefira `userEvent` a `fireEvent` — simula comportamento real do usuário
- Testes devem ser determinísticos e independentes de ordem de execução

---

## 7. Performance e Segurança

### Performance

- **Não otimize antes de medir** — use profiler, não intuição
- Identifique o gargalo real: I/O? CPU? Memória? Lock contention?
- Prefira operações em batch para DB e Kafka (evite N+1)
- Use índices corretos no banco; analise query plan antes de ir para produção
- Cache com TTL explícito e invalidação pensada — nunca cache sem estratégia de eviction
- Para Kafka: ajuste `batch.size`, `linger.ms`, `compression.type` conforme throughput

### Segurança

- **Nunca** hardcode credenciais, tokens ou secrets — use variáveis de ambiente ou secrets manager
- Valide e sanitize toda entrada externa antes de usar
- SQL: sempre use prepared statements / ORM — nunca concatenação de string
- Deserialização: valide schema explicitamente, rejeite campos inesperados
- Logs: nunca logue PII (CPF, email, telefone, senha) sem mascaramento
- Dependências: audite regularmente (`gradle dependencyCheckAnalyze`, `govulncheck`)

---

## 8. Code Review Checklist

Use antes de finalizar qualquer implementação:

```
CORRETUDE
[ ] Cobre todos os edge cases identificados?
[ ] Erros são tratados (não engolidos)?
[ ] Entradas externas são validadas?
[ ] Não há race conditions (se concorrente)?

LEGIBILIDADE
[ ] Nomes revelam intenção?
[ ] Funções têm < 20 linhas (regra geral)?
[ ] Sem comentários que explicam "o quê" (só "por quê")?
[ ] Sem código morto ou TODOs sem ticket?

DESIGN
[ ] SRP respeitado?
[ ] Sem dependências desnecessárias?
[ ] Interfaces/contratos definidos antes das implementações?
[ ] Sem acoplamento desnecessário entre módulos?

TESTES
[ ] Todo comportamento público tem ao menos um teste?
[ ] Testes são independentes e sem ordem de execução?
[ ] Sem lógica condicional nos testes?

SEGURANÇA & OBSERVABILIDADE
[ ] Sem secrets hardcoded?
[ ] Logs têm contexto suficiente para debug em produção?
[ ] Métricas/traces adicionados onde faz sentido?
[ ] PII protegido nos logs?
```

---

## 9. Referências Adicionais

Para contextos específicos, consulte:

- `references/java-spring.md` — Regras completas Java sem Lombok, Spring Boot, JPA, Security, testes
- `references/typescript-react-tailwind.md` — TypeScript strict, React patterns, Tailwind, forms, data fetching
- `references/design-patterns.md` — Catálogo de padrões (Strategy, Repository, Factory, etc.)
- `references/kafka-patterns.md` — Boas práticas para producers/consumers Kafka
- `references/api-design.md` — REST e contratos de API

---

## Lembrete Final

> **Código é lido muito mais vezes do que é escrito.**
> Otimize para o próximo desenvolvedor que vai ler — incluindo você mesmo daqui a 6 meses.
> Clareza > Brevidade > Cleverness.
