# Backend

Kotlin + Spring Boot 4 (JVM 21), PostgreSQL 16 e Flyway. As decisões estão em [`docs/adr`](../docs/adr).

```bash
docker compose up -d db   # na raiz do repositório
# APP_JWT_SECRET tem um valor de desenvolvimento; em produção defina o seu (openssl rand -base64 48)
./gradlew bootRun
./gradlew test            # exige Docker (Testcontainers)
```

## Módulos

Um pacote por domínio em `com.financeflow` (`auth`, `account`, `category`, `transaction`, `invoice`, ...), cada um com as camadas de [ADR-0028](../docs/adr/0028-organizacao-interna-dos-modulos-do-backend.md):

| Camada        | O que fica aqui                                               | Pode usar Spring/JPA? |
|---------------|---------------------------------------------------------------|-----------------------|
| `domain`      | Regras puras (competência, fatura, parcelas), testadas sem banco | Não                |
| `application` | Casos de uso, transação de banco e filtro pelo usuário        | Sim                   |
| `infra`       | Entidades JPA, repositórios Spring Data, adaptadores externos  | Sim                   |
| `api`         | Controllers e DTOs                                            | Sim                   |

Módulos sem regra de domínio relevante podem usar a entidade direto em `application`, mas ela não passa para `api` nem sai do módulo. Adaptadores externos (JWT, e-mail) ficam atrás de uma interface em `application` ou `shared`.

Só o pacote raiz de cada módulo (ex.: `com.financeflow.auth`) é visível para os outros: é ali que ficam eventos e serviços públicos. Os testes em `architecture/` (Spring Modulith e ArchUnit, [ADR-0034](../docs/adr/0034-fronteiras-de-modulos-e-camadas-verificadas-nos-testes.md)) quebram o build se um módulo usar o interno de outro ou se as camadas dependerem na direção errada.

O que é comum a todos fica em `shared`:

- `shared/error`: exceções de domínio e o `GlobalExceptionHandler`.
- `shared/security`: `CurrentUser`, que devolve o id do usuário autenticado.
- `shared/config`: configuração do Spring (segurança etc.).

### Erros

Toda resposta de erro é Problem Details (RFC 9457) com um `code` estável, que o frontend usa para escolher a mensagem ([ADR-0027](../docs/adr/0027-erros-da-api-em-problem-details.md)):

```json
{ "type": "about:blank", "title": "Unprocessable Content", "status": 422,
  "detail": "Dados inválidos", "code": "VALIDATION_FAILED",
  "errors": [{ "field": "timezone", "message": "Fuso horário inválido" }] }
```

| Lançar                                   | Status | `code` padrão       |
|------------------------------------------|--------|---------------------|
| `NotFoundException()`                    | 404    | `NOT_FOUND`         |
| `BusinessRuleException("CATEGORY_IN_USE", "...")` | 409 | o informado     |
| `ValidationException("campo", "mensagem")` | 422  | `VALIDATION_FAILED` |
| `UnauthorizedException()`                | 401    | `UNAUTHORIZED`      |
| `TooManyRequestsException(segundos)`     | 429 + `Retry-After` | `TOO_MANY_REQUESTS` |
| `ForbiddenException()`                   | 403    | `FORBIDDEN`         |

O handler também cobre Bean Validation (`@Valid` no corpo e restrições em parâmetros → 422), JSON malformado (400, `MALFORMED_REQUEST`), falta de autenticação (401, `UNAUTHORIZED`), os demais erros do Spring MVC (`code` = nome do status, ex.: `METHOD_NOT_ALLOWED`) e erros inesperados (500, `INTERNAL_ERROR`, sem a mensagem interna).

Para validar data classes, anote o campo: `@field:NotBlank val name: String`.

### Isolamento entre usuários

Toda leitura e escrita é filtrada pelo usuário autenticado, no repositório e não no controller ([ADR-0012](../docs/adr/0012-visibilidade-e-isolamento-de-dados.md)). Recurso de outro usuário responde **404** (`NotFoundException`), nunca 403, para não revelar que ele existe.

```kotlin
val account = repository.findByIdAndUserId(id, currentUser.id()) ?: throw NotFoundException()
```

## Autenticação

JWT sem sessão ([ADR-0005](../docs/adr/0005-autenticacao-jwt-com-refresh-token-rotativo.md), [ADR-0026](../docs/adr/0026-armazenamento-de-tokens-no-frontend.md)). Os endpoints, com corpo, respostas e códigos de erro, ficam na documentação da API gerada pelo OpenAPI ([ADR-0033](../docs/adr/0033-documentacao-da-api-pelo-openapi.md)), não neste README. Aqui ficam as regras que atravessam o código:

