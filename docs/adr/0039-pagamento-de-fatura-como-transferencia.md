# ADR-0039 — Pagamento de fatura como transferência registrada em `invoice_payments` (complementa 0009)

- Status: Aceito (2026-10-24, junto com a F1-15)
- Data: 2026-10-24
- Origem do 'porquê': especificação (RF-033, RF-034, RN-01, RN-06, RN-07) e sugestão (F1-15, ao ligar o pagamento à fatura).

## Contexto

O ADR-0009 diz que pagar a fatura "gera uma transação na conta pagadora e marca os itens como pagos", e o card F1-15 pede que o pagamento seja uma transferência (`TRANSFER`) da conta pagadora para o cartão, para não contar a despesa duas vezes no orçamento: as compras já contam na competência delas.

Falta dizer como o pagamento se liga à fatura. Para estornar (`DELETE /invoices/{id}/payments/{paymentId}`), é preciso achar as duas pontas da transferência e o valor que saiu de `paid_amount`. A `transactions.invoice_id` não serve: na `V3`, ela exige `purchase_date` (`ck_transactions_purchase_date`), e marca o item como compra da fatura, entrando no total dela.

Também faltam regras para o que acontece com a fatura depois do pagamento: uma compra que cai numa fatura já paga, a exclusão de uma compra de fatura com pagamento, e o limite disponível.

## Decisão

- **Tabela `invoice_payments`** (`V4`): `id`, `invoice_id` (`ON DELETE CASCADE`), `from_account_id`, `amount`, `payment_date`. O `id` do pagamento é o `transfer_group_id` das duas pontas.
- **Duas pontas `TRANSFER`, já pagas na data informada**: `OUT` na conta pagadora e `IN` no cartão, sem categoria, com a competência do mês do pagamento. Ficam fora do orçamento e dos totais, como toda transferência (RF-013), e são alteradas só pela fatura.
- **`paid_amount` continua guardado** (ADR-0009) e é sempre a soma dos pagamentos da fatura, atualizado na mesma transação do banco.
- **Status**: soma dos pagamentos igual ao total → `PAID` e todos os itens `PAID`, com a data do pagamento que quitou. Menor → `PARTIALLY_PAID`, e os itens continuam pendentes ou atrasados (RN-06). Valor acima do saldo em aberto → 422.
- **Estorno** apaga o pagamento e as duas pontas, refaz `paid_amount` e o status. Se a fatura estava paga, os itens voltam a `PENDING` ou `OVERDUE` pelo vencimento.
- **Compra que cai numa fatura paga** a deixa `PARTIALLY_PAID`: o pagamento continua valendo e a compra nova fica em aberto.
- **Compra de fatura com pagamento não é excluída** (409 `INVOICE_HAS_PAYMENTS`): o usuário estorna o pagamento antes. Sem isso, `paid_amount` passaria do total.
- **Limite** (RF-034): `used` = soma, nas faturas ainda não quitadas (atuais e futuras), do total dos itens menos o `paid_amount`; `available` = `creditLimit − used`, que pode ficar negativo. Calculado na consulta do cartão, como o saldo das contas (ADR-0011).

## Consequências

- O estorno acha tudo pelo `id` do pagamento, sem procurar por valor ou data.
- O saldo da conta pagadora cai na data do pagamento, e o do cartão volta a zero quando a fatura é quitada, sem regra nova no cálculo de saldo (ADR-0036).
- `paid_amount` duplica a soma de `invoice_payments`; os dois só mudam juntos, no mesmo caso de uso.
- Pagar parte de uma fatura não diz quais compras foram pagas. Os itens só mudam de status quando a fatura é quitada, como no extrato do banco.

## Alternativas consideradas

- Pagamento como despesa na conta pagadora: conta a mesma compra duas vezes no orçamento (card F1-15).
- Ligar a ponta `IN` à fatura por `transactions.invoice_id`: viola `ck_transactions_purchase_date` e entraria no total da fatura.
- Achar o pagamento pela descrição ou pela data: frágil e ambíguo com dois pagamentos no mesmo dia.
- Derivar `paid_amount` de `invoice_payments` e apagar a coluna: mexe no schema da `V1` sem ganho prático agora.

## Evidências

- Especificação: RF-033, RF-034, RN-01, RN-06, RN-07, RF-013
- ADR-0009, ADR-0011, ADR-0036, ADR-0038
- Card F1-15 (Trello)
- `backend/src/main/resources/db/migration/V4__pagamentos_de_fatura.sql`

## Perguntas em aberto

- Pagamento acima do total (crédito no cartão para a fatura seguinte) fica para depois; por ora é 422.
