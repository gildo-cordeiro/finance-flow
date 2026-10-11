# ADR-0007 — Domínio separado da persistência (Records, Entities e Mappers)

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentada no README; a motivação geral ("evitar código repetitivo e dependência de frameworks") está lá.

## Contexto

O README diz que a camada de dados é dividida para evitar código repetitivo e dependência de frameworks. O commit `a5532a4` aplicou a separação ao módulo de autenticação.

## Decisão

Em cada módulo: `model/domain` (Java Records imutáveis), `model/entity` (entidades JPA), `model/mapper` (conversão entre os dois), `repository` (interfaces de domínio), `repository/jpa` (implementação sobre Spring Data) e `service` (casos de uso em classes `*UseCase`). DTOs ficam em `dto/`.

## Consequências

- Mais arquivos por conceito (por exemplo, `Transaction` tem domínio, entidade, mapper e dois repositórios).
- Na prática, alguns use cases manipulam entidades JPA diretamente (por exemplo, `CreateTransactionUseCase` usa `AccountEntity` e `TransactionEntity`), o que foge da regra.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `a5532a4`
- `README.md` (seção 'Estrutura do Backend')
- `backend/.../transaction/` (estrutura de pastas)
- `CreateTransactionUseCase.java`

## Perguntas em aberto

- O uso direto de entidades nos use cases é uma exceção aceita ou uma divergência a corrigir?
