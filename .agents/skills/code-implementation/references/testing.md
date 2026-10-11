# Testes (JUnit 5 + Mockito e Vitest + Testing Library)

> Referência da skill `code-implementation`. Leia só quando a tarefa envolver este assunto. Fluxo e princípios gerais: `../SKILL.md`.

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
// Spring Boot 4: use @MockitoBean (org.springframework.test.context.bean.override.mockito.MockitoBean);
// @WebMvcTest vem de org.springframework.boot.webmvc.test.autoconfigure; ObjectMapper é tools.jackson.databind.ObjectMapper (Jackson 3).
@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private CreateTransactionUseCase createTransactionUseCase;

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
