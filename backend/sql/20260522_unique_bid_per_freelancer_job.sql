CREATE UNIQUE INDEX IF NOT EXISTS ux_bids_job_freelancer
    ON bids (job_id, freelancer_id);
