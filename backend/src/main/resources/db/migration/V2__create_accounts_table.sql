CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    balance NUMERIC(19, 4) NOT NULL,
    credit_limit NUMERIC(19, 4),
    closing_day INT,
    due_day INT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_accounts_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
