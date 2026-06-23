# Java 21 + Spring Boot 3 — Referência Completa (sem Lombok)

## Regra Zero: Lombok é proibido

Nenhuma anotação do projeto Lombok é permitida:
`@Data`, `@Builder`, `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`,
`@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`, `@Slf4j`, `@Value` — **NUNCA**.

Alternativas aceitas:
| Necessidade | Substituto |
|---|---|
| DTO imutável | `record` (Java 16+) |
| Builder | Inner class `Builder` manual ou `with*` copy methods |
| Getters/Setters | Escreva explicitamente |
| Logger | `private static final Logger log = LoggerFactory.getLogger(Foo.class);` |
| Entidade JPA | Construtores e getters manuais, sem setter em campos de identidade |

---

## Records para DTOs

```java
// Request — validação via Bean Validation
public record CreateOrderRequest(
    @NotNull UUID customerId,
    @NotEmpty @Valid List<OrderItemRequest> items
) {}

public record OrderItemRequest(
    @NotNull UUID productId,
    @Positive int quantity
) {}

// Response — sem validação necessária
public record OrderResponse(
    UUID id,
    UUID customerId,
    OrderStatus status,
    List<OrderItemResponse> items,
    Instant createdAt
) {}
```

---

## Entidades JPA sem Lombok

```java
@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @CreationTimestamp
    private Instant createdAt;

    // JPA exige construtor sem args (pode ser protected)
    protected OrderEntity() {}

    private OrderEntity(Builder builder) {
        this.customerId = builder.customerId;
        this.status = builder.status;
    }

    // Getters — sem setters em campos de identidade/auditoria
    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public OrderStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    // Setter apenas para campos que mudam
    public void updateStatus(OrderStatus newStatus) {
        Objects.requireNonNull(newStatus, "status cannot be null");
        this.status = newStatus;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderEntity other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private UUID customerId;
        private OrderStatus status = OrderStatus.PENDING;

        public Builder customerId(UUID customerId) {
            this.customerId = customerId;
            return this;
        }
        public Builder status(OrderStatus status) {
            this.status = status;
            return this;
        }
        public OrderEntity build() {
            Objects.requireNonNull(customerId, "customerId is required");
            return new OrderEntity(this);
        }
    }
}
```

---

