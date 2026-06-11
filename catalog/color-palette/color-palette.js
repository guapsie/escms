window.addEventListener('escms:colorpicker:ready', (e) => {
    const { picker, dropdown } = e.detail;
    
    if (!dropdown) return;
    
    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'addon-color-palette';
    
    const header = document.createElement('div');
    header.className = 'addon-palette-header';
    header.innerHTML = '<span style="font-size: 0.75rem; color: #888;">Color Palette</span>';
    
    const shuffleBtn = document.createElement('button');
    shuffleBtn.innerHTML = '🎲';
    shuffleBtn.className = 'addon-palette-shuffle';
    shuffleBtn.title = 'Generate new palette';
    
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
