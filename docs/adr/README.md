# Architecture Decision Records (ADRs)

Registro das decisões de arquitetura, de produto e de design do FinanceFlow. Um arquivo por decisão, numerado em ordem cronológica. Um ADR aceito não é reescrito: se a decisão mudar, crie um ADR novo que o substitui e atualize o status do antigo.

Os ADRs 0001 a 0038 foram escritos **retroativamente** em 2026-10-10, a partir do PDF de requisitos (`docs/FinanceFlow_Requisitos_Arquitetura.pdf`), do README, do código, das migrations, do workflow de CI e do histórico do git. O campo 'Origem do porquê' de cada ADR diz se a motivação está documentada ou foi inferida das evidências; o que não pôde ser provado está em 'Perguntas em aberto'. O relatório consolidado está em [`_relatorio-arqueologia.md`](_relatorio-arqueologia.md).

## Índice

| ADR | Decisão | Status | Data | Confiança |
| --- | --- | --- | --- | --- |
| [0001](0001-monolito-modular-em-monorepo.md) | Monólito modular em monorepo | Aceito (retroativo) | 2026-06-22 | alta |
| [0002](0002-java-21-e-spring-boot-no-backend.md) | Java 21 e Spring Boot no backend | Aceito (retroativo) | 2026-06-22 | alta |
| [0003](0003-postgresql-como-banco-principal.md) | PostgreSQL como banco principal | Aceito (retroativo) | 2026-06-22 | alta |
| [0004](0004-schema-evoluido-por-migrations-flyway.md) | Schema evoluído apenas por migrations Flyway | Aceito (retroativo) | 2026-06-22 | média |
| [0005](0005-uuid-e-numeric-19-4.md) | Identificadores UUID e valores monetários em NUMERIC(19,4) | Aceito (retroativo) | 2026-06-22 | média |
| [0006](0006-autenticacao-jwt-com-refresh-token-rotativo.md) | Autenticação JWT de acesso curto com refresh token rotativo | Aceito (retroativo) | 2026-06-22 | alta |
| [0007](0007-dominio-separado-da-persistencia.md) | Domínio separado da persistência (Records, Entities e Mappers) | Aceito (retroativo) | 2026-06-22 | alta |
| [0008](0008-erros-de-dominio-mapeados-por-handler-global.md) | Erros de domínio mapeados por um handler global | Aceito (retroativo) | 2026-06-22 | média |
| [0009](0009-stack-do-frontend.md) | Stack do frontend: React, Vite, TypeScript, TanStack Query, Router, Recharts e date-fns | Aceito (retroativo) | 2026-06-22 | alta |
| [0010](0010-tailwind-css-v3.md) | Tailwind CSS v3 (e não v4) | Aceito (retroativo) | 2026-06-22 | média |
| [0011](0011-tokens-no-localstorage-e-cliente-http-proprio.md) | Tokens de acesso no localStorage e cliente HTTP próprio com refresh automático | Aceito (retroativo) | 2026-06-22 | média |
| [0012](0012-exclusao-de-usuario-em-cascata.md) | Exclusão de usuário propaga em cascata pelo schema | Aceito (retroativo) | 2026-06-22 | média |
| [0013](0013-skills-de-agentes-versionadas-no-repositorio.md) | Skills de agentes de IA versionadas no repositório | Aceito (retroativo) | 2026-06-22 | média |
| [0014](0014-fluxo-de-git-por-pull-requests.md) | Fluxo de Git por Pull Requests e Conventional Commits | Aceito (retroativo) | 2026-06-22 | alta |
| [0015](0015-cache-redis-planejado-e-adiado.md) | Cache Redis (Upstash) planejado e ainda não implementado | Adiado (retroativo) | 2026-06-22 | média |
| [0016](0016-open-finance-e-viagens-adiados.md) | Open Finance e Viagens fora do escopo atual | Adiado (retroativo) | 2026-06-22 | média |
| [0017](0017-tres-datas-por-transacao.md) | Três datas por transação: competência, vencimento e pagamento | Aceito (retroativo) | 2026-06-23 | alta |
| [0018](0018-categorias-em-dois-niveis.md) | Categorias organizadas em categoria e subcategoria | Aceito (retroativo) | 2026-06-23 | média |
| [0019](0019-orcamento-previsto-armazenado-realizado-calculado.md) | Orçamento: valor previsto armazenado, valor realizado calculado | Aceito (retroativo) | 2026-06-23 | média |
| [0020](0020-estrategia-de-testes-e-verificacao-automatica.md) | Estratégia de testes e verificações automáticas | Aceito (retroativo) | 2026-06-23 | média |
| [0021](0021-competencia-e-vencimento-do-cartao-pelo-fechamento.md) | Competência e vencimento de cartão derivados do dia de fechamento | Aceito (retroativo) | 2026-06-26 | alta |
| [0022](0022-spring-boot-4.md) | Atualização para Spring Boot 4.0.x | Aceito (retroativo) | 2026-06-26 | média |
| [0023](0023-formularios-com-react-hook-form-e-zod.md) | Formulários com React Hook Form e Zod | Aceito (retroativo) | 2026-06-26 | média |
| [0024](0024-cartao-associado-a-conta-de-pagamento.md) | Cartão de crédito associado a uma conta de pagamento | Aceito (retroativo) | 2026-06-26 | média |
| [0025](0025-fluxo-de-caixa-projetado.md) | Fluxo de caixa com saldo projetado por conta | Aceito (retroativo) | 2026-06-26 | baixa |
| [0026](0026-parcelas-e-recorrencias-materializadas.md) | Parcelas e recorrências materializadas como transações | Aceito (retroativo) | 2026-06-27 | alta |
| [0027](0027-vinculo-de-casal-por-convite.md) | Vínculo de casal por convite entre dois usuários | Aceito (retroativo) | 2026-06-27 | alta |
| [0028](0028-contexto-de-visao-pessoal-ou-casal-por-header.md) | Contexto de visão pessoal ou casal definido pelo cabeçalho X-View-Context | Aceito (retroativo) | 2026-06-27 | alta |
| [0029](0029-visibilidade-pessoal-compartilhada-e-isolamento-por-usuario.md) | Visibilidade PERSONAL/SHARED e isolamento de dados por usuário | Aceito (retroativo) | 2026-06-27 | média |
| [0030](0030-design-system-dark-premium.md) | Design system escuro ("Dark Premium") com tokens e componentes base | Aceito (retroativo) | 2026-06-28 | alta |
| [0031](0031-navegacao-por-sidebar-fixa.md) | Navegação principal por sidebar fixa | Aceito (retroativo) | 2026-06-28 | baixa |
| [0032](0032-metas-como-envelopes-virtuais.md) | Metas como envelopes virtuais com contribuições manuais | Aceito (retroativo) | 2026-06-30 | alta |
| [0033](0033-ciclo-de-vida-de-contas.md) | Ciclo de vida de contas: arquivar, encerrar e excluir com regras | Aceito (retroativo) | 2026-07-01 | alta |
| [0034](0034-frontend-organizado-por-features.md) | Frontend organizado por features | Aceito (retroativo) | 2026-07-12 | alta |
| [0035](0035-deploy-continuo-docker-render-railway-e-vercel.md) | Deploy contínuo: backend em Docker (Render ou Railway) e frontend na Vercel | Aceito (retroativo) | 2026-07-12 | média |
| [0036](0036-kafka-fora-da-stack.md) | Kafka fora da stack | Aceito (retroativo) | 2026-10-10 | alta |
| [0037](0037-tokens-de-texto-e-tipografia-minima.md) | Tokens de texto e tipografia mínima legível | Aceito (retroativo) | 2026-10-10 | alta |
| [0038](0038-componentes-compartilhados-de-valor-estado-vazio-e-periodo.md) | Componentes compartilhados para valor monetário, estado vazio e período | Aceito (retroativo) | 2026-10-10 | média |
| [0039](0039-modal-unico-de-lancamento.md) | Modal único de lançamento (Despesa | Receita, Pago com, Mais detalhes) | Proposto | 2026-10-10 | alta |

## Como criar um ADR

1. Copie o último ADR como base e use o próximo número.
2. Preencha: Status, Data, Contexto, Decisão, Consequências, Alternativas consideradas, Evidências e Perguntas em aberto.
3. Seja curto: o ADR explica o porquê; o como fica no código e nas issues.
4. Adicione a linha na tabela acima.
