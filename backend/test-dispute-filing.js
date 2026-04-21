require('dotenv').config();
const { query } = require('./src/utils/dbQueries');

async function testDisputeFiling() {
  try {
    console.log('Testing dispute filing...\n');
    
    // First, get an active contract
    console.log('1. Fetching active contracts...');
    const contractsResult = await query(
      `SELECT c.id, c.project_id, c.client_id, c.freelancer_id, p.title as project_title
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.status = 'active'
       LIMIT 1`
    );
    
    if (contractsResult.rows.length === 0) {
      console.log('❌ No active contracts found');
      process.exit(1);
    }
    
    const contract = contractsResult.rows[0];
    console.log('✅ Found contract:', {
      id: contract.id,
      projectId: contract.project_id,
      clientId: contract.client_id,
      freelancerId: contract.freelancer_id,
      projectTitle: contract.project_title
    });
    
    // Test the query used in fileDispute
    console.log('\n2. Testing contract query from fileDispute...');
    const testResult = await query(
      `SELECT c.*, p.client_id, p.id as project_id
       FROM contracts c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [contract.id]
    );
    
    if (testResult.rows.length === 0) {
      console.log('❌ Contract query returned no results');
      process.exit(1);
    }
    
    const testContract = testResult.rows[0];
    console.log('✅ Contract query result:', {
      contractId: testContract.id,
      projectId: testContract.project_id,
      clientId: testContract.client_id,
      freelancerId: testContract.freelancer_id
    });
    
    // Determine respondent
    const userId = contract.client_id; // Simulate client filing dispute
    const respondentId = testContract.client_id === userId ? testContract.freelancer_id : testContract.client_id;
    
    console.log('\n3. Testing dispute insertion...');
    console.log('Filing as:', userId);
    console.log('Respondent:', respondentId);
    
    const disputeResult = await query(
      `INSERT INTO disputes (
        contract_id, project_id, milestone_id, filed_by, respondent_id,
        category, title, description, amount_disputed, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        contract.id,
        testContract.project_id,
        null,
        userId,
        respondentId,
        'payment_issue',
        'Test Dispute',
        'This is a test dispute',
        100.00,
        'medium'
      ]
    );
    
    console.log('✅ Dispute created successfully!');
    console.log('Dispute ID:', disputeResult.rows[0].id);
    
    // Clean up test dispute
    await query('DELETE FROM disputes WHERE id = $1', [disputeResult.rows[0].id]);
    console.log('✅ Test dispute cleaned up');
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDisputeFiling();
