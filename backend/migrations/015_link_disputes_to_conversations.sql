-- ============================================
-- Link Disputes to Conversations
-- ============================================

-- Add dispute_id to conversations table
ALTER TABLE conversations
ADD COLUMN dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE;

-- Create index for dispute_id
CREATE INDEX idx_conversations_dispute_id ON conversations(dispute_id);

-- Add unique constraint to ensure one conversation per dispute
CREATE UNIQUE INDEX idx_conversations_dispute_id_unique ON conversations(dispute_id) WHERE dispute_id IS NOT NULL;

COMMENT ON COLUMN conversations.dispute_id IS 'Links conversation to a dispute for dispute messaging';
