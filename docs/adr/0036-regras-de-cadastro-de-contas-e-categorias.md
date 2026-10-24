# ADR-0036 — Regras de cadastro de contas e categorias

- Status: Proposto
- Data: 2026-10-24
- Origem do 'porquê': sugestão (F1-09). Responde a pergunta em aberto do ADR-0013.

## Contexto

A F1-09 implementou contas (RF-010, RF-011) e categorias (RF-012). A especificação e o ADR-0013 definem o essencial (dois níveis, tipo, conjunto padrão copiado, sem exclusão com histórico), mas alguns comportamentos precisaram ser escolhidos durante a implementação. O ADR-0013 deixou em aberto se o seed da `V3` do projeto anterior serviria de ponto de partida.

## Decisão

**Conjunto padrão** (`category/domain/DefaultCategories.kt`), copiado ao ouvir `UserRegistered`, na mesma transação do cadastro:

- Receitas: Receitas (Salário, Investimentos), Outras receitas.
- Despesas: Alimentação (Supermercado, Restaurantes), Moradia (Aluguel, Luz, Internet), Transporte, Lazer, Saúde, Educação, Outras despesas.
- "Outros" aparece como "Outras receitas" e "Outras despesas" porque o índice único da `V1` é por usuário, pai e nome, sem o tipo.
- Mudar a lista vale só para quem se cadastrar depois.

**Categorias:**

- Nome único por pai sem diferenciar maiúsculas (o índice do banco diferencia; a aplicação é mais restrita).
- Tipo e pai não mudam depois de criados; editar é só renomear.
- Arquivar uma categoria arquiva as subcategorias. Uma subcategoria só é desarquivada com o pai ativo (`PARENT_CATEGORY_ARCHIVED`).
- Excluir exige que a categoria não tenha subcategorias (`CATEGORY_HAS_SUBCATEGORIES`), transações nem orçamento (`CATEGORY_IN_USE`).
- Mesclar exige destino diferente, do mesmo tipo e ativo, e origem sem subcategorias (`INVALID_CATEGORY_MERGE`). Transações e orçamentos vão para o destino; no mês em que os dois têm orçamento, os valores planejados somam. A origem é arquivada.
- Uma categoria de outro usuário informada no corpo (`parentId`, `targetId`) responde 422 no campo; no caminho da URL, 404 (ADR-0012).

**Contas:**

- `competenceOffset` vai de 0 a 12 meses.
- Cartão de crédito (`CREDIT_CARD`) não é criado nem alterado pelas rotas de conta (`ACCOUNT_IS_CREDIT_CARD`); tem cadastro próprio (F1-14).
- Excluir só sem transações (`ACCOUNT_IN_USE`); com transações, arquivar.

**Fronteira entre módulos:** enquanto os módulos `transaction` e `budget` não existem, o repositório de categorias lê e altera `transactions` e `budgets` por SQL (uso, mesclagem), e o de contas lê `transactions` para o saldo. Quando esses módulos chegarem (F1-11, F1-17), as consultas passam para eles e a mesclagem chama um serviço público deles na mesma transação.

## Consequências

- Todo usuário começa com 16 categorias, sem compartilhar nenhuma.
- A árvore nunca tem subcategoria ativa sob pai arquivado.
- Mesclar não perde orçamento nem viola `uq_budgets_user_category_month`.
- Até a F1-11 e a F1-17, uma mudança nas tabelas `transactions` ou `budgets` exige revisar as consultas em `account/infra` e `category/infra`; o Spring Modulith não enxerga dependências por SQL.

## Alternativas consideradas

- Um "Outros" por tipo: exigiria trocar o índice único da `V1` por um que inclua o tipo.
- Permitir mesclar categoria com subcategorias, movendo as filhas para o destino: cria terceiro nível quando o destino é subcategoria e conflitos de nome entre filhas.
- Na mesclagem, manter o orçamento do destino e descartar o da origem: perde o planejado sem avisar.
- Esperar os módulos `transaction` e `budget` para implementar mesclagem e saldo: atrasaria a F1-09, que o card pede completa.

## Evidências

- Especificação: RF-010, RF-011, RF-012, RN-07
- ADR-0008, ADR-0011, ADR-0012, ADR-0013
- Projeto anterior: migration `V3__create_transactions_and_categories.sql` (seed das categorias)
- Card F1-09

## Perguntas em aberto

- Nenhuma.
