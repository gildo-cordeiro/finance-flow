# ADR-0037 — Tokens de texto e tipografia mínima legível

- Status: Aceito (retroativo)
- Data: 2026-10-10 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Registrada na issue #62 (UX-01) e nos PRs #83, #84, #90 e #91.

## Contexto

A revisão de design de 2026-10-10 encontrou textos de 10 a 11px, labels em caixa alta com tracking aberto e cinzas escuros sobre fundo quase preto, o que prejudica a leitura de dados financeiros.

## Decisão

- Três tokens de texto: `text-text-primary` (`#F4F5FA`), `text-text-label` (`#C4C8D8`) e `text-text-muted` (`#9AA0B4`, contraste mínimo de 4.5:1 sobre `bg-bg-surface`). `text-text-secondary` permanece como alias legado de `text-label`.
- Tamanho mínimo de texto: 12px.
- Labels de campo e de card em 13px, `font-semibold`, sem caixa alta (`SectionLabel`).
- Cinza escuro (zinc 500 a 700) não é cor de texto; tons que não existem na paleta do Tailwind não devem ser usados.

## Consequências

- O #83 removeu `text-secondary` por engano e 112 usos ficaram sem cor até o PR #84 restaurar o alias.
- O PR #91 corrigiu 28 classes com tons inexistentes (por exemplo `bg-red-650`), que não geravam CSS.
- `text-label-xs` (11px) ficou como legado e não deve ser usado.

## Alternativas consideradas

Aumentar só o contraste sem mexer no tamanho: descartado, pois não resolve o texto de 10px.

## Evidências

- Commits `79a9560`, `3b94f4a`, `77ff15f`, `ae9e91a`
- PRs #83, #84, #90 e #91
- Issue #62
- `frontend/tailwind.config.js`
- `docs/design-system.md`

## Perguntas em aberto

- Nenhuma.
