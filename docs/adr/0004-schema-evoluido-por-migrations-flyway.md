# ADR-0004 — Schema evoluído apenas por migrations Flyway

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': O uso do Flyway está documentado no PDF (§4.2); a configuração `validate-on-migrate=false` não tem motivação documentada.

## Contexto

O PDF (§4.2) lista o Flyway como controle de versão do schema.

## Decisão

O Hibernate não gera nem altera o schema (`spring.jpa.hibernate.ddl-auto=none`). Toda mudança entra como migration versionada em `backend/src/main/resources/db/migration/V{n}__descricao.sql` (12 migrations até hoje, V1 a V12). O Flyway roda na inicialização (`spring.flyway.enabled=true`).

## Consequências

- Migrations aplicadas são imutáveis; correções entram como novas versões.
- `spring.flyway.validate-on-migrate=false` desliga a validação de checksum das migrations já aplicadas, o que reduz a proteção contra edições acidentais.
- O commit `6c35f99` corrigiu uma coluna ausente (`visibility` em categorias) e a inicialização do Flyway, mostrando que houve divergência entre código e schema.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `1dc589d`, `6c35f99`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/db/migration/`

## Perguntas em aberto

- Por que `validate-on-migrate` está como `false`? Motivação não documentada — confirmar com Gildo.
