# ADR-0016 — Open Finance e Viagens fora do escopo atual

- Status: Adiado (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Os módulos estão previstos no PDF; o adiamento é observado no código e não tem registro.

## Contexto

O PDF prevê um módulo Open Finance (§2.6) e um módulo de Viagens (§2.9).

## Decisão

O backend só tem a pasta `travel/` vazia (`.gitkeep`) e nenhum pacote de Open Finance. No frontend há uma aba de configurações 'Open Finance' que exibe 'Em Breve'.

## Consequências

- A interface já reserva espaço para o recurso, sem funcionalidade por trás.
- O modelo de dados do PDF (JSONB para respostas do Open Finance, entidade Travel) ainda não existe no schema.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `0fd9da7`, `f15ca88`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.6, §2.9 e §4.4
- `backend/src/main/java/com/financeflow/travel/.gitkeep`
- `frontend/src/features/auth/components/settings/OpenFinanceTab.tsx`

## Perguntas em aberto

- Esses módulos seguem no roadmap, com prazo? Motivação do adiamento não documentada.
