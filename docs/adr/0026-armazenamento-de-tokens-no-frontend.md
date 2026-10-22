# ADR-0026 — Access token em memória e refresh token em cookie HttpOnly

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão nova; corrige um risco apontado no projeto anterior.

## Contexto

No projeto anterior os dois tokens ficavam no `localStorage`, o que expõe o refresh token de 30 dias a qualquer script injetado na página (XSS). O próprio ADR antigo deixou esse risco como pergunta em aberto.

## Decisão

- O access token fica só em memória no frontend e vai no cabeçalho `Authorization: Bearer` (RES-04 continua valendo).
- O refresh token vai em cookie `HttpOnly`, `Secure`, `SameSite=Strict`, restrito ao caminho `/api/v1/auth/refresh`.
- Ao recarregar a página, o frontend chama o refresh para obter um novo access token.
- O cliente HTTP renova o access token ao receber 401 e repete a chamada uma vez.

## Consequências

- Um XSS não consegue ler o refresh token.
- Frontend e backend precisam estar no mesmo site, ou o cookie exige configuração de CORS com credenciais.

## Alternativas consideradas

- Os dois tokens no `localStorage` (projeto anterior): simples, mas expostos a XSS.
- Sessão por cookie sem JWT: contraria ADR-0005 e RNF-06.

## Evidências

- Especificação: RES-04, RNF-01
- Projeto anterior: ADR antigo 0011

## Perguntas em aberto

- O frontend (Vercel) e o backend vão ficar sob o mesmo domínio (por exemplo, `app.` e `api.` do mesmo domínio)?
