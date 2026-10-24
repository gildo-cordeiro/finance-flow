# ADR-0022 — Casal por convite e contexto de visão pessoal ou casal por requisição

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-10, RF-090, RF-091, RF-096). O cabeçalho `X-View-Context` vem do projeto anterior.

## Contexto

O vínculo de casal chega na Fase 5, mas a especificação já define as regras: convite, aceite, um casal ativo por vez e desfazer o vínculo sem perder dados.

## Decisão

- `Couple` liga dois usuários com `status` `PENDING`, `ACTIVE` ou `ENDED`; um usuário tem no máximo um casal ativo.
- Convite por e-mail, com validade de 7 dias; o vínculo só fica ativo após o aceite.
- O frontend envia o contexto em cada requisição pelo cabeçalho `X-View-Context` (`PERSONAL` ou `COUPLE`); sem casal ativo, `COUPLE` é recusado.
- Ao desfazer o vínculo, cada membro mantém seus dados; os dados compartilhados ficam somente leitura para ambos.

## Consequências

- O mesmo endpoint serve as duas visões; o contexto não fica preso a uma sessão no servidor.
- Todo endpoint que lista dados precisa respeitar o contexto, e isso entra nos testes de isolamento (ADR-0012).

## Alternativas consideradas

- Rotas separadas para a visão de casal (`/couple/transactions`): duplica controllers.
- Contexto guardado no perfil do usuário: muda o que outra aba aberta vê.

## Evidências

- Especificação: RN-10, RF-090 a RF-096
- Projeto anterior: ADR antigo 0027 e ADR antigo 0028

## Perguntas em aberto

- Confirmar o cabeçalho `X-View-Context`, que vem do projeto anterior e não está na especificação. Respondida em 2026-10-24: confirmado. No frontend, o contexto entra na chave das consultas do TanStack Query (ou o cache é limpo ao trocar de visão), para a tela não mostrar dados da visão anterior. Sem casal ativo, `COUPLE` é recusado com um `code` próprio (ADR-0027).
