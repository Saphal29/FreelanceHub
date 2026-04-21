# Fix Signed Contracts Script

## Problem

Some contracts in the database have both parties signed (`signed_by_client = true` AND `signed_by_freelancer = true`) but their status is still `'draft'` or `'pending'` instead of `'active'`.

This happened because:
1. The contract was signed before the auto-activation logic was properly implemented
2. The `signContract` function was returning the old contract data before the status update

## Solution

We've fixed the `signContract` function to properly return the updated contract with `'active'` status when both parties sign.

For existing contracts that are already signed but have incorrect status, run the fix script below.

## How to Run the Fix Script

### Step 1: Navigate to backend directory

```bash
cd backend
```

### Step 2: Run the fix script

```bash
node fix-signed-contracts.js
```

### What the script does:

1. **Finds** all contracts where:
   - `signed_by_client = true`
   - `signed_by_freelancer = true`
   - `status` is NOT `'active'`, `'completed'`, or `'cancelled'`

2. **Shows** you a list of contracts that will be updated

3. **Updates** the contracts to:
   - Set `status = 'active'`
   - Set `started_at` to the later of the two signature timestamps (if not already set)
   - Update `updated_at` to current timestamp

4. **Displays** the results showing which contracts were updated

## Example Output

```
🔍 Checking for fully signed contracts with incorrect status...

📋 Found 2 contract(s) that need to be activated:

1. Contract ID: 8728c9d4...
   Current Status: draft
   Client Signed: 1/15/2024, 10:30:00 AM
   Freelancer Signed: 1/15/2024, 2:45:00 PM

2. Contract ID: a1b2c3d4...
   Current Status: pending
   Client Signed: 1/14/2024, 3:20:00 PM
   Freelancer Signed: 1/14/2024, 5:10:00 PM

⚠️  About to update 2 contract(s) to 'active' status.

✅ Successfully updated 2 contract(s) to active status!

1. Contract ID: 8728c9d4...
   New Status: active
   Started At: 1/15/2024, 2:45:00 PM

2. Contract ID: a1b2c3d4...
   New Status: active
   Started At: 1/14/2024, 5:10:00 PM

✨ All done! Contracts have been fixed.
```

## After Running the Script

1. **Refresh** the contract details page in your browser
2. The contract status should now show **"Active"**
3. The **"Schedule a Meeting"** button should now be visible
4. Users can now:
   - Schedule video meetings
   - Make escrow payments
   - Track time
   - Complete milestones

## Verification

To verify the fix worked, you can check in your database:

```sql
SELECT 
  id, 
  status, 
  signed_by_client, 
  signed_by_freelancer,
  started_at
FROM contracts
WHERE signed_by_client = true 
  AND signed_by_freelancer = true;
```

All results should have `status = 'active'` (unless they're completed or cancelled).

## Future Prevention

The bug has been fixed in the code, so:
- New contracts will automatically become `'active'` when both parties sign
- The frontend will immediately show the updated status
- No manual intervention will be needed for future contracts
