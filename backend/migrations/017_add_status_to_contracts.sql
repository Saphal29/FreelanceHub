-- Add missing status column to contracts table if it doesn't exist
-- This fixes production database that was created before status column was added

-- First, ensure the contract_status enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
        CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled', 'disputed');
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'status'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN status contract_status NOT NULL DEFAULT 'draft';
        
        RAISE NOTICE 'Added status column to contracts table';
    ELSE
        RAISE NOTICE 'Status column already exists in contracts table';
    END IF;
END $$;

-- Create index on status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contracts' AND indexname = 'idx_contracts_status'
    ) THEN
        CREATE INDEX idx_contracts_status ON contracts(status);
        RAISE NOTICE 'Created index on contracts.status';
    ELSE
        RAISE NOTICE 'Index on contracts.status already exists';
    END IF;
END $$;
