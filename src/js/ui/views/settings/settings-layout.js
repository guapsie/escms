import { EscmsColorPicker } from '../../controls/editor-controls.js';

export function createLayoutTab(settings) {
    const tab = settings.createTabContent('settings.tab_layout');
    
    let currentWidth = settings.getStyleVariable('--max-width').replace('px', '');
    if (!currentWidth) currentWidth = '1200';
    
    const widthGroup = settings.createInputGroup('settings.max_width', 'number', (val) => {
        settings.applyStyleVariable('--max-width', val ? `${val}px` : '');
        settings.debounceSave('--max-width', val ? `${val}px` : '');
    });
    widthGroup.input.value = currentWidth;
    
    const widthDesc = document.createElement('div');
    widthDesc.setAttribute('data-i18n', 'settings.max_width_desc');
    widthDesc.style.fontSize = '0.75rem';
    widthDesc.style.color = 'rgba(245,245,245,0.5)';
    widthDesc.style.marginTop = '0.25rem';
    widthGroup.group.appendChild(widthDesc);
    
    tab.appendChild(widthGroup.group);
    
    const bgColor = new EscmsColorPicker('settings.page_bg_color', settings.getStyleVariable('--color-background') || '#0a0a0a', 100, (val) => {
        settings.applyStyleVariable('--color-background', val.rgba);
        settings.debounceSave('--color-background', val.rgba);
    });
    tab.appendChild(bgColor.element);

    const textColor = new EscmsColorPicker('settings.text_color', settings.getStyleVariable('--color-text') || '#f5f5f5', 100, (val) => {
        settings.applyStyleVariable('--color-text', val.rgba);
        settings.debounceSave('--color-text', val.rgba);
    });
    tab.appendChild(textColor.element);

    const accentColor = new EscmsColorPicker('settings.accent_color', settings.getStyleVariable('--color-accent') || '#3b82f6', 100, (val) => {
        settings.applyStyleVariable('--color-accent', val.rgba);
        settings.debounceSave('--color-accent', val.rgba);
    });
    tab.appendChild(accentColor.element);

    const linkColor = new EscmsColorPicker('settings.link_color', settings.getStyleVariable('--color-link') || '#3b82f6', 100, (val) => {
        settings.applyStyleVariable('--color-link', val.rgba);
        settings.debounceSave('--color-link', val.rgba);
    });
    tab.appendChild(linkColor.element);

    const linkHoverColor = new EscmsColorPicker('settings.link_hover_color', settings.getStyleVariable('--color-link-hover') || '#2563eb', 100, (val) => {
        settings.applyStyleVariable('--color-link-hover', val.rgba);
        settings.debounceSave('--color-link-hover', val.rgba);
    });
    tab.appendChild(linkHoverColor.element);

    return tab;
}
