-- ADR-0039: cada pagamento de fatura é uma transferência da conta pagadora para o cartão.
-- O id do pagamento é o transfer_group_id das duas pontas, o que permite o estorno.
CREATE TABLE invoice_payments (
    id              UUID          PRIMARY KEY,
    invoice_id      UUID          NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
    from_account_id UUID          NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    amount          NUMERIC(19,4) NOT NULL,
    payment_date    DATE          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_invoice_payments_amount CHECK (amount > 0)
);

CREATE INDEX ix_invoice_payments_invoice_id ON invoice_payments (invoice_id);
CREATE INDEX ix_invoice_payments_from_account_id ON invoice_payments (from_account_id);
