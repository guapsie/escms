class EscmsGlobalSettings {
    constructor(i18n) {
        this.i18n = i18n;
        this.overlay = null;
        this.activeTab = 'layout';
        this.tabButtons = {};
        this.tabContents = {};
        this.googleFonts = [];
        this.config = {
            webp_enabled: true,
            auto_zoom: true
        };
    }

    async init() {
        const topbar = document.getElementById('escms-topbar');
        if (topbar) {
            const titleDiv = topbar.firstElementChild;
            if (titleDiv) {
                titleDiv.style.display = 'flex';
                titleDiv.style.alignItems = 'center';
                titleDiv.style.gap = '0.5rem';

                this.gearBtn = document.createElement('button');
                this.gearBtn.className = 'icon-btn';
                this.gearBtn.style.flexShrink = '0';
                this.gearBtn.innerHTML = icons.gearFine;
                this.gearBtn.title = 'Global Settings';

                this.gearBtn.addEventListener('click', () => {
                    this.overlay.style.display = 'block';
                });

                titleDiv.appendChild(this.gearBtn);
            }
        }

        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.data) {
                    this.config.webp_enabled = data.data.webp_enabled !== '0';
                    this.config.auto_zoom = data.data.auto_zoom !== '0';
                    window.escmsAutoZoom = this.config.auto_zoom;
                    if (data.data.google_fonts) {
                        try {
                            this.googleFonts = JSON.parse(data.data.google_fonts);
                            this.applyGoogleFonts();
                        } catch(e) {}
                    }
                }
            }
        } catch (e) { console.error('Failed to load settings', e); }

        this.renderOverlay();
    }

    async saveConfig(key, value) {
        this.config[key] = value;
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
        } catch (e) { console.error('Failed to save settings', e); }
    }

    renderOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'escms-settings-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '50px';
        this.overlay.style.left = '0';
        this.overlay.style.right = '0';
        this.overlay.style.bottom = '0';
        this.overlay.style.background = 'var(--bg-base, #0a0a0a)';
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

        const sidebar = document.createElement('div');
        sidebar.style.width = '250px';
        sidebar.style.borderRight = '1px solid rgba(255, 255, 255, 0.05)';
        sidebar.style.paddingRight = '20px';
        sidebar.style.display = 'flex';
        sidebar.style.flexDirection = 'column';
        sidebar.style.gap = '0.5rem';

        const tabs = [
            { id: 'general', label: 'General' },
            { id: 'layout', label: 'Layout & Colors' },
            { id: 'typography', label: 'Typography' },
            { id: 'seo', label: 'Global SEO' }
        ];

        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.textContent = tab.label;
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
            sidebar.appendChild(btn);
        });

        this.contentArea = document.createElement('div');
        this.contentArea.style.flexGrow = '1';
        this.contentArea.style.paddingLeft = '60px';
        this.contentArea.style.overflowY = 'auto';
        this.contentArea.style.paddingBottom = '80px';

        this.tabContents = {
            general: this.createGeneralTab(),
            layout: this.createLayoutTab(),
            typography: this.createTypographyTab(),
            seo: this.createSeoTab()
        };

        Object.values(this.tabContents).forEach(content => {
            content.style.display = 'none';
            this.contentArea.appendChild(content);
        });

        mainLayout.appendChild(sidebar);
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
        this.switchTab('layout');

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

    createTabContent(titleText) {
        const tab = document.createElement('div');
        const heading = document.createElement('h2');
        heading.textContent = titleText;
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
        }
    }

    createGeneralTab() {
        const tab = this.createTabContent('General');
        
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

        // WebP
        tab.appendChild(createToggleSetting(
            'settings.webp_title', 
            'settings.webp_desc', 
            'webp_enabled', 
            this.config.webp_enabled, 
            (val) => { this.saveConfig('webp_enabled', val); }
        ));

        // Auto Zoom
        tab.appendChild(createToggleSetting(
            'settings.auto_zoom_title', 
            'settings.auto_zoom_desc', 
            'auto_zoom', 
            this.config.auto_zoom, 
            (val) => {
                this.saveConfig('auto_zoom', val);
                window.escmsAutoZoom = val;
            }
        ));
        
        return tab;
    }

    createLayoutTab() {
        const tab = this.createTabContent('Layout & Colors');
        tab.appendChild(this.createInputGroup('settings.max_width', 'number', (val) => this.applyStyleVariable('--max-width', val ? `${val}px` : '')).group);
        
        const bgColor = new EscmsColorPicker('settings.page_bg_color', '#ffffff', 100, (val) => this.applyStyleVariable('--bg-color', val.rgba));
        tab.appendChild(bgColor.element);

        const textColor = new EscmsColorPicker('settings.text_color', '#0a0a0a', 100, (val) => this.applyStyleVariable('--text-color', val.rgba));
        tab.appendChild(textColor.element);

        const accentColor = new EscmsColorPicker('settings.accent_color', '#3b82f6', 100, (val) => this.applyStyleVariable('--accent-color', val.rgba));
        tab.appendChild(accentColor.element);

        const linkColor = new EscmsColorPicker('settings.link_color', '#3b82f6', 100, (val) => this.applyStyleVariable('--link-color', val.rgba));
        tab.appendChild(linkColor.element);

        const linkHoverColor = new EscmsColorPicker('settings.link_hover_color', '#2563eb', 100, (val) => this.applyStyleVariable('--link-hover-color', val.rgba));
        tab.appendChild(linkHoverColor.element);

        return tab;
    }

    createTypographyTab() {
        const tab = this.createTabContent('Typography');
        
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
        
        tab.appendChild(this.createInputGroup('settings.body_font', 'text', (val) => this.applyStyleVariable('--font-family', val)).group);
        return tab;
    }

    createSeoTab() {
        const tab = this.createTabContent('Global SEO');
        tab.appendChild(this.createInputGroup('settings.site_title', 'text').group);
        tab.appendChild(this.createInputGroup('settings.meta_desc', 'textarea').group);
        return tab;
    }
}