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

    const concurrency = String((this.config.mtproto && this.config.mtproto.concurrency) || 512);
    const preferIp = (this.config.mtproto && this.config.mtproto.preferIp) || 'prefer-ipv4';

    const args = [
      'simple-run',
      `127.0.0.1:${this.port}`,
      secret,
      '--concurrency', concurrency,
      '--prefer-ip', preferIp,
      '--antireplay-cache-size', '1MB'
    ];

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
