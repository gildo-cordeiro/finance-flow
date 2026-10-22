# ADR-0005 — Autenticação JWT com refresh token rotativo

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RNF-01, RNF-02, RNF-04, RF-002, RF-003, RF-004). A detecção de reuso vem do projeto anterior; guardar só o hash do refresh token é sugestão nova.

## Contexto

A API é sem estado (RNF-06) e consumida por uma SPA com autenticação Bearer (RES-04).

## Decisão

- Spring Security sem sessão, com filtro JWT.
- Access token JWT de 15 minutos.
- Refresh token opaco de 30 dias, guardado no banco só como hash (`RefreshToken.token_hash`), rotacionado a cada uso. Reuso de um token já rotacionado ou revogado revoga todas as sessões do usuário.
- Logout e troca de senha revogam os refresh tokens.
- Senhas com bcrypt, fator 12.
- Rate limiting no login e no refresh (ADR-0006).
- Login com erro genérico, sem revelar se o e-mail existe.

## Consequências

- Revogação real de sessões, apesar do JWT sem estado.
- O access token continua válido até expirar (no máximo 15 minutos) depois de um logout.

## Alternativas consideradas

- Sessão no servidor: contraria RNF-06.
- Access token de longa duração sem refresh: sem como revogar.

## Evidências

- Especificação: RNF-01, RNF-02, RNF-04, RF-002, RF-003, RF-004, entidade RefreshToken
- Projeto anterior: ADR antigo 0006 (mesma abordagem; lá o refresh token era salvo em texto puro e o rate limiting não existia)

## Perguntas em aberto

- Onde o frontend guarda os tokens: ver ADR-0026.
