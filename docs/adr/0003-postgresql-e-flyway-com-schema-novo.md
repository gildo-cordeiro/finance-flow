# ADR-0003 — PostgreSQL com Flyway e schema recomeçado do zero

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-02 e seção Modelo de dados).

## Contexto

Dados financeiros são relacionais e precisam de transações ACID. O projeto anterior chegou a 12 migrations remendadas, com problemas como `transactions.category_id ... ON DELETE CASCADE` (excluir uma categoria apagava as transações) e `spring.flyway.validate-on-migrate=false`.

## Decisão

- PostgreSQL é o único banco.
- O schema é criado só por migrations Flyway (`db/migration/V{n}__descricao.sql`); o Hibernate não gera nem altera tabelas (`ddl-auto=none`).
- O schema recomeça em uma `V1` escrita a partir da seção Modelo de dados da especificação. Nenhuma migration do projeto anterior é copiada.
- `validate-on-migrate` fica ligado: migration aplicada não é editada, é corrigida por uma nova.

## Consequências

- Histórico de schema limpo e coerente com a especificação desde o início.
- Dados do projeto anterior não são migrados automaticamente.

## Alternativas consideradas

- Reaproveitar as 12 migrations antigas: carregariam regras que contradizem a especificação.
- Banco NoSQL para dados semiestruturados: o PostgreSQL resolve com JSONB.

## Evidências

- Especificação: RES-02, Modelo de dados, RF-012
- Projeto anterior: ADR antigo 0003 e ADR antigo 0004; migration `V3__create_transactions_and_categories.sql`

## Perguntas em aberto

- Os dados de uso do projeto anterior precisam ser importados? Se sim, por um script à parte, não por migration.
