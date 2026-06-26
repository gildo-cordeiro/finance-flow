---
name: couple-context
description: >
  Regras de isolamento, visibilidade e segurança para contextos individuais e de casal no FinanceFlow.
  Use esta skill SEMPRE que o código envolver múltiplos usuários, compartilhamento de transações, módulo de casal,
  vínculo entre contas, campos como couple_id, visibility, PERSONAL/SHARED, ou endpoints como /api/v1/couple.
  Acione também quando há dúvida sobre "quem pode ver essa transação?" ou "como filtrar dados do parceiro?".
---

# Regras de Visibilidade e Compartilhamento de Casal (Couple Context)

Esta skill orienta o desenvolvimento de todas as funcionalidades associadas ao Módulo de Gestão para Casal.

## 1. Isolamento de Dados por Usuário (LGPD)

**Toda query** que busque transações, contas ou orçamentos DEVE incluir o `userId` do usuário autenticado extraído do JWT.

```java
// ✅ BOM: filtro explícito de userId em todo repositório
public interface TransactionRepository {
    List<Transaction> findByUserIdAndCompetenceMonth(UUID userId, LocalDate month);
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId); // nunca só por id
}

// ❌ PROIBIDO: busca sem validar o dono
transactionRepository.findById(transactionId); // qualquer user pode acessar!

// ✅ CORRETO: sempre escopo pelo userId autenticado
UUID currentUserId = jwtService.extractUserId(request);
transactionRepository.findByIdAndUserId(transactionId, currentUserId)
    .orElseThrow(() -> new NotFoundException("Transaction", transactionId));
```

**Regra de ouro**: Se um endpoint recebe `transactionId` (ou qualquer ID de recurso) no path, SEMPRE valide que o recurso pertence ao `userId` do JWT antes de retornar ou modificar.

## 2. Entidade Couple

```java
@Entity
@Table(name = "couples")
public class CoupleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_a_id", nullable = false)
    private UUID userAId;

    @Column(name = "user_b_id", nullable = false)
    private UUID userBId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoupleStatus status; // PENDING_INVITE, ACTIVE, DISSOLVED

    @CreationTimestamp
    private Instant createdAt;

    protected CoupleEntity() {}

    // getters + builder manual ...
}

public enum CoupleStatus {
    PENDING_INVITE, // convite enviado, aguardando aceitação
    ACTIVE,         // vínculo ativo
    DISSOLVED       // desvinculados
}
```

### Flyway Migration

```sql
-- V4__create_couples_table.sql
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES users(id),
    user_b_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_INVITE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_couple UNIQUE (
        LEAST(user_a_id::TEXT, user_b_id::TEXT),
        GREATEST(user_a_id::TEXT, user_b_id::TEXT)
    )
);
```

## 3. Fluxo de Convite de Vínculo

```
Usuário A envia convite → status = PENDING_INVITE
Usuário B aceita        → status = ACTIVE
Usuário B recusa        → registro removido (ou status = DISSOLVED)
Qualquer um dissolve    → status = DISSOLVED
```

```java
@Service
@Transactional
public class CoupleInviteService {

    public void sendInvite(UUID fromUserId, String toUserEmail) {
        User toUser = userRepository.findByEmail(toUserEmail)
            .orElseThrow(() -> new NotFoundException("User", toUserEmail));

        // Impede vínculo duplo ou auto-convite
        if (fromUserId.equals(toUser.getId())) {
            throw new BusinessException("SELF_INVITE", "Cannot invite yourself");
        }
        coupleRepository.findActiveOrPendingBetween(fromUserId, toUser.getId())
            .ifPresent(c -> { throw new BusinessException("ALREADY_LINKED", "Users already linked"); });

        coupleRepository.save(new CoupleEntity(fromUserId, toUser.getId(), CoupleStatus.PENDING_INVITE));
    }

    public void acceptInvite(UUID currentUserId, UUID coupleId) {
        CoupleEntity couple = coupleRepository.findById(coupleId)
            .orElseThrow(() -> new NotFoundException("Couple", coupleId));

        // Apenas user_b (o convidado) pode aceitar
        if (!couple.getUserBId().equals(currentUserId)) {
            throw new ForbiddenException("Only the invited user can accept");
        }
        couple.activate();
        coupleRepository.save(couple);
    }
}
```