## Camada Web (Controller)

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final GetOrderUseCase getOrderUseCase;

    // Injeção por construtor — NUNCA @Autowired em campo
    public OrderController(
        CreateOrderUseCase createOrderUseCase,
        GetOrderUseCase getOrderUseCase
    ) {
        this.createOrderUseCase = createOrderUseCase;
        this.getOrderUseCase = getOrderUseCase;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(
        @RequestBody @Validated CreateOrderRequest request
    ) {
        OrderResponse response = createOrderUseCase.execute(request);
        URI location = URI.create("/api/v1/orders/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(getOrderUseCase.execute(id));
    }
}
```

**Regras do Controller:**
- Nenhuma lógica de negócio — só orquestração e tradução HTTP
- Sempre `@Validated` (Spring) nos parâmetros de entrada, não `@Valid` solto
- `ResponseEntity<T>` explícito em todos os endpoints
- Sem `try-catch` — deixe o `@ControllerAdvice` tratar

---

## Camada de Serviço / Use Case

```java
@Service
@Transactional   // Transação só na camada de serviço
public class CreateOrderUseCase {

    private static final Logger log = LoggerFactory.getLogger(CreateOrderUseCase.class);

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public CreateOrderUseCase(
        OrderRepository orderRepository,
        CustomerRepository customerRepository
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    public OrderResponse execute(CreateOrderRequest request) {
        log.info("Creating order for customer={}", request.customerId());

        customerRepository.findById(request.customerId())
            .orElseThrow(() -> new NotFoundException("Customer", request.customerId()));

        OrderEntity order = OrderEntity.builder()
            .customerId(request.customerId())
            .status(OrderStatus.PENDING)
            .build();

        OrderEntity saved = orderRepository.save(order);
        log.info("Order created id={}", saved.getId());

        return mapToResponse(saved);
    }

    private OrderResponse mapToResponse(OrderEntity entity) {
        return new OrderResponse(
            entity.getId(),
            entity.getCustomerId(),
            entity.getStatus(),
            List.of(),
            entity.getCreatedAt()
        );
    }
}
```

**Regras do Use Case / Service:**
- Um use case = uma classe = um método público `execute()`
- `@Transactional` aqui, nunca no controller nem no repository
- Métodos privados para mappers e helpers internos
- Log no início da operação e ao finalizar com sucesso (nível `INFO`)

---

## Camada de Repositório

```java
// Interface no domínio — sem anotação de framework
public interface OrderRepository {
    Optional<Order> findById(UUID id);
    Order save(Order order);
    List<Order> findByCustomerId(UUID customerId);
}

// Implementação na infra — Spring Data JPA
@Repository
public class JpaOrderRepository implements OrderRepository {

    private final SpringOrderRepository springRepo;

    public JpaOrderRepository(SpringOrderRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Optional<Order> findById(UUID id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public Order save(Order order) {
        return toDomain(springRepo.save(toEntity(order)));
    }

    private Order toDomain(OrderEntity entity) { /* ... */ }
    private OrderEntity toEntity(Order domain) { /* ... */ }
}

// Spring Data interface
interface SpringOrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderEntity> findByCustomerId(UUID customerId);
}
```

---

## Configuração e Properties

```java
// Sempre use @ConfigurationProperties — nunca @Value em campo
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
    String gatewayUrl,
    Duration timeout,
    int maxRetries
) {}

// Habilitar no main ou em @Configuration
@EnableConfigurationProperties(PaymentProperties.class)
```

```yaml
# application.yml
app:
  payment:
    gateway-url: https://gateway.example.com
    timeout: 5s
    max-retries: 3
```

## Spring Security e Autenticação (JWT + Rotação de Refresh Token)

Implemente autenticação stateless utilizando JWT de expiração curta (ex: 15 min) e Refresh Tokens de longa duração (ex: 30 dias) persistidos no banco de dados para permitir rotação (Refresh Token Rotation - RTR) e revogação.

### 1. Modelo de Refresh Token no Banco de Dados
```java
@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(nullable = false)
    private boolean revoked;

    protected RefreshTokenEntity() {}

    public RefreshTokenEntity(String token, UUID userId, Instant expiryDate) {
        this.token = token;
        this.userId = userId;
        this.expiryDate = expiryDate;
        this.revoked = false;
    }

    public UUID getId() { return id; }
    public String getToken() { return token; }
    public UUID getUserId() { return userId; }
    public Instant getExpiryDate() { return expiryDate; }
    public boolean isRevoked() { return revoked; }
    public boolean isExpired() { return Instant.now().isAfter(expiryDate); }

    public void revoke() { this.revoked = true; }
}
```

### 2. Serviço de Autenticação com Rotação (RTR)
Quando o cliente solicita um novo token com o Refresh Token atual:
1. Validamos se o Refresh Token é válido (não expirado e não revogado).
2. Se já estiver revogado, isso indica reuso malicioso! Revogamos imediatamente todos os tokens ativos do mesmo usuário.
3. Se válido, invalidamos/revogamos o Refresh Token antigo e geramos um novo Access Token + novo Refresh Token (rotação).

```java
@Service
@Transactional
public class AuthService {

    private final RefreshTokenRepository tokenRepository;
    private final JwtService jwtService;

    public AuthService(RefreshTokenRepository tokenRepository, JwtService jwtService) {
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
    }

    public TokenResponse refreshToken(String requestToken) {
        RefreshTokenEntity oldToken = tokenRepository.findByToken(requestToken)
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (oldToken.isRevoked() || oldToken.isExpired()) {
            // Detecção de reuso / roubo de token: revogar todos os tokens do usuário
            tokenRepository.revokeAllByUserId(oldToken.getUserId());
            throw new UnauthorizedException("Token has been reused or expired. All sessions revoked.");
        }

        // Revogar token antigo (rotação)
        oldToken.revoke();
        tokenRepository.save(oldToken);

        // Gerar novos tokens
        String newAccessToken = jwtService.generateAccessToken(oldToken.getUserId().toString());
        String newRefreshTokenString = UUID.randomUUID().toString();
        
        RefreshTokenEntity newToken = new RefreshTokenEntity(
            newRefreshTokenString,
            oldToken.getUserId(),
            Instant.now().plus(Duration.ofDays(30))
        );
        tokenRepository.save(newToken);

        return new TokenResponse(newAccessToken, newRefreshTokenString);
    }
}
```

### 3. Configuração de Segurança (Spring Security 6+ / Spring Boot 3)
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

---

## Persistência de Dados (PostgreSQL + Supabase + Spring Data JPA)

### Diretrizes de JPA e Hibernate:
1. **Configuração de Pools**: Configure pools de conexão eficientes (HikariCP) no `application.yml` apontando para a string de conexão do Supabase.
2. **Consultas Customizadas**: Prefira consultas `@Query` explícitas com JPQL/HQL ou SQL Nativo em vez de derived query methods excessivamente complexos.
3. **Mapeamento de Relacionamentos**: Use sempre fetch do tipo `LAZY` para `@OneToMany` e `@ManyToMany` para evitar consultas N+1 e melhorar a performance.
4. **Criptografia AES-256**: Utilize JPA `@Convert` ou listeners de ciclo de vida para encriptar colunas sensíveis (como tokens de integração financeira ou dados pessoais) no banco de dados.

---

## Migrations com Flyway

Toda e qualquer alteração de esquema de banco de dados deve ser versionada com **Flyway**.

### Regras de Ouro:
1. **Imutabilidade**: Arquivos de migração nunca devem ser alterados após o commit/deploy. Correções devem ser feitas em novos arquivos de migração.
2. **Padrão de Nome**: Use `V{VERSAO}__{descricao_curta}.sql` em `src/main/resources/db/migration/`. Exemplo: `V1__init_auth_schema.sql`.
3. **SQL Compatível**: Escreva SQL compatível com PostgreSQL, utilizando `IF NOT EXISTS` ou `DROP IF EXISTS` se necessário para garantir robustez.
4. **Migrações Repetíveis**: Use `R__descricao.sql` apenas para views, procedures ou triggers que possam ser recriados de forma segura a cada execução.

---

## Cache com Redis (Upstash)

Utilize Redis para cachear dashboards lentos ou dados de consulta frequente que mudam pouco (ex: orçamentos de meses anteriores, perfis do usuário).

### Configuração e Uso:
1. **Habilitação**: Utilize `@EnableCaching` na classe de configuração.
2. **Declaração**: Use `@Cacheable`, `@CacheEvict` e `@CachePut` nas camadas de serviço.
3. **Chaves e TTL**: Sempre especifique `key` e configure TTLs adequados via gerenciador de cache para evitar consumo desnecessário de memória no Upstash.

```java
@Service
public class CashFlowService {

    @Cacheable(value = "cashflow", key = "#customerId + '-' + #month")
    public CashFlowResponse getMonthlyCashFlow(UUID customerId, String month) {
        // Cálculo complexo...
        return result;
    }

    @CacheEvict(value = "cashflow", key = "#customerId + '-' + #month")
    public void invalidateCashFlowCache(UUID customerId, String month) {
        // Chamado após nova transação inserida na competência
    }
}
```

---

## Exception Handler centralizado

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleDomainValidation(ValidationException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBeanValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
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
```

---

## Testes

### Teste unitário de use case (sem Spring)

```java
class CreateOrderUseCaseTest {

    private OrderRepository orderRepository;
    private CustomerRepository customerRepository;
    private CreateOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        customerRepository = mock(CustomerRepository.class);
        useCase = new CreateOrderUseCase(orderRepository, customerRepository);
    }

    @Test
    void shouldCreateOrderSuccessfully() {
        UUID customerId = UUID.randomUUID();
        given(customerRepository.findById(customerId))
            .willReturn(Optional.of(new Customer(customerId, "Gildo")));
        given(orderRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        CreateOrderRequest request = new CreateOrderRequest(customerId, List.of());
        OrderResponse result = useCase.execute(request);

        assertThat(result.customerId()).isEqualTo(customerId);
        assertThat(result.status()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void shouldThrowNotFoundWhenCustomerDoesNotExist() {
        UUID customerId = UUID.randomUUID();
        given(customerRepository.findById(customerId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(new CreateOrderRequest(customerId, List.of())))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Customer");
    }
}
```

### Teste de controller (@WebMvcTest)

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private CreateOrderUseCase createOrderUseCase;

    @Test
    void shouldReturn201WithLocationHeader() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID customerId = UUID.randomUUID();
        given(createOrderUseCase.execute(any()))
            .willReturn(new OrderResponse(orderId, customerId, OrderStatus.PENDING, List.of(), Instant.now()));

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateOrderRequest(customerId, List.of()))))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", containsString("/api/v1/orders/" + orderId)))
            .andExpect(jsonPath("$.id").value(orderId.toString()));
    }

    @Test
    void shouldReturn422WhenCustomerIdIsNull() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"customerId": null, "items": []}"""))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
```

### Teste de repositório (@DataJpaTest)

```java
@DataJpaTest
class JpaOrderRepositoryTest {

    @Autowired private SpringOrderRepository springRepo;
    private JpaOrderRepository repository;

    @BeforeEach
    void setUp() {
        repository = new JpaOrderRepository(springRepo);
    }

    @Test
    void shouldPersistAndRetrieveOrder() {
        Order order = Order.builder().customerId(UUID.randomUUID()).build();
        Order saved = repository.save(order);

        Optional<Order> found = repository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getCustomerId()).isEqualTo(order.getCustomerId());
    }
}
```
