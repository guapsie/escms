import { EscmsToggle } from '../../controls/editor-controls.js';

export function createNetworkTab(settings) {
    const tab = settings.createTabContent('topbar.network_btn');
    tab.classList.add('escms-view-content');
    
    const card = document.createElement('div');
    card.className = 'escms-card';
    card.style.maxWidth = '600px';

    card.innerHTML = `
        <div class="escms-card-body">
            <p data-i18n="network.modal_desc" style="margin-top: 0;"></p>
            <div class="escms-alert escms-alert--warning">
                <span data-i18n="network.modal_warning"></span>
            </div>
        </div>
    `;

    const toggleRow = document.createElement('div');
    toggleRow.className = 'escms-card-footer';
    const toggle = new EscmsToggle('network.toggle_label', settings.config.escms_p2p_enabled, (val) => {
        settings.saveConfig('escms_p2p_enabled', val);
    });
    toggleRow.appendChild(toggle.element);

    card.appendChild(toggleRow);
    tab.appendChild(card);
    
    return tab;
}
