-- LomusTrack: schema PostgreSQL/Supabase completo dos modelos atuais.

-- Reexecutável: usa IF NOT EXISTS e tolera enums que já existam.

-- Execute no SQL Editor Supabase antes de publicar o backend.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE userrole AS ENUM ('superadmin', 'owner', 'admin', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE paymentplatform AS ENUM ('KIWIFY', 'PAYT', 'HOTMART', 'API'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE transactionstatus AS ENUM ('APPROVED', 'REFUNDED', 'CHARGEBACK', 'PENDING', 'TRIAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE checkoutplatform AS ENUM ('KIWIFY', 'PAYT', 'HOTMART'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE webhookplatform AS ENUM ('KIWIFY', 'PAYT', 'HOTMART', 'API'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE markertype AS ENUM ('VIDEO', 'CHECKOUT', 'PRODUCT', 'PLATFORM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE actiontype AS ENUM ('BUDGET_INCREASE', 'BUDGET_DECREASE', 'PAUSE', 'ACTIVATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admins (
	id SERIAL NOT NULL,
	company_id INTEGER,
	name VARCHAR(100) NOT NULL,
	email VARCHAR(255),
	password_hash VARCHAR(255),
	role userrole NOT NULL,
	invite_token VARCHAR(255),
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	is_active INTEGER NOT NULL,
	subscription_expires_at TIMESTAMP WITHOUT TIME ZONE,
	subscription_plan VARCHAR(20) DEFAULT 'free' NOT NULL,
	subscription_started_at TIMESTAMP WITHOUT TIME ZONE,
	token_version INTEGER NOT NULL,
	two_factor_secret VARCHAR(64),
	two_factor_enabled BOOLEAN NOT NULL,
	preferences JSON NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (email),
	UNIQUE (invite_token)
);

CREATE TABLE IF NOT EXISTS company_settings (
	id SERIAL NOT NULL,
	company_id INTEGER,
	tax_rate FLOAT,
	operational_costs JSON,
	kpi_colors JSON,
	ai_instructions JSON,
	notification_preferences JSON,
	display_currency VARCHAR(3) DEFAULT 'MZN' NOT NULL,
	stripe_enabled BOOLEAN DEFAULT 'false' NOT NULL,
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_company_settings_company_id ON company_settings (company_id);

CREATE TABLE IF NOT EXISTS customers (
	id SERIAL NOT NULL,
	company_id INTEGER,
	external_id VARCHAR(255),
	email VARCHAR(255) NOT NULL,
	name VARCHAR(255),
	phone VARCHAR(50),
	cpf VARCHAR(20),
	total_spent FLOAT,
	total_orders INTEGER,
	first_purchase_at TIMESTAMP WITHOUT TIME ZONE,
	last_purchase_at TIMESTAMP WITHOUT TIME ZONE,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_customers_company_id ON customers (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_customers_email ON customers (email);

CREATE TABLE IF NOT EXISTS products (
	id SERIAL NOT NULL,
	company_id INTEGER,
	name VARCHAR(255) NOT NULL,
	logo_url TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS ix_products_company_id ON products (company_id);

CREATE TABLE IF NOT EXISTS facebook_accounts (
	id SERIAL NOT NULL,
	company_id INTEGER,
	label VARCHAR(255) NOT NULL,
	account_id VARCHAR(100) NOT NULL,
	access_token VARCHAR(500) NOT NULL,
	business_id VARCHAR(100),
	status VARCHAR(30),
	is_active BOOLEAN DEFAULT 'false' NOT NULL,
	token_valid BOOLEAN DEFAULT 'true' NOT NULL,
	currency VARCHAR(10),
	last_sync_at TIMESTAMP WITHOUT TIME ZONE,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	UNIQUE (account_id)
);

CREATE INDEX IF NOT EXISTS ix_facebook_accounts_company_id ON facebook_accounts (company_id);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
	id SERIAL NOT NULL,
	company_id INTEGER,
	slug VARCHAR(50) NOT NULL,
	platform webhookplatform NOT NULL,
	name VARCHAR(255) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS ix_webhook_endpoints_company_id ON webhook_endpoints (company_id);

CREATE TABLE IF NOT EXISTS campaign_presets (
	id SERIAL NOT NULL,
	name VARCHAR(255) NOT NULL,
	columns JSON NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS campaign_tags (
	id SERIAL NOT NULL,
	campaign_id VARCHAR(100) NOT NULL,
	tags TEXT NOT NULL,
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_campaign_tags_campaign_id ON campaign_tags (campaign_id);

CREATE TABLE IF NOT EXISTS campaign_markers (
	id SERIAL NOT NULL,
	company_id INTEGER,
	campaign_id VARCHAR(100) NOT NULL,
	marker_type markertype NOT NULL,
	reference_id VARCHAR(255) NOT NULL,
	reference_label VARCHAR(500) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_campaign_markers_campaign_id ON campaign_markers (campaign_id);

CREATE INDEX IF NOT EXISTS ix_campaign_markers_company_id ON campaign_markers (company_id);

CREATE TABLE IF NOT EXISTS gemini_accounts (
	id SERIAL NOT NULL,
	name VARCHAR(255) NOT NULL,
	company_id INTEGER,
	api_key VARCHAR(500),
	model VARCHAR(100) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_gemini_accounts_company_id ON gemini_accounts (company_id);

CREATE TABLE IF NOT EXISTS campaign_actions (
	id SERIAL NOT NULL,
	company_id INTEGER,
	entity_id VARCHAR NOT NULL,
	entity_type VARCHAR NOT NULL,
	entity_name VARCHAR NOT NULL,
	action_type actiontype NOT NULL,
	budget_before FLOAT,
	budget_after FLOAT,
	spend FLOAT,
	revenue FLOAT,
	profit FLOAT,
	sales INTEGER,
	roas FLOAT,
	cpa FLOAT,
	cpc FLOAT,
	ctr FLOAT,
	clicks INTEGER,
	impressions INTEGER,
	connect_rate FLOAT,
	created_at TIMESTAMP WITH TIME ZONE,
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_campaign_actions_entity_id ON campaign_actions (entity_id);

CREATE INDEX IF NOT EXISTS ix_campaign_actions_company_id ON campaign_actions (company_id);

CREATE INDEX IF NOT EXISTS ix_campaign_actions_action_type ON campaign_actions (action_type);

CREATE TABLE IF NOT EXISTS stripe_accounts (
	id SERIAL NOT NULL,
	company_id INTEGER,
	name VARCHAR(255) NOT NULL,
	api_key VARCHAR(500) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_stripe_accounts_company_id ON stripe_accounts (company_id);

CREATE TABLE IF NOT EXISTS utm_clicks (
	id SERIAL NOT NULL,
	company_id INTEGER,
	user_id INTEGER,
	campaign_id VARCHAR(255),
	campaign_name VARCHAR(255),
	source VARCHAR(255),
	medium VARCHAR(255),
	campaign VARCHAR(255),
	content VARCHAR(255),
	term VARCHAR(255),
	landing_url TEXT,
	referrer TEXT,
	page_url TEXT,
	ip_address VARCHAR(64),
	user_agent TEXT,
	tracking_id VARCHAR(255),
	click_hash VARCHAR(64),
	is_conversion BOOLEAN DEFAULT 'false' NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_utm_clicks_user_id ON utm_clicks (user_id);

CREATE INDEX IF NOT EXISTS ix_utm_clicks_company_id ON utm_clicks (company_id);

CREATE INDEX IF NOT EXISTS ix_utm_clicks_click_hash ON utm_clicks (click_hash);

CREATE INDEX IF NOT EXISTS ix_utm_clicks_campaign_id ON utm_clicks (campaign_id);

CREATE INDEX IF NOT EXISTS ix_utm_clicks_tracking_id ON utm_clicks (tracking_id);

CREATE TABLE IF NOT EXISTS api_credentials (
	id SERIAL NOT NULL,
	company_id INTEGER NOT NULL,
	name VARCHAR(255) NOT NULL,
	token_hash VARCHAR(64) NOT NULL,
	token_prefix VARCHAR(16) NOT NULL,
	is_active BOOLEAN NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	last_used_at TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_api_credentials_company_id ON api_credentials (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_api_credentials_token_hash ON api_credentials (token_hash);

CREATE TABLE IF NOT EXISTS notification_deliveries (
	id SERIAL NOT NULL,
	company_id INTEGER NOT NULL,
	title VARCHAR(255) NOT NULL,
	body VARCHAR(2000) NOT NULL,
	status VARCHAR(30) NOT NULL,
	sent_count INTEGER NOT NULL,
	failed_count INTEGER NOT NULL,
	data JSON,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_notification_deliveries_company_id ON notification_deliveries (company_id);

CREATE INDEX IF NOT EXISTS ix_notification_deliveries_status ON notification_deliveries (status);

CREATE INDEX IF NOT EXISTS ix_notification_deliveries_created_at ON notification_deliveries (created_at);

CREATE TABLE IF NOT EXISTS campaign_rules (
	id SERIAL NOT NULL,
	rule_id VARCHAR(80) NOT NULL,
	company_id INTEGER NOT NULL,
	definition JSON NOT NULL,
	enabled BOOLEAN DEFAULT 'true' NOT NULL,
	last_checked_at TIMESTAMP WITHOUT TIME ZONE,
	executions_today INTEGER DEFAULT '0' NOT NULL,
	execution_date DATE,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_campaign_rules_company_id ON campaign_rules (company_id);

CREATE INDEX IF NOT EXISTS ix_campaign_rules_rule_id ON campaign_rules (rule_id);

CREATE TABLE IF NOT EXISTS notification_retries (
	id SERIAL NOT NULL,
	company_id INTEGER NOT NULL,
	title VARCHAR(255) NOT NULL,
	body TEXT NOT NULL,
	data JSON,
	delivered_subscription_ids JSON NOT NULL,
	attempts INTEGER NOT NULL,
	max_attempts INTEGER NOT NULL,
	status VARCHAR(30) NOT NULL,
	next_attempt_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo') NOT NULL,
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_notification_retries_company_id ON notification_retries (company_id);

CREATE INDEX IF NOT EXISTS ix_notification_retries_status ON notification_retries (status);

CREATE TABLE IF NOT EXISTS global_app_settings (
	id INTEGER NOT NULL,
	settings JSONB DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}' NOT NULL,
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS automation_locks (
	lock_key BIGSERIAL NOT NULL,
	lock_token VARCHAR(32) NOT NULL,
	locked_until TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (lock_key),
	UNIQUE (lock_token)
);

CREATE TABLE IF NOT EXISTS transactions (
	id SERIAL NOT NULL,
	company_id INTEGER,
	external_id VARCHAR(255) NOT NULL,
	platform paymentplatform NOT NULL,
	status transactionstatus,
	amount FLOAT NOT NULL,
	original_currency VARCHAR(10),
	original_amount FLOAT,
	amount_mzn FLOAT,
	payment_method VARCHAR(80),
	customer_id INTEGER,
	product_id INTEGER,
	product_name VARCHAR(255),
	customer_email VARCHAR(255),
	utm_source TEXT,
	utm_medium TEXT,
	utm_campaign TEXT,
	utm_content TEXT,
	utm_term TEXT,
	src TEXT,
	webhook_slug VARCHAR(50),
	checkout_url VARCHAR(1024),
	order_bumps JSON,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	UNIQUE (external_id),
	FOREIGN KEY(customer_id) REFERENCES customers (id),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_transactions_company_id ON transactions (company_id);

CREATE INDEX IF NOT EXISTS ix_transactions_customer_id ON transactions (customer_id);

CREATE INDEX IF NOT EXISTS ix_transactions_product_id ON transactions (product_id);

CREATE INDEX IF NOT EXISTS ix_transactions_payment_method ON transactions (payment_method);

CREATE INDEX IF NOT EXISTS ix_transactions_webhook_slug ON transactions (webhook_slug);

CREATE INDEX IF NOT EXISTS ix_transactions_customer_email ON transactions (customer_email);

CREATE TABLE IF NOT EXISTS checkouts (
	id SERIAL NOT NULL,
	product_id INTEGER NOT NULL,
	url VARCHAR(500),
	price FLOAT NOT NULL,
	platform checkoutplatform NOT NULL,
	checkout_code VARCHAR(255),
	name VARCHAR(255),
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_checkouts_checkout_code ON checkouts (checkout_code);

CREATE INDEX IF NOT EXISTS ix_checkouts_product_id ON checkouts (product_id);

CREATE TABLE IF NOT EXISTS order_bumps (
	id SERIAL NOT NULL,
	product_id INTEGER NOT NULL,
	external_id VARCHAR(255),
	name VARCHAR(255) NOT NULL,
	price FLOAT NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_order_bumps_product_id ON order_bumps (product_id);

CREATE TABLE IF NOT EXISTS upsells (
	id SERIAL NOT NULL,
	product_id INTEGER NOT NULL,
	external_id VARCHAR(255),
	name VARCHAR(255) NOT NULL,
	price FLOAT NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_upsells_product_id ON upsells (product_id);

CREATE TABLE IF NOT EXISTS customer_products (
	id SERIAL NOT NULL,
	customer_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	CONSTRAINT uq_customer_product UNIQUE (customer_id, product_id),
	FOREIGN KEY(customer_id) REFERENCES customers (id),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_customer_products_product_id ON customer_products (product_id);

CREATE INDEX IF NOT EXISTS ix_customer_products_customer_id ON customer_products (customer_id);

CREATE TABLE IF NOT EXISTS product_aliases (
	id SERIAL NOT NULL,
	product_id INTEGER NOT NULL,
	alias VARCHAR(255) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	CONSTRAINT uq_product_alias UNIQUE (product_id, alias),
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_product_aliases_product_id ON product_aliases (product_id);

CREATE INDEX IF NOT EXISTS ix_product_aliases_alias ON product_aliases (alias);

CREATE TABLE IF NOT EXISTS utm_conversions (
	id SERIAL NOT NULL,
	company_id INTEGER,
	click_id INTEGER,
	campaign_id VARCHAR(255),
	campaign_name VARCHAR(255),
	source VARCHAR(255),
	medium VARCHAR(255),
	campaign VARCHAR(255),
	content VARCHAR(255),
	term VARCHAR(255),
	conversion_type VARCHAR(120),
	value FLOAT NOT NULL,
	currency VARCHAR(10) NOT NULL,
	reference VARCHAR(255),
	payload TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	FOREIGN KEY(click_id) REFERENCES utm_clicks (id)
);

CREATE INDEX IF NOT EXISTS ix_utm_conversions_click_id ON utm_conversions (click_id);

CREATE INDEX IF NOT EXISTS ix_utm_conversions_company_id ON utm_conversions (company_id);

CREATE INDEX IF NOT EXISTS ix_utm_conversions_campaign_id ON utm_conversions (campaign_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
	id SERIAL NOT NULL,
	endpoint_id INTEGER,
	company_id INTEGER,
	platform VARCHAR(40) NOT NULL,
	slug VARCHAR(50) NOT NULL,
	status VARCHAR(30) NOT NULL,
	http_status INTEGER,
	error_message VARCHAR(1000),
	payload JSON,
	transaction_id INTEGER,
	attempts INTEGER NOT NULL,
	received_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	processed_at TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	FOREIGN KEY(endpoint_id) REFERENCES webhook_endpoints (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_endpoint_id ON webhook_deliveries (endpoint_id);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_status ON webhook_deliveries (status);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_company_id ON webhook_deliveries (company_id);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_slug ON webhook_deliveries (slug);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_platform ON webhook_deliveries (platform);

CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_received_at ON webhook_deliveries (received_at);

CREATE TABLE IF NOT EXISTS audit_logs (
	id SERIAL NOT NULL,
	company_id INTEGER,
	actor_id INTEGER,
	action VARCHAR(120) NOT NULL,
	resource_type VARCHAR(80) NOT NULL,
	resource_id VARCHAR(120),
	details JSON,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
	PRIMARY KEY (id),
	FOREIGN KEY(actor_id) REFERENCES admins (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);

CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_type ON audit_logs (resource_type);

CREATE INDEX IF NOT EXISTS ix_audit_logs_company_id ON audit_logs (company_id);

CREATE TABLE IF NOT EXISTS subscription_plan_requests (
	id SERIAL NOT NULL,
	company_id INTEGER NOT NULL,
	requested_by_admin_id INTEGER NOT NULL,
	requested_plan VARCHAR(20) NOT NULL,
	status VARCHAR(20) DEFAULT 'pending' NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo') NOT NULL,
	reviewed_at TIMESTAMP WITHOUT TIME ZONE,
	reviewed_by_admin_id INTEGER,
	PRIMARY KEY (id),
	FOREIGN KEY(requested_by_admin_id) REFERENCES admins (id),
	FOREIGN KEY(reviewed_by_admin_id) REFERENCES admins (id)
);

CREATE INDEX IF NOT EXISTS ix_subscription_plan_requests_company_id ON subscription_plan_requests (company_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
	id SERIAL NOT NULL,
	session_id VARCHAR(64) NOT NULL,
	admin_id INTEGER NOT NULL,
	company_id INTEGER,
	user_agent VARCHAR(500),
	ip_address VARCHAR(80),
	created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo') NOT NULL,
	last_seen_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo') NOT NULL,
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	revoked_at TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	FOREIGN KEY(admin_id) REFERENCES admins (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_auth_sessions_admin_id ON auth_sessions (admin_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_auth_sessions_session_id ON auth_sessions (session_id);

CREATE INDEX IF NOT EXISTS ix_auth_sessions_company_id ON auth_sessions (company_id);


-- Migração incluída: 2026-09-22-add-facebook-status-columns.sql

-- Migration: Add status and is_active columns to facebook_accounts table
-- Date: 2026-09-22
-- Description: Adds status and is_active columns if they don't exist

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facebook_accounts'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE facebook_accounts
        ADD COLUMN status VARCHAR(30) DEFAULT 'discovered';

        RAISE NOTICE 'Added status column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'status column already exists in facebook_accounts table';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facebook_accounts'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE facebook_accounts
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;

        RAISE NOTICE 'Added is_active column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'is_active column already exists in facebook_accounts table';
    END IF;
END $$;

-- Add last_sync_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facebook_accounts'
        AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE facebook_accounts
        ADD COLUMN last_sync_at TIMESTAMP;

        RAISE NOTICE 'Added last_sync_at column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'last_sync_at column already exists in facebook_accounts table';
    END IF;
END $$;


-- Migração incluída: 2026-09-22-add-token-valid.sql

-- Migration: Add token_valid column to facebook_accounts table
-- Date: 2026-09-22
-- Description: Adds token_valid column to track if Facebook tokens are still valid
-- This column is required by meta_data.py, meta_spend.py, and daily_report_data.py

-- Add token_valid column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'facebook_accounts'
        AND column_name = 'token_valid'
    ) THEN
        ALTER TABLE facebook_accounts
        ADD COLUMN token_valid BOOLEAN NOT NULL DEFAULT TRUE;

        RAISE NOTICE 'Added token_valid column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'token_valid column already exists in facebook_accounts table';
    END IF;
END $$;


-- Migração incluída: 2026-09-28-add-currency-support.sql

-- Adicionar suporte a múltiplas moedas (USD, BRL, MZN) na tabela de transações
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'BRL',
    ADD COLUMN IF NOT EXISTS original_amount DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS amount_mzn DOUBLE PRECISION;

-- Atualizar registros existentes que não possuem amount_mzn
UPDATE transactions
SET
    original_currency = COALESCE(original_currency, 'BRL'),
    original_amount = COALESCE(original_amount, amount),
    amount_mzn = COALESCE(amount_mzn, amount * 13)
WHERE amount_mzn IS NULL;


-- Migração incluída: 2026-09-28-add-facebook-currency.sql

-- Adicionar coluna de moeda (USD, BRL, etc.) para contas do Facebook Ads
ALTER TABLE facebook_accounts
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BRL';

UPDATE facebook_accounts
SET currency = 'BRL'
WHERE currency IS NULL;


-- Migração incluída: 2026-11-06-add-payment-method.sql

-- Preserva o método informado pelas plataformas de pagamento.
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(80);

CREATE INDEX IF NOT EXISTS ix_transactions_payment_method
    ON transactions (payment_method);


-- Migração incluída: 2026_11_07_operations.sql

CREATE TABLE IF NOT EXISTS api_credentials (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    token_prefix VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    last_used_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_api_credentials_company_id ON api_credentials(company_id);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER NULL REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
    company_id INTEGER NULL,
    platform VARCHAR(40) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    http_status INTEGER NULL,
    error_message VARCHAR(1000) NULL,
    payload JSONB NULL,
    transaction_id INTEGER NULL,
    attempts INTEGER NOT NULL DEFAULT 1,
    received_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    processed_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_company_id ON webhook_deliveries(company_id);
CREATE INDEX IF NOT EXISTS ix_webhook_deliveries_received_at ON webhook_deliveries(received_at);
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NULL,
    actor_id INTEGER NULL REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(120) NULL,
    details JSONB NULL,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(64) NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(2000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    data JSONB NULL,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_notification_deliveries_company_id ON notification_deliveries(company_id);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS ux_company_settings_company_id ON company_settings(company_id) WHERE company_id IS NOT NULL;


-- Migração incluída: 2026_11_07_subscription_plan.sql

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free';

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP NULL;

UPDATE admins
SET subscription_plan = 'free'
WHERE subscription_plan IS NULL OR subscription_plan NOT IN ('free', 'premium', 'monster');

UPDATE admins
SET subscription_started_at = created_at
WHERE role = 'owner' AND subscription_started_at IS NULL;


-- Migração incluída: 2026_11_07_supabase_persistence.sql

ALTER TABLE company_settings
    ADD COLUMN IF NOT EXISTS display_currency VARCHAR(3) NOT NULL DEFAULT 'MZN';

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS global_app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    settings JSONB NOT NULL DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE global_app_settings
    ALTER COLUMN settings SET DEFAULT '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb;

INSERT INTO global_app_settings (id, settings)
VALUES (1, '{"allowSignups":true,"maintenanceMode":false,"pushNotifications":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS automation_locks (
    lock_key BIGINT PRIMARY KEY,
    lock_token VARCHAR(32) NOT NULL UNIQUE,
    locked_until TIMESTAMP NOT NULL
);


-- Migração incluída: 2026_11_08_subscription_plan_requests.sql

CREATE TABLE IF NOT EXISTS subscription_plan_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    requested_by_admin_id INTEGER NOT NULL REFERENCES admins(id),
    requested_plan VARCHAR(20) NOT NULL CHECK (requested_plan IN ('free', 'premium', 'monster')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP NULL,
    reviewed_by_admin_id INTEGER NULL REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS ix_subscription_plan_requests_company_status
    ON subscription_plan_requests (company_id, status);


-- Migração incluída: 2026_11_10_company_notification_preferences.sql

ALTER TABLE company_settings
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB NULL;


-- Migração incluída: 2026_11_11_tenant_ai_stripe_actions.sql

ALTER TABLE stripe_accounts
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
CREATE INDEX IF NOT EXISTS ix_stripe_accounts_company_id
    ON stripe_accounts (company_id);

ALTER TABLE gemini_accounts
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
ALTER TABLE gemini_accounts
    ALTER COLUMN api_key DROP NOT NULL;
CREATE INDEX IF NOT EXISTS ix_gemini_accounts_company_id
    ON gemini_accounts (company_id);
UPDATE gemini_accounts SET api_key = NULL;

ALTER TABLE campaign_actions
    ADD COLUMN IF NOT EXISTS company_id INTEGER NULL;
CREATE INDEX IF NOT EXISTS ix_campaign_actions_company_id
    ON campaign_actions (company_id);


-- Migração incluída: 2026_11_12_campaign_marker_tenant.sql

ALTER TABLE campaign_markers
    ADD COLUMN IF NOT EXISTS company_id INTEGER;

CREATE INDEX IF NOT EXISTS ix_campaign_markers_company_id
    ON campaign_markers (company_id);


-- Migração incluída: 2026_11_13_campaign_rules.sql

CREATE TABLE IF NOT EXISTS campaign_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(80) NOT NULL,
    company_id INTEGER NOT NULL,
    definition JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMP NULL,
    executions_today INTEGER NOT NULL DEFAULT 0,
    execution_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);

CREATE INDEX IF NOT EXISTS ix_campaign_rules_rule_id ON campaign_rules (rule_id);
CREATE INDEX IF NOT EXISTS ix_campaign_rules_company_id ON campaign_rules (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_rules_company_rule_id ON campaign_rules (company_id, rule_id);


-- Migração incluída: 2026_11_14_auth_sessions.sql

CREATE TABLE IF NOT EXISTS auth_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    company_id INTEGER NULL,
    user_agent VARCHAR(500) NULL,
    ip_address VARCHAR(80) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    last_seen_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_admin_id ON auth_sessions (admin_id);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_company_id ON auth_sessions (company_id);


-- Migração incluída: 2026_11_15_notification_retries.sql

CREATE TABLE IF NOT EXISTS notification_retries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB NULL,
    delivered_subscription_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    next_attempt_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
);
CREATE INDEX IF NOT EXISTS ix_notification_retries_company_id ON notification_retries (company_id);
CREATE INDEX IF NOT EXISTS ix_notification_retries_status ON notification_retries (status);


-- Tabelas de negocio acessiveis apenas pelo backend autenticado.
DO $$ DECLARE t RECORD; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE 'pg_%' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t.tablename);
  END LOOP;
END $$;
