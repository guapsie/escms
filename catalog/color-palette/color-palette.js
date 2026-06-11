window.addEventListener('escms:colorpicker:ready', (e) => {
    const { picker, dropdown } = e.detail;
    
    if (!dropdown || dropdown.querySelector('.addon-color-palette')) return;
    
    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'addon-color-palette';
    
    const header = document.createElement('div');
    header.className = 'addon-palette-header';
    header.innerHTML = '<span style="font-size: 0.75rem; color: #888;">Color Palette</span>';
    
    const shuffleBtn = document.createElement('button');
    shuffleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 4l3 3l-3 3" /><path d="M18 20l3 -3l-3 -3" /><path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" /><path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3" /></svg>';
    shuffleBtn.className = 'addon-palette-shuffle';
    shuffleBtn.title = 'Generate new palette';
    shuffleBtn.style.color = '#888';
    
    header.appendChild(shuffleBtn);
    paletteContainer.appendChild(header);
    
    const colorsGrid = document.createElement('div');
    colorsGrid.className = 'addon-palette-grid';
    paletteContainer.appendChild(colorsGrid);
    
    const renderColors = () => {
        colorsGrid.innerHTML = '';
        const colors = generateHarmony();
        colors.forEach(hex => {
            const swatch = document.createElement('div');
            swatch.className = 'addon-palette-swatch';
            swatch.style.backgroundColor = hex;
            swatch.title = hex.toUpperCase();
            swatch.onclick = (ev) => {
                ev.stopPropagation();
                picker.setValue(hex, picker.alpha, true);
            };
            colorsGrid.appendChild(swatch);
        });
    };
    
    shuffleBtn.onclick = (ev) => {
        ev.stopPropagation();
        renderColors();
    };
    
    renderColors();
    dropdown.appendChild(paletteContainer);
});

function generateHarmony() {
    const baseHue = Math.floor(Math.random() * 360);
    const colors = [];
    colors.push(hslToHex(baseHue, 70, 50));
    colors.push(hslToHex((baseHue + 30) % 360, 60, 60));
    colors.push(hslToHex((baseHue + 180) % 360, 70, 50));
    colors.push(hslToHex((baseHue + 210) % 360, 60, 60));
    colors.push(hslToHex((baseHue + 150) % 360, 50, 40));
    return colors;
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

window.addEventListener('escms:addon:uninstall', (e) => {
    if (e.detail.id === 'color-palette') {
        document.querySelectorAll('.addon-color-palette').forEach(el => el.remove());
        document.querySelectorAll(`script[src*="/data/addons/color-palette"]`).forEach(el => el.remove());
        document.querySelectorAll(`link[href*="/data/addons/color-palette"]`).forEach(el => el.remove());
    }
});
