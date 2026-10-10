# ADR-0009 — Remoção da gestão de categorias da tela de transações

- Status: Aceito (retroativo)
- Data: 2026-06-30
- Confiança: alta

## Contexto

Anteriormente, o sistema exibia a aba de "Categorias" e seu respectivo gerenciamento em árvore na própria visualização da tela principal de Transações. Isso causava uma duplicidade de interface desnecessária e uma sobrecarga de informações num módulo focado unicamente na extração financeira.

## Decisão

A aba de gerenciamento de categorias foi removida por completo da rota `/transactions`. Todo o fluxo de manutenção e hierarquia das categorias foi isolado e centralizado na página dedicada de Configurações, mantendo apenas a capacidade de filtrar e selecionar categorias na página de Lançamentos.

## Consequências

- Benefícios: Despoluição visual da interface de listagem de despesas (a tela mais utilizada) e melhor segregação de tarefas de parametrização do sistema (Configurações).
- Desafios: Usuários agora precisam navegar até a página de Configurações para criar ou editar novas categorias durante um lançamento, a menos que componentes específicos de atalho sejam futuramente desenvolvidos.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `5f4c3ed`
- Arquivos: `frontend/src/features/transactions/components/Transactions.tsx`
- Issues e PRs: PR #53

## Perguntas em aberto

- Nenhuma.
