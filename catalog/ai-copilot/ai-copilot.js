import { el } from '/assets/js/escms-dom.js';
import { icons } from '/assets/js/editor-icons.js';
import { EscmsSelect } from '/assets/js/editor-controls.js';

export class EscmsCopilot {
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
        
        if (this.hasCheckedSettings) {
            if (this.hasKey) {
                this.renderChat();
                if (this.promptInput) {
                    setTimeout(() => this.promptInput.focus(), 50);
                }
            } else {
                this.renderSettings();
            }
        } else {
            this.container.innerHTML = '<div style="padding: 1rem; color: rgba(245,245,245,0.4); text-align: center; font-size: 0.8rem;">Loading Copilot...</div>';
            this.checkSettings();
        }
    }

    async checkSettings() {
        try {
            const res = await fetch('/api/addons/ai-copilot/settings');
            const data = await res.json();
            if (data.status === 'success') {
                this.hasKey = data.has_key;
                this.provider = data.provider || 'gemini';
                this.model = data.model || '';
                this.hasCheckedSettings = true;
                
                if (this.container) {
                    if (this.hasKey) {
                        this.renderChat();
                        if (this.promptInput) {
                            setTimeout(() => this.promptInput.focus(), 50);
                        }
                    } else {
                        this.renderSettings();
                    }
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
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.height = '100%';

        const icon = document.createElement('div');
        icon.innerHTML = icons.ai || '';
        icon.style.color = 'rgba(245,245,245,0.2)';
        const svg = icon.querySelector('svg');
        if (svg) { svg.style.width = '48px'; svg.style.height = '48px'; }

        const text = document.createElement('div');
        text.setAttribute('data-i18n', 'ai.panel_unconfigured');
        text.textContent = this.i18n ? (this.i18n.dictionary['ai.panel_unconfigured'] || 'AI Copilot is not configured.') : 'AI Copilot is not configured.';
        text.style.color = 'rgba(245,245,245,0.6)';
        text.style.fontSize = '0.9rem';

        const btn = document.createElement('button');
        btn.innerHTML = `${icons.gearFine || ''} <span style="margin-left:8px;" data-i18n="ai.btn_open_settings">${this.i18n ? (this.i18n.dictionary['ai.btn_open_settings'] || 'Open Global Settings') : 'Open Global Settings'}</span>`;
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.background = 'var(--accent-solid)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.padding = '0.75rem 1.5rem';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '500';
        
        const btnSvg = btn.querySelector('svg');
        if (btnSvg) { btnSvg.style.width = '16px'; btnSvg.style.height = '16px'; }

        btn.addEventListener('click', () => {
            const gearBtn = document.getElementById('btn-settings');
            if (gearBtn) gearBtn.click();
            if (window.escmsEditor && window.escmsEditor.settings) {
                window.escmsEditor.settings.switchTab('general');
            }
        });

        this.container.appendChild(icon);
        this.container.appendChild(text);
        this.container.appendChild(btn);
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
        title.innerHTML = `${icons.ai || ''} <span style="font-weight:500;" data-i18n="ai.panel_title">${this.i18n ? (this.i18n.dictionary['ai.panel_title'] || 'Copilot') : 'Copilot'}</span> <span style="font-size:0.7rem; color:var(--accent-solid); opacity:0.8; margin-left:8px; text-transform:uppercase;">${this.provider}</span>`;
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
            const gearBtn = document.getElementById('btn-settings');
            if (gearBtn) gearBtn.click();
            if (window.escmsEditor && window.escmsEditor.settings) {
                window.escmsEditor.settings.switchTab('general');
            }
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
        this.promptInput.setAttribute('data-i18n-placeholder', 'ai.chat_placeholder'); // Optional if we want to add support for this in engine
        this.promptInput.placeholder = this.i18n ? (this.i18n.dictionary['ai.chat_placeholder'] || 'Ask Copilot...') : 'Ask Copilot...';
        this.promptInput.style.width = '100%';
        this.promptInput.style.boxSizing = 'border-box';
        this.promptInput.style.minHeight = '48px';
        this.promptInput.style.maxHeight = '250px';
        this.promptInput.style.background = 'rgba(255,255,255,0.05)';
        this.promptInput.style.border = '1px solid rgba(255,255,255,0.1)';
        this.promptInput.style.borderRadius = '24px';
        this.promptInput.style.color = '#fff';
        this.promptInput.style.padding = '0.85rem 3rem 0.85rem 1.25rem';
        this.promptInput.style.outline = 'none';
        this.promptInput.style.resize = 'none';
        this.promptInput.style.fontFamily = 'inherit';
        this.promptInput.style.fontSize = '0.9rem';
        this.promptInput.style.lineHeight = '1.4';
        this.promptInput.style.transition = 'border-color 0.2s';
        this.promptInput.style.overflow = 'hidden';
        
        this.promptInput.addEventListener('focus', () => this.promptInput.style.borderColor = 'var(--accent-faint)');
        this.promptInput.addEventListener('blur', () => this.promptInput.style.borderColor = 'rgba(255,255,255,0.1)');

        this.promptInput.addEventListener('input', () => {
            this.promptInput.style.height = '48px';
            const sHeight = this.promptInput.scrollHeight;
            this.promptInput.style.height = Math.min(sHeight, 250) + 'px';
            this.promptInput.style.overflow = sHeight > 250 ? 'auto' : 'hidden';
        });

        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendPrompt();
            }
        });

        const btnSend = document.createElement('button');
        btnSend.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-send"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M21.864 3.549l-6.454 17.868a1.55 1.55 0 0 1 -1.41 .903a1.54 1.54 0 0 1 -1.394 -.874l-2.88 -5.759zm-1.414 -1.414l-12.139 12.138l-5.728 -2.864a1.55 1.55 0 0 1 -.903 -1.409c0 -.606 .353 -1.157 .981 -1.44z" /></svg>';
        btnSend.style.position = 'absolute';
        btnSend.style.right = '18px';
        btnSend.style.bottom = '20px';
        btnSend.style.background = 'transparent';
        btnSend.style.color = 'var(--accent-solid)';
        btnSend.style.border = 'none';
        btnSend.style.padding = '0';
        btnSend.style.width = '24px';
        btnSend.style.height = '24px';
        btnSend.style.cursor = 'pointer';
        btnSend.style.display = 'flex';
        btnSend.style.alignItems = 'center';
        btnSend.style.justifyContent = 'center';
        btnSend.style.transition = 'transform 0.1s, opacity 0.2s';
        btnSend.style.opacity = '0.9';

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
            this.appendMessage('assistant', this.i18n ? (this.i18n.dictionary['ai.welcome'] || 'Hi! I am your AI Copilot. Select a text element on the canvas and ask me to fill it with content, or just ask me anything.') : 'Hi! I am your AI Copilot. Select a text element on the canvas and ask me to fill it with content, or just ask me anything.');
        }
    }

    async sendPrompt() {
        const text = this.promptInput.value.trim();
        if (!text) return;

        this.promptInput.value = '';
        this.promptInput.style.height = '48px';
        this.promptInput.style.overflow = 'hidden';
        this.appendMessage('user', text);

        const typingId = this.appendMessage('assistant', '<span class="escms-typing">...</span>');

        const context = this.getDomContext();
        const fullPrompt = `${text}\n\n[CONTEXTO DOM ACTUAL]\n${context}`;

        try {
            const res = await fetch('/api/addons/ai-copilot/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt: fullPrompt})
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                let aiText = data.text;
                let parsedCommands = null;

                // Extraer el JSON de la respuesta de forma robusta
                const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                let jsonStr = '';
                
                if (jsonMatch) {
                    jsonStr = jsonMatch[1];
                } else {
                    const cmdIndex = aiText.indexOf('"commands"');
                    if (cmdIndex !== -1) {
                        let startIdx = aiText.lastIndexOf('{', cmdIndex);
                        if (startIdx !== -1) {
                            let braceCount = 0;
                            let endIdx = -1;
                            for (let i = startIdx; i < aiText.length; i++) {
                                if (aiText[i] === '{') braceCount++;
                                else if (aiText[i] === '}') braceCount--;
                                
                                if (braceCount === 0) {
                                    endIdx = i;
                                    break;
                                }
                            }
                            if (endIdx !== -1) {
                                jsonStr = aiText.substring(startIdx, endIdx + 1);
                            }
                        }
                    }
                }

                if (jsonStr) {
                    try {
                        const cleanJsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                        const jsonObj = JSON.parse(cleanJsonStr);
                        console.log('[ESCMS AI] JSON detectado:', jsonObj);
                        if (jsonObj.commands && Array.isArray(jsonObj.commands)) {
                            parsedCommands = jsonObj.commands;
                        }
                        aiText = aiText.replace(/```(?:json)?[\s\S]*?```/gi, '').replace(jsonStr, '').trim();
                    } catch (e) {
                        aiText += `\n<br><span style="color:#ef4444;font-size:0.7rem;">(Error parsing JSON from AI: ${e.message})</span>`;
                        console.error("Error parsing AI JSON", e);
                    }
                }

                if (!aiText) aiText = '<span style="color:var(--accent-solid)">Comandos ejecutados.</span>';

                let execErrors = '';
                if (parsedCommands) {
                    execErrors = this.executeCommands(parsedCommands);
                }

                if (execErrors) {
                    aiText += `<br><span style="color:#ef4444;font-size:0.8rem;">${execErrors}</span>`;
                }
                
                this.updateMessage(typingId, aiText);
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
        bubble.style.maxWidth = '98%';
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
            injectBtn.setAttribute('data-i18n', 'ai.inject_btn');
            injectBtn.textContent = this.i18n ? (this.i18n.dictionary['ai.inject_btn'] || 'Inject to Selection') : 'Inject to Selection';
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
                const selected = window.escmsEditor ? window.escmsEditor.leftpanel.selectedNode : null;
                const docRoot = window.escmsEditor && window.escmsEditor.canvas && window.escmsEditor.canvas.host ? window.escmsEditor.canvas.host.shadowRoot.getElementById('document-root') : null;
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
                    
                    if (window.escmsEditor && window.escmsEditor.playSound) {
                        window.escmsEditor.playSound('success');
                    }
                } else if (target.isContentEditable) {
                    // Si es texto
                    target.textContent = text; 
                    target.dispatchEvent(new Event('input', {bubbles:true}));
                    if (window.escmsEditor && window.escmsEditor.playSound) {
                        window.escmsEditor.playSound('success');
                    }
                } else {
                    alert('Select an editable text element or a container first.');
                }
            });
            wrapper.appendChild(injectBtn);
        }
    }

    getDomContext() {
        if (!window.escmsEditor || !window.escmsEditor.canvas || !window.escmsEditor.canvas.host) return "Canvas is empty or unavailable.";
        const docRoot = window.escmsEditor.canvas.host.shadowRoot.getElementById('document-root');
        if (!docRoot) return "Canvas is empty.";

        const selected = window.escmsEditor.leftpanel.selectedNode;
        let map = "";
        
        const isAncestorOfSelected = (node) => {
            if (!selected) return false;
            let curr = selected;
            while(curr) {
                if (curr === node) return true;
                curr = curr.parentNode;
            }
            return false;
        };

        const traverse = (node, depth) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const tag = node.tagName.toLowerCase();
            if (!node.id) {
                node.id = 'escms-' + Math.random().toString(36).substr(2, 9);
            }
            const id = node.id;
            const indent = '  '.repeat(depth);
            map += `${indent}- ${tag} (id: ${id})\n`;
            
            const isAncestor = isAncestorOfSelected(node);
            if (!isAncestor && depth >= 3) {
                const childCount = node.children.length;
                if (childCount > 0) {
                    map += `${indent}  [+ ${childCount} elementos ocultos para ahorrar contexto]\n`;
                }
                return;
            }
            
            Array.from(node.children).forEach(child => traverse(child, depth + 1));
        };
        
        map += `- div (id: canvas_root)\n`;
        Array.from(docRoot.children).forEach(child => traverse(child, 1));
        
        if (selected) {
            map += `\nElemento actualmente seleccionado: ${selected.tagName.toLowerCase()} (id: ${selected.id || 'no-id'})`;
        }

        return map;
    }

    findTargetNode(targetId) {
        if (!window.escmsEditor || !window.escmsEditor.canvas || !window.escmsEditor.canvas.host) return null;
        const docRoot = window.escmsEditor.canvas.host.shadowRoot.getElementById('document-root');
        if (targetId === 'canvas_root' || !targetId) return docRoot;
        return docRoot.querySelector(`#${targetId}`);
    }

    getAtomDefinition(type) {
        if (!window.escmsEditor || !window.escmsEditor.leftpanel) return null;
        const cats = window.escmsEditor.leftpanel.atomCategories;
        for (let cat of cats) {
            for (let atom of cat.atoms) {
                if (atom.name === type || atom.name.toLowerCase() === type.toLowerCase()) {
                    return atom;
                }
            }
        }
        return null;
    }

    createNodeFromDef(def) {
        const atomDef = this.getAtomDefinition(def.type);
        if (!atomDef) return null;

        const el = document.createElement(atomDef.tag);
        el.id = 'escms-' + Math.random().toString(36).substr(2, 9);
        
        let skipChildren = false;
        if (def.content) {
            el.textContent = def.content;
            if (atomDef.category === 'text' || (atomDef.children && atomDef.children.length === 1 && atomDef.children[0].textKey)) {
                skipChildren = true;
            }
        } else if (atomDef.textKey) {
            el.textContent = this.i18n.dictionary[atomDef.textKey] || 'New Text';
        }
        
        if (atomDef.className) el.className = atomDef.className;
        if (def.className) el.className += ' ' + def.className;
        
        if (atomDef.attributes) {
            Object.entries(atomDef.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
        if (atomDef.styles) {
            Object.assign(el.style, atomDef.styles);
        }

        if (def.styles) {
            if (typeof def.styles === 'string') {
                el.style.cssText += def.styles;
            } else if (typeof def.styles === 'object') {
                Object.entries(def.styles).forEach(([k, v]) => {
                    const camelKey = k.replace(/-([a-z])/g, g => g[1].toUpperCase());
                    el.style[camelKey] = v;
                });
            }
        }

        if (def.children && Array.isArray(def.children)) {
            def.children.forEach(childDef => {
                const childNode = this.createNodeFromDef(childDef);
                if (childNode) el.appendChild(childNode);
            });
            if (el.classList && el.classList.contains('escms-columns')) {
                const count = el.children.length;
                el.setAttribute('data-columns', count);
                el.style.gridTemplateColumns = count > 0 ? `repeat(${count}, 1fr)` : 'none';
            }
        } else if (atomDef.children && !skipChildren) {
            atomDef.children.forEach(childAtom => {
                const childEl = document.createElement(childAtom.tag);
                childEl.id = 'escms-' + Math.random().toString(36).substr(2, 9);
                if (childAtom.textKey) childEl.textContent = this.i18n.dictionary[childAtom.textKey] || 'Item';
                if (childAtom.className) childEl.className = childAtom.className;
                if (childAtom.attributes) {
                    Object.entries(childAtom.attributes).forEach(([k, v]) => childEl.setAttribute(k, v));
                }
                if (childAtom.styles) {
                    Object.assign(childEl.style, childAtom.styles);
                }
                el.appendChild(childEl);
            });
        }
        
        return el;
    }

    executeCommands(commands) {
        if (!window.escmsEditor) return "Error crítico: Editor no inicializado.";
        if (!Array.isArray(commands)) return "Formato de comandos inválido.";

        const errors = [];
        const newNodes = {}; // Guarda los nodos creados en este lote por su índice

        commands.forEach((cmd, idx) => {
            let target = null;
            if (cmd.target_id && cmd.target_id.startsWith('NEW_')) {
                const refIdx = parseInt(cmd.target_id.replace('NEW_', ''));
                target = newNodes[refIdx] || null;
            } else {
                target = this.findTargetNode(cmd.target_id);
            }

            let parentNode = null;
            if (cmd.parent_id) {
                if (cmd.parent_id.startsWith('NEW_')) {
                    const pRefIdx = parseInt(cmd.parent_id.replace('NEW_', ''));
                    parentNode = newNodes[pRefIdx] || null;
                } else {
                    parentNode = this.findTargetNode(cmd.parent_id);
                }
            }

            if (!target && cmd.action !== 'add_atom') {
                errors.push(`Comando ${idx + 1}: No se encontró el elemento con ID '${cmd.target_id}'.`);
                return;
            }

            if (cmd.action === 'add_atom') {
                const docRoot = window.escmsEditor.canvas.host.shadowRoot.getElementById('document-root');
                const parent = target || docRoot;

                const el = this.createNodeFromDef(cmd);
                if (el) {
                    newNodes[idx] = el;
                    parent.appendChild(el);

                    // Auto-recalcular si el padre es un bloque de Columnas
                    if (parent.classList && parent.classList.contains('escms-columns')) {
                        const count = parent.children.length;
                        parent.setAttribute('data-columns', count);
                        parent.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
                    }
                } else {
                    errors.push(`Comando ${idx + 1}: El tipo de elemento '${cmd.type}' no existe en ESCMS.`);
                }
            } else if (cmd.action === 'update_atom') {
                if (target) {
                    if (cmd.content) {
                        target.textContent = cmd.content;
                    }
                    if (cmd.className) {
                        target.className += ' ' + cmd.className;
                    }
                    if (cmd.styles) {
                        if (typeof cmd.styles === 'string') {
                            target.style.cssText += cmd.styles;
                        } else if (typeof cmd.styles === 'object') {
                            Object.entries(cmd.styles).forEach(([k, v]) => {
                                const camelKey = k.replace(/-([a-z])/g, g => g[1].toUpperCase());
                                target.style[camelKey] = v;
                            });
                        }
                    }
                }
            } else if (cmd.action === 'remove_atom') {
                if (target && target.id !== 'document-root') {
                    const parent = target.parentNode;
                    target.remove();
                    // Auto-recalcular si el padre era un bloque de Columnas
                    if (parent && parent.classList && parent.classList.contains('escms-columns')) {
                        const count = parent.children.length;
                        parent.setAttribute('data-columns', count);
                        parent.style.gridTemplateColumns = count > 0 ? `repeat(${count}, 1fr)` : 'none';
                    }
                } else if (target && target.id === 'document-root') {
                    errors.push(`Comando ${idx + 1}: No se puede eliminar el canvas raíz.`);
                }
            } else if (cmd.action === 'move_atom') {
                if (target && parentNode) {
                    if (target.id === 'document-root') {
                        errors.push(`Comando ${idx + 1}: No se puede mover el canvas raíz.`);
                    } else {
                        const oldParent = target.parentNode;
                        parentNode.appendChild(target);
                        
                        if (oldParent && oldParent.classList && oldParent.classList.contains('escms-columns')) {
                            const count = oldParent.children.length;
                            oldParent.setAttribute('data-columns', count);
                            oldParent.style.gridTemplateColumns = count > 0 ? `repeat(${count}, 1fr)` : 'none';
                        }
                        if (parentNode.classList && parentNode.classList.contains('escms-columns')) {
                            const count = parentNode.children.length;
                            parentNode.setAttribute('data-columns', count);
                            parentNode.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
                        }
                    }
                } else {
                    if (!parentNode) errors.push(`Comando ${idx + 1}: No se encontró el nuevo padre con ID '${cmd.parent_id}'.`);
                }
            } else if (cmd.action === 'duplicate_atom') {
                if (target && target.id !== 'document-root') {
                    const parent = target.parentNode;
                    const copies = cmd.copies ? parseInt(cmd.copies) : 1;
                    
                    const cloneNodeAndRenewIds = (node) => {
                        const clone = node.cloneNode(false);
                        clone.id = 'escms-' + Math.random().toString(36).substr(2, 9);
                        Array.from(node.children).forEach(child => {
                            clone.appendChild(cloneNodeAndRenewIds(child));
                        });
                        return clone;
                    };

                    let currentRef = target;
                    for (let i = 0; i < copies; i++) {
                        const clone = cloneNodeAndRenewIds(target);
                        if (currentRef.nextSibling) {
                            parent.insertBefore(clone, currentRef.nextSibling);
                        } else {
                            parent.appendChild(clone);
                        }
                        currentRef = clone;
                    }

                    if (parent && parent.classList && parent.classList.contains('escms-columns')) {
                        const count = parent.children.length;
                        parent.setAttribute('data-columns', count);
                        parent.style.gridTemplateColumns = count > 0 ? `repeat(${count}, 1fr)` : 'none';
                    }
                } else if (target && target.id === 'document-root') {
                    errors.push(`Comando ${idx + 1}: No se puede duplicar el canvas raíz.`);
                }
            } else if (cmd.action === 'undo') {
                if (window.escmsEditor && window.escmsEditor.history) {
                    window.escmsEditor.history.undo();
                }
            }
        });

        if (errors.length === 0 && window.escmsEditor) {
            if (window.escmsEditor.playSound) {
                window.escmsEditor.playSound('success');
            }
            if (window.escmsEditor.history && commands.some(c => c.action !== 'undo')) {
                // Forzar guardado sincrono de este lote de cambios en la historia
                window.escmsEditor.history.pushState();
            }
        }

        return errors.join('<br>');
    }
}

window.addEventListener('escms:leftpanel:ready', (e) => {
    const leftPanel = e.detail.leftPanel;
    const aiInstance = new EscmsCopilot(window.escmsEditor ? window.escmsEditor.i18n : null);
    leftPanel.addTab('ai', icons.ai || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', 'Copilot', () => {
        aiInstance.init(leftPanel.contentArea);
    });
});

