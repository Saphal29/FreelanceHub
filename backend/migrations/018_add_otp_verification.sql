-- Add OTP verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;

-- Add index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_otp ON users(verification_otp) WHERE verification_otp IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.verification_otp IS 'Six-digit OTP for email verification';
COMMENT ON COLUMN users.otp_expires_at IS 'Expiration timestamp for OTP (10 minutes from generation)';
COMMENT ON COLUMN users.otp_attempts IS 'Number of failed OTP verification attempts';
