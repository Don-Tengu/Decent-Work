BEGIN;

ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS skill_type VARCHAR(16),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN,
    ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT REFERENCES users(id);

UPDATE skills
SET skill_type = COALESCE(skill_type, 'PLATFORM'),
    is_verified = COALESCE(is_verified, TRUE);

ALTER TABLE skills
    ALTER COLUMN skill_type SET NOT NULL,
    ALTER COLUMN is_verified SET NOT NULL;

ALTER TABLE skills
    DROP CONSTRAINT IF EXISTS chk_skills_skill_type,
    ADD CONSTRAINT chk_skills_skill_type CHECK (skill_type IN ('PLATFORM', 'CUSTOM'));

CREATE INDEX IF NOT EXISTS idx_skills_skill_type ON skills (skill_type);
CREATE INDEX IF NOT EXISTS idx_skills_created_by_user_id ON skills (created_by_user_id);

CREATE TABLE IF NOT EXISTS skill_taxonomy_nodes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    level VARCHAR(16) NOT NULL,
    parent_id BIGINT REFERENCES skill_taxonomy_nodes(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_skill_taxonomy_nodes_slug UNIQUE (slug),
    CONSTRAINT uk_skill_taxonomy_nodes_normalized_name UNIQUE (normalized_name),
    CONSTRAINT chk_skill_taxonomy_nodes_level CHECK (level IN ('CATEGORY', 'SUBCATEGORY', 'SPECIALTY'))
);

CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_nodes_parent_id ON skill_taxonomy_nodes (parent_id);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_nodes_level ON skill_taxonomy_nodes (level);

CREATE TABLE IF NOT EXISTS skill_taxonomy_assignments (
    id BIGSERIAL PRIMARY KEY,
    taxonomy_node_id BIGINT NOT NULL REFERENCES skill_taxonomy_nodes(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT uk_skill_taxonomy_assignments_node_skill UNIQUE (taxonomy_node_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_assignments_node_id ON skill_taxonomy_assignments (taxonomy_node_id);
CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_assignments_skill_id ON skill_taxonomy_assignments (skill_id);

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
VALUES
    ('Engineering & Technology', 'engineering-technology', 'engineering & technology', 'CATEGORY', NULL, 1),
    ('Security & Privacy', 'security-privacy', 'security & privacy', 'CATEGORY', NULL, 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Blockchain & Web3', 'blockchain-web3', 'blockchain & web3', 'SUBCATEGORY', id, 1
FROM skill_taxonomy_nodes
WHERE slug = 'engineering-technology'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Software Development', 'software-development', 'software development', 'SUBCATEGORY', id, 2
FROM skill_taxonomy_nodes
WHERE slug = 'engineering-technology'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Applied Cryptography', 'applied-cryptography', 'applied cryptography', 'SUBCATEGORY', id, 1
FROM skill_taxonomy_nodes
WHERE slug = 'security-privacy'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Blockchain Development', 'taxonomy-blockchain-development', 'taxonomy blockchain development', 'SPECIALTY', id, 1
FROM skill_taxonomy_nodes
WHERE slug = 'blockchain-web3'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Smart Contract Development', 'smart-contract-development', 'smart contract development', 'SPECIALTY', id, 2
FROM skill_taxonomy_nodes
WHERE slug = 'blockchain-web3'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Blockchain Architecture', 'taxonomy-blockchain-architecture', 'taxonomy blockchain architecture', 'SPECIALTY', id, 3
FROM skill_taxonomy_nodes
WHERE slug = 'blockchain-web3'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Backend & API Development', 'backend-api-development', 'backend api development', 'SPECIALTY', id, 1
FROM skill_taxonomy_nodes
WHERE slug = 'software-development'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Frontend Development', 'frontend-development', 'frontend development', 'SPECIALTY', id, 2
FROM skill_taxonomy_nodes
WHERE slug = 'software-development'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_nodes (name, slug, normalized_name, level, parent_id, display_order)
SELECT 'Cryptography Engineering', 'cryptography-engineering', 'cryptography engineering', 'SPECIALTY', id, 1
FROM skill_taxonomy_nodes
WHERE slug = 'applied-cryptography'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('Blockchain', 'Blockchain Development', 'Ethereum', 'Bitcoin', 'Cryptocurrency', 'Initial Coin Offering', 'Distributed Ledger Technology', 'Hyperledger Fabric', 'Web3.js', 'Ethers.js')
WHERE node.slug = 'taxonomy-blockchain-development'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('Smart Contract', 'Solidity', 'Ethereum', 'Ethers.js')
WHERE node.slug = 'smart-contract-development'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('Blockchain Architecture', 'Distributed Ledger Technology', 'Hyperledger Fabric', 'Blockchain')
WHERE node.slug = 'taxonomy-blockchain-architecture'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('Java', 'Node.js', 'API', 'JavaScript', 'TypeScript')
WHERE node.slug = 'backend-api-development'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('React', 'JavaScript', 'TypeScript')
WHERE node.slug = 'frontend-development'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

INSERT INTO skill_taxonomy_assignments (taxonomy_node_id, skill_id)
SELECT node.id, skill.id
FROM skill_taxonomy_nodes node
JOIN skills skill ON skill.name IN ('Cryptography', 'Encryption', 'C++')
WHERE node.slug = 'cryptography-engineering'
ON CONFLICT (taxonomy_node_id, skill_id) DO NOTHING;

COMMIT;
