import { EscmsToggle, EscmsSelect } from '../../controls/editor-controls.js';
import { icons } from '../../../core/editor-icons.js';

export function createGeneralTab(settings) {
    const tab = settings.createTabContent('settings.tab_ide');
    
    const createToggleSetting = (titleKey, descKey, settingKey, value, onChange) => {
        const group = document.createElement('div');
        group.style.marginBottom = '2rem';
        
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '0.5rem';

        const title = document.createElement('div');
        title.setAttribute('data-i18n', titleKey);
        title.style.fontSize = '0.9rem';
        title.style.fontWeight = '500';
        title.style.color = 'var(--text-solid)';

        const toggle = new EscmsToggle(null, value, onChange);

        headerRow.appendChild(title);
        headerRow.appendChild(toggle.element);
        group.appendChild(headerRow);

        if (descKey) {
            const desc = document.createElement('div');
            desc.setAttribute('data-i18n', descKey);
            desc.style.fontSize = '0.75rem';
            desc.style.color = 'rgba(245,245,245,0.5)';
            group.appendChild(desc);
        }

        return group;
    };

    // Play Sounds
    tab.appendChild(createToggleSetting(
        'settings.sounds_title', 
        'settings.sounds_desc', 
        'ide_play_sounds', 
        settings.config.ide_play_sounds, 
        (val) => { settings.saveConfig('ide_play_sounds', val); }
    ));

    // WebP
    tab.appendChild(createToggleSetting(
        'settings.webp_title', 
        'settings.webp_desc', 
        'webp_enabled', 
        settings.config.webp_enabled, 
        (val) => { settings.saveConfig('webp_enabled', val); }
    ));

    // Auto Save Server
    tab.appendChild(createToggleSetting(
        'settings.autosave_title', 
        'settings.autosave_desc', 
        'auto_save_server', 
        settings.config.auto_save_server, 
        (val) => { settings.saveConfig('auto_save_server', val); }
    ));

    // Language
    const langSelect = new EscmsSelect('settings.language_title', [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' }
    ], settings.config.editor_language, (val) => {
        settings.saveConfig('editor_language', val);
        if (window.escmsEditor && window.escmsEditor.i18n) {
            window.escmsEditor.i18n.loadLanguage(val).then(() => {
                window.escmsEditor.i18n.translateDOM();
                // Re-render settings to show new language
                const currentTab = Object.keys(settings.tabContents).find(k => settings.tabContents[k].style.display === 'block');
                if (settings.overlay && settings.overlay.parentNode) {
                    settings.overlay.parentNode.removeChild(settings.overlay);
                }
                settings.renderOverlay();
                document.body.appendChild(settings.overlay);
                settings.overlay.style.display = 'block';
                if (currentTab) settings.switchTab(currentTab);
            });
        }
    });
    
    const refreshLangBtn = document.createElement('button');
    refreshLangBtn.innerHTML = icons.refresh || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';
    refreshLangBtn.style.cssText = 'background: transparent; border: none; color: #888; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color 0.2s;';
    refreshLangBtn.onmouseenter = () => refreshLangBtn.style.color = 'var(--text-solid)';
    refreshLangBtn.onmouseleave = () => refreshLangBtn.style.color = '#888';
    refreshLangBtn.title = 'Check for updates / Force redownload';
    refreshLangBtn.onclick = async () => {
        const svg = refreshLangBtn.querySelector('svg');
        if (svg) svg.style.animation = 'spin 1s linear infinite';
        if (window.escmsEditor && window.escmsEditor.i18n) {
            await window.escmsEditor.i18n.loadLanguage(settings.config.editor_language, true);
            window.escmsEditor.i18n.translateDOM();
            const currentTab = Object.keys(settings.tabContents).find(k => settings.tabContents[k].style.display === 'block');
            if (settings.overlay && settings.overlay.parentNode) settings.overlay.parentNode.removeChild(settings.overlay);
            settings.renderOverlay();
            document.body.appendChild(settings.overlay);
            settings.overlay.style.display = 'block';
            if (currentTab) settings.switchTab(currentTab);
        }
    };

    if (settings.config.editor_language !== 'en') {
        fetch('/api/settings?action=check_locale_update&lang=' + settings.config.editor_language)
            .then(r => r.json())
            .then(data => {
                if (data.has_update) {
                    refreshLangBtn.style.color = '#3b82f6';
                    refreshLangBtn.title = 'Update available! Click to update.';
                    refreshLangBtn.innerHTML = '<span style="font-size: 0.75rem; font-weight: bold; margin-right: 4px;">UPDATE</span>' + refreshLangBtn.innerHTML;
                }
            }).catch(() => {});
    }

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    const selectEl = langSelect.element.childNodes[1];
    selectEl.style.flex = '1';
    wrapper.style.flex = '0 0 auto';
    wrapper.style.width = '60%';
    wrapper.appendChild(selectEl);
    wrapper.appendChild(refreshLangBtn);
    langSelect.element.appendChild(wrapper);

    tab.appendChild(langSelect.element);

    return tab;
}
