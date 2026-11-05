const fs = require('fs');

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  electric: '\x1b[38;5;39m',
  navy: '\x1b[38;5;25m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

class Logger {
  static quiet = false;

  static banner() {
    if (this.quiet) return;
    console.log(`\n${ANSI.white}${ANSI.bold}  ======================================================${ANSI.reset}`);
    console.log(`${ANSI.white}${ANSI.bold}  Mavis Panel ${ANSI.dim}• Stealth Single-Port Proxy Gateway${ANSI.reset}`);
    console.log(`${ANSI.white}${ANSI.bold}  ======================================================${ANSI.reset}\n`);
  }

  static renewNotice() {
    // Cleaned up - no promotional renewal notice
  }

  static info(msg) {
    if (!this.quiet) console.log(`${ANSI.cyan}[i] ${msg}${ANSI.reset}`);
  }

  static success(msg) {
    if (!this.quiet) console.log(`${ANSI.green}[OK] ${msg}${ANSI.reset}`);
  }

  static warn(msg) {
    if (!this.quiet) console.log(`${ANSI.yellow}[!] ${msg}${ANSI.reset}`);
  }

  static error(msg) {
    console.error(`${ANSI.red}[X] ${msg}${ANSI.reset}`);
  }

  static step(msg) {
    if (!this.quiet) console.log(`${ANSI.electric}==> ${msg}${ANSI.reset}`);
  }

  static item(label, val) {
    if (!this.quiet) {
      console.log(`  ${ANSI.cyan}${label.padEnd(18)}:${ANSI.reset} ${ANSI.white}${val}${ANSI.reset}`);
    }
  }

  static section(title) {
    if (!this.quiet) {
      console.log(`\n${ANSI.bold}${ANSI.electric}--- ${title} ---${ANSI.reset}`);
    }
  }

  static readTailSync(filePath, maxBytes) {
    return readTailSync(filePath, maxBytes);
  }

  static rotateLogIfNeeded(filePath, maxSizeBytes, retainBytes) {
    return rotateLogIfNeeded(filePath, maxSizeBytes, retainBytes);
  }
}

/**
 * Safe, bounded tail reader: reads up to maxBytes from the end of a file.
 * Allocates at most maxBytes in memory, preventing high memory usage or OOM.
 * @param {string} filePath - Path to file
 * @param {number} maxBytes - Maximum number of bytes to read from end of file (default 64KB)
 * @returns {string} - Tail text as UTF-8 string, or empty string on error / missing file
 */
function readTailSync(filePath, maxBytes = 64 * 1024) {
  try {
    if (!filePath || typeof filePath !== 'string' || !fs.existsSync(filePath)) return '';
    const stat = fs.statSync(filePath);
    if (!stat.size || stat.size <= 0) return '';
    const bytesToRead = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(bytesToRead);
    const fd = fs.openSync(filePath, 'r');
    try {
      const position = stat.size - bytesToRead;
      fs.readSync(fd, buffer, 0, bytesToRead, position);
      return buffer.toString('utf8');
    } finally {
      try { fs.closeSync(fd); } catch {}
    }
  } catch {
    return '';
  }
}

/**
 * Safe log rotation & in-place truncation helper:
 * If the log file exceeds maxSizeBytes, truncates it in-place and preserves the last retainBytes.
 * Using in-place write keeps open O_APPEND file descriptors held by child processes valid.
 * @param {string} filePath - Path to log file
 * @param {number} maxSizeBytes - Size threshold to trigger rotation (default 5MB)
 * @param {number} retainBytes - Number of recent bytes to retain from tail (default 256KB)
 * @returns {boolean} - True if truncated/rotated, false otherwise
 */
function rotateLogIfNeeded(filePath, maxSizeBytes = 5 * 1024 * 1024, retainBytes = 256 * 1024) {
  try {
    if (!filePath || typeof filePath !== 'string' || !fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < maxSizeBytes) return false;

    const bytesToKeep = Math.min(stat.size, retainBytes);
    let tailBuffer = null;
    if (bytesToKeep > 0) {
      tailBuffer = Buffer.alloc(bytesToKeep);
      const rfd = fs.openSync(filePath, 'r');
      try {
        fs.readSync(rfd, tailBuffer, 0, bytesToKeep, stat.size - bytesToKeep);
      } finally {
        try { fs.closeSync(rfd); } catch {}
      }

      // If we trimmed from the middle of the file, strip any initial broken line
      if (bytesToKeep < stat.size) {
        const newlineIdx = tailBuffer.indexOf(0x0a);
        if (newlineIdx !== -1 && newlineIdx < tailBuffer.length - 1) {
          tailBuffer = tailBuffer.subarray(newlineIdx + 1);
        }
      }
    }

    const prevMb = (stat.size / (1024 * 1024)).toFixed(2);
    const header = Buffer.from(
      `\n--- [LOG ROTATED & TRUNCATED at ${new Date().toISOString()} (previous size: ${prevMb} MB)] ---\n`,
      'utf8'
    );

    const wfd = fs.openSync(filePath, 'w');
    try {
      fs.writeSync(wfd, header);
      if (tailBuffer && tailBuffer.length > 0) {
        fs.writeSync(wfd, tailBuffer);
      }
    } finally {
      try { fs.closeSync(wfd); } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  ANSI,
  Logger,
  readTailSync,
  rotateLogIfNeeded
};
