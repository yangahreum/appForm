import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const payload = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([len, payload, crc]);
}

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB

  const rowSize = 1 + size * 3;
  const rawData = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    rawData[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const offset = y * rowSize + 1 + x * 3;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', deflateSync(rawData)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Indigo #4f46e5 = rgb(79, 70, 229)
const [R, G, B] = [79, 70, 229];
const iconDir = join(ROOT, 'public', 'icons');
mkdirSync(iconDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(iconDir, `icon${size}.png`), createPNG(size, R, G, B));
  console.log(`  icon${size}.png 생성 완료`);
}
