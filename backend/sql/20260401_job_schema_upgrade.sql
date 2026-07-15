BEGIN;

CREATE TABLE IF NOT EXISTS skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_skills_slug UNIQUE (slug),
    CONSTRAINT uk_skills_normalized_name UNIQUE (normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills (name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);

INSERT INTO skills (name, slug, normalized_name, category)
VALUES
    ('Blockchain', 'blockchain', 'blockchain', 'Emerging Tech'),
    ('Blockchain Development', 'blockchain-development', 'blockchain development', 'Emerging Tech'),
    ('Blockchain Architecture', 'blockchain-architecture', 'blockchain architecture', 'Emerging Tech'),
    ('Ethereum', 'ethereum', 'ethereum', 'Emerging Tech'),
    ('Bitcoin', 'bitcoin', 'bitcoin', 'Emerging Tech'),
    ('Smart Contract', 'smart-contract', 'smart contract', 'Emerging Tech'),
    ('Cryptocurrency', 'cryptocurrency', 'cryptocurrency', 'Emerging Tech'),
    ('Cryptography', 'cryptography', 'cryptography', 'Emerging Tech'),
    ('Initial Coin Offering', 'initial-coin-offering', 'initial coin offering', 'Emerging Tech'),
    ('Distributed Ledger Technology', 'distributed-ledger-technology', 'distributed ledger technology', 'Emerging Tech'),
    ('Hyperledger Fabric', 'hyperledger-fabric', 'hyperledger fabric', 'Emerging Tech'),
    ('Solidity', 'solidity', 'solidity', 'Emerging Tech'),
    ('JavaScript', 'javascript', 'javascript', 'Development'),
    ('Java', 'java', 'java', 'Development'),
    ('Node.js', 'node-js', 'node.js', 'Development'),
    ('API', 'api', 'api', 'Development'),
    ('Encryption', 'encryption', 'encryption', 'Security'),
    ('C++', 'c-plus-plus', 'c++', 'Development'),
    ('React', 'react', 'react', 'Development'),
    ('TypeScript', 'typescript', 'typescript', 'Development'),
    ('Web3.js', 'web3-js', 'web3.js', 'Emerging Tech'),
    ('Ethers.js', 'ethers-js', 'ethers.js', 'Emerging Tech')
ON CONFLICT (normalized_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS job_skills (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id),
    display_order INTEGER NOT NULL,
    CONSTRAINT uk_job_skills_job_skill UNIQUE (job_id, skill_id),
    CONSTRAINT uk_job_skills_job_order UNIQUE (job_id, display_order),
    CONSTRAINT chk_job_skills_display_order CHECK (display_order BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON job_skills (job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON job_skills (skill_id);

CREATE TABLE IF NOT EXISTS job_attachments (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    storage_provider VARCHAR(32) NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120),
    file_size_bytes BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    public_url VARCHAR(1024),
    ipfs_cid VARCHAR(255),
    sha256_hash VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_job_attachments_storage_provider CHECK (storage_provider IN ('LOCAL', 'S3', 'IPFS'))
);

CREATE INDEX IF NOT EXISTS idx_job_attachments_job_id ON job_attachments (job_id);
CREATE INDEX IF NOT EXISTS idx_job_attachments_uploaded_by_user_id ON job_attachments (uploaded_by_user_id);

ALTER TABLE jobs
    ALTER COLUMN title TYPE VARCHAR(200),
    ALTER COLUMN description TYPE TEXT,
    ADD COLUMN IF NOT EXISTS scope_size VARCHAR(16),
    ADD COLUMN IF NOT EXISTS scope_duration VARCHAR(24),
    ADD COLUMN IF NOT EXISTS experience_level VARCHAR(24),
    ADD COLUMN IF NOT EXISTS contract_to_hire BOOLEAN,
    ADD COLUMN IF NOT EXISTS budget_type VARCHAR(16),
    ADD COLUMN IF NOT EXISTS hourly_rate_min NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS hourly_rate_max NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS fixed_budget NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS currency_code CHAR(3),
    ADD COLUMN IF NOT EXISTS payment_model VARCHAR(32),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

UPDATE jobs
SET scope_size = COALESCE(scope_size, 'MEDIUM'),
    scope_duration = COALESCE(scope_duration, 'ONE_TO_THREE_MONTHS'),
    experience_level = COALESCE(experience_level, 'INTERMEDIATE'),
    contract_to_hire = COALESCE(contract_to_hire, FALSE),
    budget_type = COALESCE(budget_type, CASE WHEN budget IS NULL OR budget = 0 THEN 'NOT_READY' ELSE 'FIXED' END),
    fixed_budget = COALESCE(fixed_budget, CASE WHEN budget IS NULL OR budget = 0 THEN NULL ELSE ROUND(budget::numeric, 2) END),
    currency_code = COALESCE(currency_code, 'USD'),
    payment_model = COALESCE(payment_model, 'OFF_CHAIN_NEGOTIATED'),
    updated_at = COALESCE(updated_at, created_at),
    published_at = COALESCE(published_at, created_at);

ALTER TABLE jobs
    ALTER COLUMN scope_size SET NOT NULL,
    ALTER COLUMN scope_duration SET NOT NULL,
    ALTER COLUMN experience_level SET NOT NULL,
    ALTER COLUMN contract_to_hire SET NOT NULL,
    ALTER COLUMN budget_type SET NOT NULL,
    ALTER COLUMN currency_code SET NOT NULL,
    ALTER COLUMN payment_model SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE jobs
    DROP COLUMN IF EXISTS budget;

ALTER TABLE jobs
    DROP CONSTRAINT IF EXISTS chk_jobs_scope_size,
    DROP CONSTRAINT IF EXISTS chk_jobs_scope_duration,
    DROP CONSTRAINT IF EXISTS chk_jobs_experience_level,
    DROP CONSTRAINT IF EXISTS chk_jobs_budget_type,
    DROP CONSTRAINT IF EXISTS chk_jobs_payment_model,
    DROP CONSTRAINT IF EXISTS chk_jobs_budget_fields,
    DROP CONSTRAINT IF EXISTS chk_jobs_small_scope_duration,
    ADD CONSTRAINT chk_jobs_scope_size CHECK (scope_size IN ('SMALL', 'MEDIUM', 'LARGE')),
    ADD CONSTRAINT chk_jobs_scope_duration CHECK (scope_duration IN ('LESS_THAN_1_MONTH', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'MORE_THAN_6_MONTHS')),
    ADD CONSTRAINT chk_jobs_experience_level CHECK (experience_level IN ('ENTRY', 'INTERMEDIATE', 'EXPERT')),
    ADD CONSTRAINT chk_jobs_budget_type CHECK (budget_type IN ('HOURLY', 'FIXED', 'NOT_READY')),
    ADD CONSTRAINT chk_jobs_payment_model CHECK (payment_model IN ('OFF_CHAIN_NEGOTIATED', 'ON_CHAIN_ESCROW', 'ON_CHAIN_MILESTONE_ESCROW')),
    ADD CONSTRAINT chk_jobs_budget_fields CHECK (
        (budget_type = 'HOURLY' AND hourly_rate_min IS NOT NULL AND hourly_rate_max IS NOT NULL AND fixed_budget IS NULL AND hourly_rate_min <= hourly_rate_max AND hourly_rate_min >= 0 AND hourly_rate_max >= 0)
        OR
        (budget_type = 'FIXED' AND fixed_budget IS NOT NULL AND hourly_rate_min IS NULL AND hourly_rate_max IS NULL AND fixed_budget >= 0)
        OR
        (budget_type = 'NOT_READY' AND fixed_budget IS NULL AND hourly_rate_min IS NULL AND hourly_rate_max IS NULL)
    ),
    ADD CONSTRAINT chk_jobs_small_scope_duration CHECK (
        NOT (scope_size = 'SMALL' AND scope_duration = 'MORE_THAN_6_MONTHS')
    );

CREATE INDEX IF NOT EXISTS idx_jobs_scope_size ON jobs (scope_size);
CREATE INDEX IF NOT EXISTS idx_jobs_budget_type ON jobs (budget_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs (experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs (published_at DESC);

ALTER TABLE bids
    ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2);

ALTER TABLE payments
    ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2);

ALTER TABLE users
    ALTER COLUMN hourly_rate TYPE NUMERIC(12,2) USING CASE WHEN hourly_rate IS NULL THEN NULL ELSE ROUND(hourly_rate::numeric, 2) END;

COMMIT;
