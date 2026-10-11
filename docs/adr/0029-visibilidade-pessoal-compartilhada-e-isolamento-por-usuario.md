# ADR-0029 — Visibilidade PERSONAL/SHARED e isolamento de dados por usuário

- Status: Aceito (retroativo)
- Data: 2026-06-27 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Regras no PDF (§6.2) e na skill `couple-context`; commits de correção confirmam os casos de borda.

## Contexto

O PDF (§6.2) exige que toda query inclua o `user_id` do token, que o contexto de casal verifique a vinculação e que transações `PERSONAL` nunca apareçam para o parceiro.

## Decisão

- Transações têm `visibility` (`PERSONAL` ou `SHARED`) e categorias também (padrão `PERSONAL`, V8).
- Consultas combinadas usam o usuário e o parceiro (`findAllFilteredCouple`).
- Na edição de transação, a categoria precisa pertencer ao usuário ou ao parceiro.
- Foram corrigidos casos de borda: duplicação de categorias e orçamentos entre pessoal e casal (`e242a53`) e permissão de edição de orçamento no contexto de casal (`41c6e9d`).

## Consequências

- A regra de isolamento depende de cada consulta aplicar o filtro; a skill orienta nunca buscar por `id` sozinho.
- A interface avisa que o usuário não pode alterar lançamentos criados pelo parceiro (`TransactionRow`); a checagem equivalente no backend não foi verificada.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `e242a53`, `41c6e9d`, `6c35f99`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §6.2
- Migrations `V3` e `V8`
- `UpdateTransactionUseCase.java` (linhas ~73 a 83)
- `.agents/skills/couple-context/SKILL.md`

## Perguntas em aberto

- Há testes automatizados que garantem que transações `PERSONAL` nunca vazam para o parceiro?