- Cadastro, login e refresh devolvem o access token no corpo e o refresh token no cookie `refresh_token` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth`). Nas rotas públicas de autenticação, o cabeçalho `Authorization` é ignorado.
- O refresh rotaciona o token a cada uso. Reapresentar um token já rotacionado revoga todas as sessões do usuário (`SessionService.revokeAll`, usado também na troca de senha).
- A versão vigente da política de privacidade (`APP_PRIVACY_VERSION`) é exposta por um endpoint público, e o frontend a envia no cadastro (RF-102).
- Recuperação de senha (RF-004): o pedido do link responde igual exista ou não o e-mail; o link é de uso único, vale 1 hora e invalida os anteriores ainda não usados; a troca de senha revoga todas as sessões.
- E-mail sai pela interface `EmailSender` (`shared/email`, [ADR-0031](../docs/adr/0031-email-transacional-por-interface-desde-a-fase-1.md)). Com `APP_EMAIL_PROVIDER=log` (padrão), o `LoggingEmailSender` só escreve a mensagem no log, com o link; nos testes de API, o `FakeEmailSender` captura as mensagens.
- Rate limiting em memória (ADR-0006), valores provisórios: login 5/min por IP e 10/hora por e-mail; refresh 30/min por IP; pedido de link 10/hora por IP e 3/hora por e-mail. Use `RateLimiter.consume(limite, chave)` em outros pontos que precisarem.
- Um job diário apaga os refresh tokens e os links de redefinição expirados há mais de 30 dias.
- As demais rotas exigem `Authorization: Bearer <accessToken>`. O `sub` do token é o id do usuário, lido com `CurrentUser.id()`.
- O cadastro publica `UserRegistered(userId)` (Spring `ApplicationEvent`) para outros módulos reagirem. O módulo `category` o usa para copiar as categorias padrão (`DefaultCategories`) na mesma transação do cadastro.

| Variável              | Para quê                                              | Padrão    |
|-----------------------|-------------------------------------------------------|-----------|
| `APP_JWT_SECRET`      | Chave HMAC-SHA256 do access token (mínimo 32 bytes). Defina sempre em produção | valor de dev |
| `APP_PRIVACY_VERSION` | Versão vigente da política de privacidade (RF-102)    | `2026-10` |
| `APP_FRONTEND_URL`    | Base do link de redefinição de senha                  | `http://localhost:5173` |
| `APP_EMAIL_PROVIDER`  | Implementação do `EmailSender`. `log` só registra no log; não use em produção | `log` |
| `APP_TRUSTED_PROXIES` | IPs dos proxies cujo `X-Forwarded-For` é confiável, separados por vírgula | nenhum |
| `APP_API_DOCS_ENABLED` | Liga `/v3/api-docs` e o Swagger UI (`/swagger-ui.html`). Use `false` em produção | `true` |

## Testes

- **Domínio** (`domain`): JUnit 5 puro, sem Spring e sem banco.
- **Integração**: estendem `IntegrationTest`, que sobe um PostgreSQL 16 por Testcontainers para a suíte inteira.
- **API**: estendem `support.ApiTest`, que já traz `mockMvc`, `jdbc` e os helpers abaixo.

```kotlin
class AccountApiTest : ApiTest() {

    @Test
    fun `conta de outro usuário não é visível`() {
        val alice = createUser()
        val bob = createUser()
        val id = /* cria uma conta da alice */

        mockMvc.get("/api/v1/accounts/$id") { with(alice.auth()) }.andExpect { status { isOk() } }
        assertNotVisibleTo(bob) { get("/api/v1/accounts/$id") }          // 404 NOT_FOUND
        assertNotListedFor(bob, id) { get("/api/v1/accounts") }          // id não aparece
    }
}
```

- `createUser()` grava um usuário com e-mail único; os testes não limpam o banco, então nada deve depender de tabelas vazias.
- `TestUser.auth()` autentica a requisição como o usuário, mandando um access token JWT real no cabeçalho `Authorization`.
- Todo endpoint que recebe um id tem um `assertNotVisibleTo`, e toda listagem tem um `assertNotListedFor` (RNF-05).

Cobertura mínima de 70%, verificada no CI com `./gradlew test koverVerify` (RNF-09).

## Documentação da API

O contrato da API fica em [`docs/api.md`](../docs/api.md), gerado do OpenAPI (springdoc, [ADR-0033](../docs/adr/0033-documentacao-da-api-pelo-openapi.md), [ADR-0038](../docs/adr/0038-geracao-e-exposicao-da-documentacao-da-api.md)). Com a aplicação rodando, o Swagger UI está em `http://localhost:8080/swagger-ui.html`.

- Cada endpoint tem `@Operation(summary = ...)`, e o controller tem `@Tag`. Campos que precisam de explicação levam `@field:Schema(description = ...)`.
- Erros de regra de negócio são declarados com `@DocumentedError(409, "CODE", "quando acontece")`. 401, 404 (rota com id), 400 e 422 (corpo com `@Valid`) entram sozinhos; rotas públicas levam `@SecurityRequirements` vazio.
- O `ApiDocsTest` falha se o `docs/api.md` estiver desatualizado. Para regerar: `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`.
