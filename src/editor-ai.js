class EscmsCopilot {
    constructor(i18n) {
        this.i18n = i18n;
        this.container = null;
        this.hasKey = false;
        this.provider = 'gemini';
        this.model = '';
        this.chatHistory = [];
    }

    init(container) {
        this.container = container;
        this.container.innerHTML = '<div style="padding: 1rem; color: rgba(245,245,245,0.4); text-align: center; font-size: 0.8rem;">Loading Copilot...</div>';
        this.checkSettings();
    }

    async checkSettings() {
        try {
            const res = await fetch('/api/ai/settings');
            const data = await res.json();
            if (data.status === 'success') {
                this.hasKey = data.has_key;
                this.provider = data.provider || 'gemini';
                this.model = data.model || '';
                
                if (this.hasKey) {
                    this.renderChat();
                } else {
                    this.renderSettings();
                }
            }
        } catch (err) {
            console.error(err);
            this.container.innerHTML = '<div style="padding: 1rem; color: #ef4444; font-size: 0.8rem; text-align: center;">Error loading AI settings</div>';
        }
    }

    renderSettings() {
        this.container.innerHTML = '';
        this.container.style.padding = '1.5rem';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '1.5rem';

        const header = document.createElement('div');
        header.innerHTML = `<h3 style="color:#fff; margin:0 0 0.5rem 0; font-weight:500; font-size:1rem; display:flex; align-items:center; gap:8px;">${icons.ai} Setup Copilot AI</h3>
                            <p style="color:rgba(245,245,245,0.5); font-size:0.8rem; margin:0; line-height:1.4;">Select your preferred AI provider and enter your API Key. The key is securely stored in your local SQLite database.</p>`;
        
        const svg = header.querySelector('svg');
        if (svg) {
            svg.style.width = '20px';
            svg.style.height = '20px';
        }

        const form = document.createElement('div');
        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.gap = '1rem';

        // Select Provider using EscmsSelect if available, else fallback
        const selectContainer = document.createElement('div');
        if (typeof EscmsSelect !== 'undefined') {
            const selectControl = new EscmsSelect(null, [
                {value: 'gemini', label: 'Google Gemini'},
                {value: 'claude', label: 'Anthropic Claude'}
            ], this.provider, (val) => {
                this.provider = val;
            });
            selectContainer.appendChild(selectControl.element);
        }

        const labelKey = document.createElement('label');
        labelKey.textContent = 'API Key';
        labelKey.style.color = 'rgba(245,245,245,0.6)';
        labelKey.style.fontSize = '0.8rem';
        labelKey.style.display = 'block';
        labelKey.style.marginBottom = '0.5rem';

        const inputKey = document.createElement('input');
        inputKey.type = 'password';
        inputKey.placeholder = 'Paste your API key here...';
        inputKey.style.padding = '0.75rem';
        inputKey.style.background = 'rgba(255,255,255,0.05)';
        inputKey.style.border = '1px solid rgba(255,255,255,0.1)';
        inputKey.style.borderRadius = '6px';
        inputKey.style.color = '#fff';
        inputKey.style.outline = 'none';
        inputKey.style.width = '100%';
        inputKey.style.boxSizing = 'border-box';
        inputKey.style.transition = 'border-color 0.2s';

        inputKey.addEventListener('focus', () => inputKey.style.borderColor = 'var(--accent-solid)');
        inputKey.addEventListener('blur', () => inputKey.style.borderColor = 'rgba(255,255,255,0.1)');

        const keyContainer = document.createElement('div');
        keyContainer.appendChild(labelKey);
        keyContainer.appendChild(inputKey);

        const btnLoad = document.createElement('button');
        btnLoad.textContent = 'Load Models';
        btnLoad.style.background = 'var(--accent-solid)';
        btnLoad.style.color = '#fff';
        btnLoad.style.border = 'none';
        btnLoad.style.padding = '0.75rem';
        btnLoad.style.borderRadius = '6px';
        btnLoad.style.cursor = 'pointer';
        btnLoad.style.fontWeight = '500';
        btnLoad.style.marginTop = '0.5rem';
        btnLoad.style.transition = 'transform 0.1s, opacity 0.2s';

        const modelContainer = document.createElement('div');
        modelContainer.style.display = 'none';
        modelContainer.style.flexDirection = 'column';
        modelContainer.style.gap = '1rem';

        const btnSave = document.createElement('button');
        btnSave.textContent = 'Save Configuration';
        btnSave.style.background = 'rgba(255,255,255,0.1)';
        btnSave.style.color = '#fff';
        btnSave.style.border = '1px solid rgba(255,255,255,0.2)';
        btnSave.style.padding = '0.75rem';
        btnSave.style.borderRadius = '6px';
        btnSave.style.cursor = 'pointer';
        btnSave.style.fontWeight = '500';
        btnSave.style.transition = 'background 0.2s';
        
        btnSave.addEventListener('mouseenter', () => btnSave.style.background = 'rgba(255,255,255,0.15)');
        btnSave.addEventListener('mouseleave', () => btnSave.style.background = 'rgba(255,255,255,0.1)');

        btnLoad.addEventListener('click', async () => {
            const key = inputKey.value.trim();
            if (!key) {
                inputKey.style.animation = 'escms-shake 0.4s';
                setTimeout(() => inputKey.style.animation = '', 400);
                return;
            }

            btnLoad.textContent = 'Loading...';
            btnLoad.style.opacity = '0.7';

            try {
                const res = await fetch('/api/ai/models', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({provider: this.provider, key: key})
                });
                const data = await res.json();
                
                btnLoad.textContent = 'Load Models';
                btnLoad.style.opacity = '1';

                if (data.status === 'success' && data.models && data.models.length > 0) {
                    btnLoad.style.display = 'none';
                    modelContainer.style.display = 'flex';
                    modelContainer.innerHTML = '';
                    
                    this.model = data.models[0].value;
                    const selectModel = new EscmsSelect(null, data.models, this.model, (val) => {
                        this.model = val;
                    });
                    
                    const labelModel = document.createElement('label');
                    labelModel.textContent = 'AI Model';
                    labelModel.style.color = 'rgba(245,245,245,0.6)';
                    labelModel.style.fontSize = '0.8rem';
                    labelModel.style.display = 'block';
                    labelModel.style.marginBottom = '0.5rem';

                    modelContainer.appendChild(labelModel);
                    modelContainer.appendChild(selectModel.element);
                    modelContainer.appendChild(btnSave);
                } else {
                    alert('Error loading models: ' + (data.msg || 'No models found'));
                }
            } catch (err) {
                console.error(err);
                btnLoad.textContent = 'Load Models';
                btnLoad.style.opacity = '1';
                alert('Network error while loading models');
            }
        });

        btnSave.addEventListener('click', async () => {
            const key = inputKey.value.trim();
            btnSave.textContent = 'Saving...';
            
            try {
                const res = await fetch('/api/ai/settings', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({provider: this.provider, key: key, model: this.model})
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (window.escmsEditorApp && window.escmsEditorApp.playSound) {
                        window.escmsEditorApp.playSound('success');
                    }
                    this.checkSettings();
                } else {
                    alert('Error saving config');
                    btnSave.textContent = 'Save Configuration';
                }
            } catch (err) {
                console.error(err);
                btnSave.textContent = 'Save Configuration';
            }
        });

        form.appendChild(selectContainer);
        form.appendChild(keyContainer);
        form.appendChild(btnLoad);
        form.appendChild(modelContainer);

        this.container.appendChild(header);
        this.container.appendChild(form);
    }

    renderChat() {
        this.container.innerHTML = '';
        this.container.style.padding = '0'; // Remover padding del parent
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%';
        this.container.style.boxSizing = 'border-box';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '0.75rem 0.75rem 0.5rem 0.75rem';
        header.style.flexShrink = '0';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        const title = document.createElement('div');
        title.innerHTML = `${icons.ai || ''} <span style="font-weight:500;">Copilot</span> <span style="font-size:0.7rem; color:var(--accent-solid); opacity:0.8; margin-left:8px; text-transform:uppercase;">${this.provider}</span>`;
        title.style.color = '#fff';
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.gap = '8px';
        title.style.fontSize = '0.9rem';
        
        const svg = title.querySelector('svg');
        if (svg) {
            svg.style.width = '18px';
            svg.style.height = '18px';
        }

        const btnSettings = document.createElement('button');
        btnSettings.innerHTML = icons.gearFine || 'Set';
        btnSettings.title = 'Settings';
        btnSettings.style.background = 'transparent';
        btnSettings.style.border = 'none';
        btnSettings.style.color = 'rgba(245,245,245,0.6)';
        btnSettings.style.cursor = 'pointer';
        btnSettings.style.padding = '0';
        btnSettings.style.display = 'flex';
        btnSettings.style.alignItems = 'center';
        btnSettings.addEventListener('click', () => {
            this.hasKey = false; // Force re-render settings
            this.renderSettings();
        });

        header.appendChild(title);
        header.appendChild(btnSettings);

        this.chatBox = document.createElement('div');
        this.chatBox.style.flex = '1';
        this.chatBox.style.overflowY = 'auto';
        this.chatBox.style.overflowX = 'hidden';
        this.chatBox.style.display = 'flex';
        this.chatBox.style.flexDirection = 'column';
        this.chatBox.style.gap = '1rem';
        this.chatBox.style.padding = '0.5rem';
        this.chatBox.style.boxSizing = 'border-box';
        this.chatBox.style.scrollbarWidth = 'thin';
        this.chatBox.style.scrollbarColor = 'rgba(255,255,255,0.2) transparent';

        const inputContainer = document.createElement('div');
        inputContainer.style.position = 'relative';
        inputContainer.style.flexShrink = '0';
        inputContainer.style.padding = '0.5rem';
        inputContainer.style.background = 'rgba(10,10,10,0.95)';
        inputContainer.style.borderTop = '1px solid rgba(255,255,255,0.05)';
        inputContainer.style.boxSizing = 'border-box';

        this.promptInput = document.createElement('textarea');
        this.promptInput.placeholder = 'Ask Copilot...';
        this.promptInput.style.width = '100%';
        this.promptInput.style.boxSizing = 'border-box';
        this.promptInput.style.minHeight = '42px';
        this.promptInput.style.maxHeight = '150px';
        this.promptInput.style.background = 'rgba(255,255,255,0.05)';
        this.promptInput.style.border = '1px solid rgba(255,255,255,0.1)';
        this.promptInput.style.borderRadius = '21px';
        this.promptInput.style.color = '#fff';
        this.promptInput.style.padding = '0.6rem 3rem 0.6rem 1rem';
        this.promptInput.style.outline = 'none';
        this.promptInput.style.resize = 'none';
        this.promptInput.style.fontFamily = 'inherit';
        this.promptInput.style.fontSize = '0.85rem';
        this.promptInput.style.lineHeight = '1.4';
        this.promptInput.style.transition = 'border-color 0.2s';
        
        this.promptInput.addEventListener('focus', () => this.promptInput.style.borderColor = 'var(--accent-faint)');
        this.promptInput.addEventListener('blur', () => this.promptInput.style.borderColor = 'rgba(255,255,255,0.1)');

        this.promptInput.addEventListener('input', () => {
            this.promptInput.style.height = '42px';
            this.promptInput.style.height = Math.min(this.promptInput.scrollHeight, 150) + 'px';
        });

        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendPrompt();
            }
        });

        const btnSend = document.createElement('button');
        btnSend.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        btnSend.style.position = 'absolute';
        btnSend.style.right = '12px';
        btnSend.style.bottom = '11px';
        btnSend.style.background = 'var(--accent-solid)';
        btnSend.style.color = '#fff';
        btnSend.style.border = 'none';
        btnSend.style.borderRadius = '50%';
        btnSend.style.width = '36px';
        btnSend.style.height = '36px';
        btnSend.style.cursor = 'pointer';
        btnSend.style.display = 'flex';
        btnSend.style.alignItems = 'center';
        btnSend.style.justifyContent = 'center';
        btnSend.style.transition = 'transform 0.1s, opacity 0.2s';

        btnSend.addEventListener('mousedown', () => btnSend.style.transform = 'scale(0.9)');
        btnSend.addEventListener('mouseup', () => btnSend.style.transform = 'none');
        btnSend.addEventListener('mouseleave', () => btnSend.style.transform = 'none');
        btnSend.addEventListener('click', () => this.sendPrompt());

        inputContainer.appendChild(this.promptInput);
        inputContainer.appendChild(btnSend);

        this.container.appendChild(header);
        this.container.appendChild(this.chatBox);
        this.container.appendChild(inputContainer);

        this.chatHistory.forEach(msg => this.appendMessage(msg.role, msg.text));
        
        if (this.chatHistory.length === 0) {
            this.appendMessage('assistant', 'Hi! I am your AI Copilot. Select a text element on the canvas and ask me to fill it with content, or just ask me anything.');
        }
    }

    async sendPrompt() {
        const text = this.promptInput.value.trim();
        if (!text) return;

        this.promptInput.value = '';
        this.promptInput.style.height = '40px';
        this.appendMessage('user', text);

        const typingId = this.appendMessage('assistant', '<span class="escms-typing">...</span>');

        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt: text})
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                this.updateMessage(typingId, data.text);
            } else {
                this.updateMessage(typingId, `<span style="color:#ef4444">Error: ${data.msg || 'Unknown error'} ${data.details ? '<br><small>'+data.details+'</small>' : ''}</span>`);
            }
        } catch (err) {
            console.error(err);
            this.updateMessage(typingId, `<span style="color:#ef4444">Network error</span>`);
        }
    }

    appendMessage(role, text) {
        const msgId = 'msg-' + Date.now() + Math.floor(Math.random() * 1000);
        const wrapper = document.createElement('div');
        wrapper.id = msgId;
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';

        const bubble = document.createElement('div');
        bubble.style.maxWidth = '92%';
        bubble.style.padding = '0.5rem 0.75rem';
        bubble.style.fontSize = '0.8rem';
        bubble.style.lineHeight = '1.5';
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.style.wordBreak = 'break-word';
        bubble.style.boxSizing = 'border-box';

        if (role === 'user') {
            bubble.style.background = 'var(--accent-solid)';
            bubble.style.color = '#fff';
            bubble.style.borderRadius = '16px 16px 2px 16px';
        } else {
            bubble.style.background = 'rgba(255,255,255,0.05)';
            bubble.style.color = 'rgba(245,245,245,0.9)';
            bubble.style.border = '1px solid rgba(255,255,255,0.05)';
            bubble.style.borderRadius = '16px 16px 16px 2px';
        }

        bubble.innerHTML = text;
        
        if (!text.includes('escms-typing') && !text.includes('Error')) {
            this.chatHistory.push({role, text});
        }

        wrapper.appendChild(bubble);
        this.addInjectButton(wrapper, role, text);

        this.chatBox.appendChild(wrapper);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;

        return msgId;
    }

    updateMessage(id, newText) {
        const wrapper = this.chatBox.querySelector('#' + id);
        if (wrapper) {
            const bubble = wrapper.firstChild;
            bubble.innerHTML = newText;
            
            if (!newText.includes('Error')) {
                const last = this.chatHistory[this.chatHistory.length - 1];
                if (last && last.role === 'assistant' && last.text.includes('escms-typing')) {
                    this.chatHistory.pop();
                }
                this.chatHistory.push({role: 'assistant', text: newText});
                this.addInjectButton(wrapper, 'assistant', newText);
            }
            
            this.chatBox.scrollTop = this.chatBox.scrollHeight;
        }
    }

    addInjectButton(wrapper, role, text) {
        if (role === 'assistant' && !text.includes('escms-typing') && !text.includes('Error')) {
            // Remove existing inject button if any
            const existingBtn = wrapper.querySelector('.escms-inject-btn');
            if (existingBtn) existingBtn.remove();

            const injectBtn = document.createElement('button');
            injectBtn.className = 'escms-inject-btn';
            injectBtn.textContent = 'Inject to Selection';
            injectBtn.style.background = 'transparent';
            injectBtn.style.border = 'none';
            injectBtn.style.color = 'var(--accent-solid)';
            injectBtn.style.fontSize = '0.7rem';
            injectBtn.style.marginTop = '4px';
            injectBtn.style.cursor = 'pointer';
            injectBtn.style.padding = '0';
            injectBtn.style.opacity = '0.5';
            injectBtn.style.transition = 'opacity 0.2s';
            injectBtn.addEventListener('mouseenter', () => injectBtn.style.opacity = '1');
            injectBtn.addEventListener('mouseleave', () => injectBtn.style.opacity = '0.5');
            
            injectBtn.addEventListener('click', () => {
                const selected = window.escmsEditorApp ? window.escmsEditorApp.leftPanel.selectedNode : null;
                const docRoot = window.escmsEditorApp ? window.escmsEditorApp.canvas.shadowRoot.getElementById('document-root') : null;
                const target = selected || docRoot;

                if (!target) return;

                const isContainer = ['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) || target === docRoot;

                if (isContainer) {
                    // Si el destino es un contenedor, parseamos el HTML (quitando marcas de markdown)
                    let cleanText = text.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();
                    const temp = document.createElement('div');
                    temp.innerHTML = cleanText;

                    const applyClasses = (node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const tag = node.tagName.toLowerCase();
                            if (['h1','h2','h3','h4','h5','h6'].includes(tag)) node.classList.add('escms-heading');
                            else if (tag === 'p' || tag === 'span') node.classList.add('escms-text');
                            else if (tag === 'section') node.classList.add('escms-section');
                            else if (tag === 'div') node.classList.add('escms-container');
                            else if (tag === 'a') node.classList.add('escms-link');
                            else if (tag === 'img') node.classList.add('escms-image');
                            else if (tag === 'button') node.classList.add('escms-button');
                            Array.from(node.children).forEach(applyClasses);
                        }
                    };

                    Array.from(temp.children).forEach(child => {
                        applyClasses(child);
                        target.appendChild(child);
                    });
                    
                    if (window.escmsEditorApp && window.escmsEditorApp.playSound) {
                        window.escmsEditorApp.playSound('success');
                    }
                } else if (target.isContentEditable) {
                    // Si es texto
                    target.textContent = text; 
                    target.dispatchEvent(new Event('input', {bubbles:true}));
                    if (window.escmsEditorApp && window.escmsEditorApp.playSound) {
                        window.escmsEditorApp.playSound('success');
                    }
                } else {
                    alert('Select an editable text element or a container first.');
                }
            });
            wrapper.appendChild(injectBtn);
        }
    }
}
