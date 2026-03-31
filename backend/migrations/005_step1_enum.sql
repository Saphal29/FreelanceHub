-- Step 1: Create ENUM type
DROP TYPE IF EXISTS contract_status CASCADE;
CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled', 'disputed');
