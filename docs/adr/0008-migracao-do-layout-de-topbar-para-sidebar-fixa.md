# ADR-0008 — Migração do layout de Topbar para Sidebar fixa

- Status: Aceito (retroativo)
- Data: 2026-06-28
- Confiança: alta

## Contexto

A navegação da aplicação utilizava originalmente uma barra de topo horizontal (Topbar), que causava problemas de colapso de margens com a área de conteúdo e duplicidade visual com outras ações integradas na tela principal. Além disso, havia dificuldade para comportar o toggle global do contexto de "Casal".

## Decisão

Migrou-se a navegação da aplicação substituindo a Topbar por uma Sidebar Fixa de 220px de largura à esquerda (no layout Desktop), agrupando navegação, seções de configurações e embutindo no rodapé o toggle que interage com o estado de ViewContext. Para visualização Mobile, a sidebar tornou-se um drawer (menu hambúrguer oculto por padrão).

## Consequências

- Benefícios: Melhor aproveitamento do espaço vertical, navegação padronizada e simplificação do layout para comportar as ações antigas de topo na própria estrutura de conteúdo das páginas (Page Headers).
- Desafios: Refatorações nos layouts aninhados e tratamento de comportamentos do drawer responsivo (Z-index, overlays, fechamento por cliques).

## Alternativas consideradas

- Manutenção da Topbar expandida para duas linhas (descartada em prol do melhor aproveitamento vertical e design).

## Evidências

- Commits: `a671b40`
- Arquivos: `frontend/src/components/Sidebar.tsx`, `frontend/src/routes/ProtectedRoute.tsx`
- Issues e PRs: Issue #38, PR #46

## Perguntas em aberto

- Nenhuma.
