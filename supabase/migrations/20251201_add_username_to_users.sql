-- Add username column to users table
-- This allows users to login with either username or email

ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comment to explain the column
COMMENT ON COLUMN users.username IS 'Optional username for login. Users can login with either username or email.';
