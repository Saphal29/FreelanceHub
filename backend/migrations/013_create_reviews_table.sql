-- ============================================
-- REVIEW & RATING SYSTEM
-- ============================================

-- Review Type Enum
CREATE TYPE review_type AS ENUM (
    'client_to_freelancer',
    'freelancer_to_client'
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Parties involved
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_type review_type NOT NULL,
    
    -- Overall rating (1-5 stars)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Category ratings (1-5 stars each)
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    
    -- Written feedback
    feedback TEXT NOT NULL,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    flagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    flagged_at TIMESTAMP,
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_reason TEXT,
    
    -- Response from reviewee
    response TEXT,
    response_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one review per contract per direction
    UNIQUE(contract_id, reviewer_id, reviewee_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_reviews_contract_id ON reviews(contract_id);
CREATE INDEX idx_reviews_project_id ON reviews(project_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX idx_reviews_hidden ON reviews(is_hidden);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR RATING CALCULATIONS
-- ============================================

-- Function to calculate average rating for a user
CREATE OR REPLACE FUNCTION calculate_user_average_rating(user_uuid UUID)
RETURNS TABLE(
    average_rating NUMERIC,
    total_reviews BIGINT,
    avg_communication NUMERIC,
    avg_quality NUMERIC,
    avg_timeliness NUMERIC,
    avg_professionalism NUMERIC,
    rating_5_count BIGINT,
    rating_4_count BIGINT,
    rating_3_count BIGINT,
    rating_2_count BIGINT,
    rating_1_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(overall_rating), 2) as average_rating,
        COUNT(*) as total_reviews,
        ROUND(AVG(communication_rating), 2) as avg_communication,
        ROUND(AVG(quality_rating), 2) as avg_quality,
        ROUND(AVG(timeliness_rating), 2) as avg_timeliness,
        ROUND(AVG(professionalism_rating), 2) as avg_professionalism,
        COUNT(*) FILTER (WHERE overall_rating = 5) as rating_5_count,
        COUNT(*) FILTER (WHERE overall_rating = 4) as rating_4_count,
        COUNT(*) FILTER (WHERE overall_rating = 3) as rating_3_count,
        COUNT(*) FILTER (WHERE overall_rating = 2) as rating_2_count,
        COUNT(*) FILTER (WHERE overall_rating = 1) as rating_1_count
    FROM reviews
    WHERE reviewee_id = user_uuid
    AND is_hidden = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Notify when review is submitted
CREATE OR REPLACE FUNCTION notify_review_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify reviewee
    INSERT INTO notifications (user_id, type, title, message, contract_id)
    VALUES (
        NEW.reviewee_id,
        'review_received',
        'New Review Received',
        'You have received a new review',
        NEW.contract_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_review_submitted
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_review_submitted();

-- Notify when review is responded to
CREATE OR REPLACE FUNCTION notify_review_response()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.response IS NULL AND NEW.response IS NOT NULL THEN
        -- Notify original reviewer
        INSERT INTO notifications (user_id, type, title, message, contract_id)
        VALUES (
            NEW.reviewer_id,
            'review_response',
            'Review Response',
            'The user you reviewed has responded to your review',
            NEW.contract_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_review_response
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_review_response();

-- ============================================
-- ADD RATING FIELDS TO USER PROFILES
-- ============================================

-- Add rating summary to freelancer profiles
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add rating summary to client profiles
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- ============================================
-- FUNCTION TO UPDATE PROFILE RATINGS
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_ratings()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
    rating_stats RECORD;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = NEW.reviewee_id;
    
    -- Calculate ratings
    SELECT * INTO rating_stats FROM calculate_user_average_rating(NEW.reviewee_id);
    
    -- Update appropriate profile table
    IF user_role = 'FREELANCER' THEN
        UPDATE freelancer_profiles
        SET average_rating = rating_stats.average_rating,
            total_reviews = rating_stats.total_reviews
        WHERE user_id = NEW.reviewee_id;
    ELSIF user_role = 'CLIENT' THEN
        UPDATE client_profiles
        SET average_rating = rating_stats.average_rating,
            total_reviews = rating_stats.total_reviews
        WHERE user_id = NEW.reviewee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile ratings when review is added/updated
CREATE TRIGGER trigger_update_profile_ratings
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_ratings();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Note: Sample data would be added after contracts are completed
-- This is just a template for reference

/*
INSERT INTO reviews (
    contract_id, project_id, reviewer_id, reviewee_id, review_type,
    overall_rating, communication_rating, quality_rating, timeliness_rating, professionalism_rating,
    feedback
) VALUES (
    'contract-uuid',
    'project-uuid',
    'reviewer-uuid',
    'reviewee-uuid',
    'client_to_freelancer',
    5,
    5,
    5,
    5,
    5,
    'Excellent work! Highly recommended.'
);
*/
