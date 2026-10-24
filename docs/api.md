# API do FinanceFlow

<!-- Gerado a partir do OpenAPI pelo ApiDocsTest. Não edite à mão. -->

> Gerado a partir do código. Para atualizar, rode no `backend/`:
> `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`

Erros seguem Problem Details (RFC 9457) com um `code` estável (ADR-0027).

Salvo indicação, as rotas exigem `Authorization: Bearer <accessToken>`.

## Autenticação

Rotas públicas. O refresh token vai no cookie HttpOnly `refresh_token` (ADR-0026).

### `POST /api/v1/auth/login`

Entra com e-mail e senha

Pública, sem access token.

Corpo: [LoginRequest](#loginrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | Sessão aberta; refresh token no cookie | [AuthResponse](#authresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `INVALID_CREDENTIALS`: E-mail ou senha inválidos | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |
| 429 | `TOO_MANY_REQUESTS`: Limite de tentativas; veja `Retry-After` | [Problem](#problem) |

### `POST /api/v1/auth/logout`

Encerra a sessão e apaga o cookie

Pública, sem access token.

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `refresh_token` | cookie | string | não |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 204 | Sessão encerrada |  |

### `POST /api/v1/auth/password/forgot`

Pede o link de redefinição de senha

Pública, sem access token.

Corpo: [ForgotPasswordRequest](#forgotpasswordrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 204 | Sempre, exista ou não o e-mail |  |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |
| 429 | `TOO_MANY_REQUESTS`: Limite de pedidos; veja `Retry-After` | [Problem](#problem) |

### `POST /api/v1/auth/password/reset`

Troca a senha com o token do link

Revoga todas as sessões do usuário.

Pública, sem access token.

Corpo: [ResetPasswordRequest](#resetpasswordrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 204 | Senha trocada |  |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors`; `INVALID_RESET_TOKEN`: Token inválido, vencido ou já usado | [Problem](#problem) |

### `GET /api/v1/auth/privacy-policy`

Versão vigente da política de privacidade

Pública, sem access token.

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [PrivacyPolicyResponse](#privacypolicyresponse) |

### `POST /api/v1/auth/refresh`

Renova a sessão pelo cookie, rotacionando o refresh token

Pública, sem access token.

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `refresh_token` | cookie | string | não |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | Novo access token; novo refresh token no cookie | [AuthResponse](#authresponse) |
| 401 | `INVALID_REFRESH_TOKEN`: Cookie ausente, vencido ou já rotacionado | [Problem](#problem) |
| 429 | `TOO_MANY_REQUESTS`: Limite de tentativas; veja `Retry-After` | [Problem](#problem) |

### `POST /api/v1/auth/register`

Cadastra o usuário e abre a sessão

Cria também as categorias padrão.

Pública, sem access token.

Corpo: [RegisterRequest](#registerrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 201 | Usuário criado; refresh token no cookie | [AuthResponse](#authresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 409 | `EMAIL_ALREADY_USED`: Já existe cadastro com o e-mail | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

## Categorias

Dois níveis, com tipo (RF-012, ADR-0013, ADR-0036).

### `GET /api/v1/categories`

Árvore de categorias com as subcategorias, em ordem alfabética

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `type` | query | `INCOME` \| `EXPENSE` | não | Filtra pelo tipo; sem ele, todas. |
| `includeArchived` | query | boolean | não | Inclui as arquivadas. Padrão: `false`. |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [CategoryResponse](#categoryresponse)[] |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |

### `POST /api/v1/categories`

Cria categoria ou subcategoria

A subcategoria tem o tipo do pai, que precisa ser de primeiro nível e ativo.

Corpo: [CreateCategoryRequest](#createcategoryrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 201 | Created | [CategoryResponse](#categoryresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 409 | `CATEGORY_NAME_TAKEN`: Nome já usado no mesmo nível | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

### `PUT /api/v1/categories/{id}`

Renomeia a categoria

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

Corpo: [RenameCategoryRequest](#renamecategoryrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [CategoryResponse](#categoryresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `CATEGORY_NAME_TAKEN`: Nome já usado no mesmo nível | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

### `DELETE /api/v1/categories/{id}`

Exclui a categoria sem uso

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 204 | No Content |  |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `CATEGORY_IN_USE`: Tem transações ou orçamento; arquive ou mescle; `CATEGORY_HAS_SUBCATEGORIES`: Tem subcategorias | [Problem](#problem) |

### `POST /api/v1/categories/{id}/archive`

Arquiva a categoria e as subcategorias

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [CategoryResponse](#categoryresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |

### `POST /api/v1/categories/{id}/merge`

Mescla na categoria de destino

Move transações e orçamentos (somando o planejado do mesmo mês) e arquiva a origem.

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

Corpo: [MergeCategoryRequest](#mergecategoryrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [CategoryResponse](#categoryresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `INVALID_CATEGORY_MERGE`: Destino igual, de outro tipo ou arquivado, ou origem com subcategorias | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

### `POST /api/v1/categories/{id}/unarchive`

Desarquiva a categoria (não as subcategorias)

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [CategoryResponse](#categoryresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `PARENT_CATEGORY_ARCHIVED`: A categoria pai está arquivada | [Problem](#problem) |

## Contas

Contas corrente e poupança (RF-010, RF-011). Cartões têm cadastro próprio.

### `GET /api/v1/accounts`

Lista as contas com o saldo calculado, em ordem alfabética

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `includeArchived` | query | boolean | não | Inclui as arquivadas. Padrão: `false`. |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [AccountResponse](#accountresponse)[] |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |

### `POST /api/v1/accounts`

Cria conta corrente ou poupança

Corpo: [SaveAccountRequest](#saveaccountrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 201 | Created | [AccountResponse](#accountresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

### `GET /api/v1/accounts/{id}`

Uma conta, com o saldo calculado

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [AccountResponse](#accountresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |

### `PUT /api/v1/accounts/{id}`

Edita a conta

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

Corpo: [SaveAccountRequest](#saveaccountrequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [AccountResponse](#accountresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `ACCOUNT_IS_CREDIT_CARD`: A conta é um cartão de crédito | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

### `DELETE /api/v1/accounts/{id}`

Exclui a conta sem transações

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 204 | No Content |  |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `ACCOUNT_IN_USE`: A conta tem transações; arquive em vez de excluir; `ACCOUNT_IS_CREDIT_CARD`: A conta é um cartão de crédito | [Problem](#problem) |

### `POST /api/v1/accounts/{id}/archive`

Arquiva a conta

Some dos formulários, mas o histórico continua.

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [AccountResponse](#accountresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `ACCOUNT_IS_CREDIT_CARD`: A conta é um cartão de crédito | [Problem](#problem) |

### `POST /api/v1/accounts/{id}/unarchive`

Desarquiva a conta

| Parâmetro | Em | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | path | string (uuid) | sim |  |

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [AccountResponse](#accountresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 404 | `NOT_FOUND`: Não existe ou é de outro usuário (ADR-0012) | [Problem](#problem) |
| 409 | `ACCOUNT_IS_CREDIT_CARD`: A conta é um cartão de crédito | [Problem](#problem) |

## Perfil

### `GET /api/v1/me`

Perfil do usuário autenticado

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [ProfileResponse](#profileresponse) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |

### `PUT /api/v1/me`

Altera nome e fuso horário

O fuso define o "hoje" do usuário (vencimentos, atrasos, mês corrente).

Corpo: [UpdateProfileRequest](#updateprofilerequest)

| Status | Descrição | Corpo |
| --- | --- | --- |
| 200 | OK | [ProfileResponse](#profileresponse) |
| 400 | `MALFORMED_REQUEST`: Corpo ausente ou JSON malformado | [Problem](#problem) |
| 401 | `UNAUTHORIZED`: Sem access token válido | [Problem](#problem) |
| 422 | `VALIDATION_FAILED`: Campos inválidos, listados em `errors` | [Problem](#problem) |

## Schemas

### AccountResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `archived` | boolean | não |  |
| `balance` | number | não | Saldo inicial + entradas pagas − saídas pagas, calculado (RN-07, ADR-0011) |
| `bank` | string | sim |  |
| `competenceOffset` | integer (int32) | não |  |
| `id` | string (uuid) | não |  |
| `initialBalance` | number | não |  |
| `name` | string | não |  |
| `type` | `CHECKING` \| `SAVINGS` \| `CREDIT_CARD` | não |  |

### AuthResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `accessToken` | string | não |  |
| `expiresIn` | integer (int64) | não |  |
| `user` | [UserResponse](#userresponse) | não |  |

### CategoryResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `archived` | boolean | não |  |
| `id` | string (uuid) | não |  |
| `name` | string | não |  |
| `parentId` | string (uuid) | sim |  |
| `subcategories` | [CategoryResponse](#categoryresponse)[] | não |  |
| `type` | `INCOME` \| `EXPENSE` | não |  |

### CreateCategoryRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `name` | string | sim | máximo de 100 caracteres |
| `parentId` | string (uuid) ou nulo | não |  |
| `type` | `INCOME` \| `EXPENSE` | sim |  |

### ForgotPasswordRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `email` | string | sim | máximo de 255 caracteres |

### LoginRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `email` | string | sim | mínimo de 1 caracteres |
| `password` | string | sim | mínimo de 1 caracteres |

### MergeCategoryRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `targetId` | string (uuid) | sim |  |

### PrivacyPolicyResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `version` | string | não |  |

### Problem

Problem Details (RFC 9457)

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `code` | string | não | Código estável do erro |
| `detail` | string | não | Mensagem para o usuário |
| `errors` | object[] | não | Só em `VALIDATION_FAILED` |
| `instance` | string | não |  |
| `status` | integer (int32) | não |  |
| `title` | string | não |  |
| `type` | string | não |  |

### ProfileResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `currency` | string | não |  |
| `email` | string | não |  |
| `id` | string (uuid) | não |  |
| `name` | string | não |  |
| `privacyVersion` | string | sim |  |
| `timezone` | string | não |  |

### RegisterRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `acceptedPrivacyVersion` | string | sim | mínimo de 1 caracteres |
| `email` | string | sim | máximo de 255 caracteres |
| `name` | string | sim | máximo de 120 caracteres |
| `password` | string | sim | mínimo de 1 caracteres |

### RenameCategoryRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `name` | string | sim | máximo de 100 caracteres |

### ResetPasswordRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `newPassword` | string | sim | mínimo de 1 caracteres |
| `token` | string | sim | mínimo de 1 caracteres |

### SaveAccountRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `bank` | string ou nulo | não | máximo de 100 caracteres |
| `competenceOffset` | integer (int32) | não | Meses subtraídos da data de referência para sugerir a competência (ADR-0008). mínimo 0, máximo 12 |
| `initialBalance` | number | sim | Até duas casas decimais; pode ser negativo |
| `name` | string | sim | máximo de 100 caracteres |
| `type` | `CHECKING` \| `SAVINGS` \| `CREDIT_CARD` | sim | `CREDIT_CARD` é recusado: cartões têm cadastro próprio |

### UpdateProfileRequest

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `name` | string | sim | máximo de 120 caracteres |
| `timezone` | string | sim | mínimo de 1 caracteres |

### UserResponse

| Campo | Tipo | Pode ser nulo | Descrição |
| --- | --- | --- | --- |
| `email` | string | não |  |
| `id` | string (uuid) | não |  |
| `name` | string | não |  |
