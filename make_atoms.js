const fs = require('fs');
const path = require('path');

const atomsConfig = [
    { cat: 'layout', items: [
        { name: 'Header', tag: 'header', icon: 'caretLineUp', className: 'escms-header', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Main', tag: 'main', icon: 'square', className: 'escms-main', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Section', tag: 'section', icon: 'section', className: 'escms-section', allowedControls: ['bgColor', 'bgGradient', 'bgImage', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Article', tag: 'article', icon: 'article', className: 'escms-article', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Aside', tag: 'aside', icon: 'sidebarSimple', className: 'escms-aside', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Nav', tag: 'nav', icon: 'compass', className: 'escms-nav', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] },
        { name: 'Footer', tag: 'footer', icon: 'caretLineDown', className: 'escms-footer', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity'] }
    ]},
    { cat: 'structure', items: [
        { name: 'Container', tag: 'div', icon: 'house', className: 'escms-container', allowedControls: ['bgColor', 'bgGradient', 'bgImage', 'margin', 'padding', 'border', 'opacity'], styles: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '20px' } },
        { name: 'Spacer', tag: 'div', icon: 'spacer', className: 'escms-spacer', allowedControls: ['height'], styles: { width: '100%', height: '50px' } },
        { name: 'Separator', tag: 'hr', icon: 'separator', className: 'escms-separator', allowedControls: ['bgColor'], styles: { width: '100%', border: 'none', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' } }
    ]},
    { cat: 'text', items: [
        { name: 'Heading', tag: 'h2', icon: 'textBolder', className: 'escms-heading', allowedControls: ['color', 'typography', 'textAlign', 'margin', 'padding', 'opacity', 'effects'], children: [{ tag: 'span', textKey: 'leftpanel.default_heading' }] },
        { name: 'Text', tag: 'p', icon: 'textAlignLeft', className: 'escms-text', allowedControls: ['color', 'typography', 'textAlign', 'margin', 'padding', 'opacity', 'effects'], children: [{ tag: 'span', textKey: 'leftpanel.default_text' }] },
        { name: 'Blockquote', tag: 'blockquote', icon: 'quotes', className: 'escms-blockquote', allowedControls: ['color', 'typography', 'textAlign', 'bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'effects'], children: [{ tag: 'span', textKey: 'leftpanel.default_blockquote' }] },
        { name: 'Link', tag: 'a', icon: 'link', className: 'escms-link', allowedControls: ['href', 'color', 'typography', 'margin', 'padding', 'opacity', 'effects'], children: [{ tag: 'span', textKey: 'leftpanel.default_link' }] },
        { name: 'List', tag: 'ul', icon: 'list', className: 'escms-list', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'effects'], children: [{ tag: 'li', className: 'escms-list-item', textKey: 'leftpanel.default_list_item' }] },
        { name: 'Code', tag: 'pre', icon: 'code', className: 'escms-code', textKey: 'leftpanel.default_code', allowedControls: ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'effects'] },
        { name: 'Image', tag: 'img', icon: 'file', className: 'escms-image', allowedControls: ['src', 'alt', 'href', 'width', 'imageAlign', 'margin', 'padding', 'border', 'opacity', 'effects'], attributes: { src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==', alt: 'Placeholder', style: 'max-width: 100%; height: auto;' } },
        { name: 'Button', tag: 'button', icon: 'button', className: 'escms-button', textKey: 'leftpanel.default_button', allowedControls: ['href', 'bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'effects'] }
    ]},
    { cat: 'embeds', items: [
        { name: 'Video', tag: 'video', icon: 'videoCamera', className: 'escms-video', allowedControls: ['src', 'margin', 'padding', 'border', 'opacity', 'effects'], attributes: { controls: 'true', style: 'width: 100%;' } },
        { name: 'Audio', tag: 'audio', icon: 'speakerHigh', className: 'escms-audio', allowedControls: ['src', 'margin', 'padding', 'border', 'opacity', 'effects'], attributes: { controls: 'true', style: 'width: 100%;' } },
        { name: 'YouTube', tag: 'iframe', icon: 'youtubeLogo', className: 'escms-youtube', allowedControls: ['src', 'margin', 'padding', 'border', 'opacity', 'effects'], attributes: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', frameborder: '0', allowfullscreen: 'true', style: 'width: 100%; aspect-ratio: 16/9;' } },
        { name: 'Vimeo', tag: 'iframe', icon: 'playCircle', className: 'escms-vimeo', allowedControls: ['src', 'margin', 'padding', 'border', 'opacity', 'effects'], attributes: { src: 'https://player.vimeo.com/video/76979871', frameborder: '0', allowfullscreen: 'true', style: 'width: 100%; aspect-ratio: 16/9;' } }
    ]}
];

const baseDir = path.join(__dirname, 'src', 'atoms');
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

atomsConfig.forEach(category => {
    category.items.forEach(atom => {
        const atomDir = path.join(baseDir, atom.name);
        if (!fs.existsSync(atomDir)) {
            fs.mkdirSync(atomDir, { recursive: true });
        }
        
        atom.category = category.cat;
        
        fs.writeFileSync(path.join(atomDir, 'atom.json'), JSON.stringify(atom, null, 2));
        console.log(`Created ${atom.name}/atom.json`);
    });
});
