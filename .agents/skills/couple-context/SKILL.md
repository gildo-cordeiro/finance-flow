---
name: couple-context
description: Regras de isolamento, visibilidade e segurança para contextos individuais e de casal no FinanceFlow.
---

# Regras de Visibilidade e Compartilhamento de Casal (Couple Context)

Esta skill orienta o desenvolvimento de funcionalidades associadas ao Módulo de Gestão para Casal (Fase 2/Fase 5 do Roadmap).

## 1. Isolamento de Dados por Usuário

Para garantir conformidade com a LGPD e privacidade básica dos usuários:
- **Toda consulta SQL ou JPA** que busque transações, contas ou orçamentos DEVE incluir explicitamente o `user_id` correspondente extraído do JWT Token da requisição.
- Nunca retorne ou modifique dados sem validar se o ID do usuário autenticado é o proprietário do recurso.

## 2. Contexto de Casal (Vínculo de Casal)

Dois usuários podem se vincular em um relacionamento (`Couple`), gerando uma relação `couple_id`.
- O sistema possui um *toggle* na interface: **Visão Pessoal** vs **Visão Casal**.
- **Na Visão Pessoal**: Apenas transações e contas individuais do usuário autenticado devem ser mostradas.
- **Na Visão Casal**: As transações de ambos os membros devem ser consolidadas.

## 3. Visibilidade das Transações (PERSONAL vs SHARED)

Cada transação possui um campo de visibilidade (`visibility`):
- `PERSONAL`: A transação é estritamente privada do usuário que a criou e **nunca** deve aparecer na visão de casal do parceiro.
- `SHARED`: A transação é compartilhada e visível na visão consolidada de casal.
- **Divisão de Despesas Compartilhadas**: Despesas marcadas como `SHARED` podem ter divisão padrão de 50/50 ou uma porcentagem configurável (ex: 60/40 com base nas contribuições individuais).

## 4. Validação de Acesso a Dados de Casal

Antes de retornar qualquer dado consolidado de casal:
- Sempre valide se os dois usuários estão ativamente vinculados no banco (`Couple` com status `ACTIVE`).
- Verifique a associação antes de processar endpoints como `/api/v1/couple` e `/api/v1/couple/invite`.
