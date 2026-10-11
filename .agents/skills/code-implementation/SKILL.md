---
name: code-implementation
description: >
  Guia completo e detalhado para implementar código de forma profissional e sustentável no FinanceFlow.
  Use esta skill SEMPRE que o usuário pedir para escrever, criar, refatorar, revisar ou implementar qualquer trecho
  de código — desde um simples script até sistemas complexos. Cobre a stack oficial do FinanceFlow:
  (1) Java 21 + Spring Boot 4 no back-end (SEM Lombok), com Spring Security + JWT com rotação de refresh token,
  PostgreSQL (Supabase), Flyway para migrations e Redis (Upstash, planejado) para cache;
  (2) React 18 + Vite + TypeScript no front-end com Tailwind CSS v3 (travado em ^3.4.17 — NÃO atualizar para v4),
  React Query (TanStack Query), React Router v6, Recharts e date-fns.
  Acione também quando o usuário mencionar "boas práticas", "código limpo", "refatorar", "como implementar",
  "estrutura de projeto", "padrões de projeto", "componente React", "endpoint Spring", "controller", "service",
  "repository", "hook", "tailwind", "use case", "mapper", "entity", "domain" etc.
---

# Skill: Code Implementation

Guia de referência para produzir código de alta qualidade, legível, testável e sustentável no FinanceFlow.

## Stack Tecnológica

### Backend (API REST)
- **Linguagem & Framework:** Java 21 + Spring Boot 4 — **sem Lombok, zero exceções**
- **Segurança:** Spring Security 6 + JWT (stateless) com rotação de refresh token (RTR)
- **Persistência:** PostgreSQL (Supabase) + Spring Data JPA / Hibernate
- **Migrations:** Flyway (arquivos imutáveis após deploy)
- **Cache:** Redis (Upstash) com TTL explícito — *planejado, ainda não implementado (sem dependência de cache no `build.gradle`)*

### Frontend (SPA)
- **Framework UI:** React 18 + Vite + TypeScript (strict mode)
- **Estilização:** Tailwind CSS v3.4.x — travado em `^3.4.17` (**NÃO atualizar para v4**)
- **Estado & Cache:** TanStack Query (React Query)
- **Roteamento:** React Router v6 (com proteção de rotas privadas)
- **Gráficos:** Recharts
- **Datas:** `date-fns` (lógica de ciclos e competências)

---

---

## 1. Fluxo de Implementação (sempre seguir esta ordem)

```
ENTENDER → PLANEJAR → ESTRUTURAR → IMPLEMENTAR → VALIDAR → DOCUMENTAR
```

### 1.1 Entender
- Clarificar **o que** o código deve fazer (comportamento externo, não implementação interna)
- Identificar **entradas, saídas e invariantes**
- Levantar **edge cases** antes de escrever uma linha
- Confirmar **contexto técnico**: linguagem, framework, restrições de performance

### 1.2 Planejar
- Esboçar a solução em pseudocódigo ou comentários antes de codificar
- Identificar **dependências externas** necessárias
- Pensar nos **pontos de falha** e como tratá-los
- Escolher o **padrão de design** adequado (ver `references/design-patterns.md`)

### 1.3 Estruturar
- Definir a estrutura de arquivos/pacotes antes de implementar
- Separar responsabilidades (SRP)
- Decidir interfaces/contratos antes das implementações

### 1.4 Implementar
- Seguir as convenções da linguagem (ver seção 3: `references/conventions.md`)
- Escrever em pequenos incrementos verificáveis
- Não otimizar prematuramente — clareza primeiro

### 1.5 Validar
- Cobrir os edge cases identificados no passo 1.1
- Escrever ao menos um teste por comportamento público
- Revisar contra o checklist de qualidade (seção 8)

### 1.6 Documentar
- Comentar **por quê**, não **o quê**
- Manter README/docstring atualizados

---

## 2. Princípios Fundamentais

### SOLID aplicado na prática

