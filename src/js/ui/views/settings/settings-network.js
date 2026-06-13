import { EscmsToggle } from '../../controls/editor-controls.js';

export function createNetworkTab(settings) {
    const tab = settings.createTabContent('topbar.network_btn');
    
    const card = document.createElement('div');
    card.style.background = 'rgba(255, 255, 255, 0.02)';
    card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    card.style.borderRadius = '8px';
    card.style.padding = '1.5rem';
    card.style.maxWidth = '600px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '1.5rem';

    card.innerHTML = `
        <p data-i18n="network.modal_desc" style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: rgba(245, 245, 245, 0.7);"></p>
        <div style="padding: 1rem; background: rgba(245, 158, 11, 0.05); border-left: 3px solid rgba(245, 158, 11, 0.5); border-radius: 0 4px 4px 0;">
            <span data-i18n="network.modal_warning" style="font-size: 0.85rem; color: rgba(245, 158, 11, 0.8); line-height: 1.4;"></span>
        </div>
    `;

    const toggleRow = document.createElement('div');
    toggleRow.style.marginTop = '0.5rem';
    const toggle = new EscmsToggle('network.toggle_label', settings.config.escms_p2p_enabled, (val) => {
        settings.saveConfig('escms_p2p_enabled', val);
    });
    toggleRow.appendChild(toggle.element);

    card.appendChild(toggleRow);
    tab.appendChild(card);
    
    return tab;
}
