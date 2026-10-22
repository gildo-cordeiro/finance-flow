# ADR-0016 — Notificações: central no app, depois e-mail, depois push

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (D-10, RF-055, RF-043).

## Contexto

Alertas de orçamento e de vencimento existiam no documento original sem canal definido.

## Decisão

- Fase 1: central de notificações no app (entidade `Notification`), com vencimentos dos próximos 3 dias, faturas a pagar e alertas de orçamento, marcação de lida.
- Fase 2: envio por e-mail, opcional por usuário.
- Fase 6: push, junto com o PWA.
- As notificações são geradas por um job diário e por eventos de domínio (por exemplo, lançamento que estoura um limite de orçamento), sem fila externa.

## Consequências

- O MVP avisa o usuário sem depender de provedor de e-mail.
- Na Fase 2 é preciso escolher um provedor de e-mail transacional.

## Alternativas consideradas

- E-mail desde o MVP: mais configuração (domínio, provedor, entregabilidade) no momento de menor folga.

## Evidências

- Especificação: D-10, RF-043, RF-055, Roadmap
- Projeto anterior: ADR antigo 0036 (Kafka fora da stack), que continua valendo: eventos são internos ao processo

## Perguntas em aberto

- Qual provedor de e-mail na Fase 2?
