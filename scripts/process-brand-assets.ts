import fs from 'fs';
import path from 'path';

async function processBrandAssets() {
  const brandDir = path.join(process.cwd(), 'public', 'brand');
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
  }

  const logoSrc = path.join(process.cwd(), 'assests', 'examtwister_logo.png');
  const bannerSrc = path.join(process.cwd(), 'assests', 'examtwister_banner.png');
  const notesLogoSrc = path.join(process.cwd(), 'assests', 'examtwisternotes_logo.png');

  // Copy files to public/brand/
  fs.copyFileSync(logoSrc, path.join(brandDir, 'logo.png'));
  fs.copyFileSync(bannerSrc, path.join(brandDir, 'banner.png'));
  if (fs.existsSync(notesLogoSrc)) {
    fs.copyFileSync(notesLogoSrc, path.join(brandDir, 'notes-logo.png'));
  }

  console.log('Copied brand assets to public/brand/');

  try {
    const sharp = (await import('sharp')).default;

    // Generate web-optimized logo
    await sharp(logoSrc)
      .resize(512, 512)
      .png({ quality: 90 })
      .toFile(path.join(brandDir, 'logo-512.png'));

    // Generate Next.js app icons
    const appDir = path.join(process.cwd(), 'app');
    await sharp(logoSrc)
      .resize(32, 32)
      .png()
      .toFile(path.join(appDir, 'icon.png'));

    await sharp(logoSrc)
      .resize(180, 180)
      .png()
      .toFile(path.join(appDir, 'apple-icon.png'));

    await sharp(logoSrc)
      .resize(32, 32)
      .toFormat('png')
      .toFile(path.join(process.cwd(), 'public', 'favicon.ico'));

    console.log('Generated icons and favicons successfully!');
  } catch (err) {
    console.error('Sharp processing error:', err);
  }
}

processBrandAssets();
