const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { Logger } = require('./logger');

function asn1(tag, ...children) {
  const content = Buffer.concat(children);
  let len;
  if (content.length < 128) {
    len = Buffer.from([content.length]);
  } else if (content.length < 256) {
    len = Buffer.from([0x81, content.length]);
  } else if (content.length < 65536) {
    len = Buffer.from([0x82, (content.length >> 8) & 0xff, content.length & 0xff]);
  } else {
    len = Buffer.from([0x83, (content.length >> 16) & 0xff, (content.length >> 8) & 0xff, content.length & 0xff]);
  }
  return Buffer.concat([Buffer.from([tag]), len, content]);
}

function seq(...ch) { return asn1(0x30, ...ch); }
function int(val) { return asn1(0x02, Buffer.isBuffer(val) ? val : Buffer.from([val])); }
function oid(bytes) { return asn1(0x06, Buffer.from(bytes)); }
function utf8(str) { return asn1(0x0c, Buffer.from(str, 'utf8')); }
function utcTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const s = String(d.getUTCFullYear()).slice(2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  return asn1(0x17, Buffer.from(s, 'ascii'));
}

function generateSelfSignedCert(commonName = 'localhost') {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' });

  // sha256WithRSAEncryption: 1.2.840.113549.1.1.11
  const sigAlg = seq(oid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]), Buffer.from([0x05, 0x00]));
  const name = seq(asn1(0x31, seq(oid([0x55, 0x04, 0x03]), utf8(commonName))));
  const now = new Date();
  const notAfter = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const validity = seq(utcTime(now), utcTime(notAfter));
  const serial = crypto.randomBytes(8);
  serial[0] &= 0x7f;

  const tbs = seq(
    asn1(0xa0, int(2)), // v3
    int(serial),
    sigAlg,
    name,
    validity,
    name,
    spkiDer
  );

  const sig = crypto.sign('sha256', tbs, privateKey);
  const bitSig = Buffer.concat([Buffer.from([0x00]), sig]);
  const certDer = seq(tbs, sigAlg, asn1(0x03, bitSig));
  const certPem = '-----BEGIN CERTIFICATE-----\n' + certDer.toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END CERTIFICATE-----\n';
  const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

  return { certPem, keyPem };
}

function ensureTlsCertificates(certPath, keyPath, sni = 'localhost') {
  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const c = fs.readFileSync(certPath, 'utf8');
      const k = fs.readFileSync(keyPath, 'utf8');
      if (c.includes('BEGIN CERTIFICATE') && k.includes('PRIVATE KEY')) {
        return { cert: c, key: k };
      }
    }
  } catch (_) {}

  const certDir = path.dirname(certPath);
  try {
    fs.mkdirSync(certDir, { recursive: true });
  } catch (_) {}

  // 1. Try openssl if available
  try {
    const res = spawnSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-subj', `/CN=${sni}`,
      '-keyout', keyPath,
      '-out', certPath,
      '-days', '365'
    ], { timeout: 15000 });
    if (res.status === 0 && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8')
      };
    }
  } catch (_) {}

  // 2. Pure JS fallback
  try {
    const { certPem, keyPem } = generateSelfSignedCert(sni);
    fs.writeFileSync(keyPath, keyPem, 'utf8');
    fs.writeFileSync(certPath, certPem, 'utf8');
    return { cert: certPem, key: keyPem };
  } catch (err) {
    Logger.error(`Failed to generate TLS cert: ${err.message}`);
    return null;
  }
}

module.exports = {
  generateSelfSignedCert,
  ensureTlsCertificates
};
