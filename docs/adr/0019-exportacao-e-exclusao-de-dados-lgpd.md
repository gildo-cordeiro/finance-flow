# ADR-0019 — Exportação e exclusão de dados do usuário desde o MVP (LGPD)

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RF-100, RF-101, RF-102, RNF-10).

## Contexto

O sistema guarda dados financeiros pessoais. A LGPD exige finalidade declarada e permite ao titular pedir os dados e a exclusão. O projeto anterior tinha exclusão em cascata, mas nenhuma exportação.

## Decisão

- Exportação de todos os dados do usuário em JSON ou CSV, gerada de forma assíncrona em até 24 horas.
- Exclusão completa da conta com confirmação explícita, em até 30 dias, incluindo anexos no armazenamento de arquivos e tokens do Open Finance (com revogação no agregador).
- As chaves estrangeiras que partem de `users` usam `ON DELETE CASCADE`; arquivos externos são apagados por um job antes da exclusão no banco.
- Aceite da política de privacidade e dos termos registrado com versão e data.
- Tudo isso entra na Fase 1.

## Consequências

- Conformidade desde o primeiro usuário real.
- O cascade no banco não alcança arquivos e serviços externos; o job de exclusão precisa cobrir cada um.

## Alternativas consideradas

- Deixar para depois do MVP: arriscado com dados financeiros reais.

## Evidências

- Especificação: RF-100, RF-101, RF-102, RNF-10
- Projeto anterior: ADR antigo 0012

## Perguntas em aberto

- Se um membro do casal exclui a conta, o que acontece com os dados compartilhados que o outro vê?
