# FinanceFlow — Sistema de Controle Financeiro Pessoal

O **FinanceFlow** é um sistema web moderno de controle financeiro pessoal projetado para oferecer acompanhamento detalhado de despesas, fluxo de caixa, orçamento e objetivos. Ele suporta de forma nativa a transição suave entre a gestão individual e a gestão financeira de casal.

---

## 🚀 O Diferencial: Modelagem Temporal (Competência)

A maioria dos gerenciadores financeiros comuns usa apenas a data de lançamento ou pagamento, o que distorce a análise do orçamento (por exemplo, uma fatura de cartão de crédito vencendo no dia 05/Julho é paga com a renda recebida em Junho).

O **FinanceFlow** resolve isso separando cada transação em três datas independentes:
1. **Data de Competência:** O mês/período ao qual a transação pertence financeiramente (e onde o orçamento é calculado).
2. **Data de Vencimento:** Quando o valor deve ser quitado.
3. **Data de Pagamento:** Quando ocorreu a saída/entrada real do caixa.

---

## 🛠️ Stack Tecnológica

### Backend (API REST)
*   **Linguagem & Framework:** Java 21 + Spring Boot 3
*   **Segurança:** Spring Security + JWT (JSON Web Tokens) com rotação de refresh token
*   **Persistência:** PostgreSQL (Supabase) + Spring Data JPA / Hibernate
*   **Migrations:** Flyway
*   **Cache:** Redis (Upstash)

### Frontend (SPA)
*   **Framework UI:** React 18 + Vite + TypeScript
*   **Estilização:** Tailwind CSS
*   **Estado & Cache:** React Query (TanStack Query)
*   **Roteamento:** React Router v6 (com proteção de rotas privadas)
*   **Gráficos:** Recharts
*   **Datas:** `date-fns` (lógica de ciclos e competências)

---

## 📂 Organização do Projeto

O projeto utiliza o padrão de **Monólito Modular** para manter o código limpo, testável e facilitar a separação em microsserviços no futuro.

### Estrutura do Backend (`/backend`)
```text
com.financeflow
├── auth                # Autenticação, Perfis e Tokens (JWT)
├── account             # Contas Bancárias e Cartões de Crédito
├── transaction         # Transações, Lançamentos, Parcelamentos e Recorrências
├── budget              # Metas de orçamento previsto x realizado
├── cashflow            # Fluxo de caixa e Projeções de saldo
├── couple              # Gestão de vínculo de casal e despesas compartilhadas
├── goals               # Objetivos e metas de poupança/investimentos
├── travel              # Módulo de planejamento financeiro de viagens
└── shared              # Utilitários compartilhados, exceções e configurações globais
```

Dentro de cada módulo, a camada de dados é dividida para evitar código repetitivo e dependência de frameworks:
*   `repository`: Interfaces puras de domínio que definem os contratos do repositório.
*   `repository/jpa`: Implementações concretas JPA e Spring Data JpaRepository.
*   `model/domain`: Representa os modelos de negócio puros mapeados como Java **Records** (imutáveis por padrão, sem Lombok).
*   `model/entity`: Contém as entidades físicas mapeadas pelo JPA/Hibernate para persistência.
*   `model/mapper`: Conversores simples que realizam a transição entre os modelos de domínio e persistência.

### Estrutura do Frontend (`/frontend`)
```text
src/
├── components/         # Componentes visuais reutilizáveis globais
├── context/            # Contextos do React (Autenticação, Tema, etc)
├── features/           # Módulos de domínio
│   ├── auth/
│   ├── transactions/
│   ├── budget/
│   └── couple/
│       ├── components/
│       ├── hooks/      # Custom hooks integrados ao React Query
│       └── api/        # Chamadas de API específicas
├── routes/             # Definição e proteção de rotas privadas
└── utils/              # Funções utilitárias (manipulação de datas/competência)
```

---

## 🛡️ Segurança e Privacidade

*   **Criptografia em Repouso:** Dados sensíveis (como credenciais bancárias e tokens do Open Finance) são armazenados usando criptografia **AES-256**.
*   **Hashes de Senhas:** Criptografia de senhas usando **BCrypt** (fator de custo 12).
*   **Conformidade com a LGPD:** O sistema garante exportação completa de dados em JSON/CSV e exclusão total da conta sob demanda.
*   **Isolamento de Dados:** Cada consulta de domínio obriga a verificação do `user_id` decodificado do JWT do usuário autenticado.

---

## 📈 Roadmap de Desenvolvimento

- **Fase 1 (MVP):** Autenticação + Contas + Transações Manuais + Orçamento Básico + Dashboard.
- **Fase 2 (Fluxo de Caixa):** Projeção de Saldo + Lançamentos Recorrentes e Parcelamentos.
- **Fase 3 (Open Finance):** Importação automática via APIs Open Finance Brasil + Categorização por IA.
- **Fase 4 (Objetivos e Viagens):** Módulo de planejamento financeiro de médio prazo.
- **Fase 5 (Casal):** Compartilhamento de despesas, orçamentos conjuntos e divisão configurável.

---

## 🤝 Fluxo de Trabalho (Git Workflow)

Para manter o repositório organizado e o histórico de commits limpo, siga as convenções estabelecidas:

### Branches
*   Novas funcionalidades: `feat/nome-da-feature`
*   Correções de bugs: `fix/nome-do-bug`
*   Refatorações: `refactor/o-que-mudou`
*   Documentações: `docs/o-que-mudou`

### Commits (Padrão Conventional Commits)
Exemplos:
*   `feat(auth): adiciona fluxo de login com JWT e refresh token`
*   `fix(budget): corrige cálculo de variância mensal com valores negativos`

---

## 🛠️ Configuração e Instalação Rápida

### Pré-requisitos
*   **JDK 21** instalado.
*   **Node.js 18+** e npm/yarn instalados.
*   Instância local do **PostgreSQL** e do **Redis** rodando (ou instâncias de nuvem configuradas).

### Inicialização do Backend
1. Navegue para o diretório `/backend` do projeto.
2. Ajuste as configurações e credenciais do banco diretamente no arquivo [application.properties](src/main/resources/application.properties) (por padrão, ele já vem configurado com os valores de fallback do Docker Compose).
3. Execute o comando para compilar e iniciar:
   ```bash
   ./gradlew bootRun
   ```

### Inicialização do Frontend
1. Navegue para o diretório `/frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
