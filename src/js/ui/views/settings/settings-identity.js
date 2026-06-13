import { EscmsMediaLibrary } from '../../panels/editor-medialibrary.js';

export function createIdentityTab(settings) {
    const tab = settings.createTabContent('settings.tab_identity');
    tab.classList.add('escms-view-content');

    const desc = document.createElement('div');
    desc.className = 'escms-alert escms-alert--info';
    desc.setAttribute('data-i18n', 'settings.identity_desc');
    desc.textContent = settings.i18n ? (settings.i18n.dictionary['settings.identity_desc'] || 'Global identity settings') : 'Global identity settings';
    tab.appendChild(desc);

    const createUploadSetting = (titleKey, val, onChange) => {
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

        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.gap = '8px';
        rightSide.style.alignItems = 'center';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'escms-input';
        input.value = val || '';
        input.style.flex = '1';

        const btn = document.createElement('button');
        btn.className = 'escms-btn escms-btn--secondary';
        btn.setAttribute('data-i18n', 'inspector.open_media_manager');
        btn.textContent = settings.i18n ? (settings.i18n.dictionary['inspector.open_media_manager'] || 'Open Media Manager') : 'Open Media Manager';
        btn.style.whiteSpace = 'nowrap';

        btn.onclick = async () => {
            if (!window.escmsMediaLibrary) {
                window.escmsMediaLibrary = new EscmsMediaLibrary(settings.i18n);
            }
            const url = await window.escmsMediaLibrary.open();
            if (url) {
                input.value = url;
                onChange(url);
            }
        };

        input.onchange = (e) => {
            onChange(e.target.value);
        };

        rightSide.appendChild(input);
        rightSide.appendChild(btn);

        row.appendChild(title);
        row.appendChild(rightSide);
        group.appendChild(row);
        
        // Add a preview image below if value exists
        const previewWrap = document.createElement('div');
        previewWrap.style.gridColumn = '2';
        previewWrap.style.marginTop = '0.5rem';
        
        const previewImg = document.createElement('img');
        previewImg.style.maxHeight = '40px';
        previewImg.style.maxWidth = '100px';
        previewImg.style.objectFit = 'contain';
        previewImg.style.display = val ? 'block' : 'none';
        previewImg.src = val || '';
        previewWrap.appendChild(previewImg);
        row.appendChild(previewWrap);

        // Update preview dynamically
        const origOnChange = onChange;
        onChange = (newVal) => {
            previewImg.src = newVal;
            previewImg.style.display = newVal ? 'block' : 'none';
            origOnChange(newVal);
        };

        return group;
    };

    tab.appendChild(createUploadSetting('settings.logo_title', settings.config.site_logo, (val) => {
        settings.saveConfig('site_logo', val);
        if (window.escmsEditor && window.escmsEditor.documentRoot) {
            const siteLogos = window.escmsEditor.documentRoot.querySelectorAll('.escms-sitelogo');
            siteLogos.forEach(logo => {
                logo.src = val;
            });
            if (window.escmsEditor.autosave) window.escmsEditor.autosave.saveToServer();
        }
    }));

    tab.appendChild(createUploadSetting('settings.favicon_title', settings.config.site_favicon, (val) => {
        settings.saveConfig('site_favicon', val);
        settings.updateFavicon();
    }));

    return tab;
}
