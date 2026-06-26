---
name: git-workflow
description: Convenções de nomenclatura de branches, commits (Conventional Commits) e criação de Pull Requests com templates no FinanceFlow.
---

# Fluxo de Git e Integração (Git Workflow)

Esta skill orienta o assistente a padronizar a criação de branches, commits e a descrição de Pull Requests (PRs) no FinanceFlow.

## 1. Convenção de Branches

As branches criadas para o desenvolvimento de tarefas devem seguir o padrão:
- `feat/nome-da-feature`: Para novos módulos ou funcionalidades (ex: `feat/auth-jwt`).
- `fix/descricao-do-bug`: Para correções de erros (ex: `fix/calculo-competencia-fatura`).
- `refactor/o-que-foi-refatorado`: Para melhorias estruturais de código sem alteração lógica (ex: `refactor/limpeza-transacoes`).
- `docs/o-que-mudou`: Para documentação e README (ex: `docs/atualiza-requisitos`).
- `chore/tarefa`: Ajustes de dependências, builds ou pipelines de CI/CD (ex: `chore/atualiza-react-query`).

## 2. Padrão de Commits (Conventional Commits)

Todas as mensagens de commit devem ser escritas no padrão de Conventional Commits:
```
<tipo>(<escopo>): <mensagem curta descritiva>
```
### Exemplos:
- `feat(auth): adiciona fluxo de login com JWT e refresh token`
- `fix(budget): corrige cálculo de variância mensal com valores negativos`
- `refactor(db): simplifica chaves estrangeiras na entidade de casal`
- `docs(readme): adiciona guia de instalação rápida e pré-requisitos`

## 3. Template de Pull Request (PR)

Ao sugerir ou criar a descrição de um Pull Request para revisão, o assistente deve gerar o seguinte formato:

```markdown
# Descrição

[Breve resumo das alterações e qual problema/funcionalidade foi resolvida]

## Tipo de alteração
- [ ] Nova funcionalidade (feature)
- [ ] Correção de bug (bug fix)
- [ ] Refatoração de código
- [ ] Atualização de documentação
- [ ] Ajuste de dependência/CI/CD (chore)

## Checklist
- [ ] O código segue os padrões de código definidos em `coding-standards`.
- [ ] Foram adicionados testes unitários/integrados cobrindo as alterações (cobertura mínima de 70%).
- [ ] O schema do banco de dados (se alterado) possui migração correspondente do Flyway.
- [ ] Realizei um auto-review no código antes de enviar.

## Screenshots / Demonstrações (opcional)
[Imagens ou representações textuais do comportamento da interface ou das respostas de API]
```

## 4. Automação de Pull Requests com MCP

Sempre que o servidor MCP do GitHub estiver configurado e ativo:
1. **Criação Automática:** O assistente deve criar o Pull Request de forma autônoma utilizando a ferramenta do MCP (ex: `github/create_pull_request` ou equivalente).
2. **Preenchimento do Template:** O parâmetro correspondente ao corpo da descrição (`body`) deve ser integralmente preenchido seguindo o template de Pull Request definido na seção 3.
3. **Fallback:** Caso as ferramentas do MCP do GitHub não estejam disponíveis no contexto ou falhem, o assistente deve recuar para as opções alternativas:
   - Exibir a URL de criação rápida informada pelo terminal durante o `git push`.
   - Oferecer o comando `gh pr create` para que o usuário execute localmente.
