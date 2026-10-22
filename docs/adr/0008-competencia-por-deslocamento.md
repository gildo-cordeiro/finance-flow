# ADR-0008 — Competência sugerida por deslocamento sobre a data de referência

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-03, D-01, D-08).

## Contexto

O documento original se contradizia: uma seção derivava a competência do vencimento e outra do dia de fechamento do cartão. O projeto anterior usava o mês da compra (ou o seguinte, depois do fechamento) e uma regra de 7 dias entre fechamento e vencimento cuja motivação nunca foi documentada. Receitas não tinham regra.

## Decisão

Competência sugerida = mês da data de referência − deslocamento de competência (em meses).

- Data de referência: o vencimento da fatura, para compras no cartão; o vencimento ou o recebimento, para as demais transações.
- Deslocamento (`competence_offset`): configurado na conta, no cartão ou no lançamento recorrente. Padrão 1 para cartões e 0 para as demais contas.
- A mesma regra vale para receitas e despesas.
- O usuário pode alterar a competência de qualquer transação; a sugestão não sobrescreve um valor informado.

Exemplos: fatura com vencimento em 05/07 e deslocamento 1 tem competência junho. Salário recebido no 5º dia útil de julho, com deslocamento 1 no lançamento recorrente, tem competência junho.

## Consequências

- Uma regra só, explícita e fácil de testar, no lugar de duas regras especiais.
- O resultado depende de o usuário configurar o deslocamento de cada conta; o padrão cobre o caso mais comum.
- A regra precisa morar em um único componente de domínio, usado por lançamento manual, parcelas, recorrências e importações.

## Alternativas consideradas

- Competência pelo mês da compra e ciclo de fechamento (projeto anterior): não modela o caso da fatura paga com a renda do mês anterior.
- Competência pela data do último recebimento de renda antes do vencimento: elegante, mas acopla toda transação ao cadastro de renda.

## Evidências

- Especificação: RN-03, D-01, D-08, RF-010, RF-024, RF-030
- Projeto anterior: ADR antigo 0021 (substituído por este)

## Perguntas em aberto

- Nenhuma.
