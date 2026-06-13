import { icons } from '../../../core/editor-icons.js';

export function createTypographyTab(settings) {
    const tab = settings.createTabContent('settings.tab_typography');
    tab.classList.add('escms-view-content');
    
    const fontUrlGroup = document.createElement('div');
    fontUrlGroup.className = 'escms-form-group';

    const label = document.createElement('label');
    label.setAttribute('data-i18n', 'settings.google_fonts');

    const inputRow = document.createElement('div');
    inputRow.style.display = 'flex';
    inputRow.style.gap = '0.5rem';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'escms-input';
    input.placeholder = 'https://fonts.googleapis.com/css2?family=...';
    input.style.flex = '1';

    const addBtn = document.createElement('button');
    addBtn.className = 'escms-btn escms-btn--primary';
    addBtn.setAttribute('data-i18n', 'settings.add');
    addBtn.textContent = settings.i18n?.t ? settings.i18n.t('settings.add') : 'Add';

    const fontsList = document.createElement('div');
    fontsList.style.display = 'flex';
    fontsList.style.flexDirection = 'column';
    fontsList.style.gap = '0.5rem';
    fontsList.style.marginTop = '1rem';

    const renderFontsList = () => {
        fontsList.innerHTML = '';
        settings.googleFonts.forEach((url, index) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.background = '#1f1f1f';
            row.style.padding = '0.5rem 0.75rem';
            row.style.borderRadius = '6px';
            row.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            
            const text = document.createElement('span');
            text.textContent = url;
            text.style.fontSize = '0.85rem';
            text.style.color = 'rgba(245, 245, 245, 0.8)';
            text.style.wordBreak = 'break-all';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'escms-btn escms-btn--danger';
            removeBtn.innerHTML = icons.trash || 'X';
            removeBtn.style.padding = '0';
            removeBtn.style.width = '32px';
            removeBtn.style.height = '32px';
            removeBtn.onclick = () => {
                settings.googleFonts.splice(index, 1);
                settings.saveConfig('google_fonts', JSON.stringify(settings.googleFonts));
                settings.applyGoogleFonts();
                renderFontsList();
            };
            
            row.appendChild(text);
            row.appendChild(removeBtn);
            fontsList.appendChild(row);
        });
    };

    addBtn.onclick = () => {
        const val = input.value.trim();
        if (val && val.startsWith('http')) {
            if (!settings.googleFonts.includes(val)) {
                settings.googleFonts.push(val);
                settings.saveConfig('google_fonts', JSON.stringify(settings.googleFonts));
                settings.applyGoogleFonts();
                renderFontsList();
                input.value = '';
            }
        }
    };

    inputRow.appendChild(input);
    inputRow.appendChild(addBtn);
    
    fontUrlGroup.appendChild(label);
    fontUrlGroup.appendChild(inputRow);
    fontUrlGroup.appendChild(fontsList);

    tab.appendChild(fontUrlGroup);
    
    // Initial render
    renderFontsList();

    return tab;
}
