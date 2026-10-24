-- Lado de cada ponta de uma transferência (ADR-0036): OUT sai da conta, IN entra.
-- Sem ele o saldo calculado (RN-07, ADR-0011) não sabe se soma ou subtrai uma transferência.

ALTER TABLE transactions ADD COLUMN transfer_direction VARCHAR(3);

ALTER TABLE transactions
    ADD CONSTRAINT ck_transactions_transfer_direction CHECK (transfer_direction IN ('OUT', 'IN')),
    -- IS NOT NULL explícito: um CHECK que avalia para NULL é aceito pelo banco
    ADD CONSTRAINT ck_transactions_transfer_direction_type CHECK (
        (type = 'TRANSFER') = (transfer_direction IS NOT NULL)
    );
