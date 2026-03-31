-- Add missing columns to freelancer_profiles
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;

-- Add missing columns to client_profiles
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(50);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS total_projects_posted INTEGER DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS total_amount_spent DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;