# ADR-0034 — Fronteiras de módulos e camadas verificadas nos testes

- Status: Aceito
- Data: 2026-10-24
- Origem do 'porquê': sugestão, respondendo à pergunta em aberto do ADR-0001 e completando o ADR-0028.

## Contexto

O ADR-0001 proíbe um módulo de usar repositórios e entidades de outro, e o ADR-0028 define as camadas `domain`, `application`, `infra` e `api`. Nenhuma das duas regras era verificada: num único módulo Gradle, todo tipo Kotlin é público. No projeto anterior, `goals` acabou lendo o repositório de `couple`.

No `auth`, o único módulo até a F1-08, a direção das camadas já tinha escapado:
- `AuthResult` levava a `UserEntity` até o `AuthController`, e o controller importava `AuthProperties` de `infra`;
- `application` dependia do `AccessTokenIssuer` (JWT) concreto em `infra`, e o `PasswordConfig` (configuração do Spring) estava em `application`;
- a normalização do e-mail estava repetida no serviço e no controller.

## Decisão

As fronteiras passam a ser verificadas por testes em `architecture/`, que rodam no CI:

- **Entre módulos, com Spring Modulith** (`ModulesTest`): cada pacote de topo é um módulo, e só o pacote raiz dele (ex.: `com.financeflow.auth`) é a API pública; os subpacotes são internos. Eventos como `UserRegistered` e serviços expostos a outros módulos ficam no pacote raiz. `shared` é um módulo aberto: todos os subpacotes podem ser usados.
- **Entre camadas, com ArchUnit** (`LayersTest`, que já vem com o Spring Modulith):
  - `domain` não depende de Spring, JPA nem das outras camadas;
  - `api` não depende de `infra`;
  - `application` usa de `infra` só entidades JPA e repositórios Spring Data (o pragmatismo do ADR-0028). Adaptadores externos (JWT, e-mail, agregador) ficam atrás de uma interface declarada em `application` ou `shared`;
  - nenhuma camada depende de `api`.

As entidades não saem de `application`: o caso de uso devolve um tipo próprio (ex.: `AuthenticatedUser`) para `api` e para outros módulos.

## Consequências

- Uma violação quebra o build, em vez de depender de revisão.
- O `auth` foi ajustado: `TokenIssuer` em `application` com `JwtAccessTokenIssuer` em `infra`; `AuthProperties` em `application`; `PasswordConfig` em `infra`; `UserRegistered` no pacote raiz; `EmailAddress` em `domain`.
- Quando outro módulo precisar de dados do usuário, o `auth` expõe um serviço no pacote raiz que devolve um DTO, nunca a `UserEntity`.
- Nova dependência (`spring-modulith-api` em produção, `spring-modulith-starter-test` nos testes), na linha 2.0, que acompanha o Spring Boot 4.0.
- O Spring Modulith permite, mais tarde, guardar os eventos publicados até os listeners terminarem (registro de publicação). Não foi ativado agora.

## Alternativas consideradas

- Só disciplina e revisão: foi o que falhou no projeto anterior.
- Um módulo Gradle por domínio, com `internal` do Kotlin: isolamento mais forte, mas multiplica a configuração de build para uma pessoa só (RES-06).
- Clean/Hexagonal completa, com portas também para a persistência: já descartada no ADR-0028 pelo custo de mapeamento.
- Só ArchUnit, sem Spring Modulith: dá para escrever as regras entre módulos à mão, mas o Modulith já as entende (pacote raiz público, ciclos) e traz o ArchUnit junto.

## Evidências

- ADR-0001 (pergunta em aberto: "ArchUnit ou Spring Modulith?"), ADR-0028
- Especificação: RES-06
- Projeto anterior: ADR antigo 0001 (`goals` acessava o repositório de `couple`)
- `backend/src/test/kotlin/com/financeflow/architecture/`

## Perguntas em aberto

- Ativar o registro de publicação de eventos do Spring Modulith quando a F1-09 passar a ouvir o `UserRegistered`? Respondida em 2026-10-24: não por enquanto. O `DefaultCategoriesListener` roda síncrono na mesma transação do cadastro, e uma falha desfaz tudo. O registro passa a valer com o primeiro ouvinte assíncrono ou após o commit (envio de e-mail do ADR-0031, notificações), e deve ser avaliado nesse momento.
