# FinanceFlow

Sistema web de controle financeiro pessoal, com suporte a gestão em casal. O diferencial é separar três datas por transação (competência, vencimento e pagamento) e calcular o orçamento pela competência.

- Fonte da verdade: [especificação de requisitos](https://docs.google.com/document/d/1CfbRNUUDdoY80AoHaz08wKSFjMLFWbwa-7_WDYMPnlU/edit)
- Decisões: [`docs/adr/`](docs/adr/README.md)
- Design system: [`docs/design-system.md`](docs/design-system.md)

## Estrutura

```text
backend/    API REST em Kotlin + Spring Boot 4 (JVM 21), PostgreSQL, Flyway
frontend/   SPA em React 18 + Vite + TypeScript + Tailwind
docs/       ADRs e design system
```

## Pré-requisitos

- JDK 21 (o Gradle baixa um automaticamente se não houver, mas precisa de algum JDK para rodar)
- Docker (banco local e testes de integração com Testcontainers)
- Node.js 22 ou mais recente

## Rodando localmente

```bash
docker compose up -d db
```

```bash
cd backend && ./gradlew bootRun
```

```bash
cd frontend && npm install && npm run dev
```

O backend sobe em `http://localhost:8080` (health check em `/actuator/health`) e o frontend em `http://localhost:5173`.

## Testes

```bash
cd backend && ./gradlew test koverVerify
```

```bash
cd frontend && npm run lint && npm run test && npm run build
```
