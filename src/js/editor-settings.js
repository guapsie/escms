import { EscmsUploadControl } from './editor-control-upload.js';
import { EscmsToggle, EscmsSelect, EscmsColorPicker } from './editor-controls.js';
import { icons } from './editor-icons.js';

export class EscmsGlobalSettings {
    constructor(i18n) {
        this.i18n = i18n;
        this.overlay = null;
        this.activeTab = 'layout';
        this.tabButtons = {};
        this.tabContents = {};
        this.googleFonts = [];
        this.config = {
            webp_enabled: true,
            ide_play_sounds: true,
            escms_p2p_enabled: false,
            site_logo: '',
            site_favicon: '',
            editor_language: 'en',
            auto_save_server: true
        };
        
        this.tabs = [
            { id: 'general', labelKey: 'settings.tab_ide', createContent: () => this.createGeneralTab() },
            { id: 'identity', labelKey: 'settings.tab_identity', createContent: () => this.createIdentityTab() },
            { id: 'layout', labelKey: 'settings.tab_layout', createContent: () => this.createLayoutTab() },
            { id: 'typography', labelKey: 'settings.tab_typography', createContent: () => this.createTypographyTab() },
            { id: 'network', labelKey: 'settings.p2p_title', createContent: () => this.createNetworkTab() },
            { id: 'backup', labelKey: 'settings.tab_backup', createContent: () => this.createBackupTab() },
            { id: 'addons', labelKey: 'settings.tab_addons', createContent: () => this.createAddonsTab() }
        ];
    }

