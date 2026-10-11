---
name: skill-maintenance
description: >
  Mantém as skills do FinanceFlow sincronizadas com o código. Use esta skill SEMPRE ao finalizar qualquer
  implementação, correção, refatoração ou mudança de configuração, e antes de abrir ou atualizar um Pull Request.
  Acione também quando a mudança alterar: dependências ou versões, comandos de build/teste, nomes de pastas ou
  módulos, componentes de UI ou tokens de design, schema do banco (migration), regras de negócio (datas,
  competência, casal, metas), segurança, CI/CD ou o template de PR. Objetivo: nenhuma skill fica falsa depois
  de uma mudança; toda atualização acontece na mesma PR que causou o impacto.
---

# Manutenção das Skills (Skill Sync)

**Skills são parte do código.** Uma mudança que torna uma skill falsa é uma mudança incompleta.
A fonte de verdade é o **código**; a skill descreve o código. Quando divergirem, a skill é atualizada, a menos
que a divergência seja uma decisão de negócio: nesse caso, pergunte ao desenvolvedor (seção 4).

## 1. Quando executar

Ao terminar qualquer tarefa que alterou arquivos, antes do commit final ou do PR. Se a tarefa só mexeu em
documentação sem relação com as skills, registre "sem impacto" e siga.

## 2. Passo a passo (obrigatório)

1. Liste os arquivos alterados: `git diff --name-only main...HEAD`.
2. Descubra as skills candidatas com `python3 scripts/check_skills_sync.py` (usa `references/impact-map.json`).
   Se o script não estiver disponível, consulte a tabela da seção 3.
3. Para cada skill candidata, abra a skill e procure (`grep`) os nomes que mudaram: classe, arquivo, comando,
   versão, token de design, regra, trecho de exemplo.
4. Classifique cada achado:
   - **Fato desatualizado** (caminho, nome, comando, versão, valor de token, código de exemplo): atualize a
     skill agora, na mesma PR, mudando só as linhas afetadas.
   - **Regra de negócio ou política em conflito** (a skill diz X, o código faz Y, ou a mudança cria uma regra nova):
     **não decida sozinho**; pergunte ao desenvolvedor (seção 4) antes de editar a regra.
   - **Sem impacto:** nada a fazer.
5. Atualize também os documentos espelho: `docs/design-system.md` acompanha `frontend-financeflow`.
6. Na descrição do PR, preencha 'Skills e decisões' listando as skills atualizadas e as revisadas sem mudança.

## 3. Mapa rápido: tipo de mudança → skills a revisar

| Mudança | Revisar |
|---|---|
| Dependência, versão, comando de build ou teste | `code-implementation`, `financeflow-architecture` |
| Nova pasta, módulo, camada ou convenção de pacote | `financeflow-architecture`, `code-implementation` |
| Componente de UI, token, tipografia, rota, hook de dados | `frontend-financeflow`, `docs/design-system.md` |
| Datas, competência, cartão, status de transação | `temporal-competence` |
| Casal, visibilidade, `X-View-Context`, isolamento por usuário | `couple-context` |
| Migration, schema, segurança, CORS, JWT | `financeflow-architecture` (e a skill do domínio afetado) |
| CI/CD, hooks, template de PR, convenções de Git | `git-workflow` |
| Fluxo de trabalho do agente (ordem de passos, checklists) | `full-stack-task` |

A tabela completa por caminhos está em `references/impact-map.json` (o CI usa o mesmo arquivo).

## 4. Quando perguntar ao desenvolvedor

Pergunte (em uma única mensagem, agrupando os casos) sempre que o achado for **regra de negócio ou decisão**:

```
Skill possivelmente afetada: `<skill>` (<seção ou arquivo:linha>)
- O que mudou: <resumo em uma frase>
- O que a skill diz hoje: <trecho curto>
- O que o código faz: <trecho curto com caminho>
- Opções:
  A) Atualizar a skill para refletir o código (recomendado quando o código é a intenção)
  B) Ajustar o código para seguir a skill (recomendado quando a skill é a regra de negócio)
  C) Manter como está e marcar a divergência na skill como 'decisão pendente'
- Minha sugestão: <A, B ou C> porque <motivo>.
Responda A, B ou C.
```

Se o desenvolvedor não puder responder agora, aplique a opção C e liste o item em 'Decisões pendentes' na PR.
Se a decisão for relevante para a arquitetura, siga também a skill `adr-workflow`.

## 5. Regras de edição

- **Mudança mínima**: edite só as linhas afetadas (por exemplo com `str_replace`); nunca reescreva a skill inteira.
- Não mude o `name` do frontmatter. Altere a `description` só se os gatilhos mudarem.
- **Aponte, não copie**: prefira caminho do arquivo e nome do símbolo a colar código real longo (envelhece rápido).
- Toda afirmação factual deve ser verificável por busca no repositório. O que ainda não existe é marcado como
  `(planejado)` ou `(alvo)`.
- Divergência não resolvida usa o bloco:
  `> ⚠ **Divergência conhecida (decisão pendente):** <o que diverge e quem decide>`
- Mantenha cada `SKILL.md` curto (meta: até 200 linhas). Detalhes longos vão para `references/`.
- Skills novas: crie `<nome>/SKILL.md` com gatilhos claros na `description` e adicione a skill ao
  `references/impact-map.json`.

## 6. Checklist de saída

```
[ ] Rodei o mapa de impacto (script ou tabela) para os arquivos que alterei
[ ] Atualizei as skills com fato desatualizado, na mesma PR
[ ] Perguntei ao desenvolvedor sobre qualquer regra em conflito (ou deixei 'decisão pendente')
[ ] docs/design-system.md está consistente com frontend-financeflow (se mexi em UI)
[ ] Preenchi 'Skills e decisões' na PR
```
