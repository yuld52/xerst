-- Preserva o método informado pelas plataformas de pagamento.
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(80);

CREATE INDEX IF NOT EXISTS ix_transactions_payment_method
    ON transactions (payment_method);
