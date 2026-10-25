---
name: backend-kotlin
description: Padrões de desenvolvimento do backend do FinanceFlow (Kotlin, Spring Boot 4, JPA, Flyway). Use ao criar ou alterar qualquer código em backend/ (endpoint, caso de uso, regra de domínio, entidade, migration, teste) e ao revisar código Kotlin do projeto.
---

# Backend Kotlin do FinanceFlow

Escrita a partir da especificação e dos ADRs (ADR-0030). Quando esta skill e um ADR divergirem, vale o ADR; quando o ADR e a especificação divergirem, vale a especificação. Código, mensagens de erro e commits em português.

## Antes de escrever código

1. Ache os IDs da especificação (RN, RF, RNF) e os ADRs que a tarefa toca. Cite-os onde a regra não for óbvia.
2. Decida em que módulo e camada cada peça entra (tabela abaixo). Se a tarefa pede uma decisão que nenhum ADR cobre (dependência nova, mudança de segurança, de schema ou de CI), proponha um ADR e pergunte ao desenvolvedor antes de seguir.
3. Leia o código vizinho e escreva no mesmo estilo: poucos comentários, só o porquê não óbvio.

## Onde cada coisa fica

Monólito modular (ADR-0001): um pacote por domínio em `com.financeflow`. As fronteiras são verificadas por `architecture/ModulesTest` e `architecture/LayersTest` (ADR-0034).

| Lugar | O que entra | Pode depender de |
|---|---|---|
| `<módulo>/` (pacote raiz) | API pública do módulo: eventos (`UserRegistered`) e serviços/DTOs usados por outros módulos | `application`, `domain` |
| `domain` | Regras puras: competência, fatura, parcelamento, políticas. `object` sem estado ou classes imutáveis | Só Kotlin, JDK, `shared.error` e `shared.time.Competence` |
| `application` | Casos de uso (`@Service`), `@Transactional`, filtro pelo usuário, interfaces de adaptadores (`TokenIssuer`), `@ConfigurationProperties` | `domain`; de `infra`, só entidades e repositórios |
| `infra` | Entidades JPA, repositórios Spring Data, adaptadores (JWT, e-mail, agregador), `@Configuration` | `application`, `domain` |
| `api` | Controllers; DTOs de requisição/resposta em `api/dto`, um arquivo por controller (`AuthDtos.kt`) | `application`, `domain` |
| `shared/` | `error`, `security`, `config`, `ratelimit`, `email`, `time` (`UserClock`, `Competence`) | Qualquer módulo pode usar |

Regras:
- Um módulo nunca importa subpacotes de outro. Precisa de dados de outro módulo: chame um serviço do pacote raiz dele, que devolve um DTO. Precisa reagir a algo: ouça um `ApplicationEvent`.
- A entidade JPA não sai do caso de uso: `application` devolve um tipo próprio (ex.: `AuthenticatedUser`) para `api` e para outros módulos.
- Converter entidade em modelo de domínio só onde há regra relevante (transações, faturas, recorrências). Módulos simples usam a entidade direto em `application` (ADR-0028).

## Kotlin idiomático

- **Imutabilidade**: `val` por padrão; `data class` para comandos, DTOs e resultados. `var` só em campos de entidade que mudam.
- **Nulabilidade** (ADR-0002): campo opcional é tipo anulável, nunca `Optional`. Em repositórios, devolva `Entidade?` (`fun findByIdAndUserId(id: UUID, userId: UUID): TransactionEntity?`) e trate com `?: throw NotFoundException()`. Evite `!!`: use só em APIs Java que anotam o retorno como anulável mas nunca devolvem nulo naquele uso (ex.: `passwordEncoder.encode(...)!!`).
- **Expressões**: `when` exaustivo sobre `enum` e `sealed`, sem `else` quando dá para listar os casos (o compilador avisa quando surge um caso novo). Retorno antecipado com `?: return` e `?.let { throw ... }`.
- **Funções de escopo** com moderação: `let` para nulos, `also` para efeito colateral curto. Encadear várias atrapalha a leitura.
- **Injeção por construtor** com `private val`. Nada de `@Autowired` em campo no código de produção (nos testes, `lateinit var` é aceito).
- **Constantes** em `companion object` (`private val RETENTION = Duration.ofDays(30)`) ou `const val`.
- **Extensões** privadas para conversões locais (`private fun UserEntity.toAuthenticated() = ...`) em vez de classes Mapper.
- **Sem coroutines** nem programação reativa: o projeto é Spring MVC síncrono.

