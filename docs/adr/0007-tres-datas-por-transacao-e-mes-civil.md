# ADR-0007 — Três datas por transação e orçamento pelo mês civil de competência

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-01, RN-02, RN-06, D-03).

## Contexto

Ferramentas comuns usam só a data do lançamento, o que distorce o orçamento: uma fatura que vence no dia 05 é paga com a renda do mês anterior. Esse é o diferencial do produto.

## Decisão

- Toda transação tem `competence_date`, `due_date` e `payment_date`, independentes.
- `payment_date` é preenchida se, e somente se, o status é `PAID`.
- A competência é sempre um mês civil (dia 1 ao último dia); `competence_date` é gravada no dia 1 do mês.
- O orçamento e os relatórios de orçamento usam só a competência.
- Status: `PLANNED`, `PENDING`, `PAID` e `OVERDUE`; a passagem para `OVERDUE` é automática (RF-025).
- Não existe "dia de fechamento do orçamento".

## Consequências

- O orçamento reflete de onde saiu o dinheiro, não quando o lançamento foi feito.
- Formulários e telas lidam com três datas, o que pede uma interface que esconda o que o sistema já sugere (ADR-0008).

## Alternativas consideradas

- Uma data por lançamento: é o problema que o produto resolve.
- Mês de orçamento com início configurável (por exemplo, dia 25 a 24): duplica o papel da competência e complica todos os relatórios (D-03).

## Evidências

- Especificação: RN-01, RN-02, RN-06, RF-025, D-03
- Projeto anterior: ADR antigo 0017 (mesma ideia)

## Perguntas em aberto

- Nenhuma.
