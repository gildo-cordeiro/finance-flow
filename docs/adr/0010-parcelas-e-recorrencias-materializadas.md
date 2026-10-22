# ADR-0010 — Parcelas e recorrências materializadas como transações

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-05, RN-12, RF-023, RF-024, entidade Recurrence).

## Contexto

Orçamento, fatura e fluxo de caixa precisam enxergar parcelas e lançamentos fixos futuros como transações comuns. No projeto anterior a recorrência gerava 12 ocorrências fixas, sem modelo próprio, e a motivação do limite não foi registrada.

## Decisão

- Parcelamento: uma transação por parcela, ligadas por `installment_group_id`, com `installment_number` e `total_installments`. A soma das parcelas é igual ao total; os centavos de diferença vão na última. No cartão, cada parcela cai na fatura seguinte.
- Recorrência: `Recurrence` guarda o modelo (valor, conta, categoria, regra, deslocamento e horizonte). Um job gera as ocorrências como `PLANNED` até o horizonte (padrão 12 meses) e completa a janela conforme o tempo passa.
- Editar ou excluir parcela ou recorrência pergunta o alcance: só esta, esta e as futuras, ou todas.

## Consequências

- Consultas de orçamento e fluxo de caixa ficam simples: tudo é transação.
- Mudanças em série exigem atualizar várias linhas em uma transação de banco.
- O job de recorrência precisa ser idempotente.

## Alternativas consideradas

- Calcular ocorrências virtuais em tempo de consulta: complica todas as consultas e o pagamento de uma ocorrência específica.

## Evidências

- Especificação: RN-05, RN-12, RF-022, RF-023, RF-024
- Projeto anterior: ADR antigo 0026 (recorrência fixa de 12 meses)

## Perguntas em aberto

- Nenhuma.
