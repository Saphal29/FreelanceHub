-- ============================================
-- Milestone Submission & Approval Enhancement
-- ============================================

-- Add new fields to project_milestones table for submission workflow
ALTER TABLE project_milestones
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS submission_notes TEXT,
ADD COLUMN IF NOT EXISTS submission_attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_tracked INTEGER DEFAULT 0; -- in minutes

-- Create milestone submissions table for tracking submission history
CREATE TABLE IF NOT EXISTS milestone_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    time_entries_snapshot JSONB DEFAULT '[]'::jsonb, -- Snapshot of time entries at submission
    total_hours DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, revision_requested
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create milestone revisions table for tracking revision requests
CREATE TABLE IF NOT EXISTS milestone_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES milestone_submissions(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revision_notes TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_milestone_submissions_milestone_id ON milestone_submissions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_submissions_submitted_by ON milestone_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_milestone_submissions_status ON milestone_submissions(status);
CREATE INDEX IF NOT EXISTS idx_milestone_revisions_milestone_id ON milestone_revisions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_revisions_submission_id ON milestone_revisions(submission_id);
CREATE INDEX IF NOT EXISTS idx_milestone_revisions_resolved ON milestone_revisions(resolved);

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_milestone_submissions_updated_at
    BEFORE UPDATE ON milestone_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestone_revisions_updated_at
    BEFORE UPDATE ON milestone_revisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update milestone status based on submission
CREATE OR REPLACE FUNCTION update_milestone_on_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Update milestone status to under_review when submitted
    UPDATE project_milestones
    SET 
        status = 'under_review',
        submitted_at = NEW.created_at,
        submitted_by = NEW.submitted_by,
        submission_notes = NEW.submission_notes,
        submission_attachments = NEW.attachments,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.milestone_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_milestone_on_submission
    AFTER INSERT ON milestone_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_on_submission();

-- Function to update milestone status on approval/rejection
CREATE OR REPLACE FUNCTION update_milestone_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status changed to approved or rejected
    IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
        UPDATE project_milestones
        SET 
            status = CASE 
                WHEN NEW.status = 'approved' THEN 'completed'::milestone_status
                WHEN NEW.status = 'rejected' THEN 'in_progress'::milestone_status
                ELSE status
            END,
            reviewed_at = NEW.reviewed_at,
            reviewed_by = NEW.reviewed_by,
            review_notes = NEW.review_notes,
            completed_at = CASE WHEN NEW.status = 'approved' THEN NEW.reviewed_at ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.milestone_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_milestone_on_review
    AFTER UPDATE ON milestone_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_on_review();

-- Function to increment revision count
CREATE OR REPLACE FUNCTION increment_milestone_revision_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE project_milestones
    SET 
        revision_count = revision_count + 1,
        status = 'in_progress'::milestone_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.milestone_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_revision_count
    AFTER INSERT ON milestone_revisions
    FOR EACH ROW
    EXECUTE FUNCTION increment_milestone_revision_count();
