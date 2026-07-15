BEGIN;

ALTER TABLE job_skills
    ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS normalized_skill_name VARCHAR(100);

ALTER TABLE job_skills
    DROP CONSTRAINT IF EXISTS uk_job_skills_job_skill,
    ALTER COLUMN skill_id DROP NOT NULL;

DROP INDEX IF EXISTS uk_job_skills_job_skill;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'skills'
          AND column_name = 'skill_type'
    ) THEN
        UPDATE job_skills job_skill
        SET skill_name = skill.name,
            normalized_skill_name = skill.normalized_name
        FROM skills skill
        WHERE job_skill.skill_id = skill.id
          AND skill.skill_type = 'CUSTOM'
          AND (job_skill.skill_name IS NULL OR job_skill.normalized_skill_name IS NULL);

        UPDATE job_skills job_skill
        SET skill_id = NULL
        FROM skills skill
        WHERE job_skill.skill_id = skill.id
          AND skill.skill_type = 'CUSTOM';

        DELETE FROM skill_taxonomy_assignments assignment
        USING skills skill
        WHERE assignment.skill_id = skill.id
          AND skill.skill_type = 'CUSTOM';

        DELETE FROM skills
        WHERE skill_type = 'CUSTOM';
    END IF;
END $$;

ALTER TABLE job_skills
    DROP CONSTRAINT IF EXISTS chk_job_skills_skill_reference,
    ADD CONSTRAINT chk_job_skills_skill_reference CHECK (
        (
            skill_id IS NOT NULL
            AND skill_name IS NULL
            AND normalized_skill_name IS NULL
        )
        OR
        (
            skill_id IS NULL
            AND skill_name IS NOT NULL
            AND normalized_skill_name IS NOT NULL
            AND btrim(skill_name) <> ''
            AND btrim(normalized_skill_name) <> ''
        )
    );

CREATE UNIQUE INDEX IF NOT EXISTS uk_job_skills_job_skill_builtin
    ON job_skills (job_id, skill_id)
    WHERE skill_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_job_skills_job_skill_custom_name
    ON job_skills (job_id, normalized_skill_name)
    WHERE skill_id IS NULL;

DROP INDEX IF EXISTS idx_skills_skill_type;

ALTER TABLE skills
    DROP CONSTRAINT IF EXISTS chk_skills_skill_type,
    DROP COLUMN IF EXISTS skill_type;

COMMIT;
