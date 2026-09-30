const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Logger } = require('./logger');

function deriveX25519PublicKey(privBase64) {
  try {
    if (!privBase64 || typeof privBase64 !== 'string') return null;
    const privBuf = Buffer.from(privBase64.trim(), 'base64');
    if (privBuf.length !== 32) return null;
    const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), privBuf]);
    const keyObj = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
    return crypto.createPublicKey(keyObj).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
  } catch {
    return null;
  }
}

class StateManager {
  constructor(paths, initialConfig) {
    this.paths = paths;
    this.config = initialConfig;
    this.state = {
      uuid: '',
      hy2Password: '',
      hy2ObfsPassword: '',
      realityPrivateKey: '',
      realityPublicKey: '',
      realityShortId: '',
      shadowTlsPassword: '',
      shadowsocksPassword: '',
      wireguardPrivateKey: '',
      wireguardPublicKey: '',
      wireguardClientPrivateKey: '',
      wireguardClientPublicKey: '',
      publicIp: '',
      links: [],
      clashYaml: '',
      singboxJson: '',
      xrayJson: '',
      base64Sub: '',
      updatedAt: null
    };
  }

  loadOrCreate() {
    try {
      fs.mkdirSync(this.paths.dataDir, { recursive: true });
      if (fs.existsSync(this.paths.stateFile)) {
        const raw = fs.readFileSync(this.paths.stateFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      }
    } catch (err) {
      Logger.warn(`Failed to read existing state.json: ${err.message}. Generating fresh state.`);
    }

    // UUID
    if (this.config.uuid) {
      this.state.uuid = this.config.uuid;
    } else if (!this.state.uuid) {
      this.state.uuid = crypto.randomUUID();
    }

    // Hysteria2
    this.state.hy2Password = this.state.uuid;
    if (!this.state.hy2ObfsPassword) {
      this.state.hy2ObfsPassword = crypto.randomBytes(8).toString('hex');
    }

    // ShadowTLS
    if (this.config.shadowTls && this.config.shadowTls.password) {
      this.state.shadowTlsPassword = this.config.shadowTls.password;
    } else if (!this.state.shadowTlsPassword) {
      this.state.shadowTlsPassword = crypto.randomBytes(12).toString('hex');
    }

    // Shadowsocks
    if (this.config.shadowsocks && this.config.shadowsocks.password) {
      this.state.shadowsocksPassword = this.config.shadowsocks.password;
    } else if (!this.state.shadowsocksPassword) {
      this.state.shadowsocksPassword = crypto.randomBytes(16).toString('base64url');
    }

    // Reality
    if (this.config.reality && this.config.reality.shortId) {
      this.state.realityShortId = this.config.reality.shortId;
    } else if (!this.state.realityShortId) {
      this.state.realityShortId = crypto.randomBytes(4).toString('hex');
    }

    // WireGuard
    const isValidKey = (k) => typeof k === 'string' && k.trim().length >= 40;
    let srvPriv = this.state.wireguardPrivateKey;
    let srvPub = this.state.wireguardPublicKey;
    let cliPriv = this.state.wireguardClientPrivateKey;
    let cliPub = this.state.wireguardClientPublicKey;

    if (!isValidKey(srvPriv) || !isValidKey(srvPub)) {
      try {
        const srv = crypto.generateKeyPairSync('x25519');
        srvPriv = srv.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        srvPub = srv.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (err) {
        Logger.warn(`Failed to generate WireGuard server keypair: ${err.message}`);
      }
    } else {
      const derived = deriveX25519PublicKey(srvPriv);
      if (derived) srvPub = derived;
    }

    if (!isValidKey(cliPriv) || !isValidKey(cliPub)) {
      try {
        const cli = crypto.generateKeyPairSync('x25519');
        cliPriv = cli.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        cliPub = cli.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (err) {
        Logger.warn(`Failed to generate WireGuard client keypair: ${err.message}`);
      }
    } else {
      const derived = deriveX25519PublicKey(cliPriv);
      if (derived) cliPub = derived;
    }

    this.state.wireguardPrivateKey = srvPriv;
    this.state.wireguardPublicKey = srvPub;
    this.state.wireguardClientPrivateKey = cliPriv;
    this.state.wireguardClientPublicKey = cliPub;

    this.save();
    return this.state;
  }

  setRealityKeys(privateKey, publicKey) {
    this.state.realityPrivateKey = privateKey;
    this.state.realityPublicKey = publicKey;
    this.save();
  }

  setWireGuardKeys(serverPriv, serverPub, clientPriv, clientPub) {
    this.state.wireguardPrivateKey = serverPriv;
    this.state.wireguardPublicKey = serverPub;
    this.state.wireguardClientPrivateKey = clientPriv;
    this.state.wireguardClientPublicKey = clientPub;
    this.save();
  }

  setLinks(links, clashYaml = '', singboxJson = '', xrayJson = '') {
    this.state.links = links;
    this.state.clashYaml = clashYaml;
    this.state.singboxJson = singboxJson;
    this.state.xrayJson = xrayJson;
    this.state.base64Sub = Buffer.from(links.join('\n')).toString('base64');
    this.save();
  }

  setPublicIp(ip) {
    this.state.publicIp = ip;
    this.save();
  }

  save() {
    try {
      this.state.updatedAt = new Date().toISOString();
      fs.mkdirSync(this.paths.dataDir, { recursive: true });
      fs.writeFileSync(this.paths.stateFile, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      Logger.warn(`Could not save state.json: ${err.message}`);
    }
  }
}

StateManager.deriveX25519PublicKey = deriveX25519PublicKey;

module.exports = {
  StateManager,
  deriveX25519PublicKey
};
