-- Enforce a single payment (escrow record) per job at the database level.
-- The application guards double-hire via the job's OPEN status check, but that
-- is a read-check-then-write with no row lock; this unique index makes a
-- concurrent second acceptBid fail fast (DataIntegrityViolationException)
-- instead of inserting a duplicate ESCROWED payment. Mirrors the bids index in
-- 20260522_unique_bid_per_freelancer_job.sql.
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_job
    ON payments (job_id);
