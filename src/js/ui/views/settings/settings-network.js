import { EscmsToggle } from '../../controls/editor-controls.js';

export function createNetworkTab(settings) {
    const tab = settings.createTabContent('topbar.network_btn');
    tab.classList.add('escms-view-content');
    
    const desc = document.createElement('p');
    desc.setAttribute('data-i18n', 'network.modal_desc');
    desc.style.marginTop = '0';
    desc.style.marginBottom = '1.5rem';
    desc.style.color = 'var(--text-muted, rgba(245, 245, 245, 0.6))';
    desc.style.fontSize = '0.85rem';
    desc.style.lineHeight = '1.5';
    tab.appendChild(desc);

    const alert = document.createElement('div');
    alert.className = 'escms-alert escms-alert--warning';
    alert.innerHTML = '<span data-i18n="network.modal_warning"></span>';
    tab.appendChild(alert);

    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'escms-form-group';
    
    const toggle = new EscmsToggle('network.toggle_label', settings.config.escms_p2p_enabled, (val) => {
        settings.saveConfig('escms_p2p_enabled', val);
    });

    // Make the toggle label look like other settings labels
    const label = toggle.element.querySelector('.escms-ui-label');
    if (label) {
        label.style.fontSize = '0.9rem';
        label.style.color = 'var(--text-solid, #f5f5f5)';
        label.style.fontWeight = '500';
    }

    toggleGroup.appendChild(toggle.element);
    tab.appendChild(toggleGroup);
    
    return tab;
}
