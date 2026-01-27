const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '../public/icons');
const svgPath = path.join(iconDir, 'icon.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const size of sizes) {
    const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);

    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated ${size}x${size} icon`);
  }

  // Generate favicon.ico (32x32)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));

  console.log('✅ Generated favicon.png (32x32)');

  // Generate apple-touch-icon (180x180)
  const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);

  console.log('✅ Generated apple-touch-icon.png (180x180)');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);