-- ============================================
-- Time Tracking System
-- ============================================

-- Drop tables first
DROP TABLE IF EXISTS time_entries CASCADE;

-- Time entry status enum
DROP TYPE IF EXISTS time_entry_status CASCADE;
CREATE TYPE time_entry_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'disputed');

-- ============================================
-- TIME ENTRIES TABLE
-- ============================================
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    hourly_rate DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    is_billable BOOLEAN DEFAULT TRUE,
    is_manual BOOLEAN DEFAULT FALSE,
    status time_entry_status DEFAULT 'draft',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_time_entries_contract_id ON time_entries(contract_id);
CREATE INDEX idx_time_entries_freelancer_id ON time_entries(freelancer_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_is_billable ON time_entries(is_billable);

-- ============================================
-- CONSTRAINTS
-- ============================================
-- Ensure end_time is after start_time
ALTER TABLE time_entries ADD CONSTRAINT check_time_order 
    CHECK (end_time IS NULL OR end_time > start_time);

-- Ensure duration matches time range when both exist
ALTER TABLE time_entries ADD CONSTRAINT check_duration_consistency
    CHECK (
        (end_time IS NULL AND duration_minutes IS NULL) OR
        (end_time IS NOT NULL AND duration_minutes IS NOT NULL)
    );

-- ============================================
-- TRIGGER
-- ============================================
CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Calculate duration and amount before insert/update
-- ============================================
CREATE OR REPLACE FUNCTION calculate_time_entry_values()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Calculate duration if end_time is set
    IF NEW.end_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    
    -- Calculate total amount if duration and rate exist
    IF NEW.duration_minutes IS NOT NULL AND NEW.hourly_rate IS NOT NULL AND NEW.is_billable THEN
        NEW.total_amount := (NEW.duration_minutes / 60.0) * NEW.hourly_rate;
    ELSE
        NEW.total_amount := 0;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_time_entry_values_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_entry_values();

-- ============================================
-- FUNCTION: Prevent multiple active timers per user
-- ============================================
CREATE OR REPLACE FUNCTION check_active_timer()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- Only check for non-manual entries with no end_time (active timers)
    IF NEW.is_manual = FALSE AND NEW.end_time IS NULL THEN
        SELECT COUNT(*) INTO active_count
        FROM time_entries
        WHERE freelancer_id = NEW.freelancer_id
          AND end_time IS NULL
          AND is_manual = FALSE
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF active_count > 0 THEN
            RAISE EXCEPTION 'User already has an active timer running';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_active_timer_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION check_active_timer();
