-- Schema inicial da Fase 1 (F1-02), escrito a partir do Modelo de dados da especificação.
-- Nunca editar depois de aplicada: mudanças vão em novas migrations (ADR-0003).
--
-- Convenções:
--   - chaves UUID geradas pela aplicação, sem DEFAULT no banco (ADR-0004);
--   - dinheiro em NUMERIC(19,4) (ADR-0004, RNF-11);
--   - created_at/updated_at TIMESTAMPTZ em todas as tabelas;
--   - chaves que partem de users usam ON DELETE CASCADE (ADR-0019);
--   - saldo de conta e realizado do orçamento não são colunas (RN-07, ADR-0011).

-- ---------------------------------------------------------------------------
-- Usuários e autenticação
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id                  UUID         PRIMARY KEY,
    email               VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    name                VARCHAR(120) NOT NULL,
    timezone            VARCHAR(64)  NOT NULL DEFAULT 'America/Sao_Paulo', -- IANA
    currency            CHAR(3)      NOT NULL DEFAULT 'BRL',
    privacy_version     VARCHAR(20),
    privacy_accepted_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Moeda única no início (RES-07, D-09, ADR-0015)
    CONSTRAINT ck_users_currency CHECK (currency = 'BRL'),
    CONSTRAINT ck_users_privacy CHECK ((privacy_version IS NULL) = (privacy_accepted_at IS NULL))
);

-- E-mail único sem diferenciar maiúsculas
CREATE UNIQUE INDEX ux_users_email ON users (lower(email));

