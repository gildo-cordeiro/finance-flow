# ADR-0013 — Categorias em dois níveis, com tipo, arquivadas em vez de excluídas

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RF-012, entidade Category).

## Contexto

No projeto anterior a categoria não tinha tipo (receita ou despesa) e `transactions.category_id` usava `ON DELETE CASCADE`: excluir uma categoria apagava as transações dela.

## Decisão

- `Category` tem `parent_id` (subcategoria) e `type` (`INCOME` ou `EXPENSE`). Só dois níveis.
- Cada usuário recebe um conjunto padrão de categorias no cadastro, copiado para ele (não compartilhado entre usuários).
- Categoria com transações não pode ser excluída: só arquivada ou mesclada em outra. A chave estrangeira usa `ON DELETE RESTRICT`.

## Consequências

- Nenhuma exclusão de categoria apaga histórico financeiro.
- O tipo permite filtrar categorias no formulário e validar receita contra despesa.

## Alternativas consideradas

- Árvore com profundidade livre: mais complexa sem necessidade descrita na especificação.
- Categorias padrão globais (`user_id` nulo), como no projeto anterior: editar uma afeta todos os usuários.

## Evidências

- Especificação: RF-012, Modelo de dados (Category)
- Projeto anterior: ADR antigo 0018; migration `V3__create_transactions_and_categories.sql`

## Perguntas em aberto

- A lista de categorias padrão do projeto anterior (seed da `V3`) serve como ponto de partida?
