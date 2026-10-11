# ADR-0014 — Fluxo de Git por Pull Requests e Conventional Commits

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Observada no histórico do git e descrita na skill `git-workflow`.

## Contexto

O histórico mostra, desde o início, trabalho em branches curtas e integração por Pull Request.

## Decisão

Branches `feat/*`, `fix/*`, `chore/*`, `refactor/*` e `docs/*` partem de `main` e voltam por Pull Request, usando o template `.github/pull_request_template.md`. Commits seguem Conventional Commits em português. A integração usa merge commit do GitHub ('Merge pull request #N'). Não existe branch `develop`.

## Consequências

- A skill `git-workflow` aceita 'squash ou merge commit', mas o histórico usa merge commit.
- Havia na skill uma instrução para partir de `develop`, corrigida no PR #84.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `ef14758`
- Histórico da `main` (121 commits, 2026-06-22 a 2026-10-10)
- `.agents/skills/git-workflow/SKILL.md`
- `.github/pull_request_template.md`

## Perguntas em aberto

- Merge commit é a estratégia desejada, ou a meta é squash?
