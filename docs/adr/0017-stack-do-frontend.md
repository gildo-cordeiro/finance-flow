# ADR-0017 — Stack do frontend: React, Vite, TypeScript, Tailwind, TanStack Query, Router, Recharts e date-fns

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-03, RNF-08).

## Contexto

O produto é web-first e precisa funcionar em navegador mobile a partir de 360 px (RNF-08).

## Decisão

SPA em React 18 com Vite e TypeScript; Tailwind CSS para estilo; TanStack Query para estado do servidor; React Router para rotas, com rotas privadas; Recharts para gráficos; date-fns para datas e competência.

## Consequências

- Mesma stack do projeto anterior, o que permite reaproveitar a base do frontend (ADR-0018).
- Regras de competência existem no backend; o frontend só exibe e sugere, nunca decide.

## Alternativas consideradas

- Não documentadas na especificação.

## Evidências

- Especificação: RES-03, RNF-08
- Projeto anterior: ADR antigo 0009

## Perguntas em aberto

- Nenhuma.
