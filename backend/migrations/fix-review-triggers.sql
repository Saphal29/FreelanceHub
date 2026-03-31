-- Fix review notification triggers to use existing notification columns

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_notify_review_submitted ON reviews;
DROP TRIGGER IF EXISTS trigger_notify_review_response ON reviews;

-- Drop existing functions
DROP FUNCTION IF EXISTS notify_review_submitted();
DROP FUNCTION IF EXISTS notify_review_response();

-- Recreate functions with correct columns
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

-- Recreate triggers
CREATE TRIGGER trigger_notify_review_submitted
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_review_submitted();

CREATE TRIGGER trigger_notify_review_response
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_review_response();
