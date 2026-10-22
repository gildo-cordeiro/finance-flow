# ADR-0028 — Organização interna dos módulos do backend

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão, adaptando o padrão do projeto anterior ao Kotlin.

## Contexto

O projeto anterior separava domínio e persistência em cada módulo (Records, Entities, Mappers e repositórios em duas camadas). A separação protegia as regras, mas multiplicava arquivos, e alguns casos de uso usavam as entidades diretamente mesmo assim.

## Decisão

Cada módulo (ADR-0001) tem:
- `domain`: regras puras em Kotlin, sem Spring nem JPA. Aqui ficam competência, fatura e parcelamento, testados sem banco;
- `application`: casos de uso, transações de banco e autorização;
- `infra`: entidades JPA, repositórios Spring Data e adaptadores externos (agregador, e-mail, armazenamento);
- `api`: controllers e DTOs.

A conversão entre entidade e domínio só existe onde há regra de domínio relevante (transações, faturas, recorrências). Módulos simples (notificações, anexos) podem usar a entidade direto na camada `application`.

## Consequências

- As regras centrais ficam isoladas e testáveis, sem pagar o custo de mapeamento em módulos simples.
- Exige julgamento sobre quando um módulo merece domínio separado.

## Alternativas consideradas

- Separação completa em todos os módulos (projeto anterior): muito código de mapeamento.
- Entidades JPA como modelo de domínio em tudo: regra de negócio misturada com persistência.

## Evidências

- Projeto anterior: ADR antigo 0007

## Perguntas em aberto

- Nenhuma.
