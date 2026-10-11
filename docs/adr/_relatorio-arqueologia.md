# Relatório da arqueologia de decisões

Gerado em 2026-10-10 como complemento dos ADRs retroativos (0001 a 0038) e do ADR proposto (0039).

## Método e limites

**Fontes lidas:** o PDF de requisitos (`docs/FinanceFlow_Requisitos_Arquitetura.pdf`, em especial §1, §2.3, §2.7, §2.8, §3, §4, §6 e §8), o README, os 121 commits da `main` (2026-06-22 a 2026-10-10), as 12 migrations Flyway, `application.properties`, `SecurityConfig`, `GlobalExceptionHandler`, casos de uso de autenticação, transações, metas, contas e casal, o frontend (`package.json`, `services/api.ts`, contextos, componentes de UI), `docker-compose.yml`, `Dockerfile`, o workflow de CI/deploy e as skills.

**Limites:** não executei a aplicação; não li todos os casos de uso; as skills `couple-context` e `temporal-competence` foram lidas só em parte. Os commits quase não têm corpo, então a maior parte das motivações só pôde ser documentada quando o PDF ou o README a registra. Onde não há registro, o ADR diz isso e a pergunta está abaixo.

## Resumo

- Total de ADRs: 39 (status: Aceito (retroativo): 36, Adiado (retroativo): 2, Proposto: 1).
- Confiança: alta: 19, média: 18, baixa: 2.
- Revisar primeiro: ADR-0004 (`validate-on-migrate=false`), ADR-0011 (tokens no `localStorage`), ADR-0021 (regra de 7 dias do vencimento do cartão), ADR-0026 (recorrência limitada a 12 meses) e ADR-0035 (provedor de deploy em produção).

## Perguntas em aberto (consolidadas)

- **ADR-0001** (Monólito modular em monorepo): Existe regra sobre quais módulos podem depender de quais? (hoje `goals` usa o repositório de `couple`, por exemplo.)
- **ADR-0003** (PostgreSQL como banco principal): A versão de produção do Postgres é a 15, a 16 ou outra? Vale alinhar o CI e o ambiente local à produção.
- **ADR-0004** (Schema evoluído apenas por migrations Flyway): Por que `validate-on-migrate` está como `false`? Motivação não documentada — confirmar com Gildo.
- **ADR-0005** (Identificadores UUID e valores monetários em NUMERIC(19,4)): Motivação não documentada — confirmar com Gildo.
- **ADR-0005** (Identificadores UUID e valores monetários em NUMERIC(19,4)): Há planos de suportar mais de uma moeda?
- **ADR-0006** (Autenticação JWT de acesso curto com refresh token rotativo): O rate limiting do login previsto no PDF foi adiado ou esquecido?
- **ADR-0007** (Domínio separado da persistência (Records, Entities e Mappers)): O uso direto de entidades nos use cases é uma exceção aceita ou uma divergência a corrigir?
- **ADR-0008** (Erros de domínio mapeados por um handler global): Motivação não documentada — confirmar com Gildo.
- **ADR-0010** (Tailwind CSS v3 (e não v4)): Por que o v3 em vez do v4, e existe plano de migração? Motivação não documentada — confirmar com Gildo.
- **ADR-0011** (Tokens de acesso no localStorage e cliente HTTP próprio com refresh automático): O risco de guardar tokens no `localStorage` foi avaliado e aceito? Motivação não documentada — confirmar com Gildo.
- **ADR-0012** (Exclusão de usuário propaga em cascata pelo schema): Existe endpoint de backend para exclusão de conta e exportação de dados (PDF §6.4)? Não verifiquei; a exportação não foi encontrada.
- **ADR-0013** (Skills de agentes de IA versionadas no repositório): Qual é o processo para manter as skills sincronizadas com o código?
- **ADR-0014** (Fluxo de Git por Pull Requests e Conventional Commits): Merge commit é a estratégia desejada, ou a meta é squash?
- **ADR-0015** (Cache Redis (Upstash) planejado e ainda não implementado): O Redis continua no roadmap? Se não, retirar do README e do `docker-compose.yml`.
- **ADR-0016** (Open Finance e Viagens fora do escopo atual): Esses módulos seguem no roadmap, com prazo? Motivação do adiamento não documentada.
- **ADR-0018** (Categorias organizadas em categoria e subcategoria): A árvore tem exatamente dois níveis ou pode crescer? A ausência de tipo (receita/despesa) é proposital?
- **ADR-0019** (Orçamento: valor previsto armazenado, valor realizado calculado): Confirmar no código que o realizado usa exclusivamente `competence_date`.
- **ADR-0020** (Estratégia de testes e verificações automáticas): A meta de 70% de cobertura continua valendo? Qual é a cobertura atual?
- **ADR-0021** (Competência e vencimento de cartão derivados do dia de fechamento): De onde vem a regra de 7 dias entre fechamento e vencimento? Motivação não documentada — confirmar com Gildo.
- **ADR-0022** (Atualização para Spring Boot 4.0.x): Motivação da atualização não documentada — confirmar com Gildo.
- **ADR-0023** (Formulários com React Hook Form e Zod): Motivação não documentada — confirmar com Gildo.
- **ADR-0024** (Cartão de crédito associado a uma conta de pagamento): Como exatamente o saldo projetado usa essa associação? Detalhar após conferir `GetCashFlowUseCase`.
- **ADR-0025** (Fluxo de caixa com saldo projetado por conta): Qual é o critério dos alertas de aperto? Registrar após leitura detalhada do use case.
- **ADR-0026** (Parcelas e recorrências materializadas como transações): O que deve acontecer com recorrências após 12 meses? Motivação do limite não documentada.
- **ADR-0027** (Vínculo de casal por convite entre dois usuários): Atualizar a skill `couple-context` para refletir os nomes reais?
- **ADR-0028** (Contexto de visão pessoal ou casal definido pelo cabeçalho X-View-Context): Todos os demais endpoints (orçamento, dashboard, fluxo de caixa) respeitam o contexto? Não verifiquei.
- **ADR-0029** (Visibilidade PERSONAL/SHARED e isolamento de dados por usuário): Há testes automatizados que garantem que transações `PERSONAL` nunca vazam para o parceiro?
- **ADR-0030** (Design system escuro ("Dark Premium") com tokens e componentes base): Motivação da identidade visual não documentada — confirmar com Gildo.
- **ADR-0031** (Navegação principal por sidebar fixa): Motivação não documentada — confirmar com Gildo.
- **ADR-0032** (Metas como envelopes virtuais com contribuições manuais): Contribuições automáticas e projeção de atingimento continuam no roadmap?
- **ADR-0035** (Deploy contínuo: backend em Docker (Render ou Railway) e frontend na Vercel): Qual provedor está em uso em produção (Render ou Railway)?
- **ADR-0035** (Deploy contínuo: backend em Docker (Render ou Railway) e frontend na Vercel): Por que a JVM precisou forçar IPv4 (`afdfca8`)? Motivação não documentada.
- **ADR-0035** (Deploy contínuo: backend em Docker (Render ou Railway) e frontend na Vercel): Existe ou haverá ambiente de staging?
- **ADR-0039** (Modal único de lançamento (Despesa | Receita, Pago com, Mais detalhes)): Aprovar a proposta e passar o status para Aceito quando as issues forem concluídas.

