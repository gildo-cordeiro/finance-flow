# ADR-0035 — Lado da transferência em coluna própria

- Status: Proposto
- Data: 2026-10-24
- Origem do 'porquê': sugestão (F1-09, ao implementar o saldo calculado).

## Contexto

Uma transferência entre contas próprias é gravada como duas linhas em `transactions`, uma por conta, ligadas por `transfer_group_id` e com `type = 'TRANSFER'`. Na `V1`, `amount` é sempre positivo (`ck_transactions_amount`) e nenhuma coluna diz qual linha é a saída e qual é a entrada.

O saldo da conta é calculado (RN-07, ADR-0011) e a F1-09 pede que as transferências entrem "conforme o lado". Com o schema da `V1`, isso não é possível.

## Decisão

- Nova coluna `transactions.transfer_direction`, com `OUT` (sai da conta) ou `IN` (entra na conta), criada na `V2`.
- Ela é preenchida se, e somente se, `type = 'TRANSFER'` (`ck_transactions_transfer_direction_type`).
- No saldo, receitas e transferências `IN` pagas somam; despesas e transferências `OUT` pagas subtraem.

## Consequências

- O saldo de cada conta sai de uma única consulta, sem precisar achar a outra ponta da transferência.
- `amount` continua positivo em todas as linhas: relatórios e somas por tipo não mudam.
- A F1-12 grava as duas pontas com o lado preenchido, e o banco recusa uma transferência sem lado.
- Se a transferência for recusada pelo banco depois de importada (Open Finance), cada ponta continua sendo uma linha independente com seu lado.

## Alternativas consideradas

- Valor com sinal (`amount` negativo na saída): quebra `ck_transactions_amount` e obriga todo relatório a tratar o sinal.
- Uma linha só, com `destination_account_id`: o saldo de uma conta passaria a olhar duas colunas, e a `V1` já adotou duas linhas com `transfer_group_id`.
- Deduzir o lado pela ordem de criação ou pelo `id` dentro do grupo: frágil e implícito.

## Evidências

- Especificação: RN-07, RF-010, D-06
- ADR-0011 (saldo calculado)
- `backend/src/main/resources/db/migration/V2__lado_da_transferencia.sql`
- Card F1-09 ("transferências conforme o lado") e F1-12 (transferência entre contas próprias)

## Perguntas em aberto

- A F1-12 também deve exigir `transfer_group_id` em toda transferência (um CHECK como o do lado)?
