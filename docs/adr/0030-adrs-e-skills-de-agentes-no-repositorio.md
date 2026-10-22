# ADR-0030 — ADRs e skills de agentes versionados no repositório

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão a partir do projeto anterior.

## Contexto

O desenvolvimento usa agentes de IA. No projeto anterior, os ADRs foram escritos depois, a partir do código, e várias motivações ficaram sem registro. As skills dos agentes descreviam regras que divergiram do código.

## Decisão

- A especificação de requisitos é a fonte da verdade. ADRs registram como cada decisão foi tomada e por quê.
- ADRs ficam em `docs/adr/`, um arquivo por decisão, com índice no `README.md`. ADR aceito não é reescrito: é substituído por um novo.
- O agente propõe ADRs; o desenvolvedor decide se cria, aceita ou dispensa.
- Skills de agentes ficam em `.agents/skills/`, escritas a partir da especificação e dos ADRs, não do código.
- Mudanças em `build.gradle.kts`, `package.json`, migrations, segurança, CI e Dockerfile disparam um lembrete no CI para avaliar um ADR.

## Consequências

- Decisões são registradas no momento em que acontecem.
- Especificação, ADRs e skills precisam ser mantidos em sincronia.

## Alternativas consideradas

- Registrar decisões só nas descrições de PR: difícil de achar depois.

## Evidências

- Projeto anterior: ADR antigo 0013; `.agents/skills/adr-workflow/SKILL.md`; `docs/adr/_relatorio-arqueologia.md`

## Perguntas em aberto

- Quais skills do projeto anterior vale reescrever primeiro? Sugestão: `adr-workflow`, `git-workflow` e `temporal-competence` (reescrita a partir do ADR-0008).