## Lacunas em relação aos requisitos do PDF

Itens previstos no PDF que **não encontrei** no código. Não são decisões registradas; são pontos para confirmar se foram adiados ou esquecidos.

- Criptografia AES-256 de colunas sensíveis em repouso (PDF §3 e §6.3): nenhum uso de `Cipher`, `@Convert` ou equivalente.
- Exportação de dados do usuário em JSON/CSV (PDF §6.4): não encontrada.
- Rate limiting no endpoint de login (PDF §6.1): não encontrado.
- Cobertura mínima de 70% no backend (PDF §3): sem JaCoCo nem limite configurado.
- Armazenamento de arquivos (Cloudflare R2, PDF §4.2): sem código correspondente.
- Despesas compartilhadas com divisão percentual e relatórios por membro (PDF §2.7): não verifiquei.

## Divergências entre documentação e código

- O PDF cita Spring Boot 3; o código usa 4.0.7 (ADR-0022).
- O README lista Redis (Upstash) como parte da stack; o código não o usa (ADR-0015).
- A skill `couple-context` usa `user_a_id`/`user_b_id` e o status `PENDING_INVITE`; o schema usa `user1_id`/`user2_id` e `PENDING` (ADR-0027).
- A skill `git-workflow` aceita squash ou merge commit; o histórico usa merge commit (ADR-0014).
- O Postgres local é a versão 16 e o do CI é a 15 (ADR-0003).
- O job de CI do frontend se chama 'Node 18', mas instala o Node 20.
- O `docs/design-system.md` e a skill `frontend-financeflow` repetem tokens e regras; já divergiram uma vez (corrigido nos PRs #84 e #90).

## Candidatas descartadas (evidência insuficiente)

- Notificações com um `ToastContext` próprio (commit `f15ca88`): sem registro de alternativa ou motivo.
- Preferências do usuário (`date_format`, fuso, moeda; V10): adição de coluna, sem decisão de arquitetura.
- Atualização de dependências sem registro de motivo além do ADR-0022.
