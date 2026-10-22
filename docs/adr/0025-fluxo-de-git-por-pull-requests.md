# ADR-0025 — Fluxo de Git por Pull Requests e Conventional Commits

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão a partir do projeto anterior; não está na especificação.

## Contexto

Mesmo com uma pessoa só, PRs dão um ponto para o CI rodar e para registrar decisões (ADR-0030).

## Decisão

- Branches `feat/*`, `fix/*`, `refactor/*`, `chore/*` e `docs/*` saem da `main` e voltam por Pull Request.
- Commits em Conventional Commits, em português.
- A `main` é protegida: só recebe merge com o CI verde.

## Consequências

- Histórico legível e deploy a partir de um estado testado.

## Alternativas consideradas

- Commits direto na `main`: mais rápido, sem CI antes do deploy.

## Evidências

- Projeto anterior: ADR antigo 0014

## Perguntas em aberto

- Merge commit (como no projeto anterior) ou squash?
