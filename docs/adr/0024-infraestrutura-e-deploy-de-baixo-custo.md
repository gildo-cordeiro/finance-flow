# ADR-0024 — Infraestrutura e deploy de baixo custo

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação para o limite de custo (RES-05); os provedores vêm do documento original e do projeto anterior.

## Contexto

A infraestrutura inicial deve custar até US$ 5 por mês, com caminho de migração para AWS (RES-05). O sistema precisa de 99,5% de disponibilidade mensal (RNF-07) e de backup diário (RNF-13).

## Decisão

- Backend em contêiner Docker (imagem multi-estágio, JVM 21) no Render ou no Railway.
- PostgreSQL gerenciado no Supabase.
- Frontend na Vercel.
- Anexos no Cloudflare R2.
- CI no GitHub Actions: testes em toda PR; deploy automático a partir da `main`.

## Consequências

- Custo inicial perto de zero.
- Planos gratuitos podem hibernar o backend, o que afeta RNF-03 e RNF-07; o plano pago pode ser necessário desde o lançamento.

## Alternativas consideradas

- AWS desde o início: custo e operação acima do limite.

## Evidências

- Especificação: RES-05, RNF-07, RNF-13
- Projeto anterior: ADR antigo 0035

## Perguntas em aberto

- Render ou Railway?
- O backup do Supabase no plano escolhido atende RNF-13 (diário, retenção de 7 dias, restauração testada)?
