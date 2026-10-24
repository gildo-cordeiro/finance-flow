# ADR-0033 — Documentação da API pelo OpenAPI (Swagger), não nos READMEs

- Status: Aceito
- Data: 2026-10-24
- Origem do 'porquê': decisão do desenvolvedor durante a F1-08.

## Contexto

As rotas da API estavam descritas à mão no `backend/README.md` (cadastro, login, refresh, logout, recuperação de senha), misturadas com regras de arquitetura. A cada entrega o texto crescia e ficava mais fácil divergir do código: corpo, respostas e códigos de erro eram repetidos em prosa, sem verificação. Com as features da Fase 1 (contas, transações, cartões, orçamento), essa lista ficaria grande demais para um README.

## Decisão

- O contrato da API (rotas, corpos, respostas, códigos de erro em Problem Details) é descrito em OpenAPI, gerado a partir do código do backend.
- A documentação versionada é um Markdown da API, `docs/api.md`, gerado a partir da especificação OpenAPI. O Swagger UI serve para explorar a API em desenvolvimento.
- READMEs e o `CLAUDE.md` não listam rotas. Eles descrevem regras e decisões, e apontam para a documentação da API quando precisam.

## Consequências

- Uma única fonte para o contrato, que acompanha o código em vez de depender de quem escreve o README.
- O frontend e os agentes têm onde consultar corpo e respostas sem ler os controllers.
- Os controllers e DTOs passam a precisar de descrições (anotações do OpenAPI) para o documento gerado ser útil. Os `code` de erro de cada endpoint precisam aparecer nas respostas documentadas.
- Entram dependências novas no backend (por exemplo, `springdoc-openapi`) e um passo para gerar o Markdown.

## Alternativas consideradas

- Manter as rotas nos READMEs: sem verificação, diverge do código e cresce sem limite.
- Só o Swagger UI, sem Markdown versionado: exige a aplicação rodando para consultar e não aparece em revisão de PR.

## Evidências

- ADR-0027 (erros em Problem Details), ADR-0028 (camadas do backend, `api` com controllers e DTOs)
- `backend/README.md`, seção "Autenticação", que listava as rotas até a F1-08

## Perguntas em aberto

- Qual ferramenta gera o Markdown a partir do OpenAPI, e se o CI verifica que `docs/api.md` está atualizado.
- O Swagger UI fica exposto em produção, só em desenvolvimento, ou em produção com autenticação?
- A especificação OpenAPI (`openapi.json`/`.yaml`) também fica versionada, ou só o Markdown?
