# Architecture Decision Records (ADRs)

Registro das decisões de arquitetura, produto e design do FinanceFlow. Um arquivo por decisão, numerado em ordem.

A fonte da verdade é a [especificação de requisitos](https://docs.google.com/document/d/1CfbRNUUDdoY80AoHaz08wKSFjMLFWbwa-7_WDYMPnlU/edit). Os ADRs registram como e por que cada decisão foi tomada, e citam os IDs da especificação (RN, RF, RNF, RES, D). Se um ADR e a especificação divergirem, vale a especificação, e o ADR deve ser substituído.

Este conjunto recomeça a numeração. Os 40 ADRs do projeto anterior foram escritos a partir do código antigo e ficam no repositório antigo como histórico. A tabela no fim deste arquivo mostra para onde foi cada um.

## Status

- **Aceito**: decisão em vigor. O campo 'Origem do porquê' de cada ADR diz se ela vem da especificação, do projeto anterior ou de uma sugestão nova. Os ADRs 0001 a 0030 foram aceitos em 2026-10-22; as perguntas em aberto continuam valendo.
- **Proposto**: ainda espera a decisão do desenvolvedor.

## Índice

| ADR | Decisão | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-monolito-modular-em-monorepo.md) | Monólito modular em monorepo | Aceito | 2026-10-22 |
| [0002](0002-kotlin-e-spring-boot-no-backend.md) | Kotlin e Spring Boot 4 no backend | Aceito | 2026-10-22 |
| [0003](0003-postgresql-e-flyway-com-schema-novo.md) | PostgreSQL com Flyway e schema recomeçado do zero | Aceito | 2026-10-22 |
| [0004](0004-uuid-e-valores-monetarios-em-numeric.md) | Chaves UUID e valores monetários em NUMERIC(19,4) | Aceito | 2026-10-22 |
| [0005](0005-autenticacao-jwt-com-refresh-token-rotativo.md) | Autenticação JWT com refresh token rotativo | Aceito | 2026-10-22 |
| [0006](0006-sem-redis-no-inicio.md) | Sem Redis no início: Caffeine e Bucket4j | Aceito | 2026-10-22 |
| [0007](0007-tres-datas-por-transacao-e-mes-civil.md) | Três datas por transação e orçamento pelo mês civil de competência | Aceito | 2026-10-22 |
| [0008](0008-competencia-por-deslocamento.md) | Competência sugerida por deslocamento sobre a data de referência | Aceito | 2026-10-22 |
| [0009](0009-fatura-como-entidade.md) | Fatura de cartão como entidade própria, definida pelo ciclo de fechamento | Aceito | 2026-10-22 |
| [0010](0010-parcelas-e-recorrencias-materializadas.md) | Parcelas e recorrências materializadas como transações | Aceito | 2026-10-22 |
| [0011](0011-saldo-calculado-e-conciliacao.md) | Saldo de conta calculado, com saldo do banco guardado para conciliação | Aceito | 2026-10-22 |
| [0012](0012-visibilidade-e-isolamento-de-dados.md) | Visibilidade em três estados desde a Fase 1 e isolamento de dados | Aceito | 2026-10-22 |
| [0013](0013-categorias-em-dois-niveis-com-tipo.md) | Categorias em dois níveis, com tipo, arquivadas em vez de excluídas | Aceito | 2026-10-22 |
| [0014](0014-open-finance-por-agregador.md) | Open Finance por agregador autorizado, com importação OFX e CSV antes | Aceito | 2026-10-22 |
| [0015](0015-moeda-unica-brl.md) | Moeda única: real (BRL) | Aceito | 2026-10-22 |
| [0016](0016-notificacoes-em-tres-etapas.md) | Notificações: central no app, depois e-mail, depois push | Aceito | 2026-10-22 |
| [0017](0017-stack-do-frontend.md) | Stack do frontend | Aceito | 2026-10-22 |
| [0018](0018-reaproveitar-base-do-frontend-anterior.md) | Reaproveitar a base visual e as ferramentas do frontend anterior | Aceito | 2026-10-22 |
| [0019](0019-exportacao-e-exclusao-de-dados-lgpd.md) | Exportação e exclusão de dados desde o MVP (LGPD) | Aceito | 2026-10-22 |
| [0020](0020-objetivos-com-contribuicoes-ligadas-ao-orcamento.md) | Objetivos com contribuições ligadas a transações e ao orçamento | Aceito | 2026-10-22 |
| [0021](0021-gastos-de-viagem-como-transacoes.md) | Gastos de viagem são transações comuns ligadas à viagem | Aceito | 2026-10-22 |
| [0022](0022-casal-por-convite-e-contexto-de-visao.md) | Casal por convite e contexto de visão por requisição | Aceito | 2026-10-22 |
| [0023](0023-estrategia-de-testes.md) | Estratégia de testes e verificação automática | Aceito | 2026-10-22 |
| [0024](0024-infraestrutura-e-deploy-de-baixo-custo.md) | Infraestrutura e deploy de baixo custo | Aceito | 2026-10-22 |
| [0025](0025-fluxo-de-git-por-pull-requests.md) | Fluxo de Git por Pull Requests e Conventional Commits | Aceito | 2026-10-22 |
| [0026](0026-armazenamento-de-tokens-no-frontend.md) | Access token em memória e refresh token em cookie HttpOnly | Aceito | 2026-10-22 |
| [0027](0027-erros-da-api-em-problem-details.md) | Erros da API em Problem Details, por um handler global | Aceito | 2026-10-22 |
| [0028](0028-organizacao-interna-dos-modulos-do-backend.md) | Organização interna dos módulos do backend | Aceito | 2026-10-22 |
| [0029](0029-frontend-organizado-por-features.md) | Frontend organizado por features | Aceito | 2026-10-22 |
| [0030](0030-adrs-e-skills-de-agentes-no-repositorio.md) | ADRs e skills de agentes versionados no repositório | Aceito | 2026-10-22 |
| [0031](0031-email-transacional-por-interface-desde-a-fase-1.md) | E-mail transacional desde a Fase 1, pela interface `EmailSender` | Proposto | 2026-10-24 |
| [0032](0032-componentes-de-interface-pelo-shadcn-ui.md) | Componentes de interface pelo shadcn/ui (substitui parte do 0018) | Aceito | 2026-10-24 |
| [0033](0033-documentacao-da-api-pelo-openapi.md) | Documentação da API pelo OpenAPI (Swagger), não nos READMEs | Aceito | 2026-10-24 |

