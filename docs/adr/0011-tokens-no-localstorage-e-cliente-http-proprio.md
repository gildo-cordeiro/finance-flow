# ADR-0011 — Tokens de acesso no localStorage e cliente HTTP próprio com refresh automático

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no código; o motivo e a avaliação de risco não estão documentados.

## Contexto

O frontend precisa autenticar as chamadas e renovar o access token (15 minutos, ver ADR-0006) sem exigir novo login.

## Decisão

`frontend/src/services/api.ts` é um cliente HTTP próprio, sem Axios. Ele guarda `access_token` e `refresh_token` no `localStorage`, anexa o cabeçalho `Authorization` e, ao receber 401, tenta renovar os tokens antes de repetir a chamada.

## Consequências

- Os tokens ficam acessíveis a qualquer JavaScript da página, o que torna um ataque XSS mais grave.
- A implementação é simples e funciona sem cookies, útil com frontend e backend em domínios diferentes (Vercel e Render/Railway).

## Alternativas consideradas

Cookies `httpOnly` para o refresh token: não adotados; motivo não documentado.

## Evidências

- Commit `1dc589d`
- `frontend/src/services/api.ts`
- `frontend/package.json` (sem Axios)

## Perguntas em aberto

- O risco de guardar tokens no `localStorage` foi avaliado e aceito? Motivação não documentada — confirmar com Gildo.
