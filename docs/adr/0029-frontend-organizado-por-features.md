# ADR-0029 — Frontend organizado por features

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão a partir do projeto anterior.

## Contexto

O frontend acompanha os módulos do backend (ADR-0001). No projeto anterior a organização por features funcionou, mas alguns componentes cresceram demais (o modal de lançamento chegou a 1.031 linhas).

## Decisão

- `src/features/<domínio>/` com `components/`, `hooks/` (TanStack Query), `api/`, `schemas/` (Zod) e `types.ts`.
- `components/ui` para componentes compartilhados (ADR-0018); `lib/`, `routes/` e `services/` globais.
- Componentes com mais de cerca de 300 linhas são divididos.

## Consequências

- Cada feature fica coesa e fácil de achar.
- Código compartilhado entre features precisa ser promovido para `components/` ou `lib/` com cuidado.

## Alternativas consideradas

- Organização por tipo (`components/`, `hooks/`, `pages/` globais): espalha cada feature pelo projeto.

## Evidências

- Projeto anterior: ADR antigo 0034, ADR antigo 0039; `TransactionFormModal.tsx`

## Perguntas em aberto

- Nenhuma.
