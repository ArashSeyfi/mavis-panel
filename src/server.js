/**
 * Mavis Panel — Modular Server Entrypoint (Development)
 */

const { MAVIS_CONFIG } = require('./config');
const { startGate } = require('./boot');

if (require.main === module) {
  startGate(MAVIS_CONFIG).catch(err => {
    console.error('[FATAL] Failed to start Mavis Panel:', err);
    process.exit(1);
  });
}

module.exports = {
  MAVIS_CONFIG,
  startGate
};
