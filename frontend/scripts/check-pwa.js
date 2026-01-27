#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifica configurazione PWA\n');

let errors = 0;
let warnings = 0;

function check(condition, message, isWarning = false) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    if (isWarning) {
      console.log(`⚠️  ${message}`);
      warnings++;
    } else {
      console.log(`❌ ${message}`);
      errors++;
    }
  }
}

// Check manifest
const manifestPath = path.join(__dirname, '../public/manifest.json');
check(fs.existsSync(manifestPath), 'manifest.json esiste');

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  check(manifest.name === 'DGGM ERP', 'manifest.name corretto');
  check(manifest.icons && manifest.icons.length === 8, 'manifest ha 8 icone');
  check(manifest.shortcuts && manifest.shortcuts.length === 3, 'manifest ha 3 shortcuts');
}

// Check icons
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
iconSizes.forEach(size => {
  const iconPath = path.join(__dirname, `../public/icons/icon-${size}x${size}.png`);
  check(fs.existsSync(iconPath), `Icona ${size}x${size} esiste`);
});

// Check apple-touch-icon
const appleTouchPath = path.join(__dirname, '../public/apple-touch-icon.png');
check(fs.existsSync(appleTouchPath), 'apple-touch-icon.png esiste');

// Check favicon
const faviconPath = path.join(__dirname, '../public/favicon.png');
check(fs.existsSync(faviconPath), 'favicon.png esiste');

// Check offline page
const offlinePath = path.join(__dirname, '../app/offline/page.tsx');
check(fs.existsSync(offlinePath), 'Pagina offline esiste');

// Check offline indicator
const offlineIndicatorPath = path.join(__dirname, '../components/offline-indicator.tsx');
check(fs.existsSync(offlineIndicatorPath), 'OfflineIndicator component esiste');

// Check hook
const hookPath = path.join(__dirname, '../hooks/use-online.ts');
check(fs.existsSync(hookPath), 'useOnline hook esiste');

// Check next.config.ts
const configPath = path.join(__dirname, '../next.config.ts');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  check(configContent.includes('withPWA'), 'next.config.ts usa withPWA');
  check(configContent.includes('NetworkFirst'), 'Cache strategy NetworkFirst configurata');
  check(configContent.includes('turbopack'), 'Turbopack config presente');
}

// Check types
const typesPath = path.join(__dirname, '../next-pwa.d.ts');
check(fs.existsSync(typesPath), 'TypeScript types per next-pwa esistono');

// Check .gitignore
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  check(gitignoreContent.includes('sw.js'), '.gitignore include sw.js');
}

// Check docs
const docsPath = path.join(__dirname, '../PWA_GUIDE.md');
check(fs.existsSync(docsPath), 'PWA_GUIDE.md esiste');

const implPath = path.join(__dirname, '../PWA_IMPLEMENTATION.md');
check(fs.existsSync(implPath), 'PWA_IMPLEMENTATION.md esiste');

console.log('\n' + '='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 Tutto OK! PWA configurata correttamente.\n');
  console.log('Next steps:');
  console.log('1. npm run build');
  console.log('2. npm run start');
  console.log('3. Apri http://localhost:3000');
  console.log('4. Installa l\'app dal browser\n');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} errori trovati`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning trovati`);
  }
  console.log('\nRisolvere i problemi prima di procedere.\n');
  process.exit(1);
}