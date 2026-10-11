# ADR-0017 — Três datas por transação: competência, vencimento e pagamento

- Status: Aceito (retroativo)
- Data: 2026-06-23 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentada no PDF (§1.1 e §8.2) e no README; é a principal diferenciação do produto.

## Contexto

Ferramentas comuns usam só a data do lançamento, o que distorce o orçamento: uma fatura que vence no dia 05 é paga com a renda do mês anterior (PDF §1.1).

## Decisão

Cada transação tem `competence_date` e `due_date` (obrigatórias) e `payment_date` (opcional). A competência é sempre normalizada para o dia 1 do mês. O status é `PLANNED`, `PAID`, `PENDING` ou `OVERDUE`. Quando o status é `PAID`, `payment_date` é obrigatória; quando não é, `payment_date` deve ser nula (validação em `CreateTransactionUseCase`).

## Consequências

- O orçamento e os relatórios podem ser calculados por competência, com alertas por vencimento e registro do pagamento real.
- Formulários e telas precisam lidar com três datas, o que aumenta a complexidade da interface.

## Alternativas consideradas

Uma única data por lançamento: descartada (PDF §8.2).

## Evidências

- Commit `e369260`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §1.1, §8.2
- Migration `V3__create_transactions_and_categories.sql`
- `CreateTransactionUseCase.java`
- `.agents/skills/temporal-competence/SKILL.md`

## Perguntas em aberto

- Nenhuma.