## Como criar um ADR

1. Copie [`_template.md`](_template.md) e use o próximo número.
2. Preencha Status, Data, Origem do 'porquê', Contexto, Decisão, Consequências, Alternativas, Evidências e Perguntas em aberto.
3. Cite os IDs da especificação. Se a decisão não está nela, o status é Proposto até o desenvolvedor decidir.
4. Seja curto: o ADR explica o porquê; o como fica no código.
5. Adicione a linha no índice acima.

## ADRs do projeto anterior

| Antigo | Assunto | Destino |
| --- | --- | --- |
| 0001 | Monólito modular em monorepo | Mantido em 0001 |
| 0002 | Java 21 e Spring Boot | Substituído por 0002 (Kotlin) |
| 0003 | PostgreSQL | Mantido em 0003 |
| 0004 | Migrations Flyway | Mantido em 0003, agora com `validate-on-migrate` ligado |
| 0005 | UUID e NUMERIC(19,4) | Mantido em 0004 |
| 0006 | JWT com refresh rotativo | Mantido em 0005, com rate limiting e hash do token |
| 0007 | Domínio separado da persistência | Simplificado em 0028 |
| 0008 | Handler global de erros | Mantido em 0027, com Problem Details |
| 0009 | Stack do frontend | Mantido em 0017 |
| 0010 | Tailwind CSS v3 | Incorporado em 0018 |
| 0011 | Tokens no `localStorage` | Substituído por 0026 |
| 0012 | Exclusão de usuário em cascata | Incorporado em 0019, com exportação |
| 0013 | Skills de agentes no repositório | Mantido em 0030 |
| 0014 | Fluxo de Git por PRs | Mantido em 0025 |
| 0015 | Redis planejado e adiado | Substituído por 0006 (sem Redis no início) |
| 0016 | Open Finance e viagens adiados | Substituído por 0014 e 0021 |
| 0017 | Três datas por transação | Mantido em 0007, com o mês civil |
| 0018 | Categorias em dois níveis | Mantido em 0013, com tipo e sem exclusão em cascata |
| 0019 | Orçamento previsto armazenado, realizado calculado | Incorporado em 0011 |
| 0020 | Estratégia de testes | Mantido em 0023 |
| 0021 | Competência do cartão pelo fechamento, regra de 7 dias | Substituído por 0008 e 0009 |
| 0022 | Spring Boot 4 | Incorporado em 0002 |
| 0023 | React Hook Form e Zod | Incorporado em 0018 |
| 0024 | Cartão associado a conta de pagamento | Pergunta em aberto em 0009 |
| 0025 | Fluxo de caixa projetado | Descartado como ADR: o comportamento está em RF-051 a RF-053 |
| 0026 | Parcelas e recorrências materializadas | Mantido em 0010, com `Recurrence` e horizonte configurável |
| 0027 | Vínculo de casal por convite | Mantido em 0022 |
| 0028 | Contexto pelo cabeçalho `X-View-Context` | Mantido em 0022, a confirmar |
| 0029 | Visibilidade PERSONAL/SHARED | Substituído por 0012 (três estados) |
| 0030 | Design system escuro | Incorporado em 0018 |
| 0031 | Navegação por sidebar fixa | Descartado: detalhe de interface, a decidir no redesenho |
| 0032 | Metas como envelopes virtuais | Substituído por 0020 |
| 0033 | Ciclo de vida de contas (arquivar, encerrar, excluir) | Descartado: a especificação prevê só edição e arquivamento (RF-011) |
| 0034 | Frontend por features | Mantido em 0029 |
| 0035 | Deploy no Render, Railway e Vercel | Mantido em 0024 |
| 0036 | Kafka fora da stack | Citado em 0016; continua valendo |
| 0037 | Tokens de texto e tipografia | Incorporado em 0018 |
| 0038 | Componentes de valor, estado vazio e período | Incorporado em 0018 |
| 0039 | Modal único de lançamento (proposto) | Descartado: as telas serão redesenhadas |
| 0040 | Tooling do shadcn/ui | Incorporado em 0018 |
