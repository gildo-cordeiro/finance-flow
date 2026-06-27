ALTER TABLE transactions
ADD COLUMN installment_group_id UUID NULL,
ADD COLUMN installment_number INTEGER NULL,
ADD COLUMN total_installments INTEGER NULL,
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN recurrence_rule VARCHAR(100) NULL,
ADD COLUMN recurrence_group_id UUID NULL;
