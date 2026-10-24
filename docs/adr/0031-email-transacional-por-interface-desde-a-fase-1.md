# ADR-0031 — E-mail transacional desde a Fase 1, pela interface `EmailSender`

- Status: Aceito
- Data: 2026-10-24
- Origem do 'porquê': especificação (RF-004, D-10) e sugestão do card F1-06.

## Contexto

A recuperação de senha por e-mail é da Fase 1 (RF-004, prioridade S), mas D-10 e o ADR-0016 deixam o envio de e-mail para a Fase 2, junto com as notificações. Sem algum e-mail na Fase 1, não há como mandar o link de redefinição. O provedor de e-mail ainda não foi escolhido (decisão pendente "Provedor de e-mail").

## Decisão

- E-mail transacional (por enquanto, só o link de redefinição de senha) entra na Fase 1. Notificações por e-mail continuam na Fase 2 (ADR-0016).
- Todo envio passa pela interface `EmailSender`, em `shared/email`. A implementação é escolhida por `APP_EMAIL_PROVIDER`.
- `APP_EMAIL_PROVIDER=log` (padrão) ativa o `LoggingEmailSender`, que só escreve a mensagem no log. Os testes usam um `EmailSender` falso que captura as mensagens.

## Consequências

- A F1-06 fica pronta e testável sem depender do provedor.
- Trocar ou adicionar provedor é escrever outra implementação, sem mexer nos casos de uso.
- Risco: com o padrão `log`, links com token vão para o log. A produção não pode subir sem o provedor real configurado.
- Hoje o envio é síncrono. Com um provedor lento, o tempo de resposta de `/password/forgot` pode revelar se o e-mail está cadastrado. O envio deve passar a ser assíncrono quando o provedor real entrar.

## Alternativas consideradas

- Esperar o provedor para implementar a F1-06: bloquearia um requisito da Fase 1 por uma escolha que não muda o código do fluxo.
- SMTP genérico pelo `spring-boot-starter-mail`: continua possível como uma das implementações; não dispensa a escolha do provedor.

## Evidências

- Especificação: RF-004, D-10, RNF-02
- ADR-0016 (notificações em três etapas), ADR-0005 (revogação de sessões na troca de senha)
- Card F1-06 · Recuperação de senha por e-mail

## Perguntas em aberto

- Qual provedor de e-mail? (o mesmo da Fase 2, em aberto no ADR-0016) Continua em aberto, mas precisa estar decidido antes do primeiro deploy em produção. Bastam um provedor com API HTTP e plano gratuito ou SMTP pelo `spring-boot-starter-mail`.
- O envio assíncrono usa `@Async` ou um evento após o commit? Respondida em 2026-10-24: os dois. O caso de uso publica um evento, tratado por `@TransactionalEventListener(phase = AFTER_COMMIT)` com `@Async`. Após o commit, o token já está gravado quando o link sai; assíncrono, `/password/forgot` responde no mesmo tempo com ou sem e-mail cadastrado (RNF-02).
- Bloquear a inicialização com o perfil de produção e `APP_EMAIL_PROVIDER=log`, para links com token não irem ao log? Sugerido em 2026-10-24, a implementar junto com o provedor real.
