# ADR-0012 — Visibilidade em três estados desde a Fase 1 e isolamento de dados por usuário

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-08, RN-11, RNF-05, D-04).

## Contexto

A gestão em casal só chega na Fase 5, mas toda transação criada antes dela precisa ter visibilidade definida. O modelo original tinha só `PERSONAL` e `SHARED`, sem um estado "o parceiro vê, mas não divide".

## Decisão

- `Transaction.visibility` assume `PRIVATE`, `VISIBLE` ou `SHARED`, existe desde a Fase 1 e tem padrão `PRIVATE`.
- `SHARED` usa `split_percent` (padrão do casal: `Couple.default_split_percent`); a soma das partes é sempre 100%.
- Transações `PRIVATE` nunca aparecem para o parceiro, nem na Visão Casal.
- Toda consulta filtra pelo usuário autenticado, ou pelo casal ativo do qual ele é membro. O filtro fica na camada de repositório, não em cada controller.
- Testes automatizados verificam, por endpoint, que nenhum dado de outro usuário ou casal é retornado.

## Consequências

- A Fase 5 não precisa migrar dados.
- Um filtro esquecido vaza dados financeiros; por isso o isolamento tem teste dedicado.

## Alternativas consideradas

- Dois estados (`PERSONAL`, `SHARED`), como no projeto anterior: não cobre o caso visível sem divisão.
- Row-Level Security no PostgreSQL: protege no banco, mas complica o pool de conexões e os testes. Pode ser reavaliado depois.

## Evidências

- Especificação: RN-08, RN-09, RN-11, RNF-05, RF-093, D-04
- Projeto anterior: ADR antigo 0029 (lá também havia `visibility` em categorias)

## Perguntas em aberto

- Categorias também precisam de visibilidade, como no projeto anterior, ou cada usuário mantém as suas?
