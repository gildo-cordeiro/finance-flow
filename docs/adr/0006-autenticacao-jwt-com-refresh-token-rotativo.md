# ADR-0006 — Autenticação JWT de acesso curto com refresh token rotativo

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Requisitos documentados no PDF (§6.1 e requisitos não funcionais); a implementação foi confirmada no código.

## Contexto

O PDF exige autenticação robusta: access token de curta duração, refresh token rotacionado a cada uso e revogável, senhas com bcrypt e limitação de tentativas no login.

## Decisão

- Spring Security stateless, com CSRF desabilitado e filtro JWT antes do `UsernamePasswordAuthenticationFilter`.
- Access token JWT assinado com HMAC e expiração de 15 minutos (`app.jwt.expiration-ms=900000`).
- Refresh token opaco (UUID) persistido em `refresh_tokens`, com expiração de 30 dias e flag `revoked`.
- A cada refresh, o token antigo é revogado e um novo é emitido. Reuso de um token revogado ou expirado revoga todas as sessões do usuário.
- Senhas com `BCryptPasswordEncoder(12)`.
- Rotas públicas: `/actuator/health`, `/api/v1/auth/register`, `/login` e `/refresh`. CORS configurável por `APP_CORS_ALLOWED_ORIGINS`.

## Consequências

- Sessões podem ser revogadas individualmente ou em massa.
- O segredo do JWT vem de configuração (`app.jwt.secret`) e precisa existir em cada ambiente.
- O limite de tentativas no login (PDF §6.1) não foi encontrado no código.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `1dc589d`, `3019a30`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §6.1
- `backend/.../auth/config/SecurityConfig.java`
- `backend/.../auth/service/RefreshTokenUseCase.java` (linhas ~35 a 53)
- `backend/.../auth/service/LoginUseCase.java`
- Migration `V1`

## Perguntas em aberto

- O rate limiting do login previsto no PDF foi adiado ou esquecido?
