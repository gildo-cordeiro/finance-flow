# Kafka Patterns — Boas Práticas

## Producer

### Configurações essenciais
```properties
# Durabilidade
acks=all                    # aguarda confirmação de todas as réplicas in-sync
retries=2147483647          # retry infinito (deixa o timeout controlar)
delivery.timeout.ms=120000  # timeout total de entrega: 2 minutos
enable.idempotence=true     # garante exactly-once no producer

# Throughput
batch.size=65536            # 64KB por batch
linger.ms=5                 # aguarda 5ms para preencher batch
compression.type=lz4        # compressão rápida e eficiente
```

### Padrão Transactional Outbox
**Use quando:** Precisa garantir consistência entre DB write e Kafka publish.

```kotlin
// ❌ NÃO faça isso — não é atômico
fun processOrder(order: Order) {
    orderRepository.save(order)        // DB write
    kafkaTemplate.send("orders", order) // pode falhar depois do save
}

// ✅ FAÇA isso — outbox pattern
fun processOrder(order: Order) {
    transactionTemplate.execute {
        orderRepository.save(order)
        outboxRepository.save(OutboxEvent("orders", order.id, serialize(order)))
        // Um relay separado lê o outbox e publica no Kafka
    }
}
```

### Escolha da chave de partição
- **Por entidade**: `order.customerId` → garante ordering por cliente
- **Null**: distribuição round-robin → máximo throughput, sem ordering
- **Nunca use chave com baixa cardinalidade** (ex: boolean) → hot partition

---

## Consumer

### Configurações essenciais
```properties
enable.auto.commit=false         # commit manual — controle explícito
auto.offset.reset=earliest       # replay completo ao criar consumer group
max.poll.records=500             # processe em batches
max.poll.interval.ms=300000      # tempo máximo de processamento por poll
session.timeout.ms=45000
heartbeat.interval.ms=15000
```

### Commit Manual (padrão recomendado)
```kotlin
@KafkaListener(topics = ["orders"])
fun consume(records: List<ConsumerRecord<String, String>>, ack: Acknowledgment) {
    try {
        records.forEach { record ->
            processOrder(deserialize(record.value()))
        }
        ack.acknowledge()  // commit só depois de processar tudo
    } catch (e: Exception) {
        log.error("Failed to process batch, will retry", e)
        // NÃO faça ack — Kafka vai redeliverar
        throw e
    }
}
```

### Idempotência no Consumer
Consumidores **devem ser idempotentes** — a mesma mensagem pode ser entregue mais de uma vez.
```kotlin
fun processPayment(event: PaymentEvent) {
    if (paymentRepository.existsByIdempotencyKey(event.idempotencyKey)) {
        log.info("Skipping duplicate payment event: ${event.idempotencyKey}")
        return
    }
    // processar...
}
```

### Dead Letter Queue (DLQ)
```kotlin
@Bean
fun errorHandler(): CommonErrorHandler =
    DefaultErrorHandler(
        DeadLetterPublishingRecoverer(kafkaTemplate) { record, ex ->
            TopicPartition("${record.topic()}.DLT", record.partition())
        },
        FixedBackOff(1000L, 3L)  // 3 tentativas com 1s entre elas
    )
```

---

## Gestão de Schema

- Use **Schema Registry** com Avro ou Protobuf para contratos fortes
- Regra de compatibilidade recomendada: `BACKWARD_TRANSITIVE`
- **Nunca** evolua schema de forma incompatível sem versionar o tópico
- Documente o schema de cada tópico no repositório de contratos

---

## Monitoramento

Métricas críticas para alertar:
- `consumer_lag` por consumer group + partition → processamento atrasado
- `record_send_rate` + `record_error_rate` → saúde do producer
- `fetch_latency_avg` → latência de consume
- DLT message count → erros de processamento
