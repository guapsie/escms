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

// --- 1. LA LIJA (Minificadores Zero-Bloat) ---
function minifyJS(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Elimina comentarios de bloque
        .replace(/(?<=^|\s)\/\/.*$/gm, '') // Elimina comentarios de línea (solo si hay espacio antes, evita romper regex) // ...
        .replace(/\s+/g, ' ')             // Colapsa múltiples espacios y saltos de línea
        .trim();
}

function minifyCSS(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*;\s*/g, ';')
        .trim();
}

// --- 2. AISLAMIENTO DEL ROUTER ---
const routerPath = path.join(srcDir, '04-router.php');
if (!fs.existsSync(routerPath)) {
    console.error('[!] 04-router.php no encontrado. Es necesario para el suicidio.');
    process.exit(1);
}
const routerContent = fs.readFileSync(routerPath, 'utf8');
const routerBase64 = Buffer.from(routerContent).toString('base64');
console.log(`[+] Router aislado para el suicidio: 04-router.php`);

// --- 3. RECOLECCIÓN Y EMPAQUETADO (PAYLOADS) ---
const payload = {
    php: [],
    js: [],
    css: [],
    atoms: [],
    templates: []
};

const files = fs.readdirSync(srcDir);

files.forEach(file => {
    const fullPath = path.join(srcDir, file);
    
    // Ignorar el router (ya aislado)
    if (file === '04-router.php') return;

    if (file.endsWith('.php')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        payload.php.push({ name: file, b64: Buffer.from(content).toString('base64') });
        console.log(`[+] Empaquetando backend (PHP): ${file}`);
    } else if (file.endsWith('.js')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = minifyJS(content);
        payload.js.push({ name: file, b64: Buffer.from(content).toString('base64') });
        console.log(`[+] Empaquetando asset JS (Minificado): ${file}`);
    } else if (file.endsWith('.css')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = minifyCSS(content);
        payload.css.push({ name: file, b64: Buffer.from(content).toString('base64') });
        console.log(`[+] Empaquetando asset CSS (Minificado): ${file}`);
    }
});

// Leer atoms de src/atoms
const atomsDir = path.join(srcDir, 'atoms');
if (fs.existsSync(atomsDir)) {
    const atomFolders = fs.readdirSync(atomsDir);
    atomFolders.forEach(folder => {
        const atomJsonPath = path.join(atomsDir, folder, 'atom.json');
        if (fs.existsSync(atomJsonPath)) {
            const content = fs.readFileSync(atomJsonPath, 'utf8');
            const minified = JSON.stringify(JSON.parse(content));
            payload.atoms.push({ folder: folder, b64: Buffer.from(minified).toString('base64') });
            console.log(`[+] Empaquetando Atom JSON: ${folder}`);
        }
    });
}

