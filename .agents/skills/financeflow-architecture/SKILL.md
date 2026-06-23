---
name: financeflow-architecture
description: Stack tecnológica, arquitetura de monólito modular, boas práticas de codificação (Clean Code, exceções, testes) e segurança no FinanceFlow.
---

# Arquitetura e Boas Práticas (FinanceFlow Architecture & Standards)

Esta skill especifica os padrões de engenharia de software, a stack tecnológica, requisitos de segurança e as diretrizes de codificação limpa do ecossistema do FinanceFlow.

## 1. Stack Tecnológica

### Backend (Java 21 + Spring Boot 3)
- **Segurança**: Spring Security + Autenticação Stateless via JWT.
- **Persistência**: Spring Data JPA + Hibernate integrados com banco PostgreSQL.
- **Migrations**: Flyway para gerenciar alterações de schema do banco.
- **Cache**: Redis para sessões e otimização de dashboards lentos.

### Frontend (React 18 + Vite + TypeScript)
- **Estilização**: Tailwind CSS.
- **Estado de Servidor**: React Query (TanStack Query) para cache e atualizações otimistas.
- **Roteamento**: React Router v6 para SPA com rotas privadas/protegidas.
- **Datas**: Biblioteca `date-fns` (tree-shakeable) para formatação e lógica de competência.
- **Gráficos**: Recharts para visualização de fluxo de caixa e orçamentos.

## 2. Estruturação do Monólito Modular

Para manter alta modularidade e permitir uma futura migração fácil para microsserviços:

### Backend Package Layout (Package by Feature)
Adote pacotes baseados em domínios de negócio sob `com.financeflow`:
```text
com.financeflow
├── auth                # Módulo de Autenticação e Perfis (JWT)
├── account             # Módulo de Contas Bancárias e Cartões
├── transaction         # Módulo de Transações e Lançamentos
│   ├── controller      # Endpoints REST expostos
│   ├── service         # Regras de negócio
│   ├── repository      # Interfaces do repositório
│   │   └── jpa         # Implementações JPA e Spring Data JpaRepositories
│   ├── model           # Modelagem e Mapeamento de Persistência
│   │   ├── domain      # Modelos de domínio puros (Java Records)
│   │   ├── entity      # Entidades de persistência (JPA)
│   │   └── mapper      # Mappers entre domain e entity
│   └── dto             # Objetos de transferência de dados (Request/Response)
├── budget              # Módulo de Planejamento e Orçamentos
├── cashflow            # Módulo de Fluxo de Caixa e Projeções
├── couple              # Módulo de Gestão de Casal
└── shared              # Utilitários globais, tratamento de erro comum
```

### 3. Modelo de Domínio vs Entidades JPA
Para eliminar o código repetitivo (*boilerplate*) sem violar a regra de não usar Lombok, adotamos a separação de responsabilidades no pacote `model`:
*   **Domain (`model/domain`):** Representa o modelo de negócio puro usando Java **Records** (nativamente imutáveis, geram getters, constructors e equals/hashCode em uma linha). As validações e regras de negócio (*fail-fast*) residem aqui.
*   **Entity (`model/entity`):** Classes anotadas com `@Entity` destinadas unicamente ao mapeamento físico do banco de dados (JPA/Hibernate).
*   **Mapper (`model/mapper`):** Conversores estáticos simples que traduzem objetos de domínio em entidades e vice-versa.

### Frontend Directory Layout
Organize a interface baseando-se em features sob `src/`:
```text
src/
├── components/         # Componentes globais (botão, input, etc)
├── features/           # Módulos de domínio
│   ├── auth/
│   ├── transactions/
│   ├── budget/
│   └── couple/
│       ├── components/ # Componentes exclusivos da feature
│       ├── hooks/      # Hooks do React Query
│       └── api/        # Requisições exclusivas
├── routes/             # Definição e proteção de rotas
└── utils/              # Funções utilitárias (helpers date-fns)
```

## 3. Comunicação entre Módulos (Desacoplamento)

Para evitar acoplamentos rígidos entre domínios no Monólito Modular:
- **Sem acesso cruzado a bancos de dados:** Um módulo nunca deve ler ou escrever no banco de dados gerenciado por outro módulo diretamente.
- **Interfaces Públicas:** Módulos que precisam chamar lógica síncrona de outros devem usar uma interface pública de `Service` exposta no pacote alvo.
- **Comunicação Assíncrona (Eventos):** Prefira publicar eventos de domínio usando o `ApplicationEventPublisher` do Spring para reações a ações de negócio (ex: publicar um `TransactionCreatedEvent` para que o módulo de orçamentos recalcule a competência correspondente sem acoplar as classes diretamente).

## 4. Padrões de Código e Limpeza (Clean Code)

- **Nomenclatura**: Nomes de variáveis, métodos e classes devem ser descritivos e autoexplicativos. Evite abreviações obscuras.
- **Foco único**: Métodos devem ser curtos e focados em apenas uma responsabilidade (Single Responsibility Principle).

## 5. Tratamento de Erros e Exceções

- **Backend (Spring Boot)**:
  - Não retorne stack traces brutos para o cliente. Use um `@ControllerAdvice` global para capturar exceções e retornar um objeto JSON padronizado de erro (contendo timestamp, status code, mensagem amigável e detalhes se for validação de campos).
  - Use exceções de domínio customizadas (ex: `ResourceNotFoundException`, `BusinessException`).
- **Frontend (React)**:
  - Implemente `Error Boundaries` para capturar falhas na renderização e evitar que a aplicação trave inteiramente.
  - Utilize tratamentos globais no React Query para renderizar toasts amigáveis de erro para falhas de rede ou validação.

## 6. Segurança, Criptografia e Logs

- **Autenticação**:
  - `Access Token` JWT de expiração curta (15 minutos).
  - `Refresh Token` de expiração longa (30 dias) rotacionado a cada uso, persistido no banco com suporte a revogação.
  - BCrypt com fator de custo `12` para hash de senhas de usuários.
- **Criptografia em Repouso**:
  - Dados bancários e tokens do Open Finance DEVEM ser criptografados em repouso no banco de dados nas colunas correspondentes usando **AES-256**.
- **Logs**:
  - Utilize logs (SLF4J) em pontos críticos. Use níveis apropriados (`INFO`, `WARN`, `ERROR`) e **nunca** inclua dados sensíveis em logs.

## 7. Padrões de Testes

- Todo novo serviço de domínio ou lógica de negócio deve vir acompanhado de testes unitários ou de integração.
- No Backend, utilize `MockMvc` para testar os Controllers e `@Mock` para isolar dependências em testes unitários.
- A meta de cobertura para qualquer alteração de código ou funcionalidade é de no mínimo **70% de cobertura no backend**.

## 8. Endpoints da API REST (Padrão `/api/v1`)

- Todos os endpoints devem exigir Authorization Header com Bearer Token (JWT).
- Mapeamento principal de rotas:
  - `POST /api/v1/auth/register` (Cadastro)
  - `POST /api/v1/auth/login` (Login)
  - `GET /api/v1/accounts` (Contas e Cartões)
  - `GET /api/v1/transactions` (Listagem de transações)
  - `POST /api/v1/transactions` (Criar transação)
  - `GET /api/v1/budget/:month` (Orçamento mensal)
  - `GET /api/v1/cashflow` (Fluxo de caixa parametrizado)
  - `POST /api/v1/couple/invite` (Convidar parceiro)
  - `GET /api/v1/goals` (Listar metas/objetivos)
  - `GET /api/v1/travels` (Listar viagens)
