# ADR-0006 — Sem Redis no início: Caffeine para cache e Bucket4j para rate limiting

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-02, D-07).

## Contexto

O documento original previa Redis para cache e sessões, mas a autenticação é por JWT sem estado (ADR-0005) e o sistema começa com uma instância. No projeto anterior o Redis subia no `docker-compose.yml` e nenhum código o usava.

## Decisão

- Refresh tokens ficam no PostgreSQL.
- Cache em memória com Caffeine (via Spring Cache), usado só onde a medição mostrar necessidade (painéis, RNF-03).
- Rate limiting de login e refresh com Bucket4j em memória.
- O Redis entra quando houver mais de uma instância do backend.

## Consequências

- Uma peça a menos para operar e pagar.
- Com mais de uma instância, cache e limites deixam de ser compartilhados: o rate limiting fica por instância, o que contraria RNF-06 nesse cenário. Esse é o gatilho para adotar o Redis.

## Alternativas consideradas

- Redis desde o início (Upstash): custo e operação sem uso real.
- Rate limiting no proxy ou na plataforma de hospedagem: depende do provedor escolhido (ADR-0024).

## Evidências

- Especificação: RES-02, D-07, RNF-04, RNF-06
- Projeto anterior: ADR antigo 0015 (Redis planejado e nunca usado)

## Perguntas em aberto

- Nenhuma.
