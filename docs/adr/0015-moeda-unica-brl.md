# ADR-0015 — Moeda única: real (BRL)

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-07, D-09).

## Contexto

O documento original tinha uma configuração de moeda, mas nenhum requisito de múltiplas moedas ou de conversão.

## Decisão

- Todos os valores são em BRL. Não há seleção de moeda na interface nem conversão.
- A coluna `currency` existe em `User`, com valor fixo `BRL`, para permitir múltiplas moedas no futuro sem migrar tudo.

## Consequências

- Formatação, cálculos e relatórios ficam simples.
- Gastos de viagem no exterior são lançados já convertidos pelo usuário.

## Alternativas consideradas

- Moeda por conta com conversão: custo alto sem requisito que peça.

## Evidências

- Especificação: RES-07, D-09, RF-005

## Perguntas em aberto

- Nenhuma.
