# ADR-0018 — Categorias organizadas em categoria e subcategoria

- Status: Aceito (retroativo)
- Data: 2026-06-23 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no schema e nos commits; o motivo não está documentado.

## Contexto

O orçamento e as transações são organizados por categoria, com subcategorias (por exemplo, Alimentação e Supermercado).

## Decisão

A tabela `categories` tem `parent_id` (auto-referência) e `UNIQUE (user_id, name, parent_id)`. Categorias padrão podem ser editadas (`6c05474`). A gestão de categorias saiu da tela de Transações e foi para Configurações (`5f4c3ed`). A V8 adicionou `visibility` (padrão `PERSONAL`, ver ADR-0029).

## Consequências

- Transações e orçamentos referenciam uma categoria; a categoria não tem campo de tipo (receita ou despesa), só `visibility`.
- Excluir uma categoria remove em cascata suas subcategorias (`ON DELETE CASCADE`).

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `e369260`, `6c05474`, `5f4c3ed`
- Migrations `V3` e `V8`
- `frontend/src/features/auth/components/settings/CategoriesTab.tsx`

## Perguntas em aberto

- A árvore tem exatamente dois níveis ou pode crescer? A ausência de tipo (receita/despesa) é proposital?
