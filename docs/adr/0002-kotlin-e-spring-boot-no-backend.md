# ADR-0002 — Kotlin e Spring Boot 4 no backend

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RES-02), decisão de 2026-10-22.

## Contexto

O projeto anterior usava Java 21 com Spring Boot 4. O desenvolvedor quer uma linguagem com menos cerimônia, mas mantendo o ecossistema que já domina.

## Decisão

Backend em Kotlin sobre a JVM 21, com Spring Boot 4, Spring Security, Spring Data JPA e Flyway. Build em Gradle com Kotlin DSL (`build.gradle.kts`).

Na prática:
- plugins `kotlin("plugin.spring")` e `kotlin("plugin.jpa")` para que classes e entidades funcionem com proxies e construtor sem argumentos;
- `jackson-module-kotlin` para (de)serialização de data classes;
- nulabilidade do Kotlin usada nos contratos: campo opcional é tipo anulável, não `Optional`.

## Consequências

- Código mais curto (data classes, null safety, funções de extensão), sem perder Spring Security, Spring Data e Flyway.
- O consumo de memória e o tempo de inicialização continuam os de uma aplicação Spring na JVM.
- Entidades JPA em Kotlin exigem atenção: classes abertas, construtor sem argumentos e cuidado com `equals`/`hashCode` em data classes.

## Alternativas consideradas

- Java 21 com Spring Boot (projeto anterior): mais verboso; o desenvolvedor não quer mais Java.
- Kotlin com Ktor e Exposed: mais leve, mas exige montar à mão autenticação, validação e injeção de dependência.

## Evidências

- Especificação: RES-02
- Projeto anterior: ADR antigo 0002 e ADR antigo 0022 (Java 21, Spring Boot 4.0.7), substituídos por este

## Perguntas em aberto

- Nenhuma.