## Entidades JPA

- Classe comum, não `data class`: `equals`/`hashCode` gerados quebram com proxies e coleções do Hibernate (ADR-0002). Os plugins `kotlin("plugin.jpa")` e `allOpen` já cuidam do construtor sem argumentos e das classes abertas.
- `@Id val id: UUID` gerado pela aplicação (`UUID.randomUUID()`), nunca pelo banco (ADR-0004).
- Toda coluna com `@Column(name = "...", nullable = ...)` alinhado à migration; o schema é do Flyway (`ddl-auto: none`).
- Sem associações bidirecionais nem `FetchType.EAGER`. Prefira guardar o id (`userId: UUID`) e buscar o que precisar.

## Dinheiro e datas

- **Dinheiro** (ADR-0004, ADR-0015): `BigDecimal` no Kotlin, `NUMERIC(19,4)` no banco, sempre BRL.
  - Crie com `BigDecimal("10.50")` ou `BigDecimal.ZERO`, nunca a partir de `Double`.
  - Compare com `compareTo` (`a.compareTo(b) == 0`, `a.signum() > 0`), nunca com `==`: `10.0` e `10.00` não são `equals`.
  - Arredonde para 2 casas com `RoundingMode.HALF_EVEN` só na exibição e ao gerar parcelas; a diferença de centavos vai na última parcela (ADR-0010).
- **Datas** (ADR-0007, ADR-0008):
  - `competence_date` é `LocalDate` sempre no dia 1; `due_date` e `payment_date` são `LocalDate`; `payment_date` existe se, e somente se, `status = PAID`.
  - Competência sugerida = mês da data de referência − `competence_offset`, sempre por `shared/time/Competence` (ADR-0038). A sugestão nunca sobrescreve um valor informado: `competence_informed` diz se o usuário informou, e só a sugerida é recalculada quando a data de referência muda.
  - Compra no cartão guarda `purchase_date` e herda a competência da fatura; a fatura sai de `InvoiceCycle` (RN-04, ADR-0009).
  - Pagamento de fatura é uma transferência da conta pagadora para o cartão, ligada à fatura por `invoice_payments` (o id do pagamento é o `transfer_group_id`), e nunca entra no orçamento (ADR-0039).
  - Instantes (criação, expiração de token) são `Instant`.
  - Pegue a hora do `Clock` injetado (`clock.instant()`, `LocalDate.now(clock)`), nunca `now()` sem argumento.
- **Valores derivados** (saldo, realizado do orçamento, total da fatura) são calculados em consulta, nunca guardados em coluna (ADR-0009, ADR-0011).

## Casos de uso e transações

