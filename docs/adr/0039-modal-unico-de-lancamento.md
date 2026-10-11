# ADR-0039 — Modal único de lançamento (Despesa | Receita, Pago com, Mais detalhes)

- Status: Proposto
- Data: 2026-10-10 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Proposta registrada nas issues #75 a #80 (UX-14 a UX-19), baseada na revisão de design; ainda não implementada.

## Contexto

Hoje existe um único `TransactionModal.tsx` (545 linhas) com três fluxos internos (`EXPENSE`, `EXPENSE_CARD`, `INCOME`), exibindo cerca de 10 a 12 campos de mesmo peso. O seletor mistura a direção do dinheiro com o meio de pagamento, o botão primário vermelho parece ação destrutiva e o mesmo modal também serve para editar.

## Decisão

- Um `TransactionFormModal` com seletor 'Despesa | Receita', valor em destaque, descrição, categoria, 'Pago com' (contas e cartão, com parcelas) e data com atalhos.
- Competência, repetição e vencimento ficam em 'Mais detalhes', recolhido; 'Compartilhar com o casal' vira um switch.
- Botão primário único na cor da marca.
- Cobre criar e editar, reaproveita o schema Zod e não altera o payload enviado ao backend.

## Consequências

- Menos campos visíveis e nenhum campo muda de posição ao trocar o tipo.
- O modal antigo é removido ao final (UX-19).
- O stepper de parcelas depende do suporte existente a `INSTALLMENT` (ADR-0026).

## Alternativas consideradas

Manter três abas: rejeitada por misturar direção e meio de pagamento. Wizard em várias etapas: rejeitado, lançar um gasto precisa ser rápido.

## Evidências

- Issues #75 a #80
- `frontend/src/features/transactions/components/TransactionModal.tsx`
- Revisão de design de 2026-10-10

## Perguntas em aberto

- Aprovar a proposta e passar o status para Aceito quando as issues forem concluídas.
