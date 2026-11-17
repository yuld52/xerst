-- Scope customer email, product name and payment transaction ID to each company.
-- These indexes protect shared SaaS data without blocking the same values in
-- separate tenants. Existing rows remain untouched.

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
DROP INDEX IF EXISTS ix_customers_email;
CREATE INDEX IF NOT EXISTS ix_customers_email ON customers (email);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_key;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_external_id_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS uq_customers_company_email;
ALTER TABLE products DROP CONSTRAINT IF EXISTS uq_products_company_name;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS uq_transactions_company_external_id;

ALTER TABLE customers
    ADD CONSTRAINT uq_customers_company_email UNIQUE (company_id, email);

ALTER TABLE products
    ADD CONSTRAINT uq_products_company_name UNIQUE (company_id, name);

ALTER TABLE transactions
    ADD CONSTRAINT uq_transactions_company_external_id UNIQUE (company_id, external_id);