- `@Transactional` nos métodos públicos do serviço de `application`; `@Transactional(readOnly = true)` em consultas. Uma chamada interna (`this.metodo()`) não passa pelo proxy e não abre transação.
- **Isolamento** (ADR-0012): o caso de uso pega o usuário de `CurrentUser.id()` e o repositório filtra por ele (`findByIdAndUserId`, `findAllByUserId`). Recurso de outro usuário responde 404 (`NotFoundException`), nunca 403. Na Visão Casal, o filtro inclui o casal ativo (ADR-0022).
- **Erros** (ADR-0027): lance as exceções de `shared/error/Exceptions.kt` com um `code` estável em MAIÚSCULAS (`BusinessRuleException("NO_ACTIVE_COUPLE", "...")`). Nunca monte `ResponseEntity` de erro no controller nem devolva `null` para indicar falha. O `GlobalExceptionHandler` traduz para Problem Details: 404, 409 (regra de negócio), 422 (validação), 401, 429.
- **Eventos**: publique com `ApplicationEventPublisher` depois de gravar; o evento é uma `data class` no pacote raiz do módulo.
- **Jobs** (`@Scheduled`): idempotentes (ADR-0010), com o cron configurável por propriedade.
- **Adaptadores externos** (e-mail, agregador): interface em `application` ou `shared`, implementação em `infra` (ADR-0031, ADR-0034). Falha de provedor não pode virar 500 quando revelaria informação (ex.: e-mail cadastrado).

## API

- Rotas em `/api/v1/<recurso>`, substantivos no plural, `@RestController` fino: valida, chama o caso de uso, converte a resposta.
- DTOs nunca ficam no arquivo do controller: vão em `<módulo>/api/dto/<Recurso>Dtos.kt` (verificado pelo `LayersTest`). A conversão para o DTO de resposta continua como extensão privada no controller.
- DTOs de requisição são `data class` com valor padrão e Bean Validation (`@field:NotBlank`, `@field:Size`), validados com `@Valid`. Regra de negócio fica no caso de uso ou no domínio, não em anotação.
- DTOs de resposta nunca expõem entidade, hash ou campos internos.
- 201 ao criar, 204 sem corpo, 200 no resto.
- O contrato é documentado pelo OpenAPI (ADR-0033), não em README: `@Tag` no controller, `@Operation` em cada endpoint e `@ProblemResponse` com os `code` de erro possíveis. Regere o `docs/api.md` com `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`.
- Rate limit nas rotas sensíveis com `RateLimiter.consume` (ADR-0006).

## Banco

- Toda mudança de schema é uma nova `V<n>__descricao.sql` em `src/main/resources/db/migration`. Migration aplicada nunca é editada (ADR-0003).
- Chaves que partem de `users` usam `ON DELETE CASCADE` (ADR-0019). Crie índices para os filtros por `user_id`.
- Mudança de migration pede avaliação de ADR (ADR-0030).

## Testes (ADR-0023)

- **Domínio**: JUnit 5 puro, sem Spring, um caso por regra (RN-01 a RN-06 obrigatórios). Nomes com crase descrevendo o comportamento em português: `` fun `parcela de cartão cai na fatura seguinte`() ``.
- **API**: estenda `support.ApiTest` (PostgreSQL real por Testcontainers, `mockMvc`, `jdbc`, `createUser()`, `TestUser.auth()`). Teste pelo HTTP, conferindo status, `code` e corpo.
- **Isolamento**: todo endpoint que recebe id tem um `assertNotVisibleTo`; toda listagem, um `assertNotListedFor`.
- **Banco compartilhado**: os testes não limpam o banco. Crie os dados de cada teste (`createUser()`, ids aleatórios) e nunca dependa de tabela vazia ou de contagem global.
- MockK só para isolar adaptadores externos; prefira o objeto real. Para e-mail, use o `FakeEmailSender`.
- Cobertura mínima de 70% (RNF-09), verificada pelo Kover.

## Verificar antes de entregar

```bash
cd backend
./gradlew test koverVerify      # o que o CI roda; exige Docker
```

Checklist:
- [ ] Camadas e módulos no lugar certo (`ModulesTest` e `LayersTest` passam).
- [ ] Toda consulta filtra pelo usuário; testes de isolamento escritos.
- [ ] Erros por exceções de `shared/error` com `code` estável.
- [ ] Dinheiro em `BigDecimal` comparado com `compareTo`; datas pelo `Clock`.
- [ ] Migration nova, se o schema mudou; nenhuma editada.
- [ ] ADR proposto, se houve decisão nova.
