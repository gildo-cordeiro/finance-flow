# Convenções por stack (Java/Spring e TypeScript/React/Tailwind)

> Referência da skill `code-implementation`. Leia só quando a tarefa envolver este assunto. Fluxo e princípios gerais: `../SKILL.md`.

## 3. Convenções por Stack

> Para regras detalhadas e exemplos extensos, consulte os arquivos de referência:
> - Back-end: `references/java-spring.md`
> - Front-end: `references/typescript-react-tailwind.md`

### 3.1 Java 21 + Spring Boot 4 (sem Lombok)

**Regra absoluta: ZERO Lombok.** Use Records para DTOs e builders manuais para entidades JPA.

```java
// ✅ BOM: Record para DTO imutável (Java 16+)
public record CreateTransactionRequest(
    @NotNull UUID accountId,
    @NotNull @Positive BigDecimal amount,
    @NotBlank String description,
    @NotNull LocalDate competenceDate
) {}

// ✅ BOM: Entidade com builder manual — sem Lombok
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    protected TransactionEntity() {} // JPA exige

    private TransactionEntity(Builder b) {
        this.userId = b.userId;
        this.amount = b.amount;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public BigDecimal getAmount() { return amount; }

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private UUID userId;
        private BigDecimal amount;

        public Builder userId(UUID v) { this.userId = v; return this; }
        public Builder amount(BigDecimal v) { this.amount = v; return this; }
        public TransactionEntity build() {
            Objects.requireNonNull(userId, "userId is required");
            Objects.requireNonNull(amount, "amount is required");
            return new TransactionEntity(this);
        }
    }
}

// ❌ PROIBIDO: qualquer anotação Lombok
// @Data, @Builder, @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor — NUNCA
```

**Estrutura de pacotes por Feature (canônica do FinanceFlow):**
```
com.financeflow.<modulo>/
├── controller/         # @RestController e endpoints REST
├── dto/                # Records de Request e Response
├── service/            # Use cases / lógica de negócio
├── repository/         # Interface de domínio (sem anotações de framework)
│   └── jpa/            # Implementação JPA + Spring Data interface
└── model/
    ├── domain/         # Java Records imutáveis — modelo de negócio puro
    ├── entity/         # Classes @Entity — mapeamento JPA
    └── mapper/         # Métodos estáticos de conversão domain ↔ entity
```

**Regras essenciais Spring:**
- `@Service`, `@Repository`, `@RestController` — injeção **sempre por construtor**, nunca `@Autowired` em campo
- `@Transactional` apenas na camada de **serviço**, nunca no controller ou repository
- `@RestControllerAdvice` para tratamento centralizado de exceções
- `@Validated` + Bean Validation (`@NotBlank`, `@NotNull`, `@Positive`) nos DTOs de entrada
- `ResponseEntity<T>` com status HTTP semântico em todos os controllers
- Um use case = uma classe = um método público `execute()`

### 3.2 TypeScript + React + Tailwind

```tsx
// ✅ BOM: Props tipadas, componente puro, Tailwind Dark Premium
interface TransactionCardProps {
  description: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PLANNED';
  onEdit?: () => void;
}

export function TransactionCard({ description, amount, status, onEdit }: TransactionCardProps) {
  return (
    <div className="glassmorphism rounded-2xl p-4 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{description}</h3>
          <p className="text-xs text-zinc-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
          </p>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium border',
          status === 'PAID'    && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          status === 'PENDING' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          status === 'OVERDUE' && 'bg-red-500/10 text-red-400 border-red-500/20',
          status === 'PLANNED' && 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
        )}>
          {status}
        </span>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="mt-3.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          Editar
        </button>
      )}
    </div>
  );
}

// ❌ RUIM: any, inline style, props sem tipo
function Card(props: any) {
  return <div style={{padding: 16}}>{props.description}</div>;
}
```

**Regras essenciais React/TS:**
- **Tailwind CSS v3.4.x** — arquivos `tailwind.config.js` e `postcss.config.js` tradicionais. **Não atualizar para v4.**
- **Tema Visual Dark Premium obrigatório**: containers com `.glassmorphism` ou `.auth-card`, gradientes `.gradient-bg`, fundos `bg-zinc-900/60`, bordas `border-zinc-800`, textos `text-zinc-100`/`text-zinc-400`, destaques `violet-600`
- **Nunca use `any`** — prefira `unknown` com type guard
- Componentes: arquivos `.tsx`, exportação nomeada, props sempre tipadas via `interface`
- Um componente por arquivo; nome do arquivo = nome do componente (`TransactionCard.tsx`)
- Hooks customizados em `hooks/use*.ts`; lógica de dados **fora** de componentes visuais
- Use `cn()` (clsx + tailwind-merge) para classes condicionais
- Proibido `!important` e `style={{}}` inline — Tailwind resolve tudo
