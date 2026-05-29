const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'dist');
const outputFile = path.join(outDir, 'index.php');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

if (!fs.existsSync(srcDir)) {
    console.error('[!] Directorio src/ no encontrado.');
    process.exit(1);
}

const files = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.php'))
    .sort();

let outputCode = '<?php\n\ndeclare(strict_types=1);\n\n// ESCMS Core - Build autogenerado. NO EDITAR.\n\n';

files.forEach(file => {
    console.log(`[+] Empaquetando backend (PHP): ${file}`);
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    content = content.replace(/^<\?php\s*/i, '');
    content = content.replace(/\?>\s*$/, '');
    content = content.replace(/declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/ig, '');
    
    outputCode += `// --- Archivo: ${file} ---\n` + content.trim() + '\n\n';
});

let assetsPayload = '';
const assetFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js') || f.endsWith('.css'));
assetFiles.forEach(file => {
    console.log(`[+] Inyectando asset (Base64): ${file}`);
    const content = fs.readFileSync(path.join(srcDir, file));
    const b64 = content.toString('base64');
    const dir = file.endsWith('.js') ? 'core/js' : 'core/css';
    assetsPayload += `        '${dir}/${file}' => '${b64}',\n`;
});
outputCode = outputCode.replace('/*__ASSETS_PAYLOAD__*/', assetsPayload.trim());

fs.writeFileSync(outputFile, outputCode);
console.log(`[ESCMS] Build completado. ${files.length} archivos concatenados en ${outputFile}`);