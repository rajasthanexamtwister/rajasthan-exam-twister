import sharp from 'sharp';
import fs from 'fs';

async function generateMobileBanner() {
  const inputBanner = 'public/brand/banner.webp';
  
  // Mobile banner WebP (768px wide)
  await sharp(inputBanner)
    .resize(768, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile('public/brand/banner-mobile.webp');

  const mobileWebpStats = fs.statSync('public/brand/banner-mobile.webp');
  console.log(`Mobile WebP banner size: ${(mobileWebpStats.size / 1024).toFixed(2)} KB`);

  // Mobile banner PNG (768px wide)
  await sharp(inputBanner)
    .resize(768, null, { withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toFile('public/brand/banner-mobile.png');

  const mobilePngStats = fs.statSync('public/brand/banner-mobile.png');
  console.log(`Mobile PNG banner size: ${(mobilePngStats.size / 1024).toFixed(2)} KB`);
}

generateMobileBanner().catch(err => {
  console.error('Mobile banner generation failed:', err);
  process.exit(1);
});
