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

Módulos sem regra de domínio relevante podem usar a entidade direto em `application`.

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

JWT sem sessão ([ADR-0005](../docs/adr/0005-autenticacao-jwt-com-refresh-token-rotativo.md), [ADR-0026](../docs/adr/0026-armazenamento-de-tokens-no-frontend.md)):

- `POST /api/v1/auth/register`, `/login` e `/refresh` são públicos e devolvem `{accessToken, expiresIn, user}` no corpo e o refresh token no cookie `refresh_token` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth`). Nessas rotas o cabeçalho `Authorization` é ignorado.
- O refresh rotaciona o token a cada uso. Reapresentar um token já rotacionado revoga todas as sessões do usuário (`SessionService.revokeAll`, usado também na troca de senha). Erro → 401 `INVALID_REFRESH_TOKEN`.
- `POST /api/v1/auth/logout` revoga o token do cookie, apaga o cookie e responde 204.
- Rate limiting em memória (ADR-0006), valores provisórios: login 5/min por IP e 10/hora por e-mail; refresh 30/min por IP. Use `RateLimiter.consume(limite, chave)` em outros pontos que precisarem.
- Um job diário apaga os refresh tokens expirados há mais de 30 dias.
- As demais rotas exigem `Authorization: Bearer <accessToken>`. O `sub` do token é o id do usuário, lido com `CurrentUser.id()`.
- O cadastro publica `UserRegistered(userId)` (Spring `ApplicationEvent`) para outros módulos reagirem.

| Variável              | Para quê                                              | Padrão    |
|-----------------------|-------------------------------------------------------|-----------|
| `APP_JWT_SECRET`      | Chave HMAC-SHA256 do access token (mínimo 32 bytes). Defina sempre em produção | valor de dev |
| `APP_PRIVACY_VERSION` | Versão vigente da política de privacidade (RF-102)    | `2026-10` |
| `APP_TRUSTED_PROXIES` | IPs dos proxies cujo `X-Forwarded-For` é confiável, separados por vírgula | nenhum |

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
