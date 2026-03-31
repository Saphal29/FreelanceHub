-- ============================================
-- FIX DISPUTE NOTIFICATION TRIGGERS
-- ============================================
-- This fixes the notification triggers to use the correct columns
-- that exist in the notifications table

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS trigger_notify_dispute_filed ON disputes;
DROP TRIGGER IF EXISTS trigger_notify_mediator_assigned ON disputes;
DROP TRIGGER IF EXISTS trigger_notify_dispute_resolved ON disputes;
DROP TRIGGER IF EXISTS trigger_notify_dispute_message ON dispute_messages;

DROP FUNCTION IF EXISTS notify_dispute_filed();
DROP FUNCTION IF EXISTS notify_mediator_assigned();
DROP FUNCTION IF EXISTS notify_dispute_resolved();
DROP FUNCTION IF EXISTS notify_dispute_message();

-- Notify when dispute is filed
CREATE OR REPLACE FUNCTION notify_dispute_filed()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify respondent
    INSERT INTO notifications (user_id, type, title, message, contract_id, project_id)
    VALUES (
        NEW.respondent_id,
        'dispute_filed',
        'New Dispute Filed',
        'A dispute has been filed against you: ' || NEW.title,
        NEW.contract_id,
        NEW.project_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_dispute_filed
    AFTER INSERT ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION notify_dispute_filed();

-- Notify when mediator is assigned
CREATE OR REPLACE FUNCTION notify_mediator_assigned()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.mediator_id IS DISTINCT FROM NEW.mediator_id AND NEW.mediator_id IS NOT NULL THEN
        -- Notify mediator
        INSERT INTO notifications (user_id, type, title, message, contract_id, project_id)
        VALUES (
            NEW.mediator_id,
            'mediator_assigned',
            'Dispute Assigned to You',
            'You have been assigned as mediator for: ' || NEW.title,
            NEW.contract_id,
            NEW.project_id
        );
        
        -- Notify both parties
        INSERT INTO notifications (user_id, type, title, message, contract_id, project_id)
        VALUES 
            (NEW.filed_by, 'mediator_assigned', 'Mediator Assigned', 
             'A mediator has been assigned to your dispute',
             NEW.contract_id, NEW.project_id),
            (NEW.respondent_id, 'mediator_assigned', 'Mediator Assigned', 
             'A mediator has been assigned to the dispute',
             NEW.contract_id, NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_mediator_assigned
    AFTER UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION notify_mediator_assigned();

-- Notify when dispute is resolved
CREATE OR REPLACE FUNCTION notify_dispute_resolved()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
        -- Notify both parties
        INSERT INTO notifications (user_id, type, title, message, contract_id, project_id)
        VALUES 
            (NEW.filed_by, 'dispute_resolved', 'Dispute Resolved', 
             'Your dispute has been resolved: ' || NEW.title,
             NEW.contract_id, NEW.project_id),
            (NEW.respondent_id, 'dispute_resolved', 'Dispute Resolved', 
             'The dispute has been resolved: ' || NEW.title,
             NEW.contract_id, NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_dispute_resolved
    AFTER UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION notify_dispute_resolved();

-- Notify when new message is sent
CREATE OR REPLACE FUNCTION notify_dispute_message()
RETURNS TRIGGER AS $$
DECLARE
    dispute_record RECORD;
BEGIN
    IF NEW.is_internal = FALSE THEN
        SELECT filed_by, respondent_id, mediator_id, contract_id, project_id 
        INTO dispute_record
        FROM disputes WHERE id = NEW.dispute_id;
        
        -- Notify all parties except sender
        INSERT INTO notifications (user_id, type, title, message, contract_id, project_id)
        SELECT 
            user_id,
            'dispute_message',
            'New Dispute Message',
            'New message in dispute thread',
            dispute_record.contract_id,
            dispute_record.project_id
        FROM (
            SELECT dispute_record.filed_by AS user_id
            UNION
            SELECT dispute_record.respondent_id
            UNION
            SELECT dispute_record.mediator_id WHERE dispute_record.mediator_id IS NOT NULL
        ) AS parties
        WHERE user_id != NEW.sender_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_dispute_message
    AFTER INSERT ON dispute_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_dispute_message();