// Leer templates de src/templates
const templatesDir = path.join(srcDir, 'templates');
if (fs.existsSync(templatesDir)) {
    const tplFolders = fs.readdirSync(templatesDir);
    tplFolders.forEach(folder => {
        const tplPath = path.join(templatesDir, folder);
        if (fs.statSync(tplPath).isDirectory()) {
            const files = fs.readdirSync(tplPath);
            files.forEach(file => {
                const filePath = path.join(tplPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                payload.templates.push({ folder: folder, file: file, b64: Buffer.from(content).toString('base64') });
                console.log(`[+] Empaquetando Template ${folder}: ${file}`);
            });
        }
    });
}

const phpArrayStr = payload.php.map(f => `'${f.name}' => '${f.b64}'`).join(',\n    ');
const jsArrayStr = payload.js.map(f => `'${f.name}' => '${f.b64}'`).join(',\n    ');
const cssArrayStr = payload.css.map(f => `'${f.name}' => '${f.b64}'`).join(',\n    ');
const atomsArrayStr = payload.atoms.map(f => `'${f.folder}' => '${f.b64}'`).join(',\n    ');
const templatesArrayStr = payload.templates.map(f => `['folder' => '${f.folder}', 'file' => '${f.file}', 'b64' => '${f.b64}']`).join(',\n    ');

// --- 4. LA MUTACIÓN (Lógica del instalador Kamikaze) ---
// Extraemos el cascarón vivo (01-installer.php) si existe, o generamos uno básico.
let baseInstaller = '';
const installerPath = path.join(srcDir, '01-installer.php');
if (fs.existsSync(installerPath)) {
    baseInstaller = fs.readFileSync(installerPath, 'utf8');
    // Limpiamos la etiqueta de apertura para inyectar nuestra lógica arriba
    baseInstaller = baseInstaller.replace(/^<\?php\s*/i, '');
} else {
    baseInstaller = `echo "Installer UI faltante";`;
}

// Inyección del núcleo Kamikaze
const kamikazeLogic = `<?php
declare(strict_types=1);

// --- INYECCIÓN KAMIKAZE (Generada por build.js) ---
// Siempre detona si es el archivo Kamikaze
$__is_kamikaze_trigger = true;

if ($__is_kamikaze_trigger) {
    // 1. Crear estructura de carpetas
    $__dirs = [
        __DIR__ . '/core',
        __DIR__ . '/assets/js',
        __DIR__ . '/assets/css',
        __DIR__ . '/data',
        __DIR__ . '/data/user-settings'
    ];
    foreach ($__dirs as $d) {
        if (!is_dir($d)) mkdir($d, 0755, true);
    }

    // 2. Vomitar PHP en /core/
    $__php_payload = [
    ${phpArrayStr}
    ];
    foreach ($__php_payload as $f => $b64) {
        file_put_contents(__DIR__ . '/core/' . $f, base64_decode($b64));
    }

    // 3. Vomitar JS en /assets/js/
    $__js_payload = [
    ${jsArrayStr}
    ];
    foreach ($__js_payload as $f => $b64) {
        file_put_contents(__DIR__ . '/assets/js/' . $f, base64_decode($b64));
    }

    // 4. Vomitar CSS en /assets/css/
    $__css_payload = [
    ${cssArrayStr}
    ];
    foreach ($__css_payload as $f => $b64) {
        file_put_contents(__DIR__ . '/assets/css/' . $f, base64_decode($b64));
    }

    // 4.5 Vomitar Atoms en /data/atoms/ (Solo si no existen)
    $__atoms_payload = [
    ${atomsArrayStr}
    ];
    if (!is_dir(__DIR__ . '/data/atoms')) mkdir(__DIR__ . '/data/atoms', 0755, true);
    foreach ($__atoms_payload as $folder => $b64) {
        $atom_dir = __DIR__ . '/data/atoms/' . $folder;
        if (!is_dir($atom_dir)) {
            mkdir($atom_dir, 0755, true);
            file_put_contents($atom_dir . '/atom.json', base64_decode($b64));
        }
    }

    // 4.6 Vomitar Templates en /data/templates/
    $__tpl_payload = [
    ${templatesArrayStr}
    ];
    if (!is_dir(__DIR__ . '/data/templates')) mkdir(__DIR__ . '/data/templates', 0755, true);
    foreach ($__tpl_payload as $tpl) {
        $tpl_dir = __DIR__ . '/data/templates/' . $tpl['folder'];
        if (!is_dir($tpl_dir)) {
            mkdir($tpl_dir, 0755, true);
        }
        $tpl_file = $tpl_dir . '/' . $tpl['file'];
        if (!file_exists($tpl_file)) {
            file_put_contents($tpl_file, base64_decode($tpl['b64']));
        }
    }

    // 5. Crear el búnker (.htaccess para /core/)
    file_put_contents(__DIR__ . '/core/.htaccess', "Deny from all\\n");

    // 6. EL SUICIDIO: Sobrescribir este mismo archivo con el router
    $__router_b64 = '${routerBase64}';
    file_put_contents(__FILE__, base64_decode($__router_b64));

    // Refrescar para que el servidor ejecute el nuevo index.php (el router)
    header('Location: ' . $_SERVER['REQUEST_URI']);
    exit;
}
// --- FIN INYECCIÓN KAMIKAZE ---

// --- CASCARÓN ORIGINAL (01-installer.php) ---
${baseInstaller}
`;

fs.writeFileSync(outputFile, kamikazeLogic);
console.log(`[ESCMS] Build Kamikaze completado en ${outputFile}`);
console.log(`[ESCMS] ${payload.php.length} PHP, ${payload.js.length} JS, ${payload.css.length} CSS empaquetados.`);