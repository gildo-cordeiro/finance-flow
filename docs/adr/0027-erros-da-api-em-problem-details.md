# ADR-0027 — Erros da API em Problem Details, por um handler global

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão; o handler global vem do projeto anterior e o formato Problem Details é novo.

## Contexto

O frontend precisa de um formato de erro único para exibir mensagens e marcar campos inválidos.

## Decisão

- Exceções de domínio (não encontrado, validação, regra de negócio, não autorizado, proibido) são traduzidas em um só `@RestControllerAdvice`.
- A resposta segue Problem Details (RFC 9457, suportado nativamente pelo Spring), com um campo `code` estável (por exemplo, `NO_ACTIVE_COUPLE`) e a lista de campos inválidos quando houver.
- Códigos HTTP: 400 para entrada malformada, 401, 403, 404, 409 para conflito de regra de negócio e 422 para validação.

## Consequências

- Um só tratamento de erro no cliente HTTP do frontend.
- Mensagens para o usuário ficam no frontend, a partir do `code`.

## Alternativas consideradas

- Formato próprio (projeto anterior): funciona, mas reinventa o padrão.

## Evidências

- Projeto anterior: ADR antigo 0008

## Perguntas em aberto

- Nenhuma.