    async init() {
        this.gearBtn = document.getElementById('btn-settings');
        if (this.gearBtn) {
            this.gearBtn.addEventListener('click', () => {
                if (this.overlay.style.display === 'block') return;
                if (window.escmsMediaLibrary && window.escmsMediaLibrary.modal) {
                    window.escmsMediaLibrary.close();
                }
                this.overlay.style.display = 'block';
                this.overlay.classList.remove('escms-anim-fade');
                void this.overlay.offsetWidth; // Force reflow
                this.overlay.classList.add('escms-anim-fade');
            });
        }

        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.data) {
                    this.config.webp_enabled = data.data.webp_enabled !== '0';
                    this.config.ide_play_sounds = data.data.ide_play_sounds !== '0';
                    this.config.escms_p2p_enabled = data.data.escms_p2p_enabled === '1';
                    this.config.site_logo = data.data.site_logo || '';
                    this.config.site_favicon = data.data.site_favicon || '';
                    this.config.editor_language = data.data.editor_language || 'en';
                    this.config.auto_save_server = data.data.auto_save_server !== '0';
                    if (this.config.editor_language !== 'en' && window.escmsEditor && window.escmsEditor.i18n) {
                        window.escmsEditor.i18n.loadLanguage(this.config.editor_language).then(() => {
                            window.escmsEditor.i18n.translateDOM();
                        });
                    }
                    if (data.data.google_fonts) {
                        try {
                            this.googleFonts = JSON.parse(data.data.google_fonts);
                            this.applyGoogleFonts();
                        } catch(e) {}
                    }
                    this.updateFavicon();
                }
            }
        } catch (e) { console.error('Failed to load settings', e); }

        this.renderOverlay();

        // Broadcast ready event
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('escms:settings:ready', { detail: { settings: this } }));
        }, 10);
        window.addEventListener('escms:addons:refresh', () => {
            window.dispatchEvent(new CustomEvent('escms:settings:ready', { detail: { settings: this } }));
        });
    }

    addTab(id, labelKey, contentElement) {
        if (!this.tabs.find(t => t.id === id)) {
            this.tabs.push({ id, labelKey, createContent: () => contentElement });
            if (this.overlay) {
                // Remove existing
                if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
                this.renderOverlay();
                document.body.appendChild(this.overlay);
            }
        }
    }

    removeTab(id) {
        this.tabs = this.tabs.filter(t => t.id !== id);
        if (this.activeTab === id) this.activeTab = 'general';
        if (this.overlay) {
            if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
            this.renderOverlay();
            document.body.appendChild(this.overlay);
        }
    }

    async saveConfig(key, value) {
        this.config[key] = value;
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key, value: value })
            });
        } catch (e) { console.error('Failed to save settings', e); }
    }


    updateFavicon() {
        const defaultFavicon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJjdXJyZW50Q29sb3IiIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb25zLXRhYmxlci1maWxsZWQgaWNvbi10YWJsZXItYXBwcyI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik05IDNoLTRhMiAyIDAgMCAwIC0yIDJ2NGEyIDIgMCAwIDAgMiAyaDRhMiAyIDAgMCAwIDIgLTJ2LTRhMiAyIDAgMCAwIC0yIC0yeiIgLz48cGF0aCBkPSJNOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xNyAzYTEgMSAwIDAgMSAuOTkzIC44ODNsLjAwNyAuMTE3djJoMmExIDEgMCAwIDEgLjExNyAxLjk5M2wtLjExNyAuMDA3aC0ydjJhMSAxIDAgMCAxIC0xLjk5MyAuMTE3bC0uMDA3IC0uMTE3di0yaC0yYTEgMSAwIDAgMSAtLjExNyAtMS45OTNsLjExNyAtLjAwN2gydi0yYTEgMSAwIDAgMSAxIC0xeiIgLz48L3N2Zz4=';
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = this.config.site_favicon || defaultFavicon;
    }

    renderOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'escms-settings-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '50px';
        this.overlay.style.left = '0';
        this.overlay.style.right = '0';
        this.overlay.style.bottom = '0';
        this.overlay.style.background = 'rgba(10, 10, 10, 0.85)';
        this.overlay.style.backdropFilter = 'blur(16px)';
        this.overlay.style.webkitBackdropFilter = 'blur(16px)';
        this.overlay.style.zIndex = '9999';
        this.overlay.style.display = 'none';

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = icons.close;
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '30px';
        closeBtn.style.right = '40px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = 'var(--text-solid)';
        closeBtn.style.width = '24px';
        closeBtn.style.height = '24px';
        closeBtn.style.transition = 'color 0.2s';
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--accent-solid)');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--text-solid)');
        closeBtn.addEventListener('click', () => {
            this.overlay.style.display = 'none';
        });

        const svgClose = closeBtn.querySelector('svg');
        if (svgClose) {
            svgClose.style.width = '100%';
            svgClose.style.height = '100%';
        }

        this.overlay.appendChild(closeBtn);

        const mainLayout = document.createElement('div');
        mainLayout.style.display = 'flex';
        mainLayout.style.width = '100%';
        mainLayout.style.height = '100%';
        mainLayout.style.maxWidth = '1200px';
        mainLayout.style.margin = '0 auto';
        mainLayout.style.paddingTop = '80px';
        mainLayout.style.boxSizing = 'border-box';

        this.sidebar = document.createElement('div');
        this.sidebar.style.width = '250px';
        this.sidebar.style.borderRight = '1px solid rgba(255, 255, 255, 0.05)';
        this.sidebar.style.paddingRight = '20px';
        this.sidebar.style.display = 'flex';
        this.sidebar.style.flexDirection = 'column';
        this.sidebar.style.gap = '0.5rem';

        this.tabButtons = {};
        this.tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.setAttribute('data-i18n', tab.labelKey);
            btn.textContent = this.i18n ? (this.i18n.dictionary[tab.labelKey] || tab.labelKey) : tab.labelKey;
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.color = 'rgba(245, 245, 245, 0.6)';
            btn.style.padding = '0.75rem 1rem';
            btn.style.textAlign = 'left';
            btn.style.fontSize = '0.9rem';
            btn.style.borderRadius = '6px';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s ease';
            
            btn.addEventListener('mouseenter', () => {
                if (this.activeTab !== tab.id) {
                    btn.style.background = 'var(--accent-faint)';
                    btn.style.color = 'var(--text-solid)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (this.activeTab !== tab.id) {
                    btn.style.background = 'transparent';
                    btn.style.color = 'rgba(245, 245, 245, 0.6)';
                }
            });

            btn.addEventListener('click', () => this.switchTab(tab.id));
            
            this.tabButtons[tab.id] = btn;
            this.sidebar.appendChild(btn);
        });



        this.contentArea = document.createElement('div');
        this.contentArea.className = 'escms-settings-content';
        this.contentArea.style.flexGrow = '1';
        this.contentArea.style.paddingLeft = '60px';
        this.contentArea.style.paddingRight = '30px';
        this.contentArea.style.overflowY = 'auto';
        this.contentArea.style.paddingBottom = '80px';

        this.tabContents = {};
        this.tabs.forEach(tab => {
            this.tabContents[tab.id] = tab.createContent();
        });

        Object.values(this.tabContents).forEach(content => {
            content.style.display = 'none';
            this.contentArea.appendChild(content);
        });

        mainLayout.appendChild(this.sidebar);
        mainLayout.appendChild(this.contentArea);
        this.overlay.appendChild(mainLayout);

        const style = document.createElement('style');
        style.textContent = `
            .escms-settings-group { margin-bottom: 1.5rem; }
            .escms-settings-label { display: block; font-size: 0.85rem; color: rgba(245, 245, 245, 0.8); margin-bottom: 0.5rem; }
            .escms-settings-input, .escms-settings-textarea {
                width: 100%; max-width: 450px; background: #f5f5f5; color: #0a0a0a; border: none;
                border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.9rem; font-family: inherit;
                box-sizing: border-box; outline: none; transition: box-shadow 0.2s ease;
            }
            .escms-settings-input:focus, .escms-settings-textarea:focus { box-shadow: 0 0 0 3px var(--accent-solid); }
            .escms-settings-textarea { max-width: 600px; min-height: 120px; resize: vertical; }
            .escms-settings-color-row { display: flex; gap: 1rem; align-items: center; }
            .escms-settings-color-input {
                -webkit-appearance: none; -moz-appearance: none; appearance: none;
                width: 36px; height: 36px; background: transparent; border: none; cursor: pointer; padding: 0;
            }
            .escms-settings-color-input::-webkit-color-swatch-wrapper { padding: 0; }
            .escms-settings-color-input::-webkit-color-swatch { border: none; border-radius: 6px; box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
            .escms-settings-color-input::-moz-color-swatch { border: none; border-radius: 6px; box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
        `;
        this.overlay.appendChild(style);

        document.body.appendChild(this.overlay);
        this.switchTab('general');

        if (this.i18n) {
            this.i18n.translateDOM(this.overlay);
        }
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        Object.entries(this.tabButtons).forEach(([id, btn]) => {
            if (id === tabId) {
                btn.style.color = 'var(--text-solid)';
                btn.style.background = 'var(--accent-solid)';
            } else {
                btn.style.color = 'rgba(245, 245, 245, 0.6)';
                btn.style.background = 'transparent';
            }
        });

        Object.entries(this.tabContents).forEach(([id, content]) => {
            content.style.display = id === tabId ? 'block' : 'none';
        });
    }

    debounceSave(key, value) {
        if (!this._saveTimers) this._saveTimers = {};
        if (this._saveTimers[key]) clearTimeout(this._saveTimers[key]);
        this._saveTimers[key] = setTimeout(() => {
            this.saveConfig(key, value);
        }, 800);
    }

    createInputGroup(labelKey, inputType = 'text', onChange = null) {
        const group = document.createElement('div');
        group.className = 'escms-settings-group';

        const label = document.createElement('label');
        label.className = 'escms-settings-label';
        label.setAttribute('data-i18n', labelKey);

        let input;
        if (inputType === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'escms-settings-textarea';
        } else {
            input = document.createElement('input');
            input.type = inputType;
            input.className = 'escms-settings-input';
        }

        if (onChange) {
            input.addEventListener('input', (e) => onChange(e.target.value));
        }

        group.appendChild(label);
        group.appendChild(input);
        return { group, input };
    }

    createTabContent(titleKey) {
        const tab = document.createElement('div');
        const heading = document.createElement('h2');
        heading.setAttribute('data-i18n', titleKey);
        heading.textContent = this.i18n ? (this.i18n.dictionary[titleKey] || titleKey) : titleKey;
        heading.style.marginTop = '0';
        heading.style.marginBottom = '2rem';
        heading.style.fontWeight = '500';
        tab.appendChild(heading);
        return tab;
    }

    applyStyleVariable(varName, value) {
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            const root = host.shadowRoot.getElementById('document-root');
            if (root) {
                root.style.setProperty(varName, value);
            }
        }
    }

    applyGoogleFonts() {
        // Remove existing from head
        const existingHeadLinks = document.head.querySelectorAll('link[data-type="escms-google-font"]');
        existingHeadLinks.forEach(l => l.remove());

        // Append to head so they load globally and work in ShadowRoot
        this.googleFonts.forEach(url => {
            const link = document.createElement('link');
            link.setAttribute('data-type', 'escms-google-font');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        });

        // Also append to shadowRoot for inspector/components to query if needed
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            const existingLinks = host.shadowRoot.querySelectorAll('link[data-type="escms-google-font"]');
            existingLinks.forEach(l => l.remove());

            this.googleFonts.forEach(url => {
                const link = document.createElement('link');
                link.setAttribute('data-type', 'escms-google-font');
                link.rel = 'stylesheet';
                link.href = url;
                host.shadowRoot.appendChild(link);
            });
            window.dispatchEvent(new Event('escms-fonts-updated'));
        }
    }

    createGeneralTab() {
        const tab = this.createTabContent('settings.tab_ide');
        
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
            this.config.ide_play_sounds, 
            (val) => { this.saveConfig('ide_play_sounds', val); }
        ));

        // WebP
        tab.appendChild(createToggleSetting(
            'settings.webp_title', 
            'settings.webp_desc', 
            'webp_enabled', 
            this.config.webp_enabled, 
            (val) => { this.saveConfig('webp_enabled', val); }
        ));

        // Auto Save Server
        tab.appendChild(createToggleSetting(
            'settings.autosave_title', 
            'settings.autosave_desc', 
            'auto_save_server', 
            this.config.auto_save_server, 
            (val) => { this.saveConfig('auto_save_server', val); }
        ));

        // Language
        const langSelect = new EscmsSelect('settings.language_title', [
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' }
        ], this.config.editor_language, (val) => {
            this.saveConfig('editor_language', val);
            if (window.escmsEditor && window.escmsEditor.i18n) {
                window.escmsEditor.i18n.loadLanguage(val).then(() => {
                    window.escmsEditor.i18n.translateDOM();
                    // Re-render settings to show new language
                    const currentTab = Object.keys(this.tabContents).find(k => this.tabContents[k].style.display === 'block');
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.parentNode.removeChild(this.overlay);
                    }
                    this.renderOverlay();
                    document.body.appendChild(this.overlay);
                    this.overlay.style.display = 'block';
                    if (currentTab) this.switchTab(currentTab);
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
                await window.escmsEditor.i18n.loadLanguage(this.config.editor_language, true);
                window.escmsEditor.i18n.translateDOM();
                const currentTab = Object.keys(this.tabContents).find(k => this.tabContents[k].style.display === 'block');
                if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
                this.renderOverlay();
                document.body.appendChild(this.overlay);
                this.overlay.style.display = 'block';
                if (currentTab) this.switchTab(currentTab);
            }
        };

        if (this.config.editor_language !== 'en') {
            fetch('/api/settings?action=check_locale_update&lang=' + this.config.editor_language)
                .then(r => r.json())
                .then(data => {
                    if (data.has_update) {
                        refreshLangBtn.style.color = '#3b82f6'; // Blue to grab attention
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
        // Ensure the select still takes up the necessary space
        selectEl.style.flex = '1';
        wrapper.style.flex = '0 0 auto';
        wrapper.style.width = '60%'; // Typical width for the right-side control in these rows
        wrapper.appendChild(selectEl);
        wrapper.appendChild(refreshLangBtn);
        langSelect.element.appendChild(wrapper);

        tab.appendChild(langSelect.element);

        return tab;
    }

    createIdentityTab() {
        const tab = this.createTabContent('settings.tab_identity');

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

        const logoControl = new EscmsUploadControl('settings.logo_title', this.i18n, this.config.site_logo, (val) => {
            this.saveConfig('site_logo', val);
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

        const faviconControl = new EscmsUploadControl('settings.favicon_title', this.i18n, this.config.site_favicon, (val) => {
            this.saveConfig('site_favicon', val);
            this.updateFavicon();
        });
        faviconControl.element.style.marginBottom = '1.5rem';
        tab.appendChild(faviconControl.element);

        return tab;
    }

    createBackupTab() {
        const tab = this.createTabContent('settings.tab_backup');
        
        const desc = document.createElement('div');
        desc.setAttribute('data-i18n', 'settings.backup_desc');
        desc.style.fontSize = '0.85rem';
        desc.style.color = 'rgba(245, 245, 245, 0.7)';
        desc.style.marginBottom = '2rem';
        desc.style.lineHeight = '1.5';
        tab.appendChild(desc);

        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'flex';
        actionsContainer.style.flexDirection = 'column';
        actionsContainer.style.gap = '1rem';
        actionsContainer.style.alignItems = 'flex-start';
        
        fetch('/api/settings?action=zip_check').then(r => r.json()).then(data => {
            if (data.status === 'success' && data.has_zip) {
                // Export Button
                const exportBtn = document.createElement('button');
                exportBtn.className = 'escms-btn';
                exportBtn.setAttribute('data-i18n', 'settings.btn_export');
                exportBtn.textContent = this.i18n ? (this.i18n.dictionary['settings.btn_export'] || 'Export Site') : 'Export Site';
                exportBtn.style.padding = '12px 24px';
                exportBtn.style.background = 'var(--accent-solid)';
                exportBtn.style.color = '#fff';
                exportBtn.style.border = 'none';
                exportBtn.style.borderRadius = '6px';
                exportBtn.style.fontWeight = '600';
                exportBtn.style.cursor = 'pointer';
                exportBtn.style.width = '200px';
                exportBtn.onclick = () => {
                    window.location.href = '/api/settings?action=export';
                };
                
                // Import
                const importWrapper = document.createElement('div');
                importWrapper.style.position = 'relative';
                importWrapper.style.overflow = 'hidden';
                importWrapper.style.display = 'inline-block';
                importWrapper.style.width = '200px';
                
                const importBtn = document.createElement('button');
                importBtn.className = 'escms-btn';
                importBtn.setAttribute('data-i18n', 'settings.btn_import');
                importBtn.textContent = this.i18n ? (this.i18n.dictionary['settings.btn_import'] || 'Import Site') : 'Import Site';
                importBtn.style.padding = '12px 24px';
                importBtn.style.background = 'transparent';
                importBtn.style.color = 'var(--text-solid)';
                importBtn.style.border = '1px solid rgba(255,255,255,0.2)';
                importBtn.style.borderRadius = '6px';
                importBtn.style.fontWeight = '600';
                importBtn.style.cursor = 'pointer';
                importBtn.style.width = '100%';
                
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.zip';
                fileInput.style.position = 'absolute';
                fileInput.style.left = '0';
                fileInput.style.top = '0';
                fileInput.style.width = '100%';
                fileInput.style.height = '100%';
                fileInput.style.opacity = '0';
                fileInput.style.cursor = 'pointer';
                
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const msg = this.i18n ? (this.i18n.dictionary['settings.import_warn'] || 'Are you sure?') : 'Are you sure?';
                    if (!confirm(msg)) {
                        fileInput.value = '';
                        return;
                    }
                    
                    importBtn.textContent = '...';
                    importBtn.style.opacity = '0.5';
                    fileInput.disabled = true;
                    
                    const formData = new FormData();
                    formData.append('backup', file);
                    
                    try {
                        const res = await fetch('/api/settings?action=import', {
                            method: 'POST',
                            body: formData
                        });
                        const resData = await res.json();
                        if (resData.status === 'success') {
                            window.location.reload();
                        } else {
                            alert(resData.error || 'Import failed');
                        }
                    } catch(err) {
                        alert(this.i18n ? (this.i18n.dictionary['settings.import_size_warn'] || 'Import failed (size limit?)') : 'Import failed');
                    }
                    
                    importBtn.textContent = this.i18n ? (this.i18n.dictionary['settings.btn_import'] || 'Import Site') : 'Import Site';
                    importBtn.style.opacity = '1';
                    fileInput.disabled = false;
                    fileInput.value = '';
                };
                
                importWrapper.appendChild(importBtn);
                importWrapper.appendChild(fileInput);
                
                actionsContainer.appendChild(exportBtn);
                actionsContainer.appendChild(importWrapper);
            } else {
                const warn = document.createElement('div');
                warn.setAttribute('data-i18n', 'settings.zip_missing');
                warn.textContent = this.i18n ? (this.i18n.dictionary['settings.zip_missing'] || 'Zip missing') : 'Zip missing';
                warn.style.color = '#ef4444';
                warn.style.background = 'rgba(239, 68, 68, 0.1)';
                warn.style.borderLeft = '3px solid #ef4444';
                warn.style.padding = '1rem';
                warn.style.borderRadius = '0 4px 4px 0';
                actionsContainer.appendChild(warn);
            }
        }).catch(err => {
            console.error('Failed to check ZipArchive support', err);
        });

        tab.appendChild(actionsContainer);
        return tab;
    }

    createNetworkTab() {
        const tab = this.createTabContent('topbar.network_btn');
        
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
        const toggle = new EscmsToggle('network.toggle_label', this.config.escms_p2p_enabled, (val) => {
            this.saveConfig('escms_p2p_enabled', val);
        });
        toggleRow.appendChild(toggle.element);

        card.appendChild(toggleRow);
        tab.appendChild(card);
        
        return tab;
    }

    createAddonsTab() {
        const tab = this.createTabContent('settings.tab_addons');
        
        const desc = document.createElement('div');
        desc.setAttribute('data-i18n', 'settings.addons_desc');
        desc.textContent = this.i18n ? (this.i18n.dictionary['settings.addons_desc'] || 'Expand the capabilities of ESCMS with community addons.') : 'Expand the capabilities of ESCMS with community addons.';
        desc.style.fontSize = '0.85rem';
        desc.style.color = 'rgba(245, 245, 245, 0.7)';
        desc.style.marginBottom = '2rem';
        desc.style.lineHeight = '1.5';
        tab.appendChild(desc);
        
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        grid.style.gap = '1.5rem';
        tab.appendChild(grid);

        const loadAddons = async () => {
            const loadingText = this.i18n ? (this.i18n.dictionary['settings.addons_loading'] || 'Loading addons...') : 'Loading addons...';
            grid.innerHTML = `<div style="color: rgba(245,245,245,0.4); grid-column: 1/-1;">${loadingText}</div>`;
            try {
                const res = await fetch('/api/settings?route=api/addons&action=list');
                const data = await res.json();
                if (data.status === 'success' && data.data) {
                    grid.innerHTML = '';
                    if (data.data.length === 0) {
                        const emptyText = this.i18n ? (this.i18n.dictionary['settings.addons_empty'] || 'No addons found.') : 'No addons found.';
                        grid.innerHTML = `<div style="color: rgba(245,245,245,0.4); grid-column: 1/-1;">${emptyText}</div>`;
                        return;
                    }
                    data.data.forEach(addon => {
                        const card = document.createElement('div');
                        card.style.background = 'rgba(255, 255, 255, 0.02)';
                        card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                        card.style.borderRadius = '8px';
                        card.style.padding = '1rem';
                        card.style.display = 'flex';
                        card.style.flexDirection = 'column';
                        card.style.gap = '0.75rem';
                        
                        const header = document.createElement('div');
                        header.style.display = 'flex';
                        header.style.justifyContent = 'space-between';
                        header.style.alignItems = 'center';
                        
                        const title = document.createElement('h4');
                        title.textContent = addon.name;
                        title.style.margin = '0';
                        title.style.fontSize = '1rem';
                        title.style.color = 'var(--text-solid)';
                        
                        const badge = document.createElement('span');
                        badge.style.fontSize = '0.7rem';
                        badge.style.padding = '2px 6px';
                        badge.style.borderRadius = '12px';
                        badge.style.background = addon.installed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                        badge.style.color = addon.installed ? '#22c55e' : 'rgba(255,255,255,0.6)';
                        badge.textContent = addon.installed ? 'v' + addon.installed_version : 'v' + addon.version;
                        
                        header.appendChild(title);
                        header.appendChild(badge);
                        card.appendChild(header);
                        
                        const description = document.createElement('div');
                        description.textContent = addon.description;
                        description.style.fontSize = '0.8rem';
                        description.style.color = 'var(--text-muted)';
                        description.style.lineHeight = '1.4';
                        description.style.flexGrow = '1';
                        card.appendChild(description);
                        
                        const actions = document.createElement('div');
                        actions.style.display = 'flex';
                        actions.style.gap = '0.5rem';
                        actions.style.marginTop = '0.5rem';
                        
                        const createBtn = (icon, titleKey, color, bg, onClick) => {
                            const btn = document.createElement('button');
                            btn.innerHTML = icon;
                            btn.title = this.i18n ? (this.i18n.dictionary[titleKey] || titleKey) : titleKey;
                            btn.style.width = '32px';
                            btn.style.height = '32px';
                            btn.style.display = 'flex';
                            btn.style.alignItems = 'center';
                            btn.style.justifyContent = 'center';
                            btn.style.borderRadius = '6px';
                            btn.style.border = 'none';
                            btn.style.background = bg;
                            btn.style.color = color;
                            btn.style.cursor = 'pointer';
                            btn.style.transition = 'all 0.2s';
                            btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
                            btn.onmouseleave = () => btn.style.transform = 'scale(1)';
                            const svg = btn.querySelector('svg');
                            if (svg) { svg.style.width = '18px'; svg.style.height = '18px'; }
                            btn.onclick = onClick;
                            return btn;
                        };
                        
                        if (!addon.installed) {
                            actions.appendChild(createBtn(icons.download || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>', 'settings.addons_btn_install', '#fff', 'var(--accent-solid)', async () => {
                                await fetch('/api/settings?route=api/addons&action=install', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({id: addon.id})
                                });
                                
                                // Inject scripts immediately without refresh
                                if (!document.querySelector(`script[src*="/data/addons/${addon.id}"]`)) {
                                    const script = document.createElement('script');
                                    script.type = 'module';
                                    script.src = `/data/addons/${addon.id}/${addon.id}.js?v=` + Date.now();
                                    script.onload = () => window.dispatchEvent(new CustomEvent('escms:addons:refresh'));
                                    document.head.appendChild(script);
                                }
                                if (!document.querySelector(`link[href*="/data/addons/${addon.id}"]`)) {
                                    const link = document.createElement('link');
                                    link.rel = 'stylesheet';
                                    link.href = `/data/addons/${addon.id}/${addon.id}.css?v=` + Date.now();
                                    document.head.appendChild(link);
                                }
                                
                                loadAddons();
                            }));
                        } else {
                            if (addon.has_update) {
                                actions.appendChild(createBtn(icons.refresh || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>', 'settings.addons_btn_update', '#fff', 'var(--accent-solid)', async () => {
                                    await fetch('/api/settings?route=api/addons&action=install', {
                                        method: 'POST',
                                        headers: {'Content-Type': 'application/json'},
                                        body: JSON.stringify({id: addon.id})
                                    });
                                    loadAddons();
                                }));
                            }
                            actions.appendChild(createBtn(icons.trash || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>', 'settings.addons_btn_delete', '#ef4444', 'rgba(239, 68, 68, 0.1)', async () => {
                                await fetch('/api/settings?route=api/addons&action=uninstall', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({id: addon.id})
                                });
                                window.dispatchEvent(new CustomEvent('escms:addon:uninstall', {detail: {id: addon.id}}));
                                loadAddons();
                            }));
                        }
                        
                        card.appendChild(actions);
                        grid.appendChild(card);
                    });
                }
            } catch(e) { console.error('Addons list failed', e); }
        };
        
        loadAddons();
        
        return tab;
    }



    getStyleVariable(varName) {
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            const root = host.shadowRoot.getElementById('document-root');
            if (root) {
                return window.getComputedStyle(root).getPropertyValue(varName).trim();
            }
        }
        return '';
    }

    createLayoutTab() {
        const tab = this.createTabContent('settings.tab_layout');
        
        let currentWidth = this.getStyleVariable('--max-width').replace('px', '');
        if (!currentWidth) currentWidth = '1200';
        
        const widthGroup = this.createInputGroup('settings.max_width', 'number', (val) => {
            this.applyStyleVariable('--max-width', val ? `${val}px` : '');
            this.debounceSave('--max-width', val ? `${val}px` : '');
        });
        widthGroup.input.value = currentWidth;
        
        const widthDesc = document.createElement('div');
        widthDesc.setAttribute('data-i18n', 'settings.max_width_desc');
        widthDesc.style.fontSize = '0.75rem';
        widthDesc.style.color = 'rgba(245,245,245,0.5)';
        widthDesc.style.marginTop = '0.25rem';
        widthGroup.group.appendChild(widthDesc);
        
        tab.appendChild(widthGroup.group);
        
        const bgColor = new EscmsColorPicker('settings.page_bg_color', this.getStyleVariable('--color-background') || '#0a0a0a', 100, (val) => {
            this.applyStyleVariable('--color-background', val.rgba);
            this.debounceSave('--color-background', val.rgba);
        });
        tab.appendChild(bgColor.element);

        const textColor = new EscmsColorPicker('settings.text_color', this.getStyleVariable('--color-text') || '#f5f5f5', 100, (val) => {
            this.applyStyleVariable('--color-text', val.rgba);
            this.debounceSave('--color-text', val.rgba);
        });
        tab.appendChild(textColor.element);

        const accentColor = new EscmsColorPicker('settings.accent_color', this.getStyleVariable('--color-accent') || '#3b82f6', 100, (val) => {
            this.applyStyleVariable('--color-accent', val.rgba);
            this.debounceSave('--color-accent', val.rgba);
        });
        tab.appendChild(accentColor.element);

        const linkColor = new EscmsColorPicker('settings.link_color', this.getStyleVariable('--color-link') || '#3b82f6', 100, (val) => {
            this.applyStyleVariable('--color-link', val.rgba);
            this.debounceSave('--color-link', val.rgba);
        });
        tab.appendChild(linkColor.element);

        const linkHoverColor = new EscmsColorPicker('settings.link_hover_color', this.getStyleVariable('--color-link-hover') || '#2563eb', 100, (val) => {
            this.applyStyleVariable('--color-link-hover', val.rgba);
            this.debounceSave('--color-link-hover', val.rgba);
        });
        tab.appendChild(linkHoverColor.element);

        return tab;
    }

    createTypographyTab() {
        const tab = this.createTabContent('settings.tab_typography');
        
        const fontUrlGroup = document.createElement('div');
        fontUrlGroup.className = 'escms-settings-group';

        const label = document.createElement('label');
        label.className = 'escms-settings-label';
        label.setAttribute('data-i18n', 'settings.google_fonts');

        const inputRow = document.createElement('div');
        inputRow.style.display = 'flex';
        inputRow.style.gap = '0.5rem';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'escms-settings-input';
        input.placeholder = 'https://fonts.googleapis.com/css2?family=...';
        input.style.flex = '1';

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add';
        addBtn.style.background = 'var(--accent-solid)';
        addBtn.style.color = 'var(--text-solid)';
        addBtn.style.border = 'none';
        addBtn.style.borderRadius = '6px';
        addBtn.style.padding = '0 1rem';
        addBtn.style.cursor = 'pointer';

        const fontsList = document.createElement('div');
        fontsList.style.display = 'flex';
        fontsList.style.flexDirection = 'column';
        fontsList.style.gap = '0.5rem';
        fontsList.style.marginTop = '1rem';

        const renderFontsList = () => {
            fontsList.innerHTML = '';
            this.googleFonts.forEach((url, index) => {
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
                text.style.whiteSpace = 'nowrap';
                text.style.overflow = 'hidden';
                text.style.textOverflow = 'ellipsis';
                text.style.marginRight = '1rem';
                
                const delBtn = document.createElement('button');
                delBtn.innerHTML = icons.trash;
                delBtn.style.background = 'transparent';
                delBtn.style.border = 'none';
                delBtn.style.color = 'rgba(245, 245, 245, 0.4)';
                delBtn.style.cursor = 'pointer';
                delBtn.style.display = 'flex';
                delBtn.style.alignItems = 'center';
                delBtn.style.justifyContent = 'center';
                delBtn.style.width = '24px';
                delBtn.style.height = '24px';
                delBtn.style.borderRadius = '4px';
                delBtn.style.transition = 'all 0.2s';
                
                const svg = delBtn.querySelector('svg');
                if (svg) {
                    svg.style.width = '14px';
                    svg.style.height = '14px';
                }

                delBtn.addEventListener('mouseenter', () => {
                    delBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                    delBtn.style.color = '#ef4444';
                });
                delBtn.addEventListener('mouseleave', () => {
                    delBtn.style.background = 'transparent';
                    delBtn.style.color = 'rgba(245, 245, 245, 0.4)';
                });
                
                delBtn.addEventListener('click', () => {
                    this.googleFonts.splice(index, 1);
                    this.applyGoogleFonts();
                    this.saveConfig('google_fonts', JSON.stringify(this.googleFonts));
                    renderFontsList();
                });
                
                row.appendChild(text);
                row.appendChild(delBtn);
                fontsList.appendChild(row);
            });
        };

        addBtn.addEventListener('click', () => {
            const url = input.value.trim();
            if (url && !this.googleFonts.includes(url)) {
                this.googleFonts.push(url);
                input.value = '';
                this.applyGoogleFonts();
                this.saveConfig('google_fonts', JSON.stringify(this.googleFonts));
                renderFontsList();
            }
        });

        inputRow.appendChild(input);
        inputRow.appendChild(addBtn);
        fontUrlGroup.appendChild(label);
        fontUrlGroup.appendChild(inputRow);
        fontUrlGroup.appendChild(fontsList);

        tab.appendChild(fontUrlGroup);
        
        renderFontsList();
        
        return tab;
    }
}
