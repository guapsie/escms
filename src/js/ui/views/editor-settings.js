import { EscmsUploadControl } from '../controls/editor-control-upload.js';
import { EscmsToggle, EscmsSelect, EscmsColorPicker } from '../controls/editor-controls.js';
import { icons } from '../../core/editor-icons.js';

import { createGeneralTab } from './settings/settings-general.js';
import { createIdentityTab } from './settings/settings-identity.js';
import { createLayoutTab } from './settings/settings-layout.js';
import { createTypographyTab } from './settings/settings-typography.js';
import { createNetworkTab } from './settings/settings-network.js';
import { createBackupTab } from './settings/settings-backup.js';
import { createAddonsTab } from './settings/settings-addons.js';

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
            { id: 'general', labelKey: 'settings.tab_ide', createContent: () => createGeneralTab(this) },
            { id: 'identity', labelKey: 'settings.tab_identity', createContent: () => createIdentityTab(this) },
            { id: 'layout', labelKey: 'settings.tab_layout', createContent: () => createLayoutTab(this) },
            { id: 'typography', labelKey: 'settings.tab_typography', createContent: () => createTypographyTab(this) },
            { id: 'network', labelKey: 'settings.p2p_title', createContent: () => createNetworkTab(this) },
            { id: 'backup', labelKey: 'settings.tab_backup', createContent: () => createBackupTab(this) },
            { id: 'addons', labelKey: 'settings.tab_addons', createContent: () => createAddonsTab(this) }
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
                const wasVisible = this.overlay.style.display !== 'none';
                if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
                this.renderOverlay();
                if (wasVisible) this.overlay.style.display = 'block';
                document.body.appendChild(this.overlay);
            }
        }
    }

    removeTab(id) {
        this.tabs = this.tabs.filter(t => t.id !== id);
        if (this.activeTab === id) this.activeTab = 'general';
        if (this.overlay) {
            const wasVisible = this.overlay.style.display !== 'none';
            if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
            this.renderOverlay();
            if (wasVisible) this.overlay.style.display = 'block';
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
        this.switchTab(this.activeTab || 'general');

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

}
