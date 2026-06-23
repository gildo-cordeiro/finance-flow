# Design Patterns — Referência Rápida

## Quando usar cada padrão

### Criacionais

#### Factory Method
**Use quando:** A lógica de criação de um objeto é complexa ou precisa variar.
```kotlin
interface NotificationFactory {
    fun create(type: NotificationType): Notification
}

class EmailNotificationFactory : NotificationFactory {
    override fun create(type: NotificationType) = EmailNotification(type)
}
```

#### Builder
**Use quando:** Objeto tem muitos parâmetros opcionais (> 3-4).
```kotlin
data class QueryBuilder(
    private val table: String,
    private val conditions: MutableList<String> = mutableListOf(),
    private val limit: Int = 100,
    private val orderBy: String? = null
) {
    fun where(condition: String) = apply { conditions.add(condition) }
    fun limit(n: Int) = apply { copy(limit = n) }
    fun orderBy(field: String) = apply { copy(orderBy = field) }
    fun build(): Query = Query(table, conditions, limit, orderBy)
}
```

#### Singleton (com cautela)
**Use quando:** Recurso compartilhado com estado global (logger, config).
**Evite** para regras de negócio — dificulta testes.

---

### Estruturais

#### Repository
**Use quando:** Abstrair acesso a dados do domínio.
```kotlin
interface UserRepository {
    fun findById(id: UUID): User?
    fun save(user: User): User
    fun findByEmail(email: String): User?
}

class PostgresUserRepository(private val db: Database) : UserRepository { ... }
class InMemoryUserRepository : UserRepository { ... }  // para testes
```

#### Adapter
**Use quando:** Integrar interface incompatível com o que o sistema espera.
```kotlin
// Sistema espera PaymentGateway, mas temos StripeClient
class StripePaymentAdapter(private val stripe: StripeClient) : PaymentGateway {
    override fun charge(amount: Money, card: Card): PaymentResult {
        val stripeCharge = stripe.createCharge(amount.cents, card.token)
        return PaymentResult(stripeCharge.id, stripeCharge.status.toPaymentStatus())
    }
}
```

#### Decorator
**Use quando:** Adicionar comportamento sem alterar a classe original.
```kotlin
class CachingUserRepository(
    private val delegate: UserRepository,
    private val cache: Cache
) : UserRepository {
    override fun findById(id: UUID): User? =
        cache.getOrPut("user:$id") { delegate.findById(id) }

    override fun save(user: User): User =
        delegate.save(user).also { cache.put("user:${it.id}", it) }
}
```

---

### Comportamentais

#### Strategy
**Use quando:** Algoritmo varia e deve ser intercambiável.
```kotlin
interface PricingStrategy {
    fun calculate(basePrice: Money, context: PricingContext): Money
}

class StandardPricing : PricingStrategy {
    override fun calculate(basePrice: Money, context: PricingContext) = basePrice
}

class DiscountPricing(private val discountPct: Double) : PricingStrategy {
    override fun calculate(basePrice: Money, context: PricingContext) =
        basePrice * (1 - discountPct)
}
```

#### Observer / Event-Driven
**Use quando:** Desacoplar produtor de consumidores (ex: publicar domínio events).
```kotlin
sealed class DomainEvent
data class UserCreated(val userId: UUID, val email: String) : DomainEvent()
data class PaymentProcessed(val orderId: UUID, val amount: Money) : DomainEvent()

interface DomainEventPublisher {
    fun publish(event: DomainEvent)
}
```

#### Command
**Use quando:** Encapsular uma operação como objeto (auditoria, undo, filas).
```kotlin
interface Command<T> {
    fun execute(): T
}

class CreateOrderCommand(
    private val request: CreateOrderRequest,
    private val orderService: OrderService
) : Command<Order> {
    override fun execute() = orderService.create(request)
}
```

#### Saga Pattern (para microserviços)
**Use quando:** Transação distribuída entre múltiplos serviços.
- **Choreography**: cada serviço publica eventos e reage a eventos de outros (Kafka)
- **Orchestration**: um orquestrador central coordena os passos

```
OrderService → [OrderCreated] → PaymentService → [PaymentProcessed] → InventoryService
```

---

## Anti-patterns a evitar

| Anti-pattern | Sintoma | Solução |
|---|---|---|
| God Object | Classe com > 500 linhas ou > 20 métodos | Extrair responsabilidades |
| Anemic Domain Model | Entidades só com getters/setters, lógica toda em Services | Mover lógica para dentro das entidades |
| Magic Numbers | `if (status == 3)` | Constantes nomeadas ou enum |
| Primitive Obsession | `String email`, `String cpf` — sem validação | Value objects: `Email`, `CPF` |
| Feature Envy | Método que usa mais dados de outra classe que da própria | Mover o método para a outra classe |
| Shotgun Surgery | Uma mudança requer editar 10 arquivos | Consolidar responsabilidade |
| Leaky Abstraction | DTO de banco de dados chegando na camada de API | Mapear em camadas corretas |
