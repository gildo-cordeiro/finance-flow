# ADR-0035 — Skills de agentes em `.claude/skills/`

- Status: Proposto (substitui, no ADR-0030, só o item "skills ficam em `.agents/skills/`")
- Data: 2026-10-24
- Origem do 'porquê': pedido do desenvolvedor.

## Contexto

O ADR-0030 pôs as skills em `.agents/skills/`, a pasta herdada do projeto anterior. O agente usado no desenvolvimento é o Claude Code, que procura skills de projeto em `.claude/skills/<nome>/SKILL.md`. As primeiras skills (`backend-kotlin` e `frontend-react`) ficaram em `.agents/skills/`, com um link simbólico em `.claude/skills` só para o Claude Code encontrá-las.

## Decisão

- As skills ficam em `.claude/skills/<nome>/SKILL.md`, a pasta padrão do Claude Code. `.agents/skills/` deixa de existir.
- O resto do ADR-0030 continua: skills escritas a partir da especificação e dos ADRs, não do código, e revisadas quando um ADR muda.

## Consequências

- O Claude Code carrega as skills sem configuração nem link simbólico (link simbólico no Git também dá problema no Windows).
- Outro agente que procure skills em outra pasta não as encontra sozinho; nesse caso, ele precisa ser apontado para `.claude/skills/`.

## Alternativas consideradas

- Manter `.agents/skills/` com o link em `.claude/skills`: duas pastas para a mesma coisa, e o link quebra em checkouts no Windows sem suporte a symlink.

## Evidências

- ADR-0030
- PR #11 (primeiras skills)

## Perguntas em aberto

- Nenhuma.
