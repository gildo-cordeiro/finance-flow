# ADR-0005 — Separação Estrutural de Contas Bancárias e Cartões de Crédito

- Status: Aceito (retroativo)
- Data: 2026-06-26
- Confiança: alta

## Contexto

Embora tanto contas correntes/poupanças quanto cartões de crédito atuem como formas de alocar gastos, eles possuem comportamentos fundamentais diferentes em relação ao fluxo de caixa. Tratamentos unificados criavam dificuldades para rastrear pagamentos cruzados e visualizar o real saldo livre no final do mês.

## Decisão

As entidades de "Contas" no sistema foram visual e estruturalmente separadas entre "Contas Bancárias" (positivas/negativas) e "Cartões de Crédito" (gastos que necessitam de liquidação). Além disso, criou-se a associação obrigatória de um cartão de crédito a uma conta específica, permitindo calcular deduções automatizadas.

## Consequências

- Benefícios: Exibição precisa do Saldo Atual e Saldo Livre Projetado (que subtrai o limite utilizado dos cartões atrelados daquela conta).
- Desafios: Aumento na complexidade de exibição na UI e na lógica de banco de dados para associar essas deduções sem causar referências circulares.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `e562473`
- Arquivos: `backend/src/main/resources/db/migration/V5__associate_credit_cards_to_accounts.sql`, `frontend/src/features/accounts/components/Accounts.tsx`
- Issues e PRs: Issue #25, PR #26

## Perguntas em aberto

- Nenhuma.
