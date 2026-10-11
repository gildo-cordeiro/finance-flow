# Estrutura de projeto e regras de dependência

> Referência da skill `code-implementation`. Leia só quando a tarefa envolver este assunto. Fluxo e princípios gerais: `../SKILL.md`.

## 4. Estrutura de Projeto

### Back-end (Java 21 + Spring Boot 4)

```
src/main/java/com/financeflow/
├── auth/
│   ├── controller/
│   ├── dto/
│   ├── service/
│   ├── repository/
│   │   └── jpa/
│   └── model/
│       ├── domain/
│       ├── entity/
│       └── mapper/
├── transaction/            # mesma estrutura
├── budget/                 # mesma estrutura
├── cashflow/               # mesma estrutura
├── account/                # mesma estrutura
├── couple/                 # mesma estrutura
├── goals/                  # mesma estrutura
├── travel/                 # mesma estrutura
└── shared/
    ├── exception/          # DomainException, NotFoundException, BusinessException
    ├── handler/            # GlobalExceptionHandler (@RestControllerAdvice)
    └── security/           # JwtAuthFilter, SecurityConfig, JwtService
```

### Front-end (TypeScript + React)

```
src/
├── components/             # Componentes globais reutilizáveis (Button, Input, Modal)
├── features/               # Módulos por domínio
│   ├── auth/
│   ├── transactions/
│   │   ├── components/
│   │   ├── hooks/          # useTransactions.ts, useCreateTransaction.ts
│   │   └── api/            # transactionApi.ts
│   ├── budget/
│   ├── cashflow/
│   └── couple/
├── routes/                 # Rotas privadas/protegidas
├── lib/
│   └── cn.ts               # clsx + tailwind-merge
└── utils/                  # Funções puras (date-fns helpers, formatters)
```

### Regras de dependência

```
Back-end:  shared ← [qualquer módulo]
           Um módulo depende de outro por interfaces públicas (service/use case); não há eventos de domínio na arquitetura (ver financeflow-architecture §4)

Front-end: api ← hooks ← components ← features ← routes
```