## 4. Contexto de Visão (Personal vs Casal)

O frontend envia o header `X-View-Context: PERSONAL | COUPLE` em todas as requisições autenticadas.

```java
// No Service, determinar o escopo de dados com base no contexto
public List<TransactionResponse> listTransactions(UUID userId, ViewContext context, LocalDate month) {
    if (context == ViewContext.PERSONAL) {
        return transactionRepository.findByUserIdAndMonth(userId, month);
    }

    // Visão de casal: valida vínculo ativo antes de qualquer consulta
    CoupleEntity couple = coupleRepository.findActiveByUserId(userId)
        .orElseThrow(() -> new BusinessException("NO_ACTIVE_COUPLE", "No active couple link found"));

    UUID partnerId = couple.getPartnerOf(userId);

    // Retorna as próprias + as SHARED do parceiro
    List<Transaction> own = transactionRepository.findByUserIdAndMonth(userId, month);
    List<Transaction> partnerShared = transactionRepository
        .findByUserIdAndMonthAndVisibility(partnerId, month, Visibility.SHARED);

    return Stream.concat(own.stream(), partnerShared.stream())
        .map(this::toResponse)
        .toList();
}
```

## 5. Visibilidade das Transações

```java
public enum Visibility {
    PERSONAL, // nunca aparece na visão do parceiro
    SHARED    // visível na consolidação do casal
}
```

```java
@Entity
@Table(name = "transactions")
public class TransactionEntity {
    // ...
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility; // padrão = PERSONAL

    @Column(name = "shared_split_percent")
    private Integer sharedSplitPercent; // nulo se PERSONAL; 50 por padrão se SHARED
}
```

### Regras de Divisão

| `visibility` | `shared_split_percent` | Comportamento |
|---|---|---|
| `PERSONAL` | `null` | Só aparece para o dono |
| `SHARED` | `50` | Cada um assume 50% |
| `SHARED` | `60` | Dono assume 60%, parceiro 40% |

## 6. Validação de Acesso em Todo Endpoint de Casal

```java
// Utilitário reutilizável para validar vínculo ativo
@Component
public class CoupleAccessValidator {

    public CoupleEntity requireActiveCouple(UUID userId) {
        return coupleRepository.findActiveByUserId(userId)
            .orElseThrow(() -> new BusinessException(
                "NO_ACTIVE_COUPLE",
                "This feature requires an active couple link"
            ));
    }

    public void requireCoupleAccess(UUID requestingUserId, UUID coupleId) {
        CoupleEntity couple = coupleRepository.findById(coupleId)
            .orElseThrow(() -> new NotFoundException("Couple", coupleId));

        boolean isMember = couple.getUserAId().equals(requestingUserId)
            || couple.getUserBId().equals(requestingUserId);

        if (!isMember) throw new ForbiddenException("Access denied to couple data");
        if (couple.getStatus() != CoupleStatus.ACTIVE) {
            throw new BusinessException("COUPLE_INACTIVE", "Couple link is not active");
        }
    }
}
```

## 7. Anti-Patterns a Evitar

| ❌ Errado | ✅ Correto |
|---|---|
| `findById(id)` sem verificar `userId` | `findByIdAndUserId(id, currentUserId)` |
| Retornar dados de casal sem verificar `CoupleStatus.ACTIVE` | Sempre chamar `requireActiveCouple()` antes |
| Transação `PERSONAL` aparecer na visão de casal | Filtrar explicitamente por `visibility = SHARED` nas queries do parceiro |
| Qualquer dos dois usuários pode aceitar o convite | Apenas `userBId` (convidado) pode aceitar |
| Usar `couple_id` direto na query sem validar membros | Sempre validar que o `userId` autenticado é `userAId` ou `userBId` |
