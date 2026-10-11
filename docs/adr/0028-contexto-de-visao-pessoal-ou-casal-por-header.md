# ADR-0028 — Contexto de visão pessoal ou casal definido pelo cabeçalho X-View-Context

- Status: Aceito (retroativo)
- Data: 2026-06-27 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Requisito no PDF (§2.7, toggle de contexto); mecanismo confirmado no código.

## Contexto

O PDF (§2.7) pede um toggle entre visão pessoal e visão de casal, com consolidação das finanças dos dois.

## Decisão

O frontend mantém o contexto em `ViewContext` e envia o cabeçalho `X-View-Context` (`PERSONAL` por padrão, ou `COUPLE`). Os casos de uso de listagem (transações, contas e metas) escolhem entre a consulta pessoal e a consulta combinada com o parceiro. Sem vínculo ativo, a visão de casal falha com `BusinessException` (`NO_ACTIVE_COUPLE`). O cabeçalho é liberado no CORS.

## Consequências

- Cada endpoint de listagem precisa tratar o cabeçalho; foi confirmado em transações, contas e metas.
- O cabeçalho é enviado pelo cliente; o isolamento depende de o backend validar o vínculo do casal (ADR-0029).

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `5b56d13`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.7
- `frontend/src/context/ViewContext.tsx`
- `ListTransactionsUseCase.java`, `ListAccountsUseCase.java`, `ListGoalsUseCase.java`
- `SecurityConfig.java` (CORS)

## Perguntas em aberto

- Todos os demais endpoints (orçamento, dashboard, fluxo de caixa) respeitam o contexto? Não verifiquei.
