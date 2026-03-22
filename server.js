#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import('./packages/codex/codexService.js')
  .then(() => console.log('[✓] Codex Ecclesia initialized'))
  .catch((err) => {
    console.error('[✗] Failed to start Codex Ecclesia:', err);
    process.exit(1);
  });

import('./apps/api/src/index.js')
  .then(() => console.log('[✓] Logistics API initialized'))
  .catch((err) => {
    console.error('[✗] Failed to start Logistics API:', err);
    process.exit(1);
  });

console.log('\n=== BORDERS DYNASTY MONOREPO STARTED ===');
console.log(`Codex Ecclesia: http://localhost:${process.env.CODEX_PORT || 3001}`);
console.log(`Logistics API: http://localhost:${process.env.API_PORT || 3000}`);
console.log('==========================================\n');
