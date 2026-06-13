import { EscmsUploadControl } from '../../controls/editor-control-upload.js';

export function createIdentityTab(settings) {
    const tab = settings.createTabContent('settings.tab_identity');

    const desc = document.createElement('div');
    desc.setAttribute('data-i18n', 'settings.identity_desc');
    desc.style.fontSize = '0.85rem';
    desc.style.color = 'rgba(245, 245, 245, 0.7)';
    desc.style.marginBottom = '2rem';
    desc.style.lineHeight = '1.5';
    desc.style.padding = '1rem';
    desc.style.background = 'rgba(59, 130, 246, 0.05)';
    desc.style.borderLeft = '3px solid rgba(59, 130, 246, 0.5)';
    desc.style.borderRadius = '0 4px 4px 0';
    tab.appendChild(desc);

    const logoControl = new EscmsUploadControl('settings.logo_title', settings.i18n, settings.config.site_logo, (val) => {
        settings.saveConfig('site_logo', val);
        if (window.escmsEditor && window.escmsEditor.documentRoot) {
            const siteLogos = window.escmsEditor.documentRoot.querySelectorAll('.escms-sitelogo');
            siteLogos.forEach(logo => {
                logo.src = val;
            });
            if (window.escmsEditor.autosave) window.escmsEditor.autosave.saveToServer();
        }
    });
    logoControl.element.style.marginBottom = '1.5rem';
    tab.appendChild(logoControl.element);

    const faviconControl = new EscmsUploadControl('settings.favicon_title', settings.i18n, settings.config.site_favicon, (val) => {
        settings.saveConfig('site_favicon', val);
        settings.updateFavicon();
    });
    faviconControl.element.style.marginBottom = '1.5rem';
    tab.appendChild(faviconControl.element);

    return tab;
}
