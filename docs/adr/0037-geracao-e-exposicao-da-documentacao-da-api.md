# ADR-0037 — Geração e exposição da documentação da API

- Status: Proposto
- Data: 2026-10-24
- Origem do 'porquê': sugestão. Responde as perguntas em aberto do ADR-0033.

## Contexto

O ADR-0033 decidiu descrever a API em OpenAPI gerado do código e versionar um Markdown, `docs/api.md`. Ficaram em aberto: qual ferramenta gera o Markdown e se o CI confere que ele está atualizado; se o Swagger UI fica exposto em produção; e se a especificação OpenAPI também é versionada.

## Decisão

- **Geração:** springdoc-openapi 3.0 (a linha do Spring Boot 4.0) expõe `/v3/api-docs` e o Swagger UI. O Markdown é montado por um renderizador próprio, em Kotlin, nos testes (`docs/OpenApiMarkdown.kt`), sem ferramenta externa.
- **Verificação:** o `ApiDocsTest` gera o Markdown e compara com o `docs/api.md`; diferença quebra o build. Com `UPDATE_API_DOCS=true` o teste regrava o arquivo. Como roda em `./gradlew test`, o CI já confere.
- **Erros documentados:** 401, 404, 400 e 422 entram por convenção, pela forma da rota (`OpenApiConfig`). Os códigos de regra de negócio são declarados no endpoint com `@DocumentedError`, agrupados por status e com o schema `Problem`.
- **Exposição:** `/v3/api-docs` e o Swagger UI ficam ligados por padrão (desenvolvimento) e são desligados com `APP_API_DOCS_ENABLED=false`, que o deploy de produção deve definir.
- **Versionado:** só o `docs/api.md`. A especificação JSON sai da aplicação em `/v3/api-docs`.

## Consequências

- O Markdown não diverge do código sem quebrar o CI, e aparece no diff da PR.
- Mudar um controller ou DTO exige regerar o arquivo; o teste diz o comando.
- O renderizador é código nosso: cobre o que a API usa hoje (objetos, listas, enums, `$ref`, parâmetros de caminho, consulta e cookie) e precisa crescer se aparecer algo novo (por exemplo, `oneOf` ou upload).
- Um código de erro novo sem `@DocumentedError` não aparece na documentação; a revisão de PR precisa olhar isso.
- Se `APP_API_DOCS_ENABLED` não for definido no deploy, a documentação fica pública em produção (ela não expõe dados, só o contrato).

## Alternativas consideradas

- Gerar o Markdown com uma ferramenta Node (widdershins, openapi-to-md): mais uma dependência e um passo fora do Gradle para o CI.
- Plugin Gradle do springdoc para baixar a especificação: sobe a aplicação inteira com banco só para isso; o teste já tem o contexto de pé.
- Versionar também o `openapi.json`: duplica o Markdown no diff sem uso imediato. Pode entrar quando houver cliente gerado no frontend.
- Swagger UI em produção com autenticação: exige outra configuração de segurança sem necessidade no MVP.

## Evidências

- ADR-0027 (Problem Details), ADR-0033 (OpenAPI)
- `backend/src/main/kotlin/com/financeflow/shared/config/OpenApiConfig.kt`, `shared/error/DocumentedError.kt`
- `backend/src/test/kotlin/com/financeflow/docs/ApiDocsTest.kt`, `OpenApiMarkdown.kt`

## Perguntas em aberto

- Nenhuma.
