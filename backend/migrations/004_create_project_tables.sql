-- ============================================
-- Project Management System Database Schema
-- ============================================

-- Create ENUM types for project management
CREATE TYPE project_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled', 'archived');
CREATE TYPE project_type AS ENUM ('fixed_price', 'hourly');
CREATE TYPE experience_level AS ENUM ('entry_level', 'intermediate', 'expert');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'under_review', 'completed', 'cancelled');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    skills TEXT[] NOT NULL, -- Array of required skills
    
    -- Budget and pricing
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    project_type project_type NOT NULL DEFAULT 'fixed_price',
    hourly_rate DECIMAL(10, 2), -- For hourly projects
    
    -- Timeline
    duration_estimate VARCHAR(100), -- e.g., "2-3 months", "1 week"
    deadline DATE,
    
    -- Project settings
    status project_status NOT NULL DEFAULT 'draft',
    experience_level experience_level NOT NULL DEFAULT 'intermediate',
    visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- public, private, invite_only
    
    -- Location and remote work
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    proposals_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- PROJECT MILESTONES TABLE
-- ============================================
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE,
    status milestone_status NOT NULL DEFAULT 'pending',
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- PROJECT INVITATIONS TABLE
-- ============================================
CREATE TABLE project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT,
    status invitation_status NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    responded_at TIMESTAMP,
    
    -- Ensure unique invitation per project-freelancer pair
    UNIQUE(project_id, freelancer_id)
);

-- ============================================
-- PROJECT PROPOSALS TABLE
-- ============================================
CREATE TABLE project_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Proposal content
    cover_letter TEXT NOT NULL,
    proposed_budget DECIMAL(12, 2),
    proposed_timeline VARCHAR(100),
    
    -- Status and metadata
    status proposal_status NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique proposal per project-freelancer pair
    UNIQUE(project_id, freelancer_id)
);

-- ============================================
-- PROJECT CATEGORIES TABLE (for better organization)
-- ============================================
CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name for frontend
    parent_id UUID REFERENCES project_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECT ATTACHMENTS TABLE
-- ============================================
CREATE TABLE project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECT SAVED/BOOKMARKS TABLE
-- ============================================
CREATE TABLE project_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique bookmark per project-user pair
    UNIQUE(project_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Projects indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills);
CREATE INDEX idx_projects_location ON projects(location);
CREATE INDEX idx_projects_featured ON projects(featured) WHERE featured = TRUE;

-- Milestones indexes
CREATE INDEX idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_due_date ON project_milestones(due_date);

-- Invitations indexes
CREATE INDEX idx_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_invitations_freelancer_id ON project_invitations(freelancer_id);
CREATE INDEX idx_invitations_status ON project_invitations(status);
CREATE INDEX idx_invitations_expires_at ON project_invitations(expires_at);

-- Proposals indexes
CREATE INDEX idx_proposals_project_id ON project_proposals(project_id);
CREATE INDEX idx_proposals_freelancer_id ON project_proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON project_proposals(status);
CREATE INDEX idx_proposals_created_at ON project_proposals(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_slug ON project_categories(slug);
CREATE INDEX idx_categories_parent_id ON project_categories(parent_id);
CREATE INDEX idx_categories_active ON project_categories(is_active) WHERE is_active = TRUE;

-- Attachments indexes
CREATE INDEX idx_attachments_project_id ON project_attachments(project_id);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_user_id ON project_bookmarks(user_id);
CREATE INDEX idx_bookmarks_project_id ON project_bookmarks(project_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON project_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON project_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT CATEGORIES
-- ============================================

INSERT INTO project_categories (name, slug, description, icon, sort_order) VALUES
('Programming & Tech', 'programming-tech', 'Web, Mobile & Software Development', 'Code', 1),
('Graphics & Design', 'graphics-design', 'Logos, Branding & UI Design', 'Paintbrush', 2),
('Writing & Translation', 'writing-translation', 'Content & Copywriting', 'PenTool', 3),
('Video & Animation', 'video-animation', 'Editing & Motion Graphics', 'Video', 4),
('Music & Audio', 'music-audio', 'Production & Voice Over', 'Music', 5),
('Business', 'business', 'Consulting & Strategy', 'BarChart3', 6),
('Data', 'data', 'Analytics & Visualization', 'FileText', 7),
('Marketing', 'marketing', 'SEO & Social Media', 'Megaphone', 8);

-- ============================================
-- FUNCTIONS FOR PROJECT STATISTICS
-- ============================================

-- Function to update project proposals count
CREATE OR REPLACE FUNCTION update_project_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects 
        SET proposals_count = proposals_count + 1 
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects 
        SET proposals_count = proposals_count - 1 
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update proposals count
CREATE TRIGGER trigger_update_proposals_count
    AFTER INSERT OR DELETE ON project_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_project_proposals_count();

-- Function to update project views count
CREATE OR REPLACE FUNCTION increment_project_views(project_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects 
    SET views_count = views_count + 1 
    WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql;