# ADR-0004 — Migração para React-Hook-Form e Zod nos formulários

- Status: Aceito (retroativo)
- Data: 2026-06-26
- Confiança: alta

## Contexto

A manipulação de estado, exibição de erros e validação manual de campos nos formulários (login, cadastro, transações, etc) se tornava trabalhosa e repetitiva ao longo do crescimento do frontend. Isso gerava código espalhado, difícil de unificar regras de validação complexas e inconsistências visuais nos componentes interativos.

## Decisão

Foi adotado o ecossistema `react-hook-form` acoplado ao `zod` para schema validation no frontend. Junto a isso, construiu-se componentes reutilizáveis base (`Button`, `Input`, `Select`) que abstraem a conexão com a biblioteca e tratam seus próprios estados de erro de forma centralizada.

## Consequências

- Benefícios: Padronização visual, centralização e unificação das lógicas de validação (através de schemas Zod), e abandono do verboso controle manual de estados (useState por field).
- Desafios: Aumento na curva de aprendizado para criação de novos componentes que precisam ser acoplados com `forwardRef` e contextos do `react-hook-form`.

## Alternativas consideradas

- Controle de formulário manual com estados React (abordagem abandonada).

## Evidências

- Commits: `0f455eb`
- Arquivos: `frontend/package.json`, `frontend/src/components/ui/Input.tsx`, `frontend/src/features/transactions/components/Transactions.tsx`
- Issues e PRs: PR #24

## Perguntas em aberto

- Nenhuma.
