-- ============================================
-- FILE MANAGEMENT SYSTEM
-- ============================================

-- File Category Enum
CREATE TYPE file_category AS ENUM (
    'profile_avatar',
    'profile_document',
    'project_attachment',
    'milestone_attachment',
    'proposal_attachment',
    'dispute_evidence',
    'chat_attachment',
    'contract_document',
    'other'
);

-- File Status Enum
CREATE TYPE file_status AS ENUM (
    'active',
    'deleted',
    'expired'
);

-- ============================================
-- FILES TABLE
-- ============================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File information
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- File metadata
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    file_extension VARCHAR(10),
    
    -- Categorization
    category file_category NOT NULL,
    status file_status DEFAULT 'active',
    
    -- Ownership
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Related entities (optional - for tracking)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES project_proposals(id) ON DELETE SET NULL,
    dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL,
    
    -- Security
    is_public BOOLEAN DEFAULT FALSE,
    access_token VARCHAR(255), -- For temporary secure links
    token_expires_at TIMESTAMP,
    
    -- Virus scan (optional)
    is_scanned BOOLEAN DEFAULT FALSE,
    scan_status VARCHAR(20), -- clean, infected, pending
    scan_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    expires_at TIMESTAMP -- For temporary files
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_project_id ON files(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_files_contract_id ON files(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_files_milestone_id ON files(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX idx_files_proposal_id ON files(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX idx_files_dispute_id ON files(dispute_id) WHERE dispute_id IS NOT NULL;
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_expires_at ON files(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to soft delete files
CREATE OR REPLACE FUNCTION soft_delete_file(file_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE files
    SET status = 'deleted',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = file_uuid AND status = 'active';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE files
    SET status = 'expired',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND status = 'active';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE(
    total_files BIGINT,
    total_size BIGINT,
    size_by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        jsonb_object_agg(
            category,
            jsonb_build_object(
                'count', count,
                'size', size
            )
        ) as size_by_category
    FROM (
        SELECT 
            category,
            COUNT(*) as count,
            SUM(file_size) as size
        FROM files
        WHERE uploaded_by = user_uuid 
        AND status = 'active'
        GROUP BY category
    ) category_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Ensure file size is positive
ALTER TABLE files ADD CONSTRAINT check_file_size_positive 
    CHECK (file_size > 0);

-- Ensure expires_at is in the future when set
ALTER TABLE files ADD CONSTRAINT check_expires_at_future 
    CHECK (expires_at IS NULL OR expires_at > created_at);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE files IS 'Centralized file management for all uploaded files';
COMMENT ON COLUMN files.stored_name IS 'Unique filename stored on disk (UUID-based)';
COMMENT ON COLUMN files.file_path IS 'Relative path from uploads directory';
COMMENT ON COLUMN files.file_url IS 'Full URL to access the file';
COMMENT ON COLUMN files.access_token IS 'Token for temporary secure file access';
COMMENT ON COLUMN files.is_public IS 'Whether file can be accessed without authentication';
COMMENT ON COLUMN files.expires_at IS 'When temporary files should be deleted';
