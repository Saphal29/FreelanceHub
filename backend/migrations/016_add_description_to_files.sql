-- ============================================
-- ADD DESCRIPTION FIELD TO FILES TABLE
-- ============================================

-- Add description column to files table
ALTER TABLE files 
ADD COLUMN description TEXT;

-- Add index for searching descriptions
CREATE INDEX idx_files_description ON files USING gin(to_tsvector('english', description)) 
WHERE description IS NOT NULL;

-- Add comment
COMMENT ON COLUMN files.description IS 'Optional description or notes about the file';
