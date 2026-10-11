# ADR-0010 — Tailwind CSS v3 (e não v4)

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': O uso do Tailwind está justificado no PDF; a escolha específica pela versão 3 não está documentada.

## Contexto

O PDF (§4.2) escolhe o Tailwind por produtividade e consistência visual sem CSS customizado extenso. O commit `0984aaf` documentou 'regras de tailwind v3' na skill `code-implementation`.

## Decisão

O projeto usa Tailwind CSS 3.4.x (`tailwindcss@^3.4.17`), com configuração em `tailwind.config.js` e PostCSS. Recursos e sintaxe exclusivos do v4 não devem ser usados.

## Consequências

- Os tokens de design vivem em `tailwind.config.js` (ver ADR-0030).
- Atualizar para v4 exigirá migração da configuração e dos tokens.

## Alternativas consideradas

Tailwind v4: não adotado; motivo não documentado.

## Evidências

- Commits `1dc589d`, `0984aaf`
- `frontend/package.json`
- `frontend/tailwind.config.js`
- `.agents/skills/code-implementation/SKILL.md`

## Perguntas em aberto

- Por que o v3 em vez do v4, e existe plano de migração? Motivação não documentada — confirmar com Gildo.
