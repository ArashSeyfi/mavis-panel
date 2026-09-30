/**
 * Extracts Server Name Indication (SNI) and ALPN from TLS ClientHello record buffer
 * RFC 5246 / RFC 8446 / RFC 7301 compliant binary parser
 */
function parseClientHello(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 42) {
    return { sni: null, alpn: [] };
  }

  try {
    if (buf[0] !== 0x16 || buf[1] !== 0x03) {
      return { sni: null, alpn: [] };
    }

    let offset = 5;
    if (buf[offset] !== 0x01) {
      return { sni: null, alpn: [] };
    }

    offset += 1 + 3 + 2 + 32;
    if (offset >= buf.length) return { sni: null, alpn: [] };

    const sessionIdLen = buf[offset];
    offset += 1 + sessionIdLen;
    if (offset + 2 > buf.length) return { sni: null, alpn: [] };

    const cipherSuitesLen = buf.readUInt16BE(offset);
    offset += 2 + cipherSuitesLen;
    if (offset + 1 > buf.length) return { sni: null, alpn: [] };

    const compMethodsLen = buf[offset];
    offset += 1 + compMethodsLen;
    if (offset + 2 > buf.length) return { sni: null, alpn: [] };

    const extTotalLen = buf.readUInt16BE(offset);
    offset += 2;
    const extLimit = Math.min(offset + extTotalLen, buf.length);

    let sni = null;
    const alpn = [];

    while (offset + 4 <= extLimit) {
      const extType = buf.readUInt16BE(offset);
      const extLen = buf.readUInt16BE(offset + 2);
      offset += 4;

      if (extType === 0x0000 && !sni) {
        // server_name
        if (offset + 2 <= extLimit) {
          const sniListLen = buf.readUInt16BE(offset);
          let sniOffset = offset + 2;
          const sniLimit = Math.min(sniOffset + sniListLen, extLimit);

          while (sniOffset + 3 <= sniLimit) {
            const nameType = buf[sniOffset];
            const nameLen = buf.readUInt16BE(sniOffset + 1);
            sniOffset += 3;

            if (nameType === 0x00 && sniOffset + nameLen <= buf.length) {
              sni = buf.toString('utf8', sniOffset, sniOffset + nameLen);
              break;
            }
            sniOffset += nameLen;
          }
        }
      } else if (extType === 0x0010) {
        // ALPN (Application-Layer Protocol Negotiation)
        if (offset + 2 <= extLimit) {
          const alpnListLen = buf.readUInt16BE(offset);
          let aOffset = offset + 2;
          const aLimit = Math.min(aOffset + alpnListLen, extLimit);
          while (aOffset + 1 <= aLimit) {
            const pLen = buf[aOffset];
            aOffset++;
            if (aOffset + pLen <= aLimit) {
              alpn.push(buf.toString('utf8', aOffset, aOffset + pLen));
            }
            aOffset += pLen;
          }
        }
      }

      offset += extLen;
    }

    return { sni, alpn };
  } catch {
    return { sni: null, alpn: [] };
  }
}

function parseClientHelloSni(buf) {
  return parseClientHello(buf).sni;
}

function parseClientHelloAlpn(buf) {
  return parseClientHello(buf).alpn;
}

module.exports = {
  parseClientHello,
  parseClientHelloSni,
  parseClientHelloAlpn
};
