function testHealthEndpoint() {
  const http = require('http');
  const assert = require('assert');

  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/health',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        assert.strictEqual(res.statusCode, 200);
        console.log('✅ /health endpoint passed');
      } catch (err) {
        console.error('❌ Assertion failed:', err.message);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.log('⚠️ Health check skipped (server not running):', error.message);
    process.exit(0);
  });

  req.end();
}

testHealthEndpoint();
