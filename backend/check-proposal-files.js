require('dotenv').config();
const { query } = require('./src/utils/dbQueries');

async function checkProposalFiles() {
  try {
    console.log('Checking proposal files...\n');
    
    // Get the most recent proposal
    const proposalResult = await query(
      `SELECT id, project_id, freelancer_id, created_at 
       FROM project_proposals 
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    
    if (proposalResult.rows.length === 0) {
      console.log('No proposals found.');
      process.exit(0);
    }
    
    const proposal = proposalResult.rows[0];
    console.log('Most recent proposal:');
    console.log(`  ID: ${proposal.id}`);
    console.log(`  Project ID: ${proposal.project_id}`);
    console.log(`  Freelancer ID: ${proposal.freelancer_id}`);
    console.log(`  Created: ${proposal.created_at}\n`);
    
    // Check for files linked to this proposal
    const filesResult = await query(
      `SELECT id, original_name, file_size, category, proposal_id, project_id, uploaded_by, created_at
       FROM files 
       WHERE proposal_id = $1 OR uploaded_by = $2
       ORDER BY created_at DESC`,
      [proposal.id, proposal.freelancer_id]
    );
    
    console.log(`Files for this freelancer (${filesResult.rows.length}):`);
    console.log('='.repeat(80));
    
    filesResult.rows.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.original_name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Size: ${(file.file_size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Category: ${file.category}`);
      console.log(`   Proposal ID: ${file.proposal_id || 'NOT LINKED'}`);
      console.log(`   Project ID: ${file.project_id || 'NOT LINKED'}`);
      console.log(`   Uploaded by: ${file.uploaded_by}`);
      console.log(`   Created: ${file.created_at}`);
    });
    
    // Check if the specific file ID from the log is linked
    const specificFileResult = await query(
      `SELECT id, original_name, proposal_id, project_id, uploaded_by
       FROM files 
       WHERE id = $1`,
      ['895333d8-4d2c-4c34-84f3-ef333237844a']
    );
    
    if (specificFileResult.rows.length > 0) {
      const file = specificFileResult.rows[0];
      console.log('\n' + '='.repeat(80));
      console.log('Specific file from log (895333d8-4d2c-4c34-84f3-ef333237844a):');
      console.log(`  Name: ${file.original_name}`);
      console.log(`  Proposal ID: ${file.proposal_id || 'NOT LINKED ❌'}`);
      console.log(`  Project ID: ${file.project_id || 'NOT LINKED ❌'}`);
      console.log(`  Uploaded by: ${file.uploaded_by}`);
      
      if (file.proposal_id) {
        console.log('\n✅ File is linked to proposal!');
      } else {
        console.log('\n❌ File is NOT linked to proposal!');
        console.log('   This means the UPDATE query in proposalService.js did not work.');
      }
    } else {
      console.log('\n❌ File with ID 895333d8-4d2c-4c34-84f3-ef333237844a not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProposalFiles();
