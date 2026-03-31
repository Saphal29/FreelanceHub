-- ============================================
-- Payments & Escrow System
-- ============================================

-- Drop tables first (in correct order due to FK)
DROP TABLE IF EXISTS escrow CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Payment status enum
DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM ('pending', 'initiated', 'completed', 'failed', 'refunded', 'cancelled');

-- Escrow status enum
DROP TYPE IF EXISTS escrow_status CASCADE;
CREATE TYPE escrow_status AS ENUM ('pending', 'held', 'released', 'refunded', 'disputed');

-- ============================================
-- PAYMENTS TABLE (Khalti transactions)
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NPR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_gateway VARCHAR(50) DEFAULT 'khalti',
    pidx VARCHAR(255),
    purchase_order_id VARCHAR(255) UNIQUE,
    transaction_id VARCHAR(255),
    payment_url TEXT,
    khalti_response JSONB,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- ESCROW TABLE
-- ============================================
CREATE TABLE escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,
    status escrow_status NOT NULL DEFAULT 'pending',
    held_at TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    release_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_pidx ON payments(pidx);
CREATE INDEX idx_payments_purchase_order_id ON payments(purchase_order_id);
CREATE INDEX idx_escrow_contract_id ON escrow(contract_id);
CREATE INDEX idx_escrow_milestone_id ON escrow(milestone_id);
CREATE INDEX idx_escrow_client_id ON escrow(client_id);
CREATE INDEX idx_escrow_status ON escrow(status);

-- ============================================
-- TRIGGER
-- ============================================
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at
    BEFORE UPDATE ON escrow
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