-- Refresh token rotativo (ADR-0005): guarda só o hash
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    replaced_by UUID         REFERENCES refresh_tokens (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Recuperação de senha (RF-004)
CREATE TABLE password_reset_tokens (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_password_reset_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);

-- ---------------------------------------------------------------------------
-- Contas e cartões
-- ---------------------------------------------------------------------------

CREATE TABLE accounts (
    id                UUID          PRIMARY KEY,
    user_id           UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name              VARCHAR(100)  NOT NULL,
    type              VARCHAR(20)   NOT NULL,
    bank              VARCHAR(100),
    initial_balance   NUMERIC(19,4) NOT NULL DEFAULT 0,
    -- Meses subtraídos da data de referência para sugerir a competência (ADR-0008)
    competence_offset SMALLINT      NOT NULL DEFAULT 0,
    archived          BOOLEAN       NOT NULL DEFAULT FALSE,
    credit_limit      NUMERIC(19,4),
    closing_day       SMALLINT,
    due_day           SMALLINT,
    brand             VARCHAR(30),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_accounts_type CHECK (type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD')),
    CONSTRAINT ck_accounts_competence_offset CHECK (competence_offset >= 0),
    CONSTRAINT ck_accounts_credit_limit CHECK (credit_limit IS NULL OR credit_limit >= 0),
    CONSTRAINT ck_accounts_closing_day CHECK (closing_day BETWEEN 1 AND 31),
    CONSTRAINT ck_accounts_due_day CHECK (due_day BETWEEN 1 AND 31),
    -- Cartão exige dia de fechamento e de vencimento
    CONSTRAINT ck_accounts_credit_card_days CHECK (
        type <> 'CREDIT_CARD' OR (closing_day IS NOT NULL AND due_day IS NOT NULL)
    )
);

CREATE INDEX ix_accounts_user_id ON accounts (user_id);

-- ---------------------------------------------------------------------------
-- Categorias (ADR-0013): dois níveis, com tipo, arquivadas em vez de excluídas
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id  UUID         REFERENCES categories (id) ON DELETE RESTRICT,
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(10)  NOT NULL,
    archived   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_categories_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT ck_categories_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

-- parent_id nulo entra na unicidade (categorias de primeiro nível não se repetem)
CREATE UNIQUE INDEX ux_categories_user_parent_name
    ON categories (user_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name);
CREATE INDEX ix_categories_parent_id ON categories (parent_id);

-- ---------------------------------------------------------------------------
-- Faturas de cartão (ADR-0009): o total é calculado das transações
-- ---------------------------------------------------------------------------

CREATE TABLE invoices (
    id               UUID          PRIMARY KEY,
    account_id       UUID          NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    closing_date     DATE          NOT NULL,
    due_date         DATE          NOT NULL,
    competence_month DATE          NOT NULL,
    status           VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    paid_amount      NUMERIC(19,4) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_invoices_account_closing UNIQUE (account_id, closing_date),
    CONSTRAINT ck_invoices_status CHECK (status IN ('OPEN', 'CLOSED', 'PAID', 'PARTIALLY_PAID')),
    CONSTRAINT ck_invoices_competence_month CHECK (EXTRACT(DAY FROM competence_month) = 1),
    CONSTRAINT ck_invoices_paid_amount CHECK (paid_amount >= 0),
    CONSTRAINT ck_invoices_dates CHECK (due_date >= closing_date)
);

-- ---------------------------------------------------------------------------
-- Transações
-- ---------------------------------------------------------------------------

CREATE TABLE transactions (
    id                   UUID          PRIMARY KEY,
    user_id              UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    account_id           UUID          NOT NULL REFERENCES accounts (id) ON DELETE RESTRICT,
    -- Nulo em transferências; categoria com transações não é excluída (ADR-0013)
    category_id          UUID          REFERENCES categories (id) ON DELETE RESTRICT,
    invoice_id           UUID          REFERENCES invoices (id) ON DELETE RESTRICT,
    description          VARCHAR(255)  NOT NULL,
    amount               NUMERIC(19,4) NOT NULL,
    type                 VARCHAR(10)   NOT NULL,
    status               VARCHAR(10)   NOT NULL,
    -- Três datas independentes (RN-01, ADR-0007)
    competence_date      DATE          NOT NULL,
    due_date             DATE,
    payment_date         DATE,
    -- Parcelas materializadas (ADR-0010)
    installment_group_id UUID,
    installment_number   SMALLINT,
    total_installments   SMALLINT,
    -- As duas pontas de uma transferência
    transfer_group_id    UUID,
    -- FKs chegam com as tabelas: recurrences (Fase 2) e travels (Fase 4)
    recurrence_id        UUID,
    travel_id            UUID,
    -- Visibilidade para o contexto casal (RN-08, D-04, ADR-0012)
    visibility           VARCHAR(10)   NOT NULL DEFAULT 'PRIVATE',
    split_percent        NUMERIC(5,2),
    -- Auditoria (RNF-12)
    created_by           UUID          REFERENCES users (id) ON DELETE SET NULL,
    updated_by           UUID          REFERENCES users (id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_transactions_type CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    CONSTRAINT ck_transactions_status CHECK (status IN ('PLANNED', 'PENDING', 'PAID', 'OVERDUE')),
    CONSTRAINT ck_transactions_visibility CHECK (visibility IN ('PRIVATE', 'VISIBLE', 'SHARED')),
    CONSTRAINT ck_transactions_amount CHECK (amount > 0),
    -- RN-01: payment_date se, e somente se, PAID
    CONSTRAINT ck_transactions_payment_date CHECK ((status = 'PAID') = (payment_date IS NOT NULL)),
    -- RN-02: competência sempre no dia 1
    CONSTRAINT ck_transactions_competence_date CHECK (EXTRACT(DAY FROM competence_date) = 1),
    CONSTRAINT ck_transactions_split_percent CHECK (split_percent BETWEEN 0 AND 100),
    -- IS NOT NULL explícito: um CHECK que avalia para NULL é aceito pelo banco
    CONSTRAINT ck_transactions_installments CHECK (
        (installment_group_id IS NULL AND installment_number IS NULL AND total_installments IS NULL)
        OR (
            installment_group_id IS NOT NULL
            AND installment_number IS NOT NULL
            AND total_installments IS NOT NULL
            AND total_installments >= 1
            AND installment_number BETWEEN 1 AND total_installments
        )
    )
);

-- Orçamento, listagens e dashboard por competência
CREATE INDEX ix_transactions_user_competence ON transactions (user_id, competence_date);
-- Saldo calculado (ADR-0011)
CREATE INDEX ix_transactions_account_status_payment ON transactions (account_id, status, payment_date);
CREATE INDEX ix_transactions_invoice_id ON transactions (invoice_id);
CREATE INDEX ix_transactions_installment_group_id ON transactions (installment_group_id);
CREATE INDEX ix_transactions_transfer_group_id ON transactions (transfer_group_id);
-- Fluxo de caixa e passagem automática para OVERDUE
CREATE INDEX ix_transactions_user_due_date ON transactions (user_id, due_date);
-- Checagem do ON DELETE RESTRICT de categorias
CREATE INDEX ix_transactions_category_id ON transactions (category_id);

-- ---------------------------------------------------------------------------
-- Orçamento: só o planejado; o realizado é calculado (RN-07)
-- ---------------------------------------------------------------------------

CREATE TABLE budgets (
    id             UUID          PRIMARY KEY,
    user_id        UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    couple_id      UUID,         -- FK chega com couples (Fase 5)
    category_id    UUID          NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    month          DATE          NOT NULL,
    planned_amount NUMERIC(19,4) NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_budgets_user_category_month UNIQUE (user_id, category_id, month),
    CONSTRAINT ck_budgets_month CHECK (EXTRACT(DAY FROM month) = 1),
    CONSTRAINT ck_budgets_planned_amount CHECK (planned_amount >= 0)
);

CREATE INDEX ix_budgets_category_id ON budgets (category_id);

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
    id         UUID        PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    payload    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_notifications_user_created ON notifications (user_id, created_at DESC);
