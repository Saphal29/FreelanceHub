-- ============================================
-- Create Tables One by One - Run Each Section Separately
-- ============================================

-- STEP 1: Add columns to existing tables first
-- Copy and run this section first:

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
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- ============================================

-- STEP 2: Add columns to client_profiles
-- Copy and run this section second:

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
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(50) DEFAULT 'email';

-- ============================================

-- STEP 3: Create freelancer_skills table
-- Copy and run this section third:

CREATE TABLE freelancer_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 4: Create portfolio_items table
-- Copy and run this section fourth:

CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL,
    project_url VARCHAR(500),
    image_urls TEXT[],
    technologies_used TEXT[],
    client_name VARCHAR(255),
    project_duration_months INTEGER,
    budget_range VARCHAR(50),
    completion_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 5: Create freelancer_experience table
-- Copy and run this section fifth:

CREATE TABLE freelancer_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255),
    location VARCHAR(255),
    employment_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[],
    skills_used TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 6: Create freelancer_education table
-- Copy and run this section sixth:

CREATE TABLE freelancer_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    institution_name VARCHAR(255) NOT NULL,
    degree_title VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    education_level VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    gpa DECIMAL(3, 2),
    description TEXT,
    achievements TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 7: Create payment_methods table
-- Copy and run this section seventh:

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100),
    provider_account_id VARCHAR(255),
    account_holder_name VARCHAR(255),
    last_four_digits VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    billing_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 8: Create user_preferences table
-- Copy and run this section eighth:

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    project_updates BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- STEP 9: Create indexes (run this last)
-- Copy and run this section last:

CREATE INDEX idx_freelancer_skills_freelancer_id ON freelancer_skills(freelancer_id);
CREATE INDEX idx_portfolio_items_freelancer_id ON portfolio_items(freelancer_id);
CREATE INDEX idx_freelancer_experience_freelancer_id ON freelancer_experience(freelancer_id);
CREATE INDEX idx_freelancer_education_freelancer_id ON freelancer_education(freelancer_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);