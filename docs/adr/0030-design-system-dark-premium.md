# ADR-0030 — Design system escuro ("Dark Premium") com tokens e componentes base

- Status: Aceito (retroativo)
- Data: 2026-06-28 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentado em `docs/design-system.md`; o motivo da identidade visual não está registrado.

## Contexto

O commit `730e86e` introduziu o design system com tokens e componentes de UI reutilizáveis, e `docs/design-system.md` o descreve.

## Decisão

Tema escuro único. Tokens no `tailwind.config.js` (`bg-base`, `bg-surface`, `bg-elevated`, `border-subtle`, `brand`, `success`, `danger`, `warning`, `info` e cores de texto). Fonte Outfit, com Inter como reserva (`index.css`). Componentes base em `frontend/src/components/ui/` (`Card`, `Button`, `Input`, `Select`, `Badge`, `ProgressBar`, `MoneyValue`, `SectionLabel`, `EmptyState`, `Skeleton`).

## Consequências

- Telas novas devem reutilizar os componentes base e os tokens.
- Os valores dos tokens de texto mudaram em 2026-10-10 (ADR-0037).

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `730e86e`, `3231669`
- `docs/design-system.md`
- `frontend/tailwind.config.js`
- `frontend/src/components/ui/`
- `frontend/src/index.css`

## Perguntas em aberto

- Motivação da identidade visual não documentada — confirmar com Gildo.
