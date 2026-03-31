// Custom HTTPS server for Next.js development
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL certificate paths
const certsDir = path.join(__dirname, 'certs');
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost.pem');

// Function to generate certificates if they don't exist
async function ensureCertificates() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✅ SSL certificates found');
    return;
  }

  console.error('❌ SSL certificates not found!');
  console.log('\n� Please generate certificates first:\n');
  console.log('   node create-certs.js\n');
  console.log('Or run:');
  console.log('   npm run generate-cert\n');
  process.exit(1);
}

// Start server
(async () => {
  await ensureCertificates();

  // HTTPS options
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  await app.prepare();

  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log('\n🔒 HTTPS Server Ready!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Local:    https://localhost:${port}`);
      console.log(`📍 Network:  https://192.168.100.6:${port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  Browser Security Warning:');
      console.log('   Your browser will show a warning about the self-signed certificate.');
      console.log('   Click "Advanced" → "Proceed to localhost (unsafe)" to continue.\n');
      console.log('📱 On your phone:');
      console.log('   1. Open https://192.168.100.6:3000');
      console.log('   2. Accept the security warning');
      console.log('   3. Camera/microphone will now work!\n');
    });
})();
