const fs = require('fs');
const path = require('path');

function createSolidPng(filePath, width, height, r, g, b, a = 255) {
  const zlib = require('zlib');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return crc ^ -1;
  }

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

const manifestPath = path.resolve('.riot-ai/11-ASSET-MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.entries.forEach(entry => {
  if (entry.format === 'png') {
    const targetPath = path.resolve(entry.path);
    createSolidPng(targetPath, 64, 64, 215, 255, 0, 255); // #D7FF00 R!OT Lime
    entry.status = 'generated';
  } else if (entry.format === 'svg') {
    const targetPath = path.resolve(entry.path);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#11110F" />
  <path d="M10 10 L90 90 M90 10 L10 90" stroke="#D7FF00" stroke-width="8" stroke-linecap="square" />
  <text x="50" y="55" font-family="monospace" font-size="10" font-weight="bold" fill="#FF3EA5" text-anchor="middle">R!OT::${entry.id}</text>
</svg>`;
    fs.writeFileSync(targetPath, svgContent, 'utf8');
    entry.status = 'generated';
  }
});

manifest.p5_sketches.forEach(sketch => {
  const targetPath = path.resolve(sketch.path);
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const sketchContent = `// R!OT OS Generative Engine: ${sketch.name}
export function setupSketch(p: any, container: HTMLElement) {
  p.setup = () => {
    p.createCanvas(container.clientWidth || 400, 200).parent(container);
    p.background(17, 17, 15);
  };
  p.draw = () => {
    p.stroke(215, 255, 0);
    p.strokeWeight(2);
    p.line(p.random(p.width), p.random(p.height), p.random(p.width), p.random(p.height));
    if (p.frameCount > 100) p.noLoop();
  };
}
`;
  fs.writeFileSync(targetPath, sketchContent, 'utf8');
  sketch.status = 'generated';
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Artwork manifest and asset generation complete.');

