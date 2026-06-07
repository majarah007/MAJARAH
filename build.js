const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  ensureDirExists(dirPath);
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}:;,])\s*/g, '$1')
    .trim();
}

function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim();
}

console.log('🚀 Starting MAJARAH build process...');

const distDir = path.join(__dirname, 'dist');
const fienDistDir = path.join(distDir, 'fien');

cleanDir(distDir);
ensureDirExists(fienDistDir);

const srcStorefrontDir = path.join(__dirname, 'src', 'storefront');
const srcAdminDir = path.join(__dirname, 'src', 'admin');

// 3. Process Storefront
console.log('📦 Compiling Storefront...');
if (fs.existsSync(srcStorefrontDir)) {
  const htmlSrc = fs.readFileSync(path.join(srcStorefrontDir, 'index.html'), 'utf8');
  const jsSrc = fs.readFileSync(path.join(srcStorefrontDir, 'storefront.js'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(srcStorefrontDir, 'storefront.css'), 'utf8');

  const minHtml = minifyHtml(htmlSrc);
  const minCss = minifyCss(cssSrc);

  console.log('🔒 Obfuscating storefront.js...');
  const obfuscatedJs = JavaScriptObfuscator.obfuscate(jsSrc, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.6,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayThreshold: 0.8,
    splitStrings: true,
    splitStringsChunkLength: 6,
    unicodeEscapeSequence: false
  }).getObfuscatedCode();

  fs.writeFileSync(path.join(distDir, 'index.html'), minHtml);
  fs.writeFileSync(path.join(distDir, 'storefront.css'), minCss);
  fs.writeFileSync(path.join(distDir, 'storefront.js'), obfuscatedJs);
  console.log('✔ Storefront compiled successfully.');
} else {
  console.warn('⚠ Storefront source directory not found.');
}

// 4. Process Admin Panel
console.log('📦 Compiling Admin Panel...');
if (fs.existsSync(srcAdminDir)) {
  const htmlSrc = fs.readFileSync(path.join(srcAdminDir, 'index.html'), 'utf8');
  const jsSrc = fs.readFileSync(path.join(srcAdminDir, 'admin.js'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(srcAdminDir, 'admin.css'), 'utf8');

  const minHtml = minifyHtml(htmlSrc);
  const minCss = minifyCss(cssSrc);

  console.log('🔒 Obfuscating admin.js...');
  const obfuscatedJs = JavaScriptObfuscator.obfuscate(jsSrc, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayThreshold: 0.8,
    splitStrings: true,
    splitStringsChunkLength: 6,
    unicodeEscapeSequence: false
  }).getObfuscatedCode();

  fs.writeFileSync(path.join(fienDistDir, 'index.html'), minHtml);
  fs.writeFileSync(path.join(fienDistDir, 'admin.css'), minCss);
  fs.writeFileSync(path.join(fienDistDir, 'admin.js'), obfuscatedJs);
  console.log('✔ Admin Panel compiled successfully.');
} else {
  console.warn('⚠ Admin Panel source directory not found.');
}

// 5. Copy static assets
console.log('📋 Copying static assets...');
const srcAssetsDir = path.join(__dirname, 'src', 'assets');
if (fs.existsSync(srcAssetsDir)) {
  const assets = fs.readdirSync(srcAssetsDir);
  assets.forEach(asset => {
    const srcPath = path.join(srcAssetsDir, asset);
    const destPath = path.join(distDir, asset);
    if (fs.lstatSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  -> Copied ${asset}`);
    }
  });
} else {
  console.warn('⚠ src/assets directory not found.');
}

console.log('🎉 MAJARAH build completed successfully!');
