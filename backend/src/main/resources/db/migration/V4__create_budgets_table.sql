CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format YYYY-MM
    planned_amount NUMERIC(19, 4) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_budgets_user_category_month UNIQUE (user_id, category_id, month)
);
