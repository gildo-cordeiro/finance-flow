# ADR-0001 — Monólito modular em monorepo

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-01, RES-06). O monorepo vem do projeto anterior.

## Contexto

O sistema é desenvolvido por uma pessoa (RES-06) e cobre vários domínios: autenticação, transações, cartões, orçamento, fluxo de caixa, Open Finance, casal, objetivos e viagens.

## Decisão

Um único backend, dividido em módulos por domínio (`auth`, `account`, `transaction`, `invoice`, `budget`, `cashflow`, `openfinance`, `couple`, `goals`, `travel`, `notification`, `shared`), no mesmo repositório do frontend (`backend/` e `frontend/`).

Um módulo só usa outro pela sua interface pública (serviços expostos), nunca pelos repositórios ou entidades internos.

## Consequências

- Um deploy, um banco e um pipeline: operação simples e barata (RES-05).
- A separação por domínio permite extrair um módulo para serviço próprio no futuro.
- A regra de dependência entre módulos precisa ser cuidada; sem ela, o monólito vira um bloco único.

## Alternativas consideradas

- Microsserviços: custo de operação (deploys, comunicação entre serviços) sem benefício para uma pessoa.
- Repositórios separados para backend e frontend: mais atrito para mudanças que atravessam as duas pontas.

## Evidências

- Especificação: RES-01, RES-06
- Projeto anterior: ADR antigo 0001 (mesma decisão; lá `goals` acessava o repositório de `couple` diretamente)

## Perguntas em aberto

- Vale verificar a regra de dependência entre módulos automaticamente (ArchUnit ou Spring Modulith)?
