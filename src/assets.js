const fs = require('fs');
const path = require('path');

class AssetManager {
  static getIndexHtml() {
    return fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  }

  static getAppCss() {
    return fs.readFileSync(path.join(__dirname, 'public', 'app.css'), 'utf8');
  }

  static getAppJs() {
    return fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');
  }

  static getLogoSvg() {
    return fs.readFileSync(path.join(__dirname, 'public', 'logo.svg'), 'utf8');
  }

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
    try {
      return Buffer.from(this.getLogoSvg(), 'utf8');
    } catch (_) {
      return Buffer.from('<svg></svg>', 'utf8');
    }
  }
}

module.exports = { AssetManager };
