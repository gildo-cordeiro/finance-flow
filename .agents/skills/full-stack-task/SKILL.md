---
name: full-stack-task
description: >
  Orquestra a implementação de tarefas que envolvem back-end E front-end simultaneamente no FinanceFlow.
  Use esta skill SEMPRE que o pedido cruzar as duas camadas: "cria o endpoint X e o hook Y", "implementa a feature
  completa de transações", "faz o CRUD de metas do back ao front", "conecta o back com o front", "implementa a tela
  e a API", "faz a integração", ou qualquer tarefa onde tanto Java/Spring quanto React/TypeScript precisam ser tocados.
  Quando esta skill for acionada, o assistente DEVE carregar e seguir TAMBÉM as skills:
    - code-implementation   → padrões de back-end E front-end com regras detalhadas
    - frontend-financeflow  → sistema de design Dark Premium, componentes, formulários, React Query
  Esta skill não contém código — ela é um ponto de entrada que garante que ambas as referências sejam consideradas.
---

# Full-Stack Task — Orquestração de Implementação

Esta skill não define padrões próprios. Ela instrui o assistente a **combinar** as duas skills especializadas
ao executar tarefas que envolvem simultaneamente back-end e front-end no FinanceFlow.

## Quando esta skill é acionada

Pedidos que cruzam camadas, por exemplo:

- "Implementa a feature de metas financeiras"
- "Cria o endpoint de orçamento e o hook de dados pro dashboard"
- "Faz o CRUD completo de cartões de crédito"
- "Conecta a tela de casal com a API"
- "Implementa o fluxo de login do back ao front"
- "Adiciona o módulo de viagens"

## Ordem de execução obrigatória

Ao receber um pedido full-stack, siga sempre esta sequência:

```
1. ENTENDER o escopo completo (back + front)
2. PLANEJAR as duas camadas juntas antes de começar qualquer código
   ├── Back-end: entidade, migration, repository, service, controller, DTOs
   └── Front-end: tipos TypeScript, camada de API, hook React Query, componente(s), formulário
3. IMPLEMENTAR back-end primeiro (contrato da API define o front)
4. IMPLEMENTAR front-end em seguida, consumindo o contrato definido
5. VALIDAR coerência entre os dois lados (nomes de campos, tipos, status HTTP)
```

## Referências obrigatórias a consultar

| Skill | O que cobre |
|---|---|
| `code-implementation` | Estrutura de pacotes Java, padrões Spring, testes JUnit/Vitest, checklist de review |
| `frontend-financeflow` | Sistema de design Dark Premium, componentes base, React Query, formulários Zod |
| `financeflow-architecture` | Decisões arquiteturais, comunicação entre módulos, segurança |
| `temporal-competence` | Se a feature envolver datas, competência ou ciclos de fatura |
| `couple-context` | Se a feature envolver visibilidade de casal ou isolamento de dados |
| `git-workflow` | Ao finalizar: nome de branch, commits e template de PR |

## Checklist de coerência full-stack

```
CONTRATO
[ ] Campos do DTO de response Java batem com a interface TypeScript?
[ ] Nomes de campos em camelCase no JSON e na interface TS?
[ ] Status HTTP do controller (201, 204, 422...) tratados no handleResponse do front?
[ ] queryKey do React Query inclui todos os parâmetros que afetam o resultado?

SEGURANÇA
[ ] Endpoint exige Bearer Token (exceto /auth/**)?
[ ] Service filtra por userId extraído do JWT?
[ ] Front envia o header Authorization em todas as chamadas autenticadas?

CONSISTÊNCIA
[ ] Migration Flyway criada para qualquer novo campo ou tabela?
[ ] invalidateQueries() cobre todos os contextos afetados pela mutação?
[ ] Skeleton loader e EmptyState implementados no componente de listagem?
[ ] Erros de validação do backend (422 com errors[]) mapeados com setError() no formulário?
```
