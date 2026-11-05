/**
 * Mavis Panel — Cloudflare Worker Deployer
 * Bundles the worker and deploys it to Cloudflare Workers via Wrangler.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');

// Simple .env parser
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

console.log('[DEPLOY:WORKER] Preparing Mavis Panel Cloudflare Worker deployment...');

// 1. Bundle assets
require('./bundle-worker');

// 2. Validate credentials
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!apiToken || !accountId) {
  console.error('[ERROR] Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment or .env file.');
  process.exit(1);
}

console.log('[DEPLOY:WORKER] Deploying to Cloudflare Workers with account ID:', accountId);

try {
  const result = spawnSync('npx', ['wrangler', 'deploy'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: apiToken,
      CLOUDFLARE_ACCOUNT_ID: accountId
    }
  });

  if (result.status !== 0) {
    console.error('[ERROR] Wrangler deploy exited with code:', result.status);
    process.exit(result.status || 1);
  }

  console.log('\n[SUCCESS] Cloudflare Worker deployment complete!');
} catch (err) {
  console.error('[ERROR] Deployment failed:', err.message);
  process.exit(1);
}
