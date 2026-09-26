import net from 'node:net';

export type McStatus = {
  online: boolean;
  host: string;
  port: number;
  version?: string;
  protocol?: number;
  playersOnline?: number;
  playersMax?: number;
  motd?: string;
  latencyMs?: number;
  error?: string;
};

const HANDSHAKE_HOST = 'abstract.pmcs.life';

function varint(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v !== 0) b |= 0x80;
    bytes.push(b);
  } while (v !== 0);
  return Buffer.from(bytes);
}

function readVarint(buf: Buffer, offset: number): { value: number; size: number } | null {
  let value = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length && shift <= 35) {
    const byte = buf[pos++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return { value: value >>> 0, size: pos - offset };
    shift += 7;
  }
  return null;
}

function stripMotd(motd: unknown): string {
  if (typeof motd === 'string') return motd;
  if (motd && typeof motd === 'object' && 'text' in motd) return String((motd as { text: string }).text);
  if (Array.isArray(motd)) return motd.map(stripMotd).join('\n');
  return '';
}

function ping(host: string, port: number, timeoutMs = 6000): Promise<McStatus> {
  return new Promise((resolve) => {
    const started = Date.now();
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = (result: McStatus) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const payload = Buffer.concat([
        varint(0x00),
        varint(767), // protocol version (varint, 1.20.5+)
        varint(HANDSHAKE_HOST.length),
        Buffer.from(HANDSHAKE_HOST, 'utf8'),
        varint(port),
        varint(1), // next state: status
      ]);
      socket.write(Buffer.concat([varint(payload.length), payload]));
      socket.write(Buffer.concat([varint(1), varint(0x00)]));
    });

    socket.on('data', (chunk) => {
      chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const len = readVarint(buf, 0);
      if (!len) return;
      if (buf.length < len.size + len.value) return;
      const body = buf.subarray(len.size, len.size + len.value);
      try {
        const jsonLen = readVarint(body, 0);
        if (!jsonLen) return;
        const json = JSON.parse(body.subarray(jsonLen.size, jsonLen.size + jsonLen.value).toString('utf8'));
        finish({
          online: true,
          host,
          port,
          version: json.version?.name,
          protocol: json.version?.protocol,
          playersOnline: json.players?.online,
          playersMax: json.players?.max,
          motd: stripMotd(json.description).slice(0, 400),
          latencyMs: Date.now() - started,
        });
      } catch (err) {
        finish({ online: false, host, port, error: String(err) });
      }
    });

    socket.on('timeout', () => finish({ online: false, host, port, error: 'timeout' }));
    socket.on('error', (err) => finish({ online: false, host, port, error: err.message }));
  });
}

export function serverStatus(host: string, port: number): Promise<McStatus> {
  return ping(host, port).catch((err) => ({ online: false, host, port, error: String(err) }));
}
