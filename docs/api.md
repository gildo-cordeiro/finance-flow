# FinanceFlow API (v1)

> Gerado pelo `ApiDocsTest` a partir do OpenAPI (ADR-0033). Não edite à mão: rode
> `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'` em `backend/`.

Rotas autenticadas exigem `Authorization: Bearer <access token>`. Erros seguem Problem Details com um `code` estável (ADR-0027).

## Autenticação

Cadastro, login e sessão. O refresh token vai só no cookie HttpOnly `refresh_token` (ADR-0026).

### `POST /api/v1/auth/login`

Entra com e-mail e senha.

Pública.

Corpo: [LoginRequest](#loginrequest)

| Status | Resposta |
|---|---|
| 200 | [AuthResponse](#authresponse) |
| 401 | [ProblemDetail](#problemdetail): `INVALID_CREDENTIALS` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |
| 429 | [ProblemDetail](#problemdetail): `TOO_MANY_REQUESTS` |

### `POST /api/v1/auth/logout`

Encerra a sessão.

Revoga o refresh token do cookie e apaga o cookie.

Pública.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `refresh_token` | cookie | string | não |

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |

### `POST /api/v1/auth/password/forgot`

Pede o link de redefinição de senha.

Responde 204 exista ou não o e-mail, para não revelar o cadastro (RF-004).

Pública.

Corpo: [ForgotPasswordRequest](#forgotpasswordrequest)

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |
| 429 | [ProblemDetail](#problemdetail): `TOO_MANY_REQUESTS` |

### `POST /api/v1/auth/password/reset`

Redefine a senha com o token do e-mail.

Pública.

Corpo: [ResetPasswordRequest](#resetpasswordrequest)

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED`, `INVALID_RESET_TOKEN` |

### `GET /api/v1/auth/privacy-policy`

Versão vigente da política de privacidade.

Pública.

| Status | Resposta |
|---|---|
| 200 | [PrivacyPolicyResponse](#privacypolicyresponse) |

### `POST /api/v1/auth/refresh`

Renova o access token.

Usa o cookie `refresh_token` e devolve um novo par de tokens (rotação).

Pública.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `refresh_token` | cookie | string | não |

| Status | Resposta |
|---|---|
| 200 | [AuthResponse](#authresponse) |
| 401 | [ProblemDetail](#problemdetail): `INVALID_REFRESH_TOKEN` |
| 429 | [ProblemDetail](#problemdetail): `TOO_MANY_REQUESTS` |

### `POST /api/v1/auth/register`

Cria a conta e abre a sessão.

A senha precisa de ao menos 8 caracteres, uma letra e um número. `acceptedPrivacyVersion` deve ser a versão vigente da política.

Pública.

Corpo: [RegisterRequest](#registerrequest)

| Status | Resposta |
|---|---|
| 201 | [AuthResponse](#authresponse) |
| 409 | [ProblemDetail](#problemdetail): `EMAIL_ALREADY_USED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

## Categorias

Categorias de receita e despesa, em dois níveis.

### `GET /api/v1/categories`

Lista as categorias em árvore.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `type` | query | `INCOME` \| `EXPENSE` | não |
| `includeArchived` | query | boolean (padrão `false`) | não |

| Status | Resposta |
|---|---|
| 200 | [CategoryResponse](#categoryresponse)[] |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |

### `POST /api/v1/categories`

Cria uma categoria ou subcategoria.

Exige `Authorization: Bearer`.

Corpo: [CreateCategoryRequest](#createcategoryrequest)

| Status | Resposta |
|---|---|
| 201 | [CategoryResponse](#categoryresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 409 | [ProblemDetail](#problemdetail): `CATEGORY_NAME_TAKEN` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `PUT /api/v1/categories/{id}`

Renomeia uma categoria.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

Corpo: [RenameCategoryRequest](#renamecategoryrequest)

| Status | Resposta |
|---|---|
| 200 | [CategoryResponse](#categoryresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `CATEGORY_NAME_TAKEN` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `DELETE /api/v1/categories/{id}`

Exclui uma categoria sem uso.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `CATEGORY_IN_USE`, `CATEGORY_HAS_SUBCATEGORIES` |

### `POST /api/v1/categories/{id}/archive`

Arquiva uma categoria e as subcategorias.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [CategoryResponse](#categoryresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |

### `POST /api/v1/categories/{id}/merge`

Mescla a categoria em outra.

Move transações e orçamentos para `targetId` e arquiva a categoria de origem.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

Corpo: [MergeCategoryRequest](#mergecategoryrequest)

| Status | Resposta |
|---|---|
| 200 | [CategoryResponse](#categoryresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `INVALID_CATEGORY_MERGE` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `POST /api/v1/categories/{id}/unarchive`

Desarquiva uma categoria.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [CategoryResponse](#categoryresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `PARENT_CATEGORY_ARCHIVED` |

## Contas

Contas correntes e poupanças. O saldo é calculado, não guardado (ADR-0011).

### `GET /api/v1/accounts`

Lista as contas com o saldo atual.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `includeArchived` | query | boolean (padrão `false`) | não |

| Status | Resposta |
|---|---|
| 200 | [AccountResponse](#accountresponse)[] |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |

### `POST /api/v1/accounts`

Cria uma conta.

Cartão de crédito tem cadastro próprio.

Exige `Authorization: Bearer`.

Corpo: [SaveAccountRequest](#saveaccountrequest)

| Status | Resposta |
|---|---|
| 201 | [AccountResponse](#accountresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `GET /api/v1/accounts/{id}`

Detalha uma conta.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [AccountResponse](#accountresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |

### `PUT /api/v1/accounts/{id}`

Altera uma conta.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

Corpo: [SaveAccountRequest](#saveaccountrequest)

| Status | Resposta |
|---|---|
| 200 | [AccountResponse](#accountresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `ACCOUNT_IS_CREDIT_CARD` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `DELETE /api/v1/accounts/{id}`

Exclui uma conta sem transações.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `ACCOUNT_IN_USE`, `ACCOUNT_IS_CREDIT_CARD` |

### `POST /api/v1/accounts/{id}/archive`

Arquiva uma conta.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [AccountResponse](#accountresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `ACCOUNT_IS_CREDIT_CARD` |

### `POST /api/v1/accounts/{id}/unarchive`

Desarquiva uma conta.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [AccountResponse](#accountresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `ACCOUNT_IS_CREDIT_CARD` |

## Orçamento

Planejado por categoria e mês, comparado ao realizado pela competência (RN-02).

### `GET /api/v1/budgets/{month}`

Orçamento do mês por categoria.

O realizado soma as transações da competência em qualquer status, sem transferências. Na categoria mãe, planejado e realizado incluem as subcategorias. Categorias arquivadas só aparecem com planejado ou realizado no mês.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `month` | path | string (yyyy-MM) | sim |

| Status | Resposta |
|---|---|
| 200 | [BudgetResponse](#budgetresponse) |
| 400 | [ProblemDetail](#problemdetail): `BAD_REQUEST` |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |

### `PUT /api/v1/budgets/{month}/categories/{categoryId}`

Define o planejado de uma categoria no mês.

Zero remove o planejado.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `month` | path | string (yyyy-MM) | sim |
| `categoryId` | path | string (uuid) | sim |

Corpo: [SetPlannedRequest](#setplannedrequest)

| Status | Resposta |
|---|---|
| 200 | [BudgetResponse](#budgetresponse) |
| 400 | [ProblemDetail](#problemdetail): `BAD_REQUEST` |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `CATEGORY_ARCHIVED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `POST /api/v1/budgets/{month}/copy-from-previous`

Copia o planejado do mês anterior.

Sem `overwrite`, mantém os valores já planejados no mês. Categorias arquivadas não são copiadas.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `month` | path | string (yyyy-MM) | sim |
| `overwrite` | query | boolean (padrão `false`) | não |

| Status | Resposta |
|---|---|
| 200 | [BudgetResponse](#budgetresponse) |
| 400 | [ProblemDetail](#problemdetail): `BAD_REQUEST` |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 409 | [ProblemDetail](#problemdetail): `NO_PREVIOUS_BUDGET` |

## Perfil

Dados do usuário autenticado.

### `GET /api/v1/me`

Perfil do usuário autenticado.

Exige `Authorization: Bearer`.

| Status | Resposta |
|---|---|
| 200 | [ProfileResponse](#profileresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |

### `PUT /api/v1/me`

Altera nome e fuso horário.

Exige `Authorization: Bearer`.

Corpo: [UpdateProfileRequest](#updateprofilerequest)

| Status | Resposta |
|---|---|
| 200 | [ProfileResponse](#profileresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

## Transações

Receitas e despesas em conta. Transferências, parcelas e compras no cartão têm cadastro próprio. Cada transação tem competência, vencimento e pagamento (ADR-0007).

### `GET /api/v1/transactions`

Lista as transações do período com os totais.

`dateField` escolhe a data do filtro (competência, vencimento ou pagamento). `categoryId` inclui as subcategorias. Os totais cobrem o filtro todo, não só a página, e ignoram transferências.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `from` | query | string (date) | sim |
| `to` | query | string (date) | sim |
| `dateField` | query | `COMPETENCE` \| `DUE` \| `PAYMENT` (padrão `COMPETENCE`) | não |
| `accountId` | query | string (uuid) | não |
| `categoryId` | query | string (uuid) | não |
| `status` | query | (`PLANNED` \| `PENDING` \| `PAID` \| `OVERDUE`)[] | não |
| `type` | query | `INCOME` \| `EXPENSE` \| `TRANSFER` | não |
| `q` | query | string | não |
| `page` | query | integer (int32) (padrão `0`) | não |
| `size` | query | integer (int32) (padrão `50`) | não |

| Status | Resposta |
|---|---|
| 200 | [TransactionPageResponse](#transactionpageresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `POST /api/v1/transactions`

Cria uma receita ou despesa.

Sem `competenceMonth`, usa a competência sugerida. Sem `status`, fica pendente, ou paga se houver `paymentDate`; o atraso é calculado (RN-06).

Exige `Authorization: Bearer`.

Corpo: [SaveTransactionRequest](#savetransactionrequest)

| Status | Resposta |
|---|---|
| 201 | [TransactionResponse](#transactionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED`, `USE_CARD_ENDPOINT` |

### `GET /api/v1/transactions/competence-suggestion`

Sugere a competência para uma conta e data.

Mês da data menos o deslocamento de competência da conta (ADR-0008).

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `accountId` | query | string (uuid) | sim |
| `date` | query | string (date) | sim |

| Status | Resposta |
|---|---|
| 200 | [CompetenceSuggestionResponse](#competencesuggestionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED` |

### `GET /api/v1/transactions/{id}`

Detalha uma transação.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [TransactionResponse](#transactionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |

### `PUT /api/v1/transactions/{id}`

Altera uma transação.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

Corpo: [SaveTransactionRequest](#savetransactionrequest)

| Status | Resposta |
|---|---|
| 200 | [TransactionResponse](#transactionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `TRANSACTION_NOT_EDITABLE_HERE` |
| 422 | [ProblemDetail](#problemdetail): `VALIDATION_FAILED`, `USE_CARD_ENDPOINT` |

### `DELETE /api/v1/transactions/{id}`

Exclui uma transação.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 204 | Sem conteúdo |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `TRANSACTION_NOT_EDITABLE_HERE` |

### `POST /api/v1/transactions/{id}/pay`

Marca a transação como paga.

Sem `paymentDate`, usa a data de hoje.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

Corpo: [PayTransactionRequest](#paytransactionrequest) (opcional)

| Status | Resposta |
|---|---|
| 200 | [TransactionResponse](#transactionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `TRANSACTION_NOT_EDITABLE_HERE` |

### `POST /api/v1/transactions/{id}/unpay`

Desfaz o pagamento.

Exige `Authorization: Bearer`.

| Parâmetro | Em | Tipo | Obrigatório |
|---|---|---|---|
| `id` | path | string (uuid) | sim |

| Status | Resposta |
|---|---|
| 200 | [TransactionResponse](#transactionresponse) |
| 401 | [ProblemDetail](#problemdetail): `UNAUTHORIZED` |
| 404 | [ProblemDetail](#problemdetail): `NOT_FOUND` |
| 409 | [ProblemDetail](#problemdetail): `TRANSACTION_NOT_EDITABLE_HERE` |

## Esquemas

### AccountResponse

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string (uuid) |  |
| `name` | string |  |
| `type` | `CHECKING` \| `SAVINGS` \| `CREDIT_CARD` |  |
| `bank` | string \| null |  |
| `initialBalance` | number |  |
| `competenceOffset` | integer (int32) |  |
| `archived` | boolean |  |
| `balance` | number |  |

### AuthResponse

| Campo | Tipo | Observação |
|---|---|---|
| `accessToken` | string |  |
| `expiresIn` | integer (int64) |  |
| `user` | [UserResponse](#userresponse) |  |

### BudgetLineResponse

| Campo | Tipo | Observação |
|---|---|---|
| `categoryId` | string (uuid) |  |
| `name` | string |  |
| `type` | `INCOME` \| `EXPENSE` |  |
| `archived` | boolean |  |
| `directPlanned` | number \| null |  |
| `planned` | number \| null |  |
| `realized` | number |  |
| `realizedPaid` | number |  |
| `remaining` | number \| null |  |
| `percentUsed` | integer (int32) \| null |  |
| `children` | [BudgetLineResponse](#budgetlineresponse)[] |  |

### BudgetResponse

| Campo | Tipo | Observação |
|---|---|---|
| `month` | string (yyyy-MM) | ex.: `2026-10` |
| `categories` | [BudgetLineResponse](#budgetlineresponse)[] |  |
| `totals` | [TotalsByTypeResponse](#totalsbytyperesponse) |  |
| `previousMonthPlanned` | number |  |

### BudgetTotalsResponse

| Campo | Tipo | Observação |
|---|---|---|
| `planned` | number |  |
| `realized` | number |  |
| `realizedPaid` | number |  |
| `remaining` | number |  |
| `percentUsed` | integer (int32) \| null |  |

### CategoryResponse

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string (uuid) |  |
| `name` | string |  |
| `type` | `INCOME` \| `EXPENSE` |  |
| `parentId` | string (uuid) \| null |  |
| `archived` | boolean |  |
| `subcategories` | [CategoryResponse](#categoryresponse)[] |  |

### CompetenceSuggestionResponse

| Campo | Tipo | Observação |
|---|---|---|
| `competenceMonth` | string (yyyy-MM) | ex.: `2026-10` |

### CreateCategoryRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | string | sim | máx. 100 caracteres |
| `type` | `INCOME` \| `EXPENSE` | sim |  |
| `parentId` | string (uuid) \| null | não |  |

### ForgotPasswordRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `email` | string | sim | máx. 255 caracteres |

### LoginRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `email` | string | sim | não pode ficar em branco |
| `password` | string | sim | não pode ficar em branco |

### MergeCategoryRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `targetId` | string (uuid) | sim |  |

### PayTransactionRequest

| Campo | Tipo | Observação |
|---|---|---|
| `paymentDate` | string (date) \| null |  |

### PrivacyPolicyResponse

| Campo | Tipo | Observação |
|---|---|---|
| `version` | string |  |

### ProblemDetail

Problem Details (RFC 9457) com o `code` estável do erro

| Campo | Tipo | Observação |
|---|---|---|
| `type` | string |  |
| `title` | string |  |
| `status` | integer (int32) |  |
| `detail` | string | Mensagem para o usuário |
| `instance` | string |  |
| `code` | string | Identificador estável do erro |
| `errors` | object[] | Campos recusados, nos erros de validação |

### ProfileResponse

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string (uuid) |  |
| `name` | string |  |
| `email` | string |  |
| `timezone` | string |  |
| `currency` | string |  |
| `privacyVersion` | string \| null |  |

### RegisterRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | string | sim | máx. 120 caracteres |
| `email` | string | sim | máx. 255 caracteres |
| `password` | string | sim | não pode ficar em branco |
| `acceptedPrivacyVersion` | string | sim | não pode ficar em branco |

### RenameCategoryRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | string | sim | máx. 100 caracteres |

### ResetPasswordRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `token` | string | sim | não pode ficar em branco |
| `newPassword` | string | sim | não pode ficar em branco |

### SaveAccountRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | string | sim | máx. 100 caracteres |
| `type` | `CHECKING` \| `SAVINGS` \| `CREDIT_CARD` | sim |  |
| `bank` | string \| null | não | máx. 100 caracteres |
| `initialBalance` | number | sim |  |
| `competenceOffset` | integer (int32) | não | mínimo 0; máximo 12 |

### SaveTransactionRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `type` | `INCOME` \| `EXPENSE` \| `TRANSFER` | sim |  |
| `description` | string | sim | máx. 255 caracteres |
| `amount` | number | sim | mínimo 0.01 |
| `accountId` | string (uuid) | sim |  |
| `categoryId` | string (uuid) | sim |  |
| `competenceMonth` | string (yyyy-MM) \| null | não | ex.: `2026-10` |
| `dueDate` | string (date) \| null | não |  |
| `paymentDate` | string (date) \| null | não |  |
| `status` | `PLANNED` \| `PENDING` \| `PAID` \| `OVERDUE` \| null | não |  |
| `visibility` | `PRIVATE` \| `VISIBLE` \| `SHARED` | não |  |

### SetPlannedRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `plannedAmount` | number | sim | mínimo 0 |

### TotalsByTypeResponse

| Campo | Tipo | Observação |
|---|---|---|
| `income` | [BudgetTotalsResponse](#budgettotalsresponse) |  |
| `expense` | [BudgetTotalsResponse](#budgettotalsresponse) |  |

### TotalsResponse

| Campo | Tipo | Observação |
|---|---|---|
| `count` | integer (int64) |  |
| `income` | number |  |
| `expense` | number |  |
| `balance` | number |  |

### TransactionPageResponse

| Campo | Tipo | Observação |
|---|---|---|
| `items` | [TransactionResponse](#transactionresponse)[] |  |
| `page` | integer (int32) |  |
| `size` | integer (int32) |  |
| `totals` | [TotalsResponse](#totalsresponse) |  |

### TransactionResponse

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string (uuid) |  |
| `type` | `INCOME` \| `EXPENSE` \| `TRANSFER` |  |
| `description` | string |  |
| `amount` | number |  |
| `accountId` | string (uuid) |  |
| `accountName` | string |  |
| `categoryId` | string (uuid) \| null |  |
| `categoryName` | string \| null |  |
| `parentCategoryName` | string \| null |  |
| `competenceMonth` | string (yyyy-MM) | ex.: `2026-10` |
| `dueDate` | string (date) \| null |  |
| `paymentDate` | string (date) \| null |  |
| `status` | `PLANNED` \| `PENDING` \| `PAID` \| `OVERDUE` |  |
| `visibility` | `PRIVATE` \| `VISIBLE` \| `SHARED` |  |
| `installmentNumber` | integer (int32) \| null |  |
| `totalInstallments` | integer (int32) \| null |  |
| `transferGroupId` | string (uuid) \| null |  |
| `transferDirection` | string \| null |  |
| `recurring` | boolean |  |

### UpdateProfileRequest

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `name` | string | sim | máx. 120 caracteres |
| `timezone` | string | sim | não pode ficar em branco |

### UserResponse

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string (uuid) |  |
| `name` | string |  |
| `email` | string |  |
