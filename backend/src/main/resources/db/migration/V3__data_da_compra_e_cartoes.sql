-- ADR-0038: data da compra (escolhe a fatura pela RN-04) e competência informada ou sugerida
ALTER TABLE transactions
    ADD COLUMN purchase_date       DATE,
    ADD COLUMN competence_informed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE transactions
    -- IS NULL dos dois lados: um CHECK que avalia para NULL é aceito pelo banco
    ADD CONSTRAINT ck_transactions_purchase_date CHECK ((invoice_id IS NULL) = (purchase_date IS NULL));

CREATE UNIQUE INDEX uq_transactions_installment
    ON transactions (installment_group_id, installment_number)
    WHERE installment_group_id IS NOT NULL;

-- ADR-0009: conta que costuma pagar a fatura, só como sugestão no pagamento
ALTER TABLE accounts
    ADD COLUMN default_payment_account_id UUID REFERENCES accounts (id) ON DELETE SET NULL;

CREATE INDEX ix_accounts_default_payment_account_id ON accounts (default_payment_account_id);
