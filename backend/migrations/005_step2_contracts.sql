-- Step 2: Create contracts table
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
