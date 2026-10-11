# ADR-0035 — Deploy contínuo: backend em Docker (Render ou Railway) e frontend na Vercel

- Status: Aceito (retroativo)
- Data: 2026-07-12 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': O desenho de infraestrutura está no PDF (§4.2); a ordem de preferência entre Render e Railway e o motivo do IPv4 não estão documentados.

## Contexto

O PDF (§4.2) recomenda infraestrutura de baixo custo (Railway ou Render para o backend, Supabase para o banco, Vercel para o frontend).

## Decisão

- Backend: `Dockerfile` multi-estágio (`eclipse-temurin:21`), JVM com `-Djava.net.preferIPv4Stack=true` e porta por `PORT`; `spring-boot-starter-actuator` com `/actuator/health` público.
- GitHub Actions: após testes bem-sucedidos e push na `main`, o job `deploy-backend` dispara o webhook do Render (`RENDER_DEPLOY_HOOK_URL`) ou o CLI do Railway (`RAILWAY_TOKEN`); o job `deploy-frontend` roda `vercel --prod` com o build delegado à nuvem da Vercel.
- Sem credenciais, o pipeline só avisa e segue.

## Consequências

- Todo push na `main` com testes verdes publica em produção; não há ambiente de staging no repositório.
- Dois provedores de backend são aceitos pelo workflow.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `c2b4f10`, `e883bd1`, `6df7229`, `13a9fa2`, `b813d74`, `7310a05`, `1833ffb`, `afdfca8`, `e3f8229`, `a6e172c`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2
- `backend/Dockerfile`
- `.github/workflows/tests.yml`

## Perguntas em aberto

- Qual provedor está em uso em produção (Render ou Railway)?
- Por que a JVM precisou forçar IPv4 (`afdfca8`)? Motivação não documentada.
- Existe ou haverá ambiente de staging?
