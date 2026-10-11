# ADR-0034 — Frontend organizado por features

- Status: Aceito (retroativo)
- Data: 2026-07-12 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Estrutura descrita no README (2026-06-22) e aplicada nos refactors de 2026-07-12.

## Contexto

O README descreve a estrutura do frontend por domínio. Os commits `023398d` e `033206f` modularizaram transações, painel e configurações para segui-la.

## Decisão

`frontend/src/features/<domínio>/` com `components/`, `hooks/` (React Query), `api/`, `schemas/` e `types.ts`; `components/ui` para componentes compartilhados; `context/`, `routes/`, `services/api.ts`, `lib/` e `utils/` globais.

## Consequências

- Mudanças de um domínio ficam concentradas na pasta da feature.
- Componentes usados por várias features devem subir para `components/` (ver ADR-0038).

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `023398d`, `033206f`, `f4a7e43`
- `README.md` (seção 'Estrutura do Frontend')
- `frontend/src/features/`

## Perguntas em aberto

- Nenhuma.
