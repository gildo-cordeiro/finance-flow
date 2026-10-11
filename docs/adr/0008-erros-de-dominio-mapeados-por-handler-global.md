# ADR-0008 — Erros de domínio mapeados por um handler global

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no código; o motivo não está documentado.

## Contexto

A API precisa devolver respostas HTTP consistentes para erros de negócio, validação e autorização.

## Decisão

Exceções de domínio em `shared/exception` são traduzidas por um `GlobalExceptionHandler`: `NotFoundException` para 404, `ValidationException` para 422 (`UNPROCESSABLE_CONTENT`), `UnauthorizedException` para 401, `BusinessException` para 409 e `ForbiddenException` para 403. Há também handler para `MethodArgumentNotValidException`.

## Consequências

- `BusinessException` carrega um código de negócio (por exemplo, `NO_ACTIVE_COUPLE`) que o frontend pode tratar.
- Os commits `d1b69c9` e `a998716` trocaram o status `UNPROCESSABLE_ENTITY`, depreciado, por `UNPROCESSABLE_CONTENT`.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `1dc589d`, `d1b69c9`, `a998716`
- `backend/.../shared/exception/GlobalExceptionHandler.java`

## Perguntas em aberto

- Motivação não documentada — confirmar com Gildo.
