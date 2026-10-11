# Tratamento de erros (back-end e front-end)

> Referência da skill `code-implementation`. Leia só quando a tarefa envolver este assunto. Fluxo e princípios gerais: `../SKILL.md`.

## 5. Tratamento de Erros

### Back-end (Java 21 + Spring Boot 4)

```java
// 1. Exceções de domínio (em shared/exception/)
public class DomainException extends RuntimeException {
    private final String code;

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }
}

public class NotFoundException extends DomainException {
    public NotFoundException(String entity, Object id) {
        super("NOT_FOUND", entity + " not found: " + id);
    }
}

public class BusinessException extends DomainException {
    public BusinessException(String code, String message) {
        super(code, message);
    }
}

public class ForbiddenException extends DomainException {
    public ForbiddenException(String message) {
        super("FORBIDDEN", message);
    }
}

// 2. Handler centralizado (em shared/handler/)
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(new ErrorResponse("VALIDATION_ERROR", "Validation failed", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}

// 3. Response record
public record ErrorResponse(String code, String message, List<FieldError> errors) {
    public ErrorResponse(String code, String message) { this(code, message, List.of()); }
    public record FieldError(String field, String message) {}
}
```

### Front-end (TypeScript + React)

```typescript
interface ApiError {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
}

// Hook de mutação com React Query
function useCreateTransaction() {
  return useMutation<TransactionResponse, ApiError, CreateTransactionRequest>({
    mutationFn: (data) => transactionApi.create(data),
    onError: (error) => {
      // Tratar erro de validação separado de erro de API
      if (error.code === 'VALIDATION_ERROR') {
        toast.error('Verifique os campos e tente novamente');
      } else {
        toast.error(error.message ?? 'Erro inesperado');
      }
    },
  });
}
```

### Regras de ouro para erros

1. **Back:** nunca exponha stack trace, mensagem de SQL ou path interno na resposta HTTP
2. **Back:** log com contexto no ponto de origem — nunca relogue na cadeia de chamada
3. **Front:** nunca `catch` silencioso — sempre trate ou propague com contexto
4. **Front:** erros de validação de formulário são distintos de erros de API — trate separado
5. **Ambos:** erros de programação (NPE, ClassCast) → deixe subir para o handler global
