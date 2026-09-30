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
}

module.exports = { ANSI, Logger };
