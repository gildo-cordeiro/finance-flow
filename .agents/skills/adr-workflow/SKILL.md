---
name: adr-workflow
description: >
  Decide quando uma decisão merece um ADR (Architecture Decision Record) e como consultar o desenvolvedor.
  Use esta skill SEMPRE ao finalizar qualquer implementação e sempre que, no meio de uma tarefa, surgir uma
  escolha com alternativas reais: nova dependência ou biblioteca, novo padrão estrutural, mudança de modelo de
  dados ou de regra de negócio central, segurança/autenticação, deploy/infraestrutura, troca ou abandono de uma
  abordagem, ou desvio de um ADR existente. Acione também antes de começar uma tarefa, para ler `docs/adr/`.
  REGRA CENTRAL: o agente PROPÕE, o desenvolvedor DECIDE. Nunca crie, aceite ou altere um ADR sem resposta
  explícita do desenvolvedor, e sempre apresente sugestões junto com a pergunta.
---

# ADRs: quando propor e como consultar o desenvolvedor

ADRs ficam em `docs/adr/` (índice em `docs/adr/README.md`, modelo em `references/adr-template.md`).

## 1. Antes de implementar

Leia `docs/adr/README.md`. Se a tarefa **contradiz um ADR aceito**, pare e pergunte (seção 3) em vez de
implementar. ADRs com status `Proposto` ainda não são regra: trate-os como intenção.

## 2. Quando considerar um ADR (gatilhos)

Considere propor um ADR se a mudança tem **alternativas reais** e **custo de reverter** e envolve pelo menos um:

- dependência ou biblioteca nova, removida ou trocada (backend ou frontend);
- padrão estrutural novo (camada, eventos, cache, mensageria, alias de import, estratégia de estado);
- mudança de modelo de dados ou de regra de negócio central (datas e competência, casal, metas, status);
- segurança, autenticação, autorização ou CORS;
- deploy, CI/CD, infraestrutura ou ambientes;
- abandono ou troca de uma abordagem existente (inclusive adiar algo previsto);
- desvio de um ADR existente, ou de uma skill, por uma boa razão;
- algo que alguém perguntaria depois 'por que é assim?' e o código não responde.

**Não é gatilho:** correção de bug simples, refatoração local, ajuste de estilo, atualização de patch de
dependência, mudança que apenas segue um ADR ou uma skill existente.

Sinais automáticos: o CI (`scripts/check_skills_sync.py`) avisa na PR quando arquivos sensíveis mudam
(`build.gradle`, `package.json`, migrations, `auth/config`, workflows, Dockerfile). O aviso é só um lembrete:
a decisão de propor continua sua.

## 3. Como consultar o desenvolvedor (obrigatório, com sugestões)

Ao detectar um gatilho, **pare e envie uma mensagem neste formato**. Se houver várias decisões, agrupe em
uma só mensagem. Faça isso ao final da implementação (ou antes, se a decisão bloquear o trabalho).

```
Possível ADR: <título sugerido, no formato de decisão>
- O que foi decidido: <uma frase, com o arquivo ou PR onde aparece>
- Por que parece relevante: <gatilho da seção 2>
- Alternativas que considerei: <2 ou 3, com prós e contras curtos>
- Minha sugestão: <1, 2 ou 3> porque <motivo>
- Respostas possíveis:
  1) Criar o ADR agora (eu escrevo o rascunho como 'Proposto')
  2) Registrar só na descrição da PR (decisão pequena ou reversível)
  3) Dispensar (não é decisão arquitetural)
  4) Ajustar: <diga o que mudar no título, na decisão ou no status>
```

Sugestões prontas por tipo:

| Situação | Sugestão padrão |
|---|---|
| Dependência nova, biblioteca trocada | 1 (ADR curto com a alternativa descartada) |
| Mudança em migration/modelo de dados | 1 se altera regra de negócio; 2 se só adiciona coluna |
| Segurança, auth, CORS | 1 |
| Deploy, CI/CD, infraestrutura | 1 |
| Ajuste de configuração reversível | 2 |
| Bug fix, refatoração local, estilo | 3 |

**Aguarde a resposta.** Se não for possível perguntar agora (por exemplo em automação), **não crie o ADR**:
liste a decisão em 'ADRs pendentes' na descrição da PR com o mesmo formato.

## 4. Se o desenvolvedor responder 'criar' (1)

1. Descubra o próximo número em `docs/adr/` e crie `docs/adr/NNNN-slug-em-kebab-case.md` a partir de
   `references/adr-template.md`.
2. Status inicial: **`Proposto`**. Só vira `Aceito` quando o desenvolvedor disser, ou no merge da PR, se ele pedir.
3. Preencha Contexto, Decisão, Consequências, Alternativas e Evidências (commits, arquivos, issues, PRs).
   **Não invente motivação**: o que você não sabe vai em 'Perguntas em aberto' ou 'Motivação não documentada'.
4. Adicione a linha na tabela de `docs/adr/README.md`.
5. Se o novo ADR substitui outro, altere o status do antigo para `Substituído por ADR-NNNN`.
6. Faça o commit na mesma PR: `docs(adr): <título>`.

## 5. Checklist de saída

```
[ ] Li docs/adr/README.md antes de implementar
[ ] Avaliei os gatilhos da seção 2 para o que implementei
[ ] Se houve gatilho, enviei a mensagem da seção 3 com sugestões e aguardei a resposta
[ ] Só criei ADR com resposta 1, em status 'Proposto', e atualizei o README de ADRs
[ ] Decisões sem resposta estão em 'ADRs pendentes' na descrição da PR
```
