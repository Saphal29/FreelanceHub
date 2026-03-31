// Generate self-signed SSL certificate for local development using Node.js crypto
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const certsDir = path.join(__dirname, 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

console.log('🔐 Generating self-signed SSL certificate using Node.js...\n');

try {
  // Try using selfsigned package (pure Node.js solution)
  const selfsigned = require('selfsigned');
  
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'State' },
    { name: 'localityName', value: 'City' },
    { name: 'organizationName', value: 'FreelanceHub Dev' },
    { shortName: 'OU', value: 'Development' }
  ];

  const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '192.168.100.6' }
        ]
      }
    ]
  };

  const pems = selfsigned.generate(attrs, options);

  // Write certificate and key
  fs.writeFileSync(path.join(certsDir, 'localhost.pem'), pems.cert);
  fs.writeFileSync(path.join(certsDir, 'localhost-key.pem'), pems.private);

  console.log('✅ SSL certificate generated successfully!');
  console.log(`📁 Certificate location: ${certsDir}`);
  console.log('\n⚠️  Note: This is a self-signed certificate.');
  console.log('   Your browser will show a security warning.');
  console.log('   Click "Advanced" → "Proceed to localhost (unsafe)" to continue.\n');
  
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('📦 Installing required package: selfsigned\n');
    try {
      execSync('npm install selfsigned --save-dev', { stdio: 'inherit' });
      console.log('\n✅ Package installed! Please run the command again:\n');
      console.log('   npm run generate-cert\n');
    } catch (installError) {
      console.error('❌ Failed to install package:', installError.message);
    }
  } else {
    console.error('❌ Error generating certificate:', error.message);
  }
  process.exit(1);
}
