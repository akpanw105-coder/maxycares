import fs from 'fs';
import path from 'path';
import https from 'https';

const images = {
  'hero-consultation.jpg': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
  'pharmacy-interior.jpg': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1000&q=80',
  'pharmacist-care.jpg': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
  'medication-dispensing.jpg': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80',
  'vitamins-wellness.jpg': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  'family-wellness.jpg': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  'diagnostics.jpg': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
};

const dir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(images)) {
    const dest = path.join(dir, name);
    console.log(`Downloading ${name}...`);
    await download(url, dest);
  }
  console.log('All images downloaded successfully!');
}

run().catch(console.error);
