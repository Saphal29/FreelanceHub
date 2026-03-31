-- ============================================
-- Contracts and Notifications System
-- ============================================

-- Create ENUM types for contracts (drop if exists first)
DROP TYPE IF EXISTS contract_status CASCADE;
CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled', 'disputed');

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreed_budget DECIMAL(12, 2) NOT NULL,
    agreed_timeline VARCHAR(100),
    payment_terms TEXT,
    deliverables TEXT,
    status contract_status NOT NULL DEFAULT 'draft',
    signed_by_client BOOLEAN DEFAULT FALSE,
    signed_by_freelancer BOOLEAN DEFAULT FALSE,
    client_signed_at TIMESTAMP,
    freelancer_signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT unique_proposal_contract UNIQUE(proposal_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    type VARCHAR(50) NOT NULL, -- proposal_received, proposal_accepted, contract_created, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities (optional)
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES project_proposals(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Contracts indexes
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_project_id ON notifications(project_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR AUTOMATIC NOTIFICATIONS
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_project_id UUID DEFAULT NULL,
    p_proposal_id UUID DEFAULT NULL,
    p_contract_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, project_id, proposal_id, contract_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_project_id, p_proposal_id, p_contract_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on proposal submission
CREATE OR REPLACE FUNCTION notify_proposal_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify client
    PERFORM create_notification(
        (SELECT client_id FROM projects WHERE id = NEW.project_id),
        'proposal_received',
        'New Proposal Received',
        'You have received a new proposal for your project',
        NEW.project_id,
        NEW.id,
        NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_proposal_submitted
    AFTER INSERT ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_submitted();

-- Function to notify on proposal status change
CREATE OR REPLACE FUNCTION notify_proposal_status_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Notify freelancer
        PERFORM create_notification(
            NEW.freelancer_id,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'proposal_accepted'
                WHEN NEW.status = 'rejected' THEN 'proposal_rejected'
                ELSE 'proposal_updated'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Proposal Accepted!'
                WHEN NEW.status = 'rejected' THEN 'Proposal Rejected'
                ELSE 'Proposal Updated'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Congratulations! Your proposal has been accepted.'
                WHEN NEW.status = 'rejected' THEN 'Your proposal was not selected this time.'
                ELSE 'Your proposal status has been updated.'
            END,
            NEW.project_id,
            NEW.id,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_proposal_status_changed
    AFTER UPDATE ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_proposal_status_changed();

-- Function to notify on contract creation
CREATE OR REPLACE FUNCTION notify_contract_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify both client and freelancer
    PERFORM create_notification(
        NEW.client_id,
        'contract_created',
        'Contract Created',
        'A new contract has been created for your project',
        NEW.project_id,
        NEW.proposal_id,
        NEW.id
    );
    
    PERFORM create_notification(
        NEW.freelancer_id,
        'contract_created',
        'Contract Ready for Signature',
        'Please review and sign the contract to start working',
        NEW.project_id,
        NEW.proposal_id,
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_contract_created
    AFTER INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION notify_contract_created();
