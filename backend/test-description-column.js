const { pool } = require('./src/config/database');

async function testDescriptionColumn() {
  try {
    console.log('Testing if description column exists in files table...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'files' 
      AND column_name = 'description'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Description column exists:', result.rows[0]);
    } else {
      console.log('❌ Description column does NOT exist');
      console.log('\nPlease run this SQL in pgAdmin:');
      console.log('ALTER TABLE files ADD COLUMN description TEXT;');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDescriptionColumn();
