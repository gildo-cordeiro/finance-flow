# ADR-0025 — Fluxo de caixa com saldo projetado por conta

- Status: Aceito (retroativo)
- Data: 2026-06-26 (data do commit ou do artefato que introduziu a decisão)
- Confiança: baixa
- Origem do 'porquê': Título do commit, PDF e trechos do código; o critério dos alertas não foi verificado.

## Contexto

O PDF (§2.5) prevê fluxo de caixa com projeções e identificação de períodos de aperto. O commit `8bb9728` o implementou ('projeções temporais e alertas de aperto').

## Decisão

`GetCashFlowUseCase` calcula saldos projetados por conta e consolidado ao longo do tempo. A interface tem gráfico de barras duplas e seletor de mês (`1f14f54`).

## Consequências

- A projeção depende de lançamentos futuros (recorrências materializadas, ver ADR-0026).
- Os critérios dos alertas de aperto não foram verificados.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `8bb9728`, `1f14f54`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.5
- `backend/.../cashflow/service/GetCashFlowUseCase.java`

## Perguntas em aberto

- Qual é o critério dos alertas de aperto? Registrar após leitura detalhada do use case.
