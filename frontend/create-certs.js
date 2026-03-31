// Simple certificate generator using node-forge
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

// Create certs directory
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

console.log('🔐 Generating SSL certificates...\n');

try {
  const forge = require('node-forge');
  const pki = forge.pki;

  // Generate a keypair
  console.log('Generating RSA keypair...');
  const keys = pki.rsa.generateKeyPair(2048);

  // Create a certificate
  console.log('Creating certificate...');
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'State' },
    { name: 'localityName', value: 'City' },
    { name: 'organizationName', value: 'FreelanceHub Dev' }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Add extensions
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '192.168.100.6' }
      ]
    }
  ]);

  // Self-sign certificate
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert to PEM format
  const certPem = pki.certificateToPem(cert);
  const keyPem = pki.privateKeyToPem(keys.privateKey);

  // Write files
  fs.writeFileSync(path.join(certsDir, 'localhost.pem'), certPem);
  fs.writeFileSync(path.join(certsDir, 'localhost-key.pem'), keyPem);

  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Location: ${certsDir}\n`);
  console.log('⚠️  Note: This is a self-signed certificate.');
  console.log('   Your browser will show a security warning.');
  console.log('   Click "Advanced" → "Proceed to localhost (unsafe)"\n');

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('📦 Installing node-forge package...\n');
    const { execSync } = require('child_process');
    try {
      execSync('npm install node-forge --save-dev', { stdio: 'inherit' });
      console.log('\n✅ Package installed! Run the command again:\n');
      console.log('   node create-certs.js\n');
    } catch (installError) {
      console.error('❌ Installation failed');
      console.log('\nPlease install manually:');
      console.log('   npm install node-forge --save-dev\n');
    }
  } else {
    console.error('❌ Error:', error.message);
  }
}
