import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateFavicons() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate 32x32 PNG for icon.png in public
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon-32x32.png'));

  // 2. Generate 192x192 PNG for app icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'icon.png'));

  // 3. Generate 180x180 PNG for apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));

  // 4. Generate 48x48 PNG to replace src/app/favicon.ico
  const png48 = await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toBuffer();

  // ICO header for single 48x48 PNG
  // 6 bytes header: 0,0, 1,0 (type 1 for icon), 1,0 (1 image)
  // 16 bytes directory entry:
  // width: 48, height: 48, colorCount: 0, reserved: 0, planes: 1,0, bpp: 32,0, bytesize: uint32, offset: uint32 (22)
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  header.writeUInt8(48, 6);  // width
  header.writeUInt8(48, 7);  // height
  header.writeUInt8(0, 8);   // colors
  header.writeUInt8(0, 9);   // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(png48.length, 14); // data size
  header.writeUInt32LE(22, 18); // offset to data

  const icoBuffer = Buffer.concat([header, png48]);
  fs.writeFileSync(path.join(process.cwd(), 'src', 'app', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), icoBuffer);

  console.log("Favicons generated successfully!");
}

generateFavicons().catch(err => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
