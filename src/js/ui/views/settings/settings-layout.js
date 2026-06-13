import { EscmsColorPicker } from '../../controls/editor-controls.js';

export function createLayoutTab(settings) {
    const tab = settings.createTabContent('settings.tab_layout');
    tab.classList.add('escms-view-content');
    
    let currentWidth = settings.getStyleVariable('--max-width').replace('px', '');
    if (!currentWidth) currentWidth = '1200';
    
    const widthGroup = settings.createInputGroup('settings.max_width', 'number', (val) => {
        settings.applyStyleVariable('--max-width', val ? `${val}px` : '');
        settings.debounceSave('--max-width', val ? `${val}px` : '');
    });
    widthGroup.input.value = currentWidth;
    
    const widthDesc = document.createElement('p');
    widthDesc.setAttribute('data-i18n', 'settings.max_width_desc');
    widthDesc.textContent = settings.i18n ? (settings.i18n.dictionary['settings.max_width_desc'] || 'Maximum width of the page content.') : 'Maximum width of the page content.';
    widthGroup.group.appendChild(widthDesc);
    
    tab.appendChild(widthGroup.group);
    
    const createColorSetting = (titleKey, initialVal, onChange) => {
        const group = document.createElement('div');
        group.className = 'escms-form-group';
        
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '35% 1fr';
        row.style.alignItems = 'center';
        row.style.gap = '0.5rem';

        const title = document.createElement('label');
        title.setAttribute('data-i18n', titleKey);
        title.textContent = settings.i18n ? (settings.i18n.dictionary[titleKey] || titleKey) : titleKey;
        title.style.display = 'block';
        title.style.fontSize = '0.9rem';
        title.style.color = 'var(--text-solid, #f5f5f5)';
        title.style.fontWeight = '500';

        // EscmsColorPicker natively creates a grid row with 35% 1fr if we pass a label.
        // We pass null to omit its label, and it gives us an empty first column.
        // We can just grab the interactive parts from it.
        const picker = new EscmsColorPicker(null, initialVal, 100, onChange);
        
        // The picker.element is an escms-control-row (grid). 
        // childNodes[0] is the empty labelContainer.
        // childNodes[1] is the button, childNodes[2] is the dropdown.
        const rightSide = document.createElement('div');
        rightSide.style.position = 'relative';
        rightSide.style.width = '100%';
        rightSide.appendChild(picker.button);
        rightSide.appendChild(picker.dropdown);
        
        // Ensure the button stretches 100% of the rightSide
        picker.button.style.width = '100%';
        picker.button.style.boxSizing = 'border-box';

        row.appendChild(title);
        row.appendChild(rightSide);
        group.appendChild(row);
        return group;
    };

    const bgColorHex = settings.getStyleVariable('--color-background') || '#0a0a0a';
    tab.appendChild(createColorSetting('settings.page_bg_color', bgColorHex, (val) => {
        settings.applyStyleVariable('--color-background', val.rgba);
        settings.debounceSave('--color-background', val.rgba);
    }));

    const textColorHex = settings.getStyleVariable('--color-text') || '#f5f5f5';
    tab.appendChild(createColorSetting('settings.text_color', textColorHex, (val) => {
        settings.applyStyleVariable('--color-text', val.rgba);
        settings.debounceSave('--color-text', val.rgba);
    }));

    const accentColorHex = settings.getStyleVariable('--color-accent') || '#3b82f6';
    tab.appendChild(createColorSetting('settings.accent_color', accentColorHex, (val) => {
        settings.applyStyleVariable('--color-accent', val.rgba);
        settings.debounceSave('--color-accent', val.rgba);
    }));

    const linkColorHex = settings.getStyleVariable('--color-link') || '#3b82f6';
    tab.appendChild(createColorSetting('settings.link_color', linkColorHex, (val) => {
        settings.applyStyleVariable('--color-link', val.rgba);
        settings.debounceSave('--color-link', val.rgba);
    }));

    const linkHoverColorHex = settings.getStyleVariable('--color-link-hover') || '#2563eb';
    tab.appendChild(createColorSetting('settings.link_hover_color', linkHoverColorHex, (val) => {
        settings.applyStyleVariable('--color-link-hover', val.rgba);
        settings.debounceSave('--color-link-hover', val.rgba);
    }));

    return tab;
}
