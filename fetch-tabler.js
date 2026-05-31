const https = require('https');
const fs = require('fs');

const iconMap = {
    globe: 'world',
    pencil: 'pencil',
    magnifyingGlass: 'search',
    cornersOut: 'box-model-2',
    cornersIn: 'arrows-minimize',
    arrowsOut: 'arrows-maximize',
    arrowsIn: 'arrows-minimize',
    monitor: 'device-desktop',
    tablet: 'device-tablet',
    deviceMobile: 'device-mobile',
    shareNetwork: 'share',
    textT: 'typography',
    image: 'photo',
    square: 'square',
    rows: 'layout-rows',
    heading: 'heading',
    copy: 'copy',
    trash: 'trash',
    atom: 'atom',
    stack: 'layers-subtract',
    gearFine: 'settings',
    close: 'x',
    dotsThreeVertical: 'dots-vertical',
    house: 'home',
    scroll: 'file-text',
    file: 'file',
    eye: 'eye',
    plus: 'plus',
    columns: 'layout-columns',
    grid: 'layout-grid',
    button: 'rectangle',
    separator: 'separator',
    spacer: 'space',
    quotes: 'quote',
    list: 'list',
    code: 'code',
    videoCamera: 'video',
    speakerHigh: 'volume',
    youtubeLogo: 'brand-youtube',
    playCircle: 'player-play',
    textAlignLeft: 'align-left',
    textAlignCenter: 'align-center',
    textAlignRight: 'align-right',
    textAlignJustify: 'align-justified',
    textBolder: 'bold',
    textItalic: 'italic',
    textUnderline: 'underline',
    textStrikethrough: 'strikethrough',
    arrowsVertical: 'arrows-vertical',
    link: 'link',
    sidebarSimple: 'layout-sidebar',
    article: 'article',
    compass: 'compass',
    caretLineUp: 'layout-navbar',
    caretLineDown: 'layout-bottombar'
};

const fetchIcon = (name) => {
    return new Promise((resolve) => {
        https.get(`https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/outline/${name}.svg`, (res) => {
            let data = '';
            if (res.statusCode !== 200) {
                console.error(`Failed to fetch ${name}`);
                resolve(null);
                return;
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // replace all newlines with spaces and multiple spaces with a single space
                let clean = data.replace(/\r?\n|\r/g, ' ').replace(/\s{2,}/g, ' ').trim();
                resolve(clean);
            });
        }).on('error', () => resolve(null));
    });
};

async function run() {
    let output = 'const icons = {\n';
    for (const [key, tablerName] of Object.entries(iconMap)) {
        console.log(`Fetching ${tablerName} for ${key}...`);
        const svg = await fetchIcon(tablerName);
        if (svg) {
            output += `    ${key}: \`${svg}\`,\n`;
        } else {
            console.log(`Fallback for ${key}`);
            output += `    ${key}: \`<svg viewBox="0 0 24 24"></svg>\`,\n`;
        }
    }
    output += '};\n';
    fs.writeFileSync('src/editor-icons.js', output);
    console.log('Done!');
}

run();