window.addEventListener('escms:settings:ready', (e) => {
    const settings = e.detail.settings;
    const tabContainer = document.createElement('div');
    tabContainer.innerHTML = '<h3>AI Copilot Settings</h3><div id="ai-settings-content">Loading...</div>';
    
    settings.addTab('ai', 'AI Copilot', tabContainer);
    
    fetch('/api/addons/ai-copilot/settings').then(r => r.json()).then(data => {
                if (data.status === 'success') {
                    const content = document.getElementById('ai-settings-content');
                    content.innerHTML = `
                        <div id="ai-provider-container" style="margin-bottom: 1.5rem;"></div>
                        
                        <div id="ai-endpoint-container" class="escms-control-row" style="display:none; margin-bottom: 1.5rem;">
                            <div class="escms-ui-label">Custom Endpoint URL</div>
                            <input type="text" id="ai-endpoint" value="${data.endpoint || ''}" placeholder="https://api.example.com/v1" class="escms-settings-input">
                        </div>

                        <div class="escms-control-row" style="margin-bottom: 1.5rem;">
                            <div class="escms-ui-label">API Key</div>
                            <input type="password" id="ai-key" placeholder="${data.has_key ? '(Key is configured. Enter new to change)' : 'Paste your API Key here'}" class="escms-settings-input">
                        </div>

                        <div id="ai-model-container" style="margin-bottom: 1.5rem;"></div>

                        <div style="margin-bottom: 1.5rem;">
                            <div class="escms-ui-label" style="margin-bottom: 0.5rem;">Custom Instructions (Optional)</div>
                            <textarea id="ai-instructions" rows="4" placeholder="e.g. Always respond in Spanish, use Tailwind classes sparingly, etc." class="escms-settings-input" style="resize:vertical; width: 100%; box-sizing: border-box;">${data.instructions || ''}</textarea>
                        </div>
                        
                        <div style="text-align: right; margin-top: 2rem;">
                            <button id="btn-save-ai" style="padding: 12px 24px; background: var(--accent-solid); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Save AI Settings</button>
                        </div>
                    `;

                    // Provider Dropdown
                    const providerOptions = [
                        { value: 'gemini', label: 'Google Gemini (Recommended)' },
                        { value: 'claude', label: 'Anthropic Claude' },
                        { value: 'groq', label: 'Groq (Fast)' },
                        { value: 'deepseek', label: 'DeepSeek' },
                        { value: 'mistral', label: 'Mistral AI' },
                        { value: 'custom', label: 'Custom OpenAI-compatible' }
                    ];
                    
                    let currentProvider = data.provider || 'gemini';
                    const endpointCont = document.getElementById('ai-endpoint-container');
                    const toggleEndpoint = (val) => {
                        if (val === 'custom') {
                            endpointCont.style.display = ''; // Restore grid display
                            endpointCont.classList.add('escms-control-row');
                        } else {
                            endpointCont.style.display = 'none';
                        }
                        currentProvider = val;
                    };
                    
                    const providerSelect = new EscmsSelect('Provider', providerOptions, currentProvider, toggleEndpoint);
                    providerSelect.element.children[0].textContent = 'Provider';
                    providerSelect.element.style.marginBottom = '0';
                    document.getElementById('ai-provider-container').appendChild(providerSelect.element);
                    toggleEndpoint(currentProvider);

                    // Model Dropdown
                    let currentModel = data.model || '';
                    const modelOptions = [
                        { value: currentModel, label: currentModel || 'Default' }
                    ];
                    let modelSelect = new EscmsSelect('Model', modelOptions, currentModel, (val) => { currentModel = val; });
                    modelSelect.element.children[0].textContent = 'Model';
                    modelSelect.element.style.marginBottom = '0';
                    
                    const modelRightSide = modelSelect.element.children[1];
                    const modelWrapper = document.createElement('div');
                    modelWrapper.style.display = 'flex';
                    modelWrapper.style.gap = '10px';
                    modelWrapper.style.alignItems = 'center';
                    
                    modelRightSide.parentNode.insertBefore(modelWrapper, modelRightSide);
                    modelWrapper.appendChild(modelRightSide);
                    
                    const fetchBtn = document.createElement('button');
                    fetchBtn.id = 'btn-fetch-models';
                    fetchBtn.textContent = 'Fetch Models';
                    fetchBtn.style = 'padding: 10px 16px; background: var(--accent-solid); color: #fff; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;';
                    modelWrapper.appendChild(fetchBtn);
                    
                    document.getElementById('ai-model-container').appendChild(modelSelect.element);




                    document.getElementById('btn-fetch-models').addEventListener('click', async (e) => {
                        e.preventDefault();
                        const key = document.getElementById('ai-key').value;
                        const provider = currentProvider;
                        const endpoint = document.getElementById('ai-endpoint').value;
                        
                        const btn = e.target;
                        btn.textContent = 'Fetching...';
                        
                        try {
                            const mr = await fetch('/api/addons/ai-copilot/models', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ provider, key, endpoint })
                            });
                            const md = await mr.json();
                            if (md.status === 'success') {
                                const newOptions = md.models.map(m => ({ value: m.value, label: m.label }));
                                modelSelect.updateOptions(newOptions);
                                if (newOptions.length > 0) {
                                    currentModel = newOptions[0].value;
                                }
                            } else {
                                alert('Error fetching models: ' + (md.msg || 'Unknown error'));
                            }
                        } catch (err) {
                            alert('Network error');
                        } finally {
                            btn.textContent = 'Fetch Models';
                        }
                    });

                    document.getElementById('btn-save-ai').addEventListener('click', async () => {
                        const payload = {
                            provider: currentProvider,
                            model: currentModel,
                            endpoint: document.getElementById('ai-endpoint').value,
                            key: document.getElementById('ai-key').value,
                            instructions: document.getElementById('ai-instructions').value
                        };
                        
                        const btn = document.getElementById('btn-save-ai');
                        btn.textContent = 'Saving...';
                        
                        try {
                            const sr = await fetch('/api/addons/ai-copilot/settings', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(payload)
                            });
                            const sd = await sr.json();
                            if (sd.status === 'success') {
                                btn.textContent = 'Saved!';
                                setTimeout(() => btn.textContent = 'Save AI Settings', 2000);
                            } else {
                                alert('Error saving: ' + sd.msg);
                                btn.textContent = 'Save AI Settings';
                            }
                        } catch (err) {
                            alert('Network error');
                            btn.textContent = 'Save AI Settings';
                        }
                    });
                } else {
                    const content = tabContainer.querySelector('#ai-settings-content') || document.getElementById('ai-settings-content');
                    if (content) content.innerHTML = '<p style="color:red">Error loading AI settings</p>';
                }
            });
});

window.addEventListener('escms:contextmenu:ready', (e) => {
    const contextMenu = e.detail.contextMenu;
    contextMenu.addItem('ai-prompt', 'Ask AI...', icons.ai || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', () => {
        if (window.escmsEditor && window.escmsEditor.leftpanel) {
            window.escmsEditor.leftpanel.activeTab = 'ai';
            window.escmsEditor.leftpanel.render();
            setTimeout(() => {
                const aiInput = document.querySelector('#escms-left-panel textarea');
                if (aiInput) {
                    aiInput.value = 'Change the text of the selected element to: ';
                    aiInput.focus();
                }
            }, 50);
        }
    });
});

window.addEventListener('escms:addon:uninstall', (e) => {
    if (e.detail.id === 'ai-copilot') {
        if (window.escmsEditor) {
            if (window.escmsEditor.leftpanel) window.escmsEditor.leftpanel.removeTab('ai');
            if (window.escmsEditor.settings) window.escmsEditor.settings.removeTab('ai');
            if (window.escmsEditor.contextMenu) window.escmsEditor.contextMenu.removeItem('ai-prompt');
        }
    }
});
