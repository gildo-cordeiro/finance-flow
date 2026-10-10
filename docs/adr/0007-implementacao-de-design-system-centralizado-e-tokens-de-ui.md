# ADR-0007 — Implementação de Design System Centralizado e Tokens de UI

- Status: Aceito (retroativo)
- Data: 2026-06-28
- Confiança: alta

## Contexto

Com o sistema ganhando telas e componentes novos, começou a surgir inconsistência visual em componentes fundamentais, quebras de espaçamento e dificuldade em manter a coerência das cores padrão através do Tailwind (diferentes classes para botões e cards espalhadas pela codebase).

## Decisão

Foi criado e documentado um Design System próprio (`docs/design-system.md`), que centraliza os tokens visuais em componentes agnósticos (UI base). Tais componentes usam uma paleta fixa (configurada via Tailwind) para tipografia, contrastes e blocos semânticos.

## Consequências

- Benefícios: Facilita significativamente manutenções de layout e onboarding de novos desenvolvedores frontend, que agora utilizam componentes base em vez de declarar longas cadeias de utilitários css nativos em todo lugar.
- Desafios: Refatoração extensa para limpar componentes antigos e adaptá-los à nova biblioteca unificada.

## Alternativas consideradas

- Utilização de bibliotecas externas completas como Material-UI ou Chakra UI (aparentemente rejeitado em favor de customização total via Tailwind).

## Evidências

- Commits: `730e86e`
- Arquivos: `docs/design-system.md`, `frontend/tailwind.config.js`
- Issues e PRs: Issue #37, PR #45

## Perguntas em aberto

- Nenhuma.
