# ADR-0009 — Fatura de cartão como entidade própria, definida pelo ciclo de fechamento

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-04, RF-031, RF-032, RF-033, RF-034, entidade Invoice).

## Contexto

Pagar uma fatura, pagar parcialmente, navegar entre faturas e calcular o limite disponível exigem saber quais compras pertencem a qual fatura. O projeto anterior não tinha fatura: o vencimento era recalculado em cada transação.

## Decisão

- `Invoice` é uma entidade por cartão e ciclo, com `closing_date`, `due_date`, `competence_month`, `status` e `paid_amount`.
- Uma compra pertence à fatura cujo ciclo (fechamento anterior exclusive até o fechamento seguinte inclusive) contém a data da compra; a transação guarda `invoice_id`.
- A competência da fatura segue ADR-0008, e as compras dela herdam essa competência.
- O total da fatura é calculado das transações; não é armazenado.
- Pagar a fatura gera uma transação na conta pagadora e marca os itens como pagos; pagamento parcial deixa saldo em aberto.
- Faturas futuras são criadas quando uma parcela cai nelas.

## Consequências

- Pagamento, limite e navegação entre faturas ficam diretos.
- Mudar o dia de fechamento de um cartão exige decidir o que acontece com as faturas abertas.

## Alternativas consideradas

- Fatura derivada em tempo de consulta, sem tabela: não guarda o que foi pago nem o status.

## Evidências

- Especificação: RN-04, RN-05, RF-031 a RF-034, Modelo de dados (Invoice)
- Projeto anterior: ADR antigo 0021 e ADR antigo 0024 (sem fatura; cartão associado a uma conta de pagamento)

## Perguntas em aberto

- Ao mudar o dia de fechamento, as faturas abertas são recalculadas ou só as novas usam o novo dia? Respondida em 2026-10-24: só as novas. A fatura aberta mantém a `closing_date` que já tem, e o novo dia vale a partir do ciclo seguinte, como nos bancos. Recalcular moveria compras entre faturas e mudaria a competência delas, e portanto o orçamento de meses já vistos. O ciclo de transição fica mais curto ou mais longo que um mês, e a interface avisa. Recalcular faturas futuras sem pagamento pode ser avaliado depois.
- O cartão deve ter uma conta pagadora padrão, como `associated_account_id` no projeto anterior? Respondida em 2026-10-24: sim, opcional e só como sugestão. Uma coluna nova (ex.: `default_payment_account_id`, `ON DELETE SET NULL`), criada em migration junto com a F1-14, preenche a conta no formulário de pagamento; o pagamento continua escolhendo a conta (RF-033).
