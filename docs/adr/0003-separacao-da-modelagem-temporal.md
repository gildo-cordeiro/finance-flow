# ADR-0003 — Separação da Modelagem Temporal (Competência, Vencimento, Pagamento)

- Status: Aceito (retroativo)
- Data: 2026-06-23
- Confiança: alta

## Contexto

O controle financeiro em sistemas comuns baseia-se muitas vezes numa data única (lançamento ou pagamento). Isso distorce análises orçamentárias (por exemplo: despesas de junho no cartão de crédito pagas no mês seguinte constam como gastos de julho, bagunçando a visão da real competência mensal de consumo x renda do período).

## Decisão

Adotou-se, no cerne do projeto, a independência de três datas em todas as transações:
1. **Data de Competência**: Mês e ano onde o valor se aplica ao cálculo do orçamento.
2. **Data de Vencimento**: A data exigida para quitação financeira do valor.
3. **Data de Pagamento**: O dia de liquidação em caixa, alterando efetivamente a projeção de saldos bancários.

## Consequências

- Benefícios: Alinha o sistema com os princípios contábeis reais e evita distorção de orçamentos e análises estatísticas em caso de atrasos ou parcelamentos no cartão de crédito.
- Desafios: A lógica de filtro temporal em relatórios e dashboard ficou substancialmente mais complexa. Modificou-se a stack tecnológica para introduzir bibliotecas especializadas como o `date-fns` para garantir a integridade dos ciclos mensais.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `e369260`, `e9704b5`
- Arquivos: `README.md`, `backend/src/main/java/com/financeflow/budget/service/GetBudgetUseCase.java`, `frontend/src/features/transactions/components/Transactions.tsx`
- Issues e PRs: PR #18, PR #23

## Perguntas em aberto

- Nenhuma.
