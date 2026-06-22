---
name: temporal-competence
description: Regras de negócio de modelagem temporal e cálculo de competência para transações e cartões de crédito no FinanceFlow.
---

# Modelagem Temporal e Competência Financeira (Temporal Competence)

Esta skill define a regra de negócio central do FinanceFlow sobre a manipulação temporal de transações e cartões de crédito.

## 1. As Três Datas Independentes

Toda transação (`Transaction`) no banco de dados DEVE possuir três colunas de datas separadas:
1. `competence_date` (Data de Competência): Mês/Período ao qual o gasto ou receita pertence financeiramente.
2. `due_date` (Data de Vencimento): Quando a conta deve ser paga.
3. `payment_date` (Data de Pagamento): Quando o valor foi efetivamente pago.

## 2. Regras de Orçamento e Fluxo de Caixa

- **Orçamento Mensal**: Deve SEMPRE ser calculado e consolidado com base na `competence_date`.
- **Fluxo de Caixa**: É calculado e projetado com base nas datas de vencimento (`due_date`) e pagamento real (`payment_date`).
- **Exemplo Prático**: Uma fatura de cartão que vence no dia 05/Julho pertence à competência de **Junho**, pois é paga com o salário recebido no fim de Junho (competência Junho).

## 3. Sugestão Automática de Competência para Cartões de Crédito

Ao lançar uma despesa vinculada a um cartão de crédito, o sistema deve sugerir a competência automaticamente com base nas configurações da conta/cartão:
- Cada cartão de crédito possui `closing_day` (dia de fechamento) e `due_day` (dia de vencimento).
- Se a transação ocorrer **antes ou no dia do fechamento** do ciclo atual, a competência é o **mês atual**.
- Se a transação ocorrer **após o dia do fechamento**, a competência pertence ao **próximo mês** (próxima fatura).

## 4. Estrutura das Entidades de Dados

Certifique-se de que a entidade `Transaction` contenha:
```java
private LocalDate competenceDate;
private LocalDate dueDate;
private LocalDate paymentDate;
```
E os estados de status mapeados: `PLANNED`, `PAID`, `PENDING`, `OVERDUE`.
