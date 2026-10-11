# ADR-0031 — Navegação principal por sidebar fixa

- Status: Aceito (retroativo)
- Data: 2026-06-28 (data do commit ou do artefato que introduziu a decisão)
- Confiança: baixa
- Origem do 'porquê': Observada no histórico; o motivo não está documentado.

## Contexto

A navegação principal era uma barra horizontal no topo. O commit `a671b40` a substituiu.

## Decisão

Sidebar fixa com os módulos (Dashboard, Orçamento, Transações, Fluxo de Caixa, Contas e Cartões, Objetivos e Configurações), perfil e saída no rodapé. O item ativo é calculado pela rota atual (`useLocation`).

## Consequências

- Mais espaço vertical para o conteúdo e navegação sempre visível.
- Ocupa largura horizontal em telas pequenas.

## Alternativas consideradas

Topbar horizontal: substituída; motivo não documentado.

## Evidências

- Commit `a671b40`
- `frontend/src/components/Sidebar.tsx`

## Perguntas em aberto

- Motivação não documentada — confirmar com Gildo.
