# FreelanceHub Database Schema

## Overview
This document describes the complete database schema for the FreelanceHub profile management system.

## Migration Files
1. `001_create_auth_tables.sql` - Basic user authentication tables
2. `002_create_profile_management_tables.sql` - Enhanced profile management system

## Database Tables

### Core User Tables

#### `users` (from migration 001)
- Basic user information and authentication
- Roles: ADMIN, FREELANCER, CLIENT
- Email verification and password reset functionality

#### `freelancer_profiles` (enhanced in migration 002)
- Extended freelancer profile information
- Skills, bio, hourly rate, availability
- Performance metrics (ratings, earnings, jobs completed)
- Verification status and featured status

#### `client_profiles` (enhanced in migration 002)
- Company information and details
- Verification status and business metrics
- Social media links and company details

### Freelancer-Specific Tables

#### `freelancer_skills`
- Normalized skills table with proficiency levels (1-5)
- Years of experience per skill
- Primary skill designation
- Better than storing skills as array in main table

#### `portfolio_items`
- Freelancer portfolio management
- Project details, images, technologies used
- Client information and project duration
- Featured items and display ordering

#### `freelancer_experience`
- Work experience records
- Company details and job descriptions
- Current/past employment tracking
- Skills used in each role

#### `freelancer_education`
- Education records with degree levels
- Institution details and achievements
- GPA and field of study tracking
- Current/completed status

#### `freelancer_certifications`
- Professional certifications
- Issuing organizations and credential IDs
- Expiry date tracking
- Credential verification URLs

### Client-Specific Tables

#### `client_verification_documents`
- Business verification documents
- Document type and verification status
- File management and approval workflow
- Rejection reasons and verification history

### Shared Tables

#### `payment_methods`
- Payment methods for both freelancers and clients
- Multiple payment providers support
- Default payment method selection
- Billing address storage as JSON

#### `user_preferences`
- Notification preferences
- Display preferences (timezone, language, currency)
- Communication preferences
- Marketing opt-in/out settings

### Search and Performance Tables

#### `freelancer_search_index`
- Full-text search optimization
- Automatically updated search vectors
- Separate text fields for targeted searching
- PostgreSQL tsvector for fast search

## ENUM Types

### `user_role`
- ADMIN, FREELANCER, CLIENT

### `availability_status`
- available, busy, unavailable, vacation

### `verification_status`
- pending, verified, rejected

### `portfolio_type`
- web_development, mobile_app, design, writing, marketing, other

### `education_level`
- high_school, associate, bachelor, master, phd, bootcamp, certification

### `payment_method_type`
- credit_card, debit_card, paypal, stripe, bank_transfer

## Key Features

### 1. **Comprehensive Profile Management**
- Separate tables for different profile aspects
- Normalized data structure for better performance
- Rich metadata for each profile section

### 2. **Search Optimization**
- Full-text search using PostgreSQL tsvector
- Automatic search index updates
- Multiple search criteria support

### 3. **Verification System**
- Document upload and verification workflow
- Status tracking for verification process
- Admin approval system

### 4. **Performance Tracking**
- Automatic calculation of profile completion
- Rating and earnings tracking
- Job completion statistics

### 5. **Flexible Payment System**
- Multiple payment method support
- Provider-agnostic design
- Billing address management

## Database Views

### `freelancer_complete_profiles`
- Joins user and freelancer profile data
- Includes calculated fields (portfolio count, etc.)
- Optimized for freelancer listing queries

### `client_complete_profiles`
- Joins user and client profile data
- Complete client information in single view
- Optimized for client profile queries

## Indexes

### Performance Indexes
- All foreign keys are indexed
- Search-critical fields (skills, location, rating)
- Composite indexes for common query patterns

### Search Indexes
- GIN index on search_vector for full-text search
- B-tree indexes on filterable fields
- Partial indexes on boolean flags

## Triggers and Functions

### Automatic Timestamp Updates
- `update_updated_at_column()` function
- Triggers on all tables with updated_at columns
- Ensures accurate modification tracking

### Search Index Maintenance
- `update_freelancer_search_index()` function
- Automatic search vector updates
- Maintains search relevance

## Data Validation

### Check Constraints
- Proficiency levels (1-5 scale)
- Rating values (0-5 scale)
- Positive values for rates and earnings

### Foreign Key Constraints
- Cascade deletes for profile cleanup
- Referential integrity maintenance
- Orphan record prevention

## Usage Examples

### Creating a Freelancer Profile
```sql
-- Insert basic freelancer profile
INSERT INTO freelancer_profiles (user_id, title, bio, hourly_rate)
VALUES ('user-uuid', 'Full Stack Developer', 'Experienced developer...', 75.00);

-- Add skills
INSERT INTO freelancer_skills (freelancer_id, skill_name, proficiency_level, years_experience)
VALUES 
  ('freelancer-uuid', 'JavaScript', 5, 8),
  ('freelancer-uuid', 'React', 5, 6),
  ('freelancer-uuid', 'Node.js', 4, 5);

-- Add portfolio item
INSERT INTO portfolio_items (freelancer_id, title, description, project_type, technologies_used)
VALUES ('freelancer-uuid', 'E-commerce Platform', 'Built a full-stack...', 'web_development', 
        ARRAY['React', 'Node.js', 'PostgreSQL']);
```

### Searching Freelancers
```sql
-- Full-text search
SELECT * FROM freelancer_complete_profiles fp
JOIN freelancer_search_index fsi ON fp.id = fsi.freelancer_id
WHERE fsi.search_vector @@ to_tsquery('english', 'javascript & react');

-- Filter by criteria
SELECT * FROM freelancer_complete_profiles
WHERE hourly_rate BETWEEN 50 AND 100
  AND availability_status = 'available'
  AND average_rating >= 4.0;
```

## Migration Instructions

### Step 1: Run Migration 002
```sql
-- In pgAdmin or psql
\i backend/migrations/002_create_profile_management_tables.sql
```

### Step 2: Verify Tables
```sql
-- Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 3: Insert Default Preferences
The migration automatically inserts default preferences for existing users.

## Maintenance

### Regular Tasks
1. **Reindex search vectors** monthly for optimal performance
2. **Update profile completion percentages** when schema changes
3. **Clean up expired verification tokens** weekly
4. **Archive old portfolio items** if needed

### Performance Monitoring
1. Monitor query performance on search operations
2. Check index usage statistics
3. Analyze slow query logs
4. Update table statistics regularly

## Security Considerations

### Data Protection
- Sensitive payment data is tokenized
- Document URLs should use signed URLs
- Personal information access logging
- GDPR compliance for data deletion

### Access Control
- Row-level security for multi-tenant data
- API-level authorization checks
- Audit trails for sensitive operations
- Rate limiting on search operations

## Future Enhancements

### Planned Features
1. **Skill endorsements** from other users
2. **Project collaboration** tracking
3. **Advanced analytics** tables
4. **Notification queue** system
5. **File metadata** tracking
6. **Backup and archival** system

This schema provides a solid foundation for a comprehensive freelance marketplace with room for future growth and optimization.