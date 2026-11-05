const fs = require('fs');
const { spawn } = require('child_process');
const { Logger, rotateLogIfNeeded } = require('../logger');

class MtgEngine {
  constructor(config, stateManager, localPort) {
    this.config = config;
    this.paths = config.paths;
    this.stateManager = stateManager;
    this.port = localPort;
    this.process = null;
    this.logRotatorTimer = null;
  }

  buildTomlConfig(secret) {
    const concurrency = (this.config.mtproto && this.config.mtproto.concurrency) || 512;
    const preferIp = (this.config.mtproto && this.config.mtproto.preferIp) || 'prefer-ipv4';
    const timeSkew = (this.config.mtproto && this.config.mtproto.tolerateTimeSkewness) || '120s';
    const socks5 = (this.config.mtproto && this.config.mtproto.socks5) || '';

    let toml = `# Mavis Panel MTProto Engine (mtg) configuration
secret = ${JSON.stringify(secret)}
bind-to = "127.0.0.1:${this.port}"
concurrency = ${concurrency}
prefer-ip = "${preferIp}"
tolerate-time-skewness = "${timeSkew}"
allow-fallback-on-unknown-dc = true

[network.timeout]
tcp = "5s"
http = "10s"
idle = "5m"
handshake = "10s"

[defense.anti-replay]
enabled = true
max-size = "1mib"

# Blocklist disabled to prevent false-positive bans of client/loopback subnets
[defense.blocklist]
enabled = false
`;

    if (socks5) {
      toml += `
[network]
proxies = [
  ${JSON.stringify(socks5)}
]
`;
    }

    return toml;
  }

  start() {
    if (!this.config.enable.mtproto || !fs.existsSync(this.paths.mtgBin)) {
      Logger.warn('mtg binary missing or MTProto disabled. MTProto engine skipped.');
      return false;
    }

    const secret = this.stateManager.state.mtprotoSecret;
    if (!secret) {
      Logger.warn('MTProto secret missing in state. MTProto engine skipped.');
      return false;
    }

    const maxLogSize = (this.config.maxLogSizeMb || 5) * 1024 * 1024;
    rotateLogIfNeeded(this.paths.mtgLog, maxLogSize);

    // Write robust TOML config with generous time skew and disabled FireHOL blocklist
    const tomlContent = this.buildTomlConfig(secret);
    try {
      fs.writeFileSync(this.paths.mtgConfig, tomlContent, 'utf8');
    } catch (err) {
      Logger.warn(`Failed to write mtg.toml: ${err.message}`);
    }

    const args = ['run', this.paths.mtgConfig];

    Logger.step(`Launching Telegram MTProto proxy (mtg) on local port ${this.port}...`);
    const logFd = fs.openSync(this.paths.mtgLog, 'a');

    this.process = spawn(this.paths.mtgBin, args, {
      stdio: ['ignore', logFd, logFd],
      detached: false
    });

    this.logRotatorTimer = setInterval(() => {
      rotateLogIfNeeded(this.paths.mtgLog, maxLogSize);
    }, 60000);
    if (this.logRotatorTimer.unref) this.logRotatorTimer.unref();

    this.process.on('error', (err) => {
      Logger.warn(`MTProto mtg engine error: ${err.message}`);
    });

    this.process.on('exit', (code, sig) => {
      if (this.logRotatorTimer) {
        clearInterval(this.logRotatorTimer);
        this.logRotatorTimer = null;
      }
      try { fs.closeSync(logFd); } catch {}
      if (code !== 0 && code !== null) {
        Logger.warn(`mtg process exited with code ${code} (${sig || 'none'})`);
      }
    });

    Logger.success(`Telegram MTProto engine (mtg) running on local port ${this.port}.`);
    return true;
  }

  stop() {
    if (this.logRotatorTimer) {
      clearInterval(this.logRotatorTimer);
      this.logRotatorTimer = null;
    }
    if (this.process && !this.process.killed) {
      try {
        this.process.kill('SIGTERM');
      } catch {}
    }
  }
}

module.exports = { MtgEngine };
