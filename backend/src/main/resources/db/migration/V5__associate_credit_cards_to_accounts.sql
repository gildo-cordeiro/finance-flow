ALTER TABLE accounts 
ADD COLUMN associated_account_id UUID NULL;

ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_associated_account 
FOREIGN KEY (associated_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
