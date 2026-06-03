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
        this.gearBtn = document.getElementById('btn-settings');
        if (this.gearBtn) {
            this.gearBtn.addEventListener('click', () => {
                this.overlay.style.display = 'block';
            });
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
                body: JSON.stringify({ key: key, value: value })
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
            { id: 'general', labelKey: 'settings.tab_ide' },
            { id: 'layout', labelKey: 'settings.tab_layout' },
            { id: 'typography', labelKey: 'settings.tab_typography' },
            { id: 'ai', labelKey: 'ai.panel_title' }
        ];

        tabs.forEach(tab => {
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
            sidebar.appendChild(btn);
        });



        this.contentArea = document.createElement('div');
        this.contentArea.className = 'escms-settings-content';
        this.contentArea.style.flexGrow = '1';
        this.contentArea.style.paddingLeft = '60px';
        this.contentArea.style.paddingRight = '30px';
        this.contentArea.style.overflowY = 'auto';
        this.contentArea.style.paddingBottom = '80px';

        this.tabContents = {
            general: this.createGeneralTab(),
            layout: this.createLayoutTab(),
            typography: this.createTypographyTab(),
            ai: this.createAITab()
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

    createAITab() {
        const tab = this.createTabContent('ai.panel_title');
        
        const aiTitle = document.createElement('h3');
        aiTitle.innerHTML = `${icons.ai || ''} <span data-i18n="settings.ai_title">${this.i18n ? (this.i18n.dictionary['settings.ai_title'] || 'AI Copilot Setup') : 'AI Copilot Setup'}</span>`;
        aiTitle.style.display = 'flex';
        aiTitle.style.alignItems = 'center';
        aiTitle.style.gap = '8px';
        aiTitle.style.fontWeight = '500';
        aiTitle.style.marginTop = '0';
        aiTitle.style.marginBottom = '1rem';
        const aiSvg = aiTitle.querySelector('svg');
        if (aiSvg) { aiSvg.style.width = '20px'; aiSvg.style.height = '20px'; }
        tab.appendChild(aiTitle);

        const aiForm = document.createElement('div');
        aiForm.innerHTML = `<div data-i18n="settings.ai_loading" style="color: rgba(245,245,245,0.4); font-size: 0.8rem;">${this.i18n ? (this.i18n.dictionary['settings.ai_loading'] || 'Loading AI settings...') : 'Loading AI settings...'}</div>`;
        tab.appendChild(aiForm);

        (async () => {
            try {
                const res = await fetch('/api/ai/settings');
                const data = await res.json();
                if (data.status === 'success') {
                    let provider = data.provider || 'gemini';
                    let model = data.model || '';
                    let endpoint = data.endpoint || '';
                    let instructions = data.instructions || '';
                    const hasKey = data.has_key;

                    aiForm.innerHTML = '';
                    aiForm.style.display = 'flex';
                    aiForm.style.flexDirection = 'column';
                    aiForm.style.gap = '1rem';

                    const selectContainer = document.createElement('div');
                    selectContainer.style.maxWidth = '450px';
                    if (typeof EscmsSelect !== 'undefined') {
                        const selectControl = new EscmsSelect(null, [
                            {value: 'gemini', label: 'Google Gemini'},
                            {value: 'claude', label: 'Anthropic Claude'},
                            {value: 'mistral', label: 'Mistral AI'},
                            {value: 'groq', label: 'Groq'},
                            {value: 'deepseek', label: 'DeepSeek'},
                            {value: 'custom', label: 'Custom'}
                        ], provider, (val) => { 
                            provider = val; 
                            updateEndpointVisibility(); 
                        });
                        selectContainer.appendChild(selectControl.element);
                    }

                    const endpointContainer = document.createElement('div');
                    const labelEndpoint = document.createElement('label');
                    labelEndpoint.setAttribute('data-i18n', 'settings.ai_endpoint');
                    labelEndpoint.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_endpoint'] || 'Endpoint URL (Custom only)') : 'Endpoint URL (Custom only)';
                    labelEndpoint.style.color = 'rgba(245,245,245,0.6)';
                    labelEndpoint.style.fontSize = '0.8rem';
                    labelEndpoint.style.display = 'block';
                    labelEndpoint.style.marginBottom = '0.5rem';

                    const inputEndpoint = document.createElement('input');
                    inputEndpoint.type = 'text';
                    inputEndpoint.setAttribute('data-i18n-placeholder', 'settings.ai_endpoint_placeholder');
                    inputEndpoint.placeholder = this.i18n ? (this.i18n.dictionary['settings.ai_endpoint_placeholder'] || 'https://your-api.com/v1') : 'https://your-api.com/v1';
                    inputEndpoint.value = endpoint;
                    inputEndpoint.className = 'escms-settings-input';

                    endpointContainer.appendChild(labelEndpoint);
                    endpointContainer.appendChild(inputEndpoint);

                    const updateEndpointVisibility = () => {
                        endpointContainer.style.display = provider === 'custom' ? 'block' : 'none';
                    };
                    updateEndpointVisibility();

                    const keyContainer = document.createElement('div');
                    const labelKey = document.createElement('label');
                    labelKey.setAttribute('data-i18n', 'settings.ai_apikey');
                    labelKey.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_apikey'] || 'API Key') : 'API Key';
                    labelKey.style.color = 'rgba(245,245,245,0.6)';
                    labelKey.style.fontSize = '0.8rem';
                    labelKey.style.display = 'block';
                    labelKey.style.marginBottom = '0.5rem';

                    const inputKey = document.createElement('input');
                    inputKey.type = 'password';
                    inputKey.setAttribute('data-i18n-placeholder', hasKey ? 'settings.ai_apikey_placeholder_has' : 'settings.ai_apikey_placeholder');
                    inputKey.placeholder = hasKey ? 
                        (this.i18n ? (this.i18n.dictionary['settings.ai_apikey_placeholder_has'] || '•••••••••••••••• (Leave blank to keep existing)') : '•••••••••••••••• (Leave blank to keep existing)') : 
                        (this.i18n ? (this.i18n.dictionary['settings.ai_apikey_placeholder'] || 'Paste your API key here...') : 'Paste your API key here...');
                    inputKey.className = 'escms-settings-input';

                    keyContainer.appendChild(labelKey);
                    keyContainer.appendChild(inputKey);

                    const btnLoad = document.createElement('button');
                    btnLoad.setAttribute('data-i18n', 'settings.ai_btn_load');
                    btnLoad.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_load'] || 'Load Models') : 'Load Models';
                    btnLoad.style.background = 'var(--accent-solid)';
                    btnLoad.style.color = '#fff';
                    btnLoad.style.border = 'none';
                    btnLoad.style.padding = '0.75rem';
                    btnLoad.style.borderRadius = '6px';
                    btnLoad.style.cursor = 'pointer';
                    btnLoad.style.fontWeight = '500';
                    btnLoad.style.marginTop = '0.5rem';
                    btnLoad.style.maxWidth = '200px';

                    const modelContainer = document.createElement('div');
                    modelContainer.style.display = model ? 'flex' : 'none';
                    modelContainer.style.flexDirection = 'column';
                    modelContainer.style.gap = '1rem';
                    modelContainer.style.maxWidth = '450px';

                    const instructionsContainer = document.createElement('div');
                    instructionsContainer.style.display = model ? 'block' : 'none';
                    const labelInstructions = document.createElement('label');
                    labelInstructions.setAttribute('data-i18n', 'settings.ai_instructions');
                    labelInstructions.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_instructions'] || 'System Instructions') : 'System Instructions';
                    labelInstructions.style.color = 'rgba(245,245,245,0.6)';
                    labelInstructions.style.fontSize = '0.8rem';
                    labelInstructions.style.display = 'block';
                    labelInstructions.style.marginBottom = '0.5rem';

                    const inputInstructions = document.createElement('textarea');
                    inputInstructions.setAttribute('data-i18n-placeholder', 'settings.ai_instructions_placeholder');
                    inputInstructions.placeholder = this.i18n ? (this.i18n.dictionary['settings.ai_instructions_placeholder'] || 'You are an expert web designer...') : 'You are an expert web designer...';
                    inputInstructions.value = instructions;
                    inputInstructions.className = 'escms-settings-input';
                    inputInstructions.style.resize = 'vertical';
                    inputInstructions.style.minHeight = '80px';

                    instructionsContainer.appendChild(labelInstructions);
                    instructionsContainer.appendChild(inputInstructions);

                    const btnSave = document.createElement('button');
                    btnSave.setAttribute('data-i18n', 'settings.ai_btn_save');
                    btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_save'] || 'Save Configuration') : 'Save Configuration';
                    btnSave.style.background = 'var(--accent-solid)';
                    btnSave.style.color = '#fff';
                    btnSave.style.border = 'none';
                    btnSave.style.padding = '0.75rem';
                    btnSave.style.borderRadius = '6px';
                    btnSave.style.cursor = 'pointer';
                    btnSave.style.fontWeight = '500';
                    btnSave.style.maxWidth = '200px';

                    btnLoad.addEventListener('click', async () => {
                        const key = inputKey.value.trim();
                        if (!key && !hasKey) {
                            inputKey.style.animation = 'escms-shake 0.4s';
                            setTimeout(() => inputKey.style.animation = '', 400);
                            return;
                        }

                        if (provider === 'custom' && !inputEndpoint.value.trim()) {
                            inputEndpoint.style.animation = 'escms-shake 0.4s';
                            setTimeout(() => inputEndpoint.style.animation = '', 400);
                            return;
                        }

                        btnLoad.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_loading'] || 'Loading...') : 'Loading...';
                        btnLoad.style.opacity = '0.7';

                        try {
                            const payloadLoad = {provider: provider, key: key};
                            if (provider === 'custom') payloadLoad.endpoint = inputEndpoint.value.trim();

                            const mRes = await fetch('/api/ai/models', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(payloadLoad)
                            });
                            const mData = await mRes.json();
                            
                            btnLoad.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_load'] || 'Load Models') : 'Load Models';
                            btnLoad.style.opacity = '1';

                            if (mData.status === 'success' && mData.models && mData.models.length > 0) {
                                btnLoad.style.display = 'none';
                                modelContainer.style.display = 'flex';
                                instructionsContainer.style.display = 'block';
                                modelContainer.innerHTML = '';
                                
                                if (!mData.models.find(m => m.value === model)) {
                                    model = mData.models[0].value;
                                }

                                const selectModel = new EscmsSelect(null, mData.models, model, (val) => {
                                    model = val;
                                });
                                
                                const labelModel = document.createElement('label');
                                labelModel.setAttribute('data-i18n', 'settings.ai_model');
                                labelModel.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_model'] || 'AI Model') : 'AI Model';
                                labelModel.style.color = 'rgba(245,245,245,0.6)';
                                labelModel.style.fontSize = '0.8rem';
                                labelModel.style.display = 'block';
                                labelModel.style.marginBottom = '0.5rem';

                                modelContainer.appendChild(labelModel);
                                modelContainer.appendChild(selectModel.element);
                                btnSave.style.display = 'block';
                                btnSave.style.background = 'var(--accent-solid)';
                                btnSave.style.cursor = 'pointer';
                            } else {
                                alert('Error loading models: ' + (mData.msg || 'No models found'));
                            }
                        } catch (err) {
                            console.error(err);
                            btnLoad.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_load'] || 'Load Models') : 'Load Models';
                            btnLoad.style.opacity = '1';
                            alert('Network error while loading models');
                        }
                    });

                    btnSave.addEventListener('click', async () => {
                        const key = inputKey.value.trim();
                        btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_saving'] || 'Saving...') : 'Saving...';
                        
                        const payload = {provider: provider, model: model};
                        if (key) payload.key = key;
                        if (provider === 'custom') payload.endpoint = inputEndpoint.value.trim();
                        payload.instructions = inputInstructions.value.trim();

                        try {
                            const sRes = await fetch('/api/ai/settings', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(payload)
                            });
                            const sData = await sRes.json();
                            if (sData.status === 'success') {
                                if (window.escmsEditor && window.escmsEditor.playSound) {
                                    window.escmsEditor.playSound('success');
                                }
                                btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_saved'] || 'Saved!') : 'Saved!';
                                setTimeout(() => btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_save'] || 'Save Configuration') : 'Save Configuration', 2000);
                                if (window.escmsEditor && window.escmsEditor.leftpanel && window.escmsEditor.leftpanel.copilot) {
                                    window.escmsEditor.leftpanel.copilot.checkSettings();
                                }
                            } else {
                                alert('Error saving config');
                                btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_save'] || 'Save Configuration') : 'Save Configuration';
                            }
                        } catch (err) {
                            console.error(err);
                            btnSave.textContent = this.i18n ? (this.i18n.dictionary['settings.ai_btn_save'] || 'Save Configuration') : 'Save Configuration';
                        }
                    });

                    aiForm.appendChild(selectContainer);
                    aiForm.appendChild(endpointContainer);
                    aiForm.appendChild(keyContainer);
                    aiForm.appendChild(btnLoad);
                    aiForm.appendChild(modelContainer);
                    aiForm.appendChild(instructionsContainer);
                    aiForm.appendChild(btnSave);
                    
                    if (!model) {
                        btnSave.style.display = 'none';
                    }
                }
            } catch (err) {
                console.error(err);
                aiForm.innerHTML = `<div data-i18n="settings.ai_error" style="color: #ef4444; font-size: 0.8rem;">${this.i18n ? (this.i18n.dictionary['settings.ai_error'] || 'Error loading AI settings') : 'Error loading AI settings'}</div>`;
            }
        })();
        
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
