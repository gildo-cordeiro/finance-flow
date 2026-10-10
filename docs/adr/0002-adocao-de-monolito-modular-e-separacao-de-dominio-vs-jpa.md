# ADR-0002 — Adoção de Monólito Modular e Separação de Domínio vs JPA

- Status: Aceito (retroativo)
- Data: 2026-06-22
- Confiança: alta

## Contexto

A arquitetura de aplicações Spring Boot frequentemente acopla o modelo de banco de dados (Entidades JPA) com o modelo de negócio, usando frameworks como o Lombok para reduzir verbosidade. No entanto, para suportar regras de negócio mais ricas (especialmente as relativas a regras de casal e fluxos temporais) e permitir uma possível separação em microsserviços no futuro, esse acoplamento gera alto atrito e dificulta os testes.

## Decisão

O backend utilizará o padrão de Monólito Modular, isolando os domínios (ex: `auth`, `account`, `transaction`). Dentro de cada módulo, haverá uma separação estrita da camada de dados:
- O Domínio Puro será representado por **Records** do Java (imutáveis, sem Lombok) em `model/domain`.
- A Persistência será feita através de entidades JPA mapeadas em `model/entity`.
- Conversores (`model/mapper`) e interfaces de repositório puras isolarão o Spring Data JPA do núcleo de negócio.

## Consequências

- Benefícios: Código altamente testável e focado no domínio. O negócio não é "contaminado" pelas anotações do Hibernate. Facilita refatorações futuras caso os módulos precisem ser separados.
- Desafios: Aumento na verbosidade devido à criação contínua de Mappers (ex: `UserMapper.java`) para converter Records em Entidades e vice-versa.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `a5532a4`
- Arquivos: `README.md`, `backend/src/main/java/com/financeflow/auth/model/domain/User.java`, `backend/src/main/java/com/financeflow/auth/model/entity/UserEntity.java`, `backend/src/main/java/com/financeflow/auth/model/mapper/UserMapper.java`
- Issues e PRs: N/A

## Perguntas em aberto

- Nenhuma.
