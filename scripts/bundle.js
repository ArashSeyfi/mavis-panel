/**
 * Mavis Panel — Standalone Compiler & Bundler
 * Compiles modular files under src/ and assets under src/public/
 * into a single, self-contained index.js file.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const PUBLIC_DIR = path.join(SRC_DIR, 'public');
const OUTPUT_FILE = path.join(ROOT_DIR, 'index.js');

console.log('[BUILD] Starting Mavis Panel bundle compilation...');

// 1. Read frontend assets
const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
const appCss = fs.readFileSync(path.join(PUBLIC_DIR, 'app.css'), 'utf8');
const appJs = fs.readFileSync(path.join(PUBLIC_DIR, 'app.js'), 'utf8');
const logoSvg = fs.readFileSync(path.join(PUBLIC_DIR, 'logo.svg'), 'utf8');

console.log('  -> Embedded index.html (' + indexHtml.length + ' bytes)');
console.log('  -> Embedded app.css (' + appCss.length + ' bytes)');
console.log('  -> Embedded app.js (' + appJs.length + ' bytes)');
console.log('  -> Embedded logo.svg (' + logoSvg.length + ' bytes)');

// Helper to sanitize module code: strip local requires and module.exports
function cleanModule(filePath, label) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip local requires like require('./...') or require('../...')
  content = content.replace(/const\s+\{[^}]+\}\s*=\s*require\(['"]\.\.?\/[^'"]+['"]\);?\r?\n?/g, '');
  content = content.replace(/const\s+[A-Za-z0-9_]+\s*=\s*require\(['"]\.\.?\/[^'"]+['"]\);?\r?\n?/g, '');

  // Strip standard external requires that are already imported at the bundle root
  content = content.replace(/const\s+(fs|path|os|net|http|https|crypto|axios|express)\s*=\s*require\(['"][^'"]+['"]\);?\r?\n?/g, '');
  content = content.replace(/const\s+\{[^}]*\}\s*=\s*require\(['"]child_process['"]\);?\r?\n?/g, '');

  // Strip module.exports at the end of file
  content = content.trimEnd();
  content = content.replace(/module\.exports\s*=\s*\{[\s\S]*?\};?$/s, '');
  content = content.replace(/module\.exports\s*=\s*[A-Za-z0-9_]+;?$/s, '');

  return `\n// --- Module: ${label} ---\n` + content.trim() + '\n';
}

// 2. Build sections
const parts = [];

// Header comment
parts.push(`/**
 * ====================================================================
 *                 MAVIS PANEL — STANDALONE CORE
 * ====================================================================
 * Stealth proxy core & single-port multiplexer
 * Single-port router for Linux containers, VPS & cloud servers
 * Generated automatically by Mavis Panel compiler
 * ====================================================================
 */
`);

// Standard dependencies
parts.push(`const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const express = require('express');
const axios = require('axios');
`);

// Embedded assets object
parts.push(`// --- Embedded Web Panel Assets (Monochrome Clean B&W) ---
const EMBEDDED_ASSETS = {
  indexHtml: ${JSON.stringify(indexHtml)},
  appCss: ${JSON.stringify(appCss)},
  appJs: ${JSON.stringify(appJs)},
  logoSvg: ${JSON.stringify(logoSvg)}
};

class AssetManager {
  static getIndexHtml() { return EMBEDDED_ASSETS.indexHtml; }
  static getAppCss() { return EMBEDDED_ASSETS.appCss; }
  static getAppJs() { return EMBEDDED_ASSETS.appJs; }
  static getLogoSvg() { return EMBEDDED_ASSETS.logoSvg; }

  static _readFileCandidate(filenames) {
    const names = Array.isArray(filenames) ? filenames : [filenames];
    const dirs = [
      path.join(process.cwd(), 'assets'),
      path.join(__dirname, 'assets'),
      path.join(process.cwd()),
      path.join(__dirname)
    ];
    for (const d of dirs) {
      for (const name of names) {
        const full = path.join(d, name);
        try {
          if (fs.existsSync(full)) {
            const buf = fs.readFileSync(full);
            if (buf && buf.length > 0) return buf;
          }
        } catch (_) {}
      }
    }
    return null;
  }

  static getLogo() {
    const buf = this._readFileCandidate(['logo.svg', 'logo.png']);
    if (buf) return buf;
    return Buffer.from(EMBEDDED_ASSETS.logoSvg, 'utf8');
  }
}
`);

// Modules in logical order
parts.push(cleanModule(path.join(SRC_DIR, 'tls-sni.js'), 'lib/tls-sni.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'logger.js'), 'lib/logger.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'config.js'), 'lib/config.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'ports.js'), 'lib/ports.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'state.js'), 'lib/state.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'binaries.js'), 'lib/binaries.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'cert.js'), 'lib/cert.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'engines', 'singbox.js'), 'lib/engines/singbox.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'engines', 'xray.js'), 'lib/engines/xray.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'engines', 'argo.js'), 'lib/engines/argo.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'panel', 'validator.js'), 'lib/panel/validator.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'panel', 'links.js'), 'lib/panel/links.js'));

parts.push(cleanModule(path.join(SRC_DIR, 'panel', 'http-panel.js'), 'lib/panel/http-panel.js'));

parts.push(cleanModule(path.join(SRC_DIR, 'mux', 'tcp-router.js'), 'lib/mux/tcp-router.js'));
parts.push(cleanModule(path.join(SRC_DIR, 'boot.js'), 'lib/boot.js'));

// Execution & export footer
parts.push(`
// --- Auto-start execution ---
if (require.main === module) {
  startGate(MAVIS_CONFIG).catch(err => {
    console.error('[FATAL] Failed to start Mavis Panel:', err);
    process.exit(1);
  });
}

module.exports = {
  MAVIS_CONFIG,
  BK_CONFIG: MAVIS_CONFIG,
  startGate
};
`);

const finalBundle = parts.join('\n');
fs.writeFileSync(OUTPUT_FILE, finalBundle, 'utf8');

console.log('[BUILD] Successfully generated standalone bundle: index.js');
console.log('  -> Size: ' + finalBundle.length + ' bytes (' + (finalBundle.length / 1024).toFixed(1) + ' KB)');
