-- ============================================
-- Add user status column for account suspension
-- ============================================

-- Create user status enum
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

-- Add status column to users table
ALTER TABLE users 
ADD COLUMN status user_status DEFAULT 'active',
ADD COLUMN suspension_reason TEXT,
ADD COLUMN suspended_at TIMESTAMP,
ADD COLUMN suspended_by UUID REFERENCES users(id);

-- Create index for faster status lookups
CREATE INDEX idx_users_status ON users(status);

-- Update existing users to have active status
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, or deleted';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for account suspension';
COMMENT ON COLUMN users.suspended_at IS 'Timestamp when account was suspended';
COMMENT ON COLUMN users.suspended_by IS 'Admin user ID who suspended the account';
