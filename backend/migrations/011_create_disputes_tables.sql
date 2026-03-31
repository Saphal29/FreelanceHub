-- ============================================
-- DISPUTE RESOLUTION SYSTEM
-- ============================================

-- Dispute Status Enum
CREATE TYPE dispute_status AS ENUM (
    'open',
    'under_review',
    'in_mediation',
    'resolved',
    'closed'
);

-- Dispute Category Enum
CREATE TYPE dispute_category AS ENUM (
    'payment_issue',
    'quality_of_work',
    'missed_deadline',
    'scope_disagreement',
    'communication_issue',
    'contract_breach',
    'other'
);

-- Dispute Resolution Type Enum
CREATE TYPE dispute_resolution_type AS ENUM (
    'release_to_freelancer',
    'refund_to_client',
    'partial_settlement',
    'no_action',
    'other'
);

-- ============================================
-- DISPUTES TABLE
-- ============================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    
    -- Parties involved
    filed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mediator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Dispute details
    category dispute_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount_disputed DECIMAL(12, 2),
    
    -- Status tracking
    status dispute_status NOT NULL DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Resolution
    resolution_type dispute_resolution_type,
    resolution_notes TEXT,
    resolution_amount DECIMAL(12, 2),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- DISPUTE EVIDENCE TABLE
-- ============================================
CREATE TABLE dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DISPUTE MESSAGES TABLE
-- ============================================
CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes for mediators
    attachments JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DISPUTE TIMELINE TABLE (Audit Trail)
-- ============================================
CREATE TABLE dispute_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- filed, status_changed, evidence_added, message_sent, resolved, closed
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_disputes_contract_id ON disputes(contract_id);
CREATE INDEX idx_disputes_project_id ON disputes(project_id);
CREATE INDEX idx_disputes_milestone_id ON disputes(milestone_id);
CREATE INDEX idx_disputes_filed_by ON disputes(filed_by);
CREATE INDEX idx_disputes_respondent_id ON disputes(respondent_id);
CREATE INDEX idx_disputes_mediator_id ON disputes(mediator_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_category ON disputes(category);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);

CREATE INDEX idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);
CREATE INDEX idx_dispute_evidence_uploaded_by ON dispute_evidence(uploaded_by);

CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_sender_id ON dispute_messages(sender_id);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(created_at);

CREATE INDEX idx_dispute_timeline_dispute_id ON dispute_timeline(dispute_id);
CREATE INDEX idx_dispute_timeline_created_at ON dispute_timeline(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispute_messages_updated_at
    BEFORE UPDATE ON dispute_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create timeline entry when dispute is created
CREATE OR REPLACE FUNCTION create_dispute_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO dispute_timeline (dispute_id, user_id, action, description, new_value)
        VALUES (NEW.id, NEW.filed_by, 'filed', 'Dispute filed', NEW.status);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Track status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO dispute_timeline (dispute_id, user_id, action, description, old_value, new_value)
            VALUES (NEW.id, NEW.resolved_by, 'status_changed', 
                    'Status changed from ' || OLD.status || ' to ' || NEW.status,
                    OLD.status, NEW.status);
        END IF;
        
        -- Track mediator assignment
        IF OLD.mediator_id IS DISTINCT FROM NEW.mediator_id AND NEW.mediator_id IS NOT NULL THEN
            INSERT INTO dispute_timeline (dispute_id, user_id, action, description, new_value)
            VALUES (NEW.id, NEW.mediator_id, 'mediator_assigned', 
                    'Mediator assigned to dispute',
                    NEW.mediator_id::TEXT);
        END IF;
        
        -- Track resolution
        IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
            INSERT INTO dispute_timeline (dispute_id, user_id, action, description, new_value, metadata)
            VALUES (NEW.id, NEW.resolved_by, 'resolved', 
                    'Dispute resolved: ' || COALESCE(NEW.resolution_type::TEXT, 'N/A'),
                    NEW.resolution_type::TEXT,
                    jsonb_build_object('resolution_amount', NEW.resolution_amount, 'resolution_notes', NEW.resolution_notes));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dispute_timeline
    AFTER INSERT OR UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION create_dispute_timeline_entry();

-- Create timeline entry when evidence is added
CREATE OR REPLACE FUNCTION create_evidence_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dispute_timeline (dispute_id, user_id, action, description, metadata)
    VALUES (NEW.dispute_id, NEW.uploaded_by, 'evidence_added', 
            'Evidence file uploaded: ' || NEW.file_name,
            jsonb_build_object('file_name', NEW.file_name, 'file_type', NEW.file_type));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evidence_timeline
    AFTER INSERT ON dispute_evidence
    FOR EACH ROW
    EXECUTE FUNCTION create_evidence_timeline_entry();

-- Create timeline entry when message is sent
CREATE OR REPLACE FUNCTION create_message_timeline_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_internal = FALSE THEN
        INSERT INTO dispute_timeline (dispute_id, user_id, action, description)
        VALUES (NEW.dispute_id, NEW.sender_id, 'message_sent', 
                'Message sent in dispute thread');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_message_timeline
    AFTER INSERT ON dispute_messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_timeline_entry();

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Notify when dispute is filed
CREATE OR REPLACE FUNCTION notify_dispute_filed()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify respondent
    INSERT INTO notifications (user_id, type, title, message, related_id, metadata)
    VALUES (
        NEW.respondent_id,
        'dispute_filed',
        'New Dispute Filed',
        'A dispute has been filed against you: ' || NEW.title,
        NEW.id,
        jsonb_build_object('dispute_id', NEW.id, 'contract_id', NEW.contract_id, 'category', NEW.category)
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
        INSERT INTO notifications (user_id, type, title, message, related_id, metadata)
        VALUES (
            NEW.mediator_id,
            'mediator_assigned',
            'Dispute Assigned to You',
            'You have been assigned as mediator for: ' || NEW.title,
            NEW.id,
            jsonb_build_object('dispute_id', NEW.id, 'contract_id', NEW.contract_id)
        );
        
        -- Notify both parties
        INSERT INTO notifications (user_id, type, title, message, related_id, metadata)
        VALUES 
            (NEW.filed_by, 'mediator_assigned', 'Mediator Assigned', 
             'A mediator has been assigned to your dispute', NEW.id,
             jsonb_build_object('dispute_id', NEW.id)),
            (NEW.respondent_id, 'mediator_assigned', 'Mediator Assigned', 
             'A mediator has been assigned to the dispute', NEW.id,
             jsonb_build_object('dispute_id', NEW.id));
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
        INSERT INTO notifications (user_id, type, title, message, related_id, metadata)
        VALUES 
            (NEW.filed_by, 'dispute_resolved', 'Dispute Resolved', 
             'Your dispute has been resolved: ' || NEW.title, NEW.id,
             jsonb_build_object('dispute_id', NEW.id, 'resolution_type', NEW.resolution_type)),
            (NEW.respondent_id, 'dispute_resolved', 'Dispute Resolved', 
             'The dispute has been resolved: ' || NEW.title, NEW.id,
             jsonb_build_object('dispute_id', NEW.id, 'resolution_type', NEW.resolution_type));
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
        SELECT filed_by, respondent_id, mediator_id INTO dispute_record
        FROM disputes WHERE id = NEW.dispute_id;
        
        -- Notify all parties except sender
        INSERT INTO notifications (user_id, type, title, message, related_id, metadata)
        SELECT 
            user_id,
            'dispute_message',
            'New Dispute Message',
            'New message in dispute thread',
            NEW.dispute_id,
            jsonb_build_object('dispute_id', NEW.dispute_id, 'message_id', NEW.id)
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
