# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FinanceFlow: controle financeiro pessoal (com gestão em casal). Monorepo com `backend/` (Kotlin + Spring Boot 4, JVM 21, PostgreSQL 16, Flyway) e `frontend/` (React 18 + Vite + TypeScript + Tailwind). Código, commits, docs e mensagens de erro são em português.

## Fontes da verdade

- A especificação de requisitos (link no `README.md`) manda. Códigos como `RN-01`, `RF-025`, `RNF-09` vêm dela.
- `docs/adr/` registra o porquê de cada decisão (índice em `docs/adr/README.md`, modelo em `_template.md`). ADR aceito não é reescrito: é substituído por um novo. Proponha um ADR quando a mudança envolver uma decisão; quem decide criar, aceitar ou dispensar é o desenvolvedor. Mudanças em `build.gradle.kts`, `package.json`, migrations, segurança, CI ou Dockerfile normalmente pedem essa avaliação.
- Skills de agentes vão em `.claude/skills/` (ADR-0035), escritas a partir da especificação e dos ADRs, não do código: `backend-kotlin` e `frontend-react` trazem os padrões de cada ponta. Ao mudar um ADR, revise as skills que o citam.

## Comandos

```bash
docker compose up -d db                     # PostgreSQL local (raiz do repo)

cd backend
./gradlew bootRun                           # http://localhost:8080, health em /actuator/health
./gradlew test koverVerify                  # o que o CI roda; exige Docker (Testcontainers), cobertura mínima 70%
./gradlew test --tests 'com.financeflow.auth.api.AuthApiTest'          # uma classe
./gradlew test --tests 'com.financeflow.auth.api.AuthApiTest.nome*'    # um teste (nomes com crase: use curinga)

cd frontend
npm run dev                                 # http://localhost:5173
npm run lint && npm run test && npm run build   # o que o CI roda
npx vitest run src/utils/formatters.test.ts     # um arquivo
```

O hook `pre-push` (husky) roda lint e testes do frontend.

`APP_JWT_SECRET` e `APP_EMAIL_PROVIDER` têm valores de desenvolvimento no `application.yml`. Produção roda com `SPRING_PROFILES_ACTIVE=prod`, que tira esses padrões e não sobe sem eles (`application-prod.yml`, `ProductionGuard`). Se a aplicação falhar com "Migration checksum mismatch", o banco local é de uma versão antiga do projeto: recrie o volume (`docker compose down -v && docker compose up -d db`) em vez de usar `flyway repair` ou editar a migration.

## Backend

Monólito modular (ADR-0001): um pacote por domínio em `com.financeflow` (`auth`, `account`, `transaction`, `invoice`, `budget`, ...). Um módulo usa outro só pelo pacote raiz dele (serviços e eventos públicos, ex.: `com.financeflow.auth.UserRegistered`), nunca pelos subpacotes; para reagir a eventos, use `ApplicationEvent`. `ModulesTest` (Spring Modulith) e `LayersTest` (ArchUnit) em `architecture/` verificam isso e a direção das camadas (ADR-0034).

Rotas e contratos da API ficam em `docs/api.md`, gerado do OpenAPI pelo `ApiDocsTest` (ADR-0033), não nos READMEs nem neste arquivo. Ao mudar um controller ou DTO, regere com `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`.

Camadas por módulo (ADR-0028): `domain` (regras puras, sem Spring/JPA, testadas sem banco), `application` (casos de uso, transação, filtro por usuário), `infra` (entidades JPA, Spring Data, adaptadores), `api` (controllers; DTOs em `api/dto/<Recurso>Dtos.kt`, nunca no arquivo do controller). `api` não vê `infra`; `application` usa de `infra` só entidades e repositórios, e entidades não saem do caso de uso. O que é comum fica em `shared/` (`error`, `security`, `config`, `ratelimit`). O `backend/README.md` detalha erros, autenticação e testes.

Regras que atravessam o código:

- **Isolamento** (ADR-0012): toda consulta filtra pelo usuário autenticado (`CurrentUser.id()`) no repositório, ex.: `findByIdAndUserId`. Recurso de outro usuário responde 404 (`NotFoundException`), nunca 403.
- **Erros** (ADR-0027): sempre Problem Details com `code` estável, lançando as exceções de `shared/error/Exceptions.kt`; o `GlobalExceptionHandler` faz o mapeamento.
- **Banco** (ADR-0003, ADR-0004): schema só por migrations Flyway (`ddl-auto: none`); migration aplicada nunca é editada, mudança vai numa nova `V<n>__*.sql`. UUIDs são gerados pela aplicação; dinheiro é `NUMERIC(19,4)` / `BigDecimal`. Chaves que partem de `users` usam `ON DELETE CASCADE` (ADR-0019).
- **Três datas por transação** (ADR-0007, ADR-0008): `competence_date` (sempre dia 1 do mês), `due_date` e `payment_date` (preenchida se, e somente se, `status = PAID`). Orçamento usa só a competência. Competência sugerida = mês da data de referência − `competence_offset` da conta/cartão/recorrência; a sugestão nunca sobrescreve um valor informado.
- **Valores derivados não são colunas** (ADR-0011): saldo da conta e realizado do orçamento são calculados. Total da fatura também (ADR-0009).
- Use o `Clock` injetado (`shared/config/ClockConfig.kt`), não `now()` direto, para manter as regras de data testáveis.

### Testes

- `domain`: JUnit 5 puro (MockK disponível).
- Integração: estende `IntegrationTest` (um PostgreSQL por Testcontainers para a suíte toda). API: estende `support.ApiTest` (`mockMvc`, `jdbc`, `createUser()`, `TestUser.auth()`).
- Todo endpoint que recebe id tem um `assertNotVisibleTo`, e toda listagem um `assertNotListedFor`.
- Os testes não limpam o banco: nada pode depender de tabela vazia.

## Frontend

Organizado por features (ADR-0029): `src/features/<domínio>/` com `components/`, `hooks/` (TanStack Query), `api/`, `schemas/` (Zod) e `types.ts`; compartilhado em `components/ui` (shadcn), `lib/`, `routes/`, `services/`. Divida componentes acima de ~300 linhas. Tokens visuais seguem `docs/design-system.md`. Armazenamento de tokens de auth: ADR-0026.

## Git

Branches `feat/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` saindo da `main` e voltando por PR (a `main` é protegida e exige CI verde). Commits em Conventional Commits, em português, com o id da tarefa quando houver: `feat(auth): cadastro, login e filtro JWT [F1-04]`. Use o `.github/pull_request_template.md`, que pede revisão de ADRs e skills. O código tem poucos comentários: comente só o porquê não óbvio (geralmente citando o ADR ou a regra).
