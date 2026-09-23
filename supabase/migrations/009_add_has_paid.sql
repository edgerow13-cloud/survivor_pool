-- Commissioner-only flag for tracking who has paid the pool buy-in.
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_paid boolean NOT NULL DEFAULT false;
