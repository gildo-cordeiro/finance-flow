# API Design — REST e Contratos

## Nomenclatura de Recursos

```
# ✅ BOM: substantivos, plural, hierarquia clara
GET    /users/{userId}
GET    /users/{userId}/orders
POST   /orders
PATCH  /orders/{orderId}
DELETE /orders/{orderId}

# ❌ RUIM: verbos na URL
POST /createOrder
GET  /getUser?id=123
POST /orders/cancel     ← use PATCH /orders/{id} com body { "status": "CANCELLED" }
```

## Status HTTP corretos

| Cenário | Status |
|---|---|
| Criação bem-sucedida | 201 Created + Location header |
| Operação assíncrona iniciada | 202 Accepted |
| Sucesso sem corpo | 204 No Content |
| Recurso não encontrado | 404 Not Found |
| Validação de entrada falhou | 422 Unprocessable Entity |
| Conflito de estado | 409 Conflict |
| Erro de autenticação | 401 Unauthorized |
| Sem permissão | 403 Forbidden |
| Rate limit atingido | 429 Too Many Requests |
| Erro interno | 500 Internal Server Error |

## Formato de Erro Padronizado (RFC 7807)

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields are invalid",
  "instance": "/orders/abc123",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" },
    { "field": "amount", "message": "Must be greater than zero" }
  ]
}
```

## Paginação

```json
// Request: GET /orders?page=2&size=20&sort=createdAt,desc

// Response:
{
  "content": [...],
  "pagination": {
    "page": 2,
    "size": 20,
    "totalElements": 143,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

## Versionamento

- Prefira versionamento na URL: `/v1/orders`, `/v2/orders`
- Suporte ao menos a versão anterior durante período de migração (mínimo 6 meses)
- Documente breaking changes explicitamente no CHANGELOG

## Idempotency Key

Para operações não-idempotentes (POST), aceitar `Idempotency-Key` no header:
```
POST /payments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```
- Armazenar resultado por chave por 24-48h
- Retornar o mesmo resultado para requests com a mesma chave

## Contrato First (Spec Driven)

1. Escreva o OpenAPI spec **antes** de implementar
2. Gere stubs de servidor a partir do spec
3. Valide o comportamento real contra o spec em testes de contrato (Pact, Spring Cloud Contract)
4. Publique o spec no portal de APIs da organização
