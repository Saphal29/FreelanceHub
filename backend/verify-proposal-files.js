const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifyProposalFiles() {
  try {
    console.log('🔍 Checking proposal files...\n');
    
    // Get recent proposals
    const proposalsResult = await pool.query(`
      SELECT 
        pp.id,
        pp.project_id,
        pp.freelancer_id,
        pp.created_at,
        u.full_name as freelancer_name
      FROM project_proposals pp
      JOIN users u ON pp.freelancer_id = u.id
      ORDER BY pp.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${proposalsResult.rows.length} recent proposals:\n`);
    
    for (const proposal of proposalsResult.rows) {
      console.log(`📋 Proposal ID: ${proposal.id}`);
      console.log(`   Freelancer: ${proposal.freelancer_name}`);
      console.log(`   Created: ${proposal.created_at}`);
      
      // Get files for this proposal
      const filesResult = await pool.query(`
        SELECT 
          id,
          original_name,
          file_size,
          mime_type,
          category,
          uploaded_at
        FROM files
        WHERE proposal_id = $1
        ORDER BY uploaded_at DESC
      `, [proposal.id]);
      
      if (filesResult.rows.length > 0) {
        console.log(`   ✅ Files attached: ${filesResult.rows.length}`);
        filesResult.rows.forEach(file => {
          console.log(`      - ${file.original_name} (${(file.file_size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log(`   ❌ No files attached`);
      }
      console.log('');
    }
    
    // Check for orphaned files (uploaded but not linked)
    const orphanedResult = await pool.query(`
      SELECT 
        id,
        original_name,
        category,
        uploaded_at,
        uploaded_by
      FROM files
      WHERE proposal_id IS NULL 
        AND category = 'proposal_attachment'
        AND status = 'active'
      ORDER BY uploaded_at DESC
      LIMIT 10
    `);
    
    if (orphanedResult.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedResult.rows.length} orphaned proposal files (uploaded but not linked):\n`);
      orphanedResult.rows.forEach(file => {
        console.log(`   - ${file.original_name} (ID: ${file.id})`);
        console.log(`     Uploaded: ${file.uploaded_at}`);
      });
    } else {
      console.log('✅ No orphaned proposal files found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyProposalFiles();
