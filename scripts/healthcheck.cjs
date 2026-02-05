#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000/health';

(async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (data.status === 'ok') {
      console.log(`✅ Health check passed: ${data.service}`);
      process.exit(0);
    } else {
      console.error('⚠️ Unexpected health response:', data);
      process.exit(1);
    }
  } catch (err) {
    console.error('🛑 Health check failed:', err.message);
    process.exit(1);
  }
})();
