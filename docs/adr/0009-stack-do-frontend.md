# ADR-0009 — Stack do frontend: React, Vite, TypeScript, TanStack Query, Router, Recharts e date-fns

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Justificativas documentadas no PDF de requisitos (§4.2).

## Contexto

O PDF (§4.2) justifica cada peça: React 18 + Vite (ecossistema maduro e experiência prévia), TypeScript (segurança de tipos em projeto de longa duração), React Query (cache, refetch e atualizações otimistas), React Router v6 (SPA com rotas protegidas), Recharts (leve e com componentes React nativos) e date-fns (leve e essencial para a lógica de competência).

## Decisão

SPA em React 18 + Vite 5 + TypeScript 5.6, com `@tanstack/react-query` v5 para estado do servidor, `react-router-dom` v6, `recharts` v3 e `date-fns` v4. Ícones com `lucide-react`.

## Consequências

- Estado do servidor fica no React Query; não há biblioteca de estado global.
- Cálculos de datas e competência no cliente usam `date-fns`.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `0fd9da7`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2
- `frontend/package.json`
- `README.md`

## Perguntas em aberto

- Nenhuma.
