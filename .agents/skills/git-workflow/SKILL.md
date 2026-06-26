---
name: git-workflow
description: >
  Convenções de nomenclatura de branches, commits (Conventional Commits) e criação de Pull Requests no FinanceFlow.
  Use esta skill SEMPRE que o usuário pedir para criar uma branch, escrever uma mensagem de commit, gerar a descrição
  de um PR, ou ao finalizar uma implementação. Acione também para "como faço o commit disso?", "que nome de branch uso?",
  "cria o PR pra mim" ou qualquer fluxo de versionamento de código.
---

# Fluxo de Git e Integração (Git Workflow)

Esta skill padroniza a criação de branches, commits e Pull Requests no FinanceFlow.

## 1. Convenção de Branches

```
<tipo>/<escopo-curto-em-kebab-case>
```

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Nova funcionalidade ou módulo | `feat/auth-jwt-refresh` |
| `fix` | Correção de bug | `fix/calculo-competencia-pos-fechamento` |
| `refactor` | Melhoria estrutural sem mudança de comportamento | `refactor/transaction-mapper-records` |
| `docs` | Documentação, README, comentários | `docs/atualiza-guia-instalacao` |
| `chore` | Dependências, build, CI/CD, configs | `chore/atualiza-react-query-v5` |
| `test` | Adição ou correção de testes | `test/cobertura-cashflow-service` |
| `hotfix` | Correção urgente direto de produção | `hotfix/token-rotacao-duplicada` |

**Regras:**
- Nunca use espaços ou caracteres especiais — apenas letras, números e hífens.
- Branches do tipo `hotfix` partem de `main`; todas as outras partem de `develop`.
- Nunca faça push direto em `main` ou `develop` — sempre via Pull Request.

## 2. Conventional Commits

```
<tipo>(<escopo>): <mensagem curta no imperativo>
```

**Tipos aceitos:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`

**Boas mensagens (imperativo, sem ponto final, máx. 72 chars):**
```
feat(auth): adiciona rotação de refresh token com detecção de reuso
fix(budget): corrige cálculo de variância com transações negativas
refactor(transaction): migra entidade para separação domain/entity/mapper
test(cashflow): adiciona testes de projeção para meses futuros
chore(deps): atualiza spring-boot para 3.3.2
docs(readme): adiciona guia de configuração do Supabase local
perf(dashboard): adiciona cache Redis com TTL de 5 min no cashflow
```

**Breaking change** — adicione `!` e um rodapé `BREAKING CHANGE:`:
```
feat(api)!: altera formato de paginação para incluir metadados

BREAKING CHANGE: campo `total` renomeado para `totalElements` no body de resposta paginada.
```

**Mensagens ruins (evitar):**
```
fix: corrige bug              ← sem escopo, sem contexto
update stuff                  ← não segue Conventional Commits
feat: várias melhorias        ← commit deveria ter sido quebrado
WIP: implementando X          ← nunca commite WIP na branch principal
```

## 3. Template de Pull Request

Ao sugerir ou criar a descrição de um PR, use exatamente este formato:

```markdown
# Descrição

[Breve resumo das alterações e qual problema/funcionalidade foi resolvida — 2 a 4 linhas]

## Tipo de alteração
- [ ] Nova funcionalidade (feat)
- [ ] Correção de bug (fix)
- [ ] Refatoração de código (refactor)
- [ ] Atualização de documentação (docs)
- [ ] Ajuste de dependência/CI/CD (chore)
- [ ] Adição/correção de testes (test)

## Checklist
- [ ] O código segue os padrões definidos em `code-implementation` e `financeflow-architecture`.
- [ ] Testes unitários/integrados cobrem as alterações (cobertura mínima de 70%).
- [ ] Se o schema do banco foi alterado, existe migration Flyway correspondente (`V{N}__descricao.sql`).
- [ ] Nenhum dado sensível (CPF, e-mail, senha, token) foi logado ou exposto.
- [ ] Realizei auto-review antes de enviar.

## Como testar

[Passos para reproduzir / testar a mudança localmente, ex: endpoint a chamar, payload de exemplo]

## Screenshots / Demonstrações (opcional)

[Print de interface ou resposta JSON relevante, se aplicável]
```

## 4. Fluxo Completo de uma Feature

```
1. git checkout develop && git pull origin develop
2. git checkout -b feat/nome-da-feature
3. [implementa, commita em pequenos incrementos]
4. git push origin feat/nome-da-feature
5. Abre PR: develop ← feat/nome-da-feature
6. Code review + ajustes
7. Merge via squash (1 commit limpo na develop) ou merge commit (preserva histórico)
8. git branch -d feat/nome-da-feature (limpa local)
```

## 5. Fluxo de Hotfix (Produção)

```
1. git checkout main && git pull origin main
2. git checkout -b hotfix/descricao-curta
3. [corrige, testa, commita]
4. Abre PR: main ← hotfix/descricao-curta    (merge urgente)
5. Após merge em main, abre PR: develop ← main (sincroniza)
```

## 6. Automação via GitHub MCP

Se o servidor MCP do GitHub estiver disponível no contexto:

1. **Criação automática de PR** usando a ferramenta MCP correspondente (`create_pull_request` ou equivalente).
2. O campo `body` deve ser integralmente preenchido com o template da seção 3.
3. **Fallback** se MCP não estiver disponível:
   - Exibir a URL retornada pelo terminal após `git push` (GitHub imprime a URL de criação de PR automaticamente).
   - Oferecer o comando `gh pr create --title "..." --body "..."` para execução local.
