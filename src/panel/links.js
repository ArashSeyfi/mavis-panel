const crypto = require('crypto');
const { isValidNode } = require('./validator');

/**
 * Link and subscription configuration generator for mavis-panel
 */



function urlSafeEncode(str) {
  return encodeURIComponent(str);
}

function yamlSafeQuote(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

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

class LinkGenerator {
  constructor(config, state, resolvedHost) {
    this.config = config;
    this.state = state;
    this.host = config.forceHost || resolvedHost || config.domain || '127.0.0.1';
    this.port = config.publicPort;
    this.prefix = config.nodePrefix || 'mavis - ';
    this.wsPath = '/mavis-ws';
    this.vmessPath = '/mavis-vmess';
    this.huPath = '/mavis-httpupgrade';
    this.xhPath = '/mavis-xhttp';
    this.trPath = '/mavis-trojan';
    this.grpcService = 'mavis-grpc';
  }

  generateHysteria2() {
    return null; // Hysteria removed as requested
  }

  generateVlessWs() {
    if (!this.config.enable.vlessWs) return null;
    const name = `${this.prefix}WS`;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'VLESS-WS',
      label: 'WebSocket Direct / CDN',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=ws&host=${this.host}&path=${urlSafeEncode(this.wsPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessWsTls() {
    if (!this.config.enable.vlessWsTls) return null;
    const name = `${this.prefix}WS-TLS`;
    const sni = this.config.domain || this.host;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'ws',
      tls: true,
      servername: sni,
      'skip-cert-verify': true,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: sni }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      tls: {
        enabled: true,
        server_name: sni,
        insecure: true
      },
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: sni }
      }
    };
    return {
      name,
      type: 'VLESS-WS-TLS',
      label: 'CDN Cloudflare Compatible',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=tls&sni=${sni}&type=ws&host=${sni}&path=${urlSafeEncode(this.wsPath)}&fp=chrome&allowInsecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVmessWsTls() {
    if (!this.config.enable.vmessWsTls) return null;
    const name = `${this.prefix}VMess-WS-TLS`;
    const sni = this.config.domain || this.host;
    const vmessConfig = {
      v: '2',
      ps: name,
      add: this.host,
      port: String(this.port),
      id: this.state.uuid,
      aid: '0',
      scy: 'auto',
      net: 'ws',
      type: 'none',
      host: sni,
      path: this.vmessPath,
      tls: 'tls',
      sni: sni,
      alpn: 'http/1.1',
      fp: 'chrome'
    };
    const uri = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    const clashProxy = {
      name,
      type: 'vmess',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      alterId: 0,
      cipher: 'auto',
      network: 'ws',
      tls: true,
      servername: sni,
      'skip-cert-verify': true,
      'ws-opts': {
        path: this.vmessPath,
        headers: { Host: sni }
      }
    };
    const sbOutbound = {
      type: 'vmess',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      alter_id: 0,
      security: 'auto',
      tls: {
        enabled: true,
        server_name: sni,
        insecure: true
      },
      transport: {
        type: 'ws',
        path: this.vmessPath,
        headers: { Host: sni }
      }
    };
    return {
      name,
      type: 'VMess-WS-TLS',
      label: 'Classic Universal Client',
      compat: true,
      uri,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVmessWs() {
    if (!this.config.enable.vmessWs) return null;
    const name = `${this.prefix}VMess-WS`;
    const vmessConfig = {
      v: '2',
      ps: name,
      add: this.host,
      port: String(this.port),
      id: this.state.uuid,
      aid: '0',
      scy: 'auto',
      net: 'ws',
      type: 'none',
      host: this.host,
      path: this.vmessPath,
      tls: 'none'
    };
    const uri = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
    const clashProxy = {
      name,
      type: 'vmess',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      alterId: 0,
      cipher: 'auto',
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: this.vmessPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'vmess',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      alter_id: 0,
      security: 'auto',
      transport: {
        type: 'ws',
        path: this.vmessPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'VMess-WS',
      label: 'VMess WebSocket Direct',
      compat: true,
      uri,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessHttpUpgrade() {
    if (!this.config.enable.vlessHttpUpgrade) return null;
    const name = `${this.prefix}HTTPUpgrade`;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'httpupgrade',
      tls: false,
      'httpupgrade-opts': {
        path: this.huPath,
        host: this.host
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'httpupgrade',
        path: this.huPath,
        host: this.host
      }
    };
    return {
      name,
      type: 'VLESS-HTTPUpgrade',
      compat: false,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=httpupgrade&path=${urlSafeEncode(this.huPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateReality() {
    if (!this.config.enable.reality) return null;
    if (!this.state.realityPublicKey || !this.state.realityPrivateKey || this.state.realityPublicKey.length < 10) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        this.state.realityPrivateKey = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64url');
        this.state.realityPublicKey = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url');
        this.state.realityShortId = this.state.realityShortId || crypto.randomBytes(4).toString('hex');
      } catch (_) {
        return null;
      }
    }
    const name = `${this.prefix}Reality`;
    const target = String(this.config.reality.target || 'www.microsoft.com').replace(/[\[\]]/g, '').trim();
    const shortId = this.state.realityShortId || '12345678';
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      flow: 'xtls-rprx-vision',
      tls: true,
      'reality-opts': {
        'public-key': this.state.realityPublicKey,
        'short-id': shortId
      },
      'client-fingerprint': 'chrome',
      servername: target
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      flow: 'xtls-rprx-vision',
      tls: {
        enabled: true,
        server_name: target,
        reality: {
          enabled: true,
          public_key: this.state.realityPublicKey,
          short_id: shortId
        },
        utls: { enabled: true, fingerprint: 'chrome' }
      }
    };
    return {
      name,
      type: 'VLESS-REALITY',
      label: 'Anti-blocking / Web traffic',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=reality&sni=${target}&fp=chrome&pbk=${this.state.realityPublicKey}&sid=${shortId}&type=tcp&flow=xtls-rprx-vision#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateShadowTls() {
    if (!this.config.enable.shadowTlsVless || !this.state.shadowTlsPassword) return null;
    const name = `${this.prefix}ShadowTLS`;
    const sni = String(this.config.shadowTls.sni || 'www.microsoft.com').replace(/[\[\]]/g, '').trim();
    const clashProxy = {
      name,
      type: 'shadow-tls',
      server: this.host,
      port: this.port,
      password: this.state.shadowTlsPassword,
      version: 3,
      sni
    };
    const sbOutbounds = [
      {
        type: 'shadowtls',
        tag: name,
        server: this.host,
        server_port: this.port,
        version: 3,
        password: this.state.shadowTlsPassword,
        tls: {
          enabled: true,
          server_name: sni
        },
        detour: `${name}-detour`
      },
      {
        type: 'vless',
        tag: `${name}-detour`,
        server: this.host,
        server_port: this.port,
        uuid: this.state.uuid
      }
    ];
    return {
      name,
      type: 'ShadowTLS-VLESS',
      compat: false, // shadowtls:// is not recognized by v2rayN/v2rayNG
      uri: `shadowtls://${this.state.shadowTlsPassword}@${this.host}:${this.port}?sni=${sni}&version=3#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: sbOutbounds,
      singboxJson: JSON.stringify(sbOutbounds, null, 2),
      note: 'Use Hiddify, sing-box, or Clash Meta'
    };
  }

  generateShadowsocks() {
    if (!this.config.enable.shadowsocks || !this.state.shadowsocksPassword) return null;
    const name = `${this.prefix}Shadowsocks`;
    const method = this.config.shadowsocks.method || 'aes-256-gcm';
    const auth = Buffer.from(`${method}:${this.state.shadowsocksPassword}`).toString('base64');
    const clashProxy = {
      name,
      type: 'ss',
      server: this.host,
      port: this.port,
      cipher: method,
      password: this.state.shadowsocksPassword
    };
    const sbOutbound = {
      type: 'shadowsocks',
      tag: name,
      server: this.host,
      server_port: this.port,
      method,
      password: this.state.shadowsocksPassword
    };
    return {
      name,
      type: 'Shadowsocks',
      compat: true,
      uri: `ss://${auth}@${this.host}:${this.port}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  _getOrGenerateWgKeys() {
    let clientPriv = this.state && this.state.wireguardClientPrivateKey;
    let clientPub = this.state && this.state.wireguardClientPublicKey;
    let serverPriv = this.state && this.state.wireguardPrivateKey;
    let serverPub = this.state && this.state.wireguardPublicKey;

    const isValidBase64Key = (k) => typeof k === 'string' && k.trim().length >= 40;

    if (!isValidBase64Key(clientPriv)) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        clientPriv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        clientPub = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (_) {
        const raw = crypto.randomBytes(32);
        raw[0] &= 248; raw[31] &= 127; raw[31] |= 64;
        clientPriv = raw.toString('base64');
        clientPub = deriveX25519PublicKey(clientPriv) || crypto.randomBytes(32).toString('base64');
      }
    } else {
      const derived = deriveX25519PublicKey(clientPriv);
      if (derived) clientPub = derived;
    }

    if (!isValidBase64Key(serverPriv)) {
      try {
        const kp = crypto.generateKeyPairSync('x25519');
        serverPriv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32).toString('base64');
        serverPub = kp.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64');
      } catch (_) {
        const raw = crypto.randomBytes(32);
        raw[0] &= 248; raw[31] &= 127; raw[31] |= 64;
        serverPriv = raw.toString('base64');
        serverPub = deriveX25519PublicKey(serverPriv) || crypto.randomBytes(32).toString('base64');
      }
    } else {
      const derived = deriveX25519PublicKey(serverPriv);
      if (derived) serverPub = derived;
    }

    if (this.state) {
      this.state.wireguardClientPrivateKey = clientPriv;
      this.state.wireguardClientPublicKey = clientPub;
      this.state.wireguardPrivateKey = serverPriv;
      this.state.wireguardPublicKey = serverPub;
    }

    return { clientPriv, clientPub, serverPub };
  }

  generateWireGuard() {
    try {
      if (!this.config || !this.config.enable || !this.config.enable.wireguard) return null;

      const keys = this._getOrGenerateWgKeys();
      const clientPrivateKey = keys.clientPriv;
      const serverPublicKey = keys.serverPub;

      if (!clientPrivateKey || !serverPublicKey) return null;

      const name = `${this.prefix}WireGuard`;
      const port = (this.config.wireguard && this.config.wireguard.port) || this.port || 51820;
      const clientIp = (this.config.wireguard && this.config.wireguard.clientIp) || '10.66.66.2/32';
      const ifaceAddress = clientIp.endsWith('/32') ? clientIp.replace('/32', '/24') : clientIp;
      const mtu = (this.config.wireguard && this.config.wireguard.mtu) || 1420;

      const wgConf = [
        '[Interface]',
        `PrivateKey = ${clientPrivateKey}`,
        `Address = ${ifaceAddress}`,
        'DNS = 1.1.1.1, 8.8.8.8',
        `MTU = ${mtu}`,
        '',
        '[Peer]',
        `PublicKey = ${serverPublicKey}`,
        `Endpoint = ${this.host}:${port}`,
        'AllowedIPs = 0.0.0.0/0, ::/0',
        'PersistentKeepalive = 25'
      ].join('\n') + '\n';

      const clashProxy = {
        name,
        type: 'wireguard',
        server: this.host,
        port,
        ip: clientIp.replace(/\/.*$/, ''),
        'public-key': serverPublicKey,
        'private-key': clientPrivateKey,
        udp: true,
        'remote-dns-resolve': true,
        dns: ['1.1.1.1', '8.8.8.8'],
        mtu
      };

      const sbOutbound = {
        type: 'wireguard',
        tag: name,
        server: this.host,
        server_port: port,
        local_address: [clientIp],
        private_key: clientPrivateKey,
        peer_public_key: serverPublicKey,
        mtu
      };

      const rawUri = `wireguard://${encodeURIComponent(clientPrivateKey)}@${this.host}:${port}?publickey=${encodeURIComponent(serverPublicKey)}&address=${encodeURIComponent(clientIp)}&mtu=${mtu}#${urlSafeEncode(name)}`;

      return {
        name,
        type: 'WireGuard',
        compat: false,
        uri: rawUri,
        wgConf,
        clash: clashProxy,
        singboxOutbound: [sbOutbound],
        singboxJson: JSON.stringify([sbOutbound], null, 2),
        note: 'WireGuard .conf / Clash Meta / Sing-box'
      };
    } catch (err) {
      console.warn(`[WARN] WireGuard generation failed: ${err.message}. Skipping.`);
      return null;
    }
  }

  generateTuic() {
    if (!this.config.enable.tuic) return null;
    const name = `${this.prefix}TUIC`;
    const port = this.config.tuic.port || 8443;
    const sni = this.config.sniHy2 || 'www.google.com';
    const cc = this.config.tuic.congestionController || 'bbr';

    const clashProxy = {
      name,
      type: 'tuic',
      server: this.host,
      port,
      uuid: this.state.uuid,
      password: this.state.uuid,
      alpn: ['h3'],
      sni,
      'skip-cert-verify': true,
      'congestion-controller': cc,
      udp: true
    };

    const sbOutbound = {
      type: 'tuic',
      tag: name,
      server: this.host,
      server_port: port,
      uuid: this.state.uuid,
      password: this.state.uuid,
      congestion_controller: cc,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ['h3'],
        insecure: true
      }
    };

    return {
      name,
      type: 'TUIC',
      compat: false,
      uri: `tuic://${this.state.uuid}:${this.state.uuid}@${this.host}:${port}?congestion_control=${cc}&alpn=h3&sni=${sni}&allow_insecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateXhttp() {
    if (!this.config.enable.vlessXhttp) return null;
    const name = `${this.prefix}XHTTP`;
    return {
      name,
      type: 'VLESS-XHTTP',
      compat: false,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=xhttp&path=${urlSafeEncode(this.xhPath)}&mode=auto#${urlSafeEncode(name)}`,
      clash: null
    };
  }

  generateArgo(argoDomain) {
    if (!this.config.enable.argo || !argoDomain) return null;
    const name = `${this.prefix}Argo`;
    const clashProxy = {
      name,
      type: 'vless',
      server: argoDomain,
      port: 443,
      uuid: this.state.uuid,
      network: 'ws',
      tls: true,
      servername: argoDomain,
      'ws-opts': {
        path: this.wsPath,
        headers: { Host: argoDomain }
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: argoDomain,
      server_port: 443,
      uuid: this.state.uuid,
      tls: {
        enabled: true,
        server_name: argoDomain
      },
      transport: {
        type: 'ws',
        path: this.wsPath,
        headers: { Host: argoDomain }
      }
    };
    return {
      name,
      type: 'VLESS-Argo',
      compat: true,
      uri: `vless://${this.state.uuid}@${argoDomain}:443?encryption=none&security=tls&sni=${argoDomain}&type=ws&host=${argoDomain}&path=${urlSafeEncode(this.wsPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateTrojanWs() {
    if (!this.config.enable.trojanWs) return null;
    const name = `${this.prefix}Trojan-WS`;
    const trPath = this.trPath;
    const clashProxy = {
      name,
      type: 'trojan',
      server: this.host,
      port: this.port,
      password: this.state.uuid,
      network: 'ws',
      tls: false,
      'ws-opts': {
        path: trPath,
        headers: { Host: this.host }
      }
    };
    const sbOutbound = {
      type: 'trojan',
      tag: name,
      server: this.host,
      server_port: this.port,
      password: this.state.uuid,
      transport: {
        type: 'ws',
        path: trPath,
        headers: { Host: this.host }
      }
    };
    return {
      name,
      type: 'Trojan-WS',
      label: 'Trojan WebSocket Direct',
      compat: true,
      uri: `trojan://${this.state.uuid}@${this.host}:${this.port}?security=none&type=ws&host=${this.host}&path=${urlSafeEncode(trPath)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateTrojanGrpcTls() {
    if (!this.config.enable.trojanGrpcTls) return null;
    const name = `${this.prefix}Trojan-gRPC`;
    const sni = this.config.domain || this.host;
    const serviceName = this.grpcService;
    const clashProxy = {
      name,
      type: 'trojan',
      server: this.host,
      port: this.port,
      password: this.state.uuid,
      network: 'grpc',
      tls: true,
      sni: sni,
      'skip-cert-verify': true,
      alpn: ['h2'],
      'grpc-opts': {
        'grpc-service-name': serviceName
      }
    };
    const sbOutbound = {
      type: 'trojan',
      tag: name,
      server: this.host,
      server_port: this.port,
      password: this.state.uuid,
      tls: {
        enabled: true,
        server_name: sni,
        alpn: ['h2'],
        insecure: true
      },
      transport: {
        type: 'grpc',
        service_name: serviceName
      }
    };
    return {
      name,
      type: 'Trojan-gRPC-TLS',
      label: 'CDN gRPC Alternative',
      compat: true,
      uri: `trojan://${this.state.uuid}@${this.host}:${this.port}?security=tls&sni=${sni}&alpn=h2&type=grpc&serviceName=${urlSafeEncode(serviceName)}&fp=chrome&allowInsecure=1#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  generateVlessGrpc() {
    if (!this.config.enable.vlessGrpc) return null;
    const name = `${this.prefix}VLESS-gRPC`;
    const serviceName = this.grpcService;
    const clashProxy = {
      name,
      type: 'vless',
      server: this.host,
      port: this.port,
      uuid: this.state.uuid,
      network: 'grpc',
      tls: false,
      'grpc-opts': {
        'grpc-service-name': serviceName
      }
    };
    const sbOutbound = {
      type: 'vless',
      tag: name,
      server: this.host,
      server_port: this.port,
      uuid: this.state.uuid,
      transport: {
        type: 'grpc',
        service_name: serviceName
      }
    };
    return {
      name,
      type: 'VLESS-gRPC',
      label: 'gRPC Direct',
      compat: true,
      uri: `vless://${this.state.uuid}@${this.host}:${this.port}?encryption=none&security=none&type=grpc&serviceName=${urlSafeEncode(serviceName)}#${urlSafeEncode(name)}`,
      clash: clashProxy,
      singboxOutbound: [sbOutbound],
      singboxJson: JSON.stringify([sbOutbound], null, 2)
    };
  }

  getAllNodes(options = {}) {
    let argoDomain = null;
    let compat = 'v2ray';
    let allowLocalHost = this.config.allowLocalHostLinks || false;

    if (typeof options === 'string') {
      argoDomain = options;
    } else if (options && typeof options === 'object') {
      argoDomain = options.argoDomain || null;
      if (options.compat) compat = options.compat;
      if (options.allowLocalHostLinks !== undefined) allowLocalHost = options.allowLocalHostLinks;
    }

    let wgNode = null;
    try {
      wgNode = this.generateWireGuard();
    } catch (err) {
      console.warn(`[WARN] WireGuard skipped in getAllNodes: ${err.message}`);
    }

    const all = [
      this.generateReality(),
      this.generateVlessWsTls(),
      this.generateTrojanGrpcTls(),
      this.generateVmessWsTls(),
      this.generateVlessWs(),
      this.generateVmessWs(),
      this.generateTrojanWs(),
      this.generateVlessHttpUpgrade(),
      this.generateVlessGrpc(),
      this.generateXhttp(),
      this.generateShadowsocks(),
      wgNode,
      this.generateShadowTls(),
      this.generateTuic(),
      this.generateArgo(argoDomain)
    ].filter(Boolean);

    return all.filter(node => isValidNode(node, { allowLocalHostLinks: allowLocalHost, compatMode: compat }));
  }

  buildClashMetaYaml(nodes) {
    const proxyLines = [];
    const proxyNames = [];

    for (const node of nodes) {
      if (!node.clash) continue;
      proxyNames.push(node.clash.name);
      proxyLines.push(`  - name: ${yamlSafeQuote(node.clash.name)}`);
      proxyLines.push(`    type: ${node.clash.type}`);
      proxyLines.push(`    server: ${yamlSafeQuote(node.clash.server)}`);
      proxyLines.push(`    port: ${node.clash.port}`);

      if (node.clash.password) proxyLines.push(`    password: ${yamlSafeQuote(node.clash.password)}`);
      if (node.clash.uuid) proxyLines.push(`    uuid: ${yamlSafeQuote(node.clash.uuid)}`);
      if (node.clash.alterId !== undefined) proxyLines.push(`    alterId: ${node.clash.alterId}`);
      if (node.clash.sni) proxyLines.push(`    sni: ${yamlSafeQuote(node.clash.sni)}`);
      if (node.clash.servername) proxyLines.push(`    servername: ${yamlSafeQuote(node.clash.servername)}`);
      if (node.clash['skip-cert-verify'] !== undefined) proxyLines.push(`    skip-cert-verify: ${node.clash['skip-cert-verify']}`);
      if (node.clash.obfs) proxyLines.push(`    obfs: ${node.clash.obfs}`);
      if (node.clash['obfs-password']) proxyLines.push(`    obfs-password: ${yamlSafeQuote(node.clash['obfs-password'])}`);
      if (node.clash.alpn) proxyLines.push(`    alpn: [${node.clash.alpn.map(yamlSafeQuote).join(', ')}]`);
      if (node.clash.network) proxyLines.push(`    network: ${node.clash.network}`);
      if (node.clash.tls !== undefined) proxyLines.push(`    tls: ${node.clash.tls}`);
      if (node.clash.flow) proxyLines.push(`    flow: ${node.clash.flow}`);
      if (node.clash['client-fingerprint']) proxyLines.push(`    client-fingerprint: ${node.clash['client-fingerprint']}`);

      if (node.clash.ip) proxyLines.push(`    ip: ${yamlSafeQuote(node.clash.ip)}`);
      if (node.clash['public-key']) proxyLines.push(`    public-key: ${yamlSafeQuote(node.clash['public-key'])}`);
      if (node.clash['private-key']) proxyLines.push(`    private-key: ${yamlSafeQuote(node.clash['private-key'])}`);
      if (node.clash.udp !== undefined) proxyLines.push(`    udp: ${node.clash.udp}`);
      if (node.clash['remote-dns-resolve'] !== undefined) proxyLines.push(`    remote-dns-resolve: ${node.clash['remote-dns-resolve']}`);
      if (node.clash.dns) proxyLines.push(`    dns: [${node.clash.dns.map(yamlSafeQuote).join(', ')}]`);
      if (node.clash.mtu) proxyLines.push(`    mtu: ${node.clash.mtu}`);
      if (node.clash['congestion-controller']) proxyLines.push(`    congestion-controller: ${yamlSafeQuote(node.clash['congestion-controller'])}`);

      if (node.clash['reality-opts']) {
        proxyLines.push(`    reality-opts:`);
        proxyLines.push(`      public-key: ${yamlSafeQuote(node.clash['reality-opts']['public-key'])}`);
        proxyLines.push(`      short-id: ${yamlSafeQuote(node.clash['reality-opts']['short-id'])}`);
      }

      if (node.clash['ws-opts']) {
        proxyLines.push(`    ws-opts:`);
        proxyLines.push(`      path: ${yamlSafeQuote(node.clash['ws-opts'].path)}`);
        if (node.clash['ws-opts'].headers) {
          proxyLines.push(`      headers:`);
          for (const [k, v] of Object.entries(node.clash['ws-opts'].headers)) {
            proxyLines.push(`        ${k}: ${yamlSafeQuote(v)}`);
          }
        }
      }

      if (node.clash['httpupgrade-opts']) {
        proxyLines.push(`    httpupgrade-opts:`);
        proxyLines.push(`      path: ${yamlSafeQuote(node.clash['httpupgrade-opts'].path)}`);
        proxyLines.push(`      host: ${yamlSafeQuote(node.clash['httpupgrade-opts'].host)}`);
      }

      if (node.clash['grpc-opts']) {
        proxyLines.push(`    grpc-opts:`);
        proxyLines.push(`      grpc-service-name: ${yamlSafeQuote(node.clash['grpc-opts']['grpc-service-name'])}`);
      }

      if (node.clash.cipher) proxyLines.push(`    cipher: ${node.clash.cipher}`);
      if (node.clash.version) proxyLines.push(`    version: ${node.clash.version}`);
    }

    const proxiesBlock = proxyLines.join('\n');
    const proxyListStr = proxyNames.map(name => `      - ${yamlSafeQuote(name)}`).join('\n');

    return `# Mavis Panel - Clash Meta (Mihomo) Subscription
port: 7890
socks-port: 7891
allow-lan: true
mode: rule
log-level: info

proxies:
${proxiesBlock}

proxy-groups:
  - name: "🦇 Mavis Panel"
    type: select
    proxies:
      - "⚡ Auto Select"
${proxyListStr}

  - name: "⚡ Auto Select"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
${proxyListStr}

rules:
  - MATCH,"🦇 Mavis Panel"
`;
  }

  buildSingBoxClientJson(nodes) {
    const outbounds = [];
    const proxyTags = [];

    for (const node of nodes) {
      if (node.singboxOutbound && Array.isArray(node.singboxOutbound)) {
        for (const ob of node.singboxOutbound) {
          outbounds.push(ob);
        }
        proxyTags.push(node.name);
      }
    }

    const allOutbounds = [];

    if (proxyTags.length > 0) {
      allOutbounds.push(
        {
          type: 'selector',
          tag: '🦇 Mavis Panel',
          outbounds: ['⚡ Auto Select', ...proxyTags]
        },
        {
          type: 'urltest',
          tag: '⚡ Auto Select',
          outbounds: [...proxyTags],
          url: 'http://www.gstatic.com/generate_204',
          interval: '5m'
        }
      );
    }

    allOutbounds.push(...outbounds);
    allOutbounds.push(
      { type: 'direct', tag: 'direct' },
      { type: 'block', tag: 'block' }
    );

    return JSON.stringify({
      log: { level: 'info' },
      outbounds: allOutbounds
    }, null, 2);
  }
}

module.exports = {
  LinkGenerator,
  urlSafeEncode,
  yamlSafeQuote,
  deriveX25519PublicKey
};
