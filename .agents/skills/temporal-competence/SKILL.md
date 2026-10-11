---
name: temporal-competence
description: >
  Regras de negócio de modelagem temporal e cálculo de competência para transações e cartões de crédito no FinanceFlow.
  Use esta skill SEMPRE que o código envolver datas de transações, cálculo de competência, ciclos de fatura de cartão,
  fluxo de caixa, vencimento, ou campos como competenceDate, dueDate, paymentDate. Acione também para perguntas
  como "em que mês entra essa compra?", "qual a competência dessa fatura?" ou qualquer lógica de fechamento de fatura.
---

# Modelagem Temporal e Competência Financeira (Temporal Competence)

Esta skill define a regra de negócio central do FinanceFlow sobre manipulação temporal de transações e cartões de crédito.

## 1. As Três Datas Independentes

Toda transação (`Transaction`) no banco de dados DEVE possuir três colunas de datas separadas:

| Campo | Tipo | Significado |
|---|---|---|
| `competence_date` | `DATE` | Mês/período ao qual o gasto financeiramente pertence (base do orçamento) |
| `due_date` | `DATE` | Quando a conta deve ser paga (base do fluxo de caixa) |
| `payment_date` | `DATE` | Quando o valor foi efetivamente pago (pode ser nulo se ainda não pago) |

```java
// Entidade Transaction — campos de data obrigatórios
private LocalDate competenceDate;   // nunca nulo
private LocalDate dueDate;          // nunca nulo
private LocalDate paymentDate;      // nulo até o pagamento ocorrer
```

## 2. Regras de Orçamento e Fluxo de Caixa

- **Orçamento Mensal**: SEMPRE calculado com base na `competence_date`.
- **Fluxo de Caixa**: Calculado e projetado com base em `due_date` (previsto) e `payment_date` (realizado).

### Exemplo Prático — Fatura de Cartão

> Compra feita em 20/Jun → fatura fecha em 25/Jun → vence em 05/Jul → paga em 05/Jul

| Campo | Valor | Por quê |
|---|---|---|
| `competence_date` | 2024-06-01 | A compra pertence ao orçamento de junho |
| `due_date` | 2024-07-05 | A fatura vence em julho |
| `payment_date` | 2024-07-05 | Quando o débito ocorreu na conta |

> **Regra de ouro**: o mês da `competence_date` é determinado pelo ciclo da fatura, **não** pela data em que o dinheiro sai da conta.

## 3. Cálculo Automático de Competência para Cartões de Crédito

Ao lançar uma transação vinculada a cartão de crédito, o sistema calcula a competência automaticamente:

```java
/**
 * Calcula a competência de uma transação com base no ciclo do cartão.
 *
 * @param transactionDate  Data em que a compra foi realizada
 * @param closingDay       Dia do mês em que a fatura fecha (ex: 25)
 * @return                 Primeiro dia do mês de competência
 */
public static LocalDate calculateCompetence(LocalDate transactionDate, int closingDay) {
    // Se a compra ocorreu ANTES ou NO dia de fechamento → competência é o mês atual
    if (transactionDate.getDayOfMonth() <= closingDay) {
        return transactionDate.withDayOfMonth(1);
    }
    // Se ocorreu APÓS o fechamento → cai na próxima fatura (competência = próximo mês)
    return transactionDate.plusMonths(1).withDayOfMonth(1);
}

// Exemplos:
// closingDay = 25
// transactionDate = 20/Jun → competence = 01/Jun  (antes do fechamento)
// transactionDate = 26/Jun → competence = 01/Jul  (depois do fechamento → próxima fatura)
// transactionDate = 25/Jun → competence = 01/Jun  (no dia exato → fatura atual)
```

### Cálculo da Due Date a partir da Competência

Implementação: `CreateTransactionUseCase.calculateDueDate`. Para contas que não são cartão (ou cartão sem `closing_day` e `due_day`), o vencimento é o `dueDate` informado no request.

```java
// Cartão de crédito com closing_day e due_day
int gap = dueDay - closingDay;
if (gap < 7) {   // inclui gap negativo (vencimento "menor" que o fechamento)
    due = competenceDate.plusMonths(1) com dia = dueDay;   // vence no mês seguinte à competência
} else {
    due = competenceDate com dia = dueDay;                 // vence no mesmo mês da competência
}
// Dias inexistentes (por exemplo 31 em fevereiro) são ajustados por safeDateOf
```

Exemplos: Nubank (fecha 18, vence 16, gap -2): competência Jul vence 16/Ago. Itaú (fecha 3, vence 5, gap 2): competência Jun vence 05/Jul. Fecha 5 e vence 20 (gap 15): competência Jun vence 20/Jun.

> **Decisão do desenvolvedor (2026-10-11):** vale a regra do código (gap). A regra antiga "sempre no mês seguinte" foi descartada.

## 4. Cartões do FinanceFlow (Configuração Real)

| Cartão | `closing_day` | `due_day` | Exemplo de competência |
|---|---|---|---|
| Nubank Mastercard Platinum | 18 | 16 | Compra em 19/Jun → competência Jul, vence 16/Ago |
| Itaú Uniclass Black | 03 | 05 | Compra em 02/Jun → competência Jun, vence 05/Jul |

## 5. Status de Transação

O status é **derivado das datas**, nunca escolhido pelo usuário. Regra única em `TransactionStatusPolicy.derive(dueDate, paymentDate, today)`:

| Condição | Status |
|---|---|
| `payment_date` preenchida | `PAID` |
| sem pagamento e `due_date` anterior a hoje | `OVERDUE` |
| sem pagamento e `due_date` igual a hoje | `PENDING` |
| sem pagamento e `due_date` posterior a hoje | `PLANNED` |

**Onde é aplicada:** criação (única, parcelada e recorrente, cada ocorrência pela própria data), atualização e leitura em `ListTransactionsUseCase` (o status devolvido acompanha o dia atual, sem job agendado). `TransactionRequest.status` continua obrigatório e só é validado por consistência (`PAID` exige `payment_date`; os demais proíbem), mas o valor gravado e devolvido é o derivado. Em cartão, `PAID` no request grava `payment_date = due_date` da fatura.

**Cuidados:**
- "Hoje" é `LocalDate.now()` do servidor, sem fuso do usuário (perto da meia-noite o status pode mudar algumas horas antes ou depois no horário local).
- O status gravado pode ficar velho (um `PLANNED` gravado que já venceu). Para exibição vale o status derivado na leitura.
- Fluxo de caixa e saldo só distinguem `PAID` de não pago. Arquivar cartão é bloqueado por transações `PENDING`, `PLANNED` ou `OVERDUE`.

## 6. Anti-Patterns a Evitar

| ❌ Errado | ✅ Correto |
|---|---|
| Usar apenas uma coluna de data para tudo | Três colunas separadas: competência, vencimento, pagamento |
| `competence_date` = data da compra | `competence_date` calculada pelo ciclo do cartão |
| Orçamento calculado por `payment_date` | Orçamento SEMPRE por `competence_date` |
| `due_date` nulo em transações de débito | Débito automático: `due_date` = `competence_date` (mesmo dia) |
| Ignorar o dia de fechamento no cálculo | Sempre verificar `transactionDate.getDayOfMonth() <= closingDay` |
