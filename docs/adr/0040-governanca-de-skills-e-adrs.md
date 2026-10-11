# ADR-0040 — Governança de skills e ADRs mantida por skills e checagem não bloqueante no CI

- Status: Aceito
- Data: 2026-10-11 (PR #96, aprovado pelo desenvolvedor)
- Origem do 'porquê': documentada na revisão das skills do PR #96 e na descrição daquele PR.

## Contexto

A revisão de 2026-10-10 (PRs #84 e #96) mostrou que as skills em `.agents/skills/` tinham envelhecido em relação ao código: exemplos com `@MockBean` (no Spring Boot 4 é `@MockitoBean`), imports com alias `@/` que não existia, um `deriveStatus` que o backend não implementava, regra de vencimento do cartão diferente da do código, Kafka e Redis descritos como stack, branch `develop` inexistente e árvore de pacotes desatualizada. O desenvolvedor trabalha com um agente (Antigravity) que segue as skills ao pé da letra, então uma skill falsa gera código errado. Também não havia processo para registrar decisões importantes quando surgem durante a implementação.

## Decisão

1. **Skills são atualizadas junto com a mudança que as afeta**, na mesma PR. A skill `skill-maintenance` define o passo a passo, usando o mapa de impacto `references/impact-map.json` (caminhos alterados para skills). Fato desatualizado é corrigido pelo agente; regra de negócio em conflito é perguntada ao desenvolvedor com opções A, B e C.
2. **ADRs são propostos pelo agente e decididos pelo desenvolvedor.** A skill `adr-workflow` lista os gatilhos e obriga uma consulta com sugestões antes de criar qualquer ADR. O agente nunca cria nem aceita um ADR sem resposta; um ADR novo nasce como `Proposto`; sem como perguntar, vira 'ADRs pendentes' na descrição da PR.
3. **As skills `full-stack-task` e `git-workflow`, o template de PR e as skills de código** passam a exigir esses dois passos ao finalizar uma tarefa (seção 'Skills e decisões' do template).
4. **O CI avisa, mas não bloqueia:** `scripts/check_skills_sync.py` e `.github/workflows/governance.yml` comentam em cada PR quando arquivos mapeados mudam sem a skill correspondente, e quando arquivos sensíveis (dependências, migrations, segurança, workflows) mudam sem ADR. O script sempre sai com código 0; a opção `--strict` existe para tornar o aviso bloqueante.

## Consequências

- Skills e código tendem a evoluir juntos, e as decisões importantes passam por uma pergunta explícita ao desenvolvedor.
- O mapa de impacto precisa ser mantido: tem falsos positivos (por exemplo, qualquer arquivo em `frontend/src/components/**` aciona `frontend-financeflow`) e já foi ajustado uma vez (testes de backend).
- Cada PR ganha uma etapa de revisão; o custo é baixo porque os avisos do CI são informativos.
- Os avisos dependem de o agente ou do revisor agirem sobre eles; sem `--strict`, nada impede o merge.

## Alternativas consideradas

- **Checagem bloqueante (`--strict`):** não adotada por ora. Muitas mudanças não exigem alterar uma skill, e bloquear geraria atrito e justificativas vazias. Pode ser reavaliada se os avisos forem ignorados com frequência.
- **Só convenção nas skills, sem CI:** descartada. A convenção sozinha já falhou (as skills envelheceram), e o CI funciona como lembrete para o agente e para o revisor.
- **Criar ADRs automaticamente:** descartada. O desenvolvedor quer decidir quando uma decisão merece ADR.

## Evidências

- PRs: #84, #96 (mecanismo), #95 (ADRs retroativos)
- Arquivos: `.agents/skills/skill-maintenance/`, `.agents/skills/adr-workflow/`, `scripts/check_skills_sync.py`, `.github/workflows/governance.yml`, `.github/pull_request_template.md`
- Achados da revisão: descrição do PR #96

## Perguntas em aberto

- Se os avisos do CI forem ignorados com frequência, passar a usar `--strict`?
