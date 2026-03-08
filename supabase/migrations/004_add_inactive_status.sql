-- Add 'inactive' to the user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'inactive';
