const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkFilePath() {
  try {
    const fileId = 'ddeab453-9581-4f33-acc2-ec436aa9a1e3';
    
    console.log(`🔍 Checking file: ${fileId}\n`);
    
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [fileId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ File not found in database');
      return;
    }
    
    const file = result.rows[0];
    console.log('📄 File details:');
    console.log(`   ID: ${file.id}`);
    console.log(`   Original name: ${file.original_name}`);
    console.log(`   File path: ${file.file_path}`);
    console.log(`   Uploaded by: ${file.uploaded_by}`);
    console.log(`   Project ID: ${file.project_id}`);
    console.log(`   Proposal ID: ${file.proposal_id}`);
    console.log(`   Status: ${file.status}`);
    console.log('');
    
    // Check if file exists on disk
    const fullPath = path.join(process.cwd(), file.file_path);
    console.log(`📂 Full path: ${fullPath}\n`);
    
    try {
      await fs.access(fullPath);
      const stats = await fs.stat(fullPath);
      console.log('✅ File exists on disk');
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Modified: ${stats.mtime}`);
    } catch (err) {
      console.log('❌ File does NOT exist on disk');
      console.log(`   Error: ${err.message}`);
      
      // Check if directory exists
      const dir = path.dirname(fullPath);
      try {
        await fs.access(dir);
        console.log(`   Directory exists: ${dir}`);
        
        // List files in directory
        const files = await fs.readdir(dir);
        console.log(`   Files in directory (${files.length}):`);
        files.slice(0, 5).forEach(f => console.log(`      - ${f}`));
      } catch (dirErr) {
        console.log(`   Directory does NOT exist: ${dir}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkFilePath();