| Princípio | Sinal de violação | Correção |
|---|---|---|
| **S** — Single Responsibility | Classe/função faz mais de uma coisa | Extrair responsabilidade |
| **O** — Open/Closed | Mudança de comportamento requer modificar código existente | Usar polimorfismo/strategy |
| **L** — Liskov Substitution | Subclasse quebra contrato da superclasse | Rever herança → usar composição |
| **I** — Interface Segregation | Interface com métodos que cliente não usa | Quebrar em interfaces menores |
| **D** — Dependency Inversion | Código depende de implementações concretas | Depender de abstrações/interfaces |

### Outros princípios críticos

- **DRY** — duplicação é dívida técnica; extraia lógica repetida
- **YAGNI** — não implemente o que não foi pedido agora
- **KISS** — prefira a solução mais simples que funcione
- **Fail Fast** — valide entradas cedo, lance exceções específicas, nunca engula erros silenciosamente
- **Código deve ser lido como prosa** — nomes revelam intenção, estrutura guia o leitor

---

## 3. Detalhes por assunto (leia só o que a tarefa precisa)

| Assunto | Arquivo | Leia quando |
|---|---|---|
| Convenções por stack (Java 21 + Spring Boot 4 sem Lombok; TypeScript + React + Tailwind) | `references/conventions.md` | Escrever código novo ou revisar estilo |
| Estrutura de projeto e regras de dependência | `references/project-structure.md` e skill `financeflow-architecture` | Decidir onde um arquivo vive |
| Tratamento de erros (back-end e front-end) | `references/error-handling.md` | Lançar, mapear ou exibir erros |
| Testes (JUnit 5 + Mockito; Vitest + Testing Library) | `references/testing.md` | Escrever ou rodar testes |
| Performance e segurança | `references/performance-security.md` | Consultas, cache, validação, autenticação |

---

## 8. Code Review Checklist

Use antes de finalizar qualquer implementação:

```
CORRETUDE
[ ] Cobre todos os edge cases identificados?
[ ] Erros são tratados (não engolidos)?
[ ] Entradas externas são validadas com Bean Validation ou type guard?
[ ] Não há race conditions (se concorrente)?
[ ] Queries filtram por userId para evitar acesso cruzado?

LEGIBILIDADE
[ ] Nomes revelam intenção?
[ ] Funções têm < 20 linhas (regra geral)?
[ ] Sem comentários que explicam "o quê" (só "por quê")?
[ ] Sem código morto ou TODOs sem ticket?

DESIGN
[ ] SRP respeitado?
[ ] Estrutura de pacotes segue o padrão canônico (domain/entity/mapper)?
[ ] Módulos se comunicam por interfaces públicas (sem eventos de domínio)?
[ ] Interfaces/contratos definidos antes das implementações?

TESTES
[ ] Todo comportamento público tem ao menos um teste?
[ ] Testes são independentes e sem ordem de execução?
[ ] Sem lógica condicional nos testes?
[ ] Cobertura ≥ 70% no backend?

SEGURANÇA & OBSERVABILIDADE
[ ] Sem secrets hardcoded?
[ ] Logs têm contexto suficiente para debug em produção?
[ ] PII protegido nos logs?
[ ] Migration Flyway criada se o schema foi alterado?
```

---

## 9. Referências Adicionais

Para contextos específicos, consulte:

- `references/conventions.md`, `project-structure.md`, `error-handling.md`, `testing.md`, `performance-security.md` — detalhes por assunto (seção 3)
- `references/java-spring.md` — Regras completas Java sem Lombok, Spring Boot, JPA, Security, testes (exemplos genéricos)
- `references/typescript-react-tailwind.md` — TypeScript strict, React patterns, Tailwind, forms, data fetching (exemplos genéricos)
- `references/design-patterns.md` — Catálogo de padrões (Strategy, Repository, Factory, etc.)
- `references/api-design.md` — REST, contratos, paginação, Spec Driven Development

---

## Lembrete Final

> **Código é lido muito mais vezes do que é escrito.**
> Otimize para o próximo desenvolvedor que vai ler — incluindo você mesmo daqui a 6 meses.
> Clareza > Brevidade > Cleverness.

## Ao terminar qualquer tarefa

1. Rode a skill `skill-maintenance`: alguma skill ficou desatualizada por causa desta mudança? Atualize na mesma PR.
2. Rode a skill `adr-workflow`: houve uma decisão importante? Consulte o desenvolvedor antes de criar qualquer ADR.
