export class EscmsCssView {
    constructor() {
        this.view = null;
        this.cssContainer = null;
        this.textarea = null;
        this.lastSavedValue = '';
        this.syncTimeout = null;
    }

    init(container) {
        this.view = document.createElement('div');
        this.view.id = 'escms-css-view';
        this.view.style.flex = '1';
        this.view.style.position = 'relative';
        this.view.style.backgroundColor = '#0f0f11'; // Slightly different dark bg
        this.view.style.display = 'none';
        this.view.style.flexDirection = 'column';

        // Topbar
        const topbar = document.createElement('div');
        topbar.style.height = '48px';
        topbar.style.display = 'flex';
        topbar.style.alignItems = 'center';
        topbar.style.padding = '0 2rem';
        topbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        topbar.style.justifyContent = 'flex-end';
        topbar.style.gap = '1rem';
        topbar.style.flexShrink = '0';

        const btnRestore = document.createElement('button');
        btnRestore.innerHTML = '<span data-i18n="css.restore">Restore Default</span>';
        btnRestore.style.background = 'transparent';
        btnRestore.style.color = '#ef4444';
        btnRestore.style.border = '1px solid #ef4444';
        btnRestore.style.padding = '6px 12px';
        btnRestore.style.borderRadius = '4px';
        btnRestore.style.cursor = 'pointer';
        btnRestore.style.fontSize = '0.75rem';
        btnRestore.style.fontWeight = 'bold';
        btnRestore.style.transition = 'all 0.2s';
        btnRestore.addEventListener('mouseenter', () => { btnRestore.style.background = 'rgba(239, 68, 68, 0.1)'; });
        btnRestore.addEventListener('mouseleave', () => { btnRestore.style.background = 'transparent'; });
        btnRestore.addEventListener('click', () => this.restoreCss());

        const btnSave = document.createElement('button');
        btnSave.innerHTML = '<span data-i18n="css.save">Save Changes</span>';
        btnSave.style.background = 'var(--accent-solid)';
        btnSave.style.color = 'var(--text-solid)';
        btnSave.style.border = 'none';
        btnSave.style.padding = '6px 16px';
        btnSave.style.borderRadius = '4px';
        btnSave.style.cursor = 'pointer';
        btnSave.style.fontSize = '0.75rem';
        btnSave.style.fontWeight = 'bold';
        btnSave.style.transition = 'all 0.2s';
        btnSave.addEventListener('click', () => this.saveCss());

        topbar.appendChild(btnRestore);
        topbar.appendChild(btnSave);

        // Editor "Zero-Bloat"
        const editorWrapper = document.createElement('div');
        editorWrapper.style.flex = '1';
        editorWrapper.style.position = 'relative';
        editorWrapper.style.padding = '2rem';
        editorWrapper.style.overflow = 'hidden';

        const sharedStyles = `
            margin: 0;
            padding: 1rem;
            border: none;
            box-sizing: border-box;
            font-family: Consolas, "Courier New", monospace;
            font-size: 0.85rem;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
            overflow-wrap: break-word;
            tab-size: 4;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        `;

        this.cssContainer = document.createElement('pre');
        this.cssContainer.style.cssText = sharedStyles + `
            color: #e5e7eb;
            overflow: hidden;
            pointer-events: none;
            background-image: linear-gradient(rgba(0, 0, 0, 0.15) 50%, transparent 50%);
            background-size: 100% 3em;
            background-attachment: local;
        `;

        this.textarea = document.createElement('textarea');
        this.textarea.style.cssText = sharedStyles + `
            overflow: auto;
            background: transparent;
            color: transparent;
            caret-color: #34d399;
            outline: none;
            resize: none;
        `;
        this.textarea.spellcheck = false;

        this.textarea.addEventListener('scroll', () => {
            this.cssContainer.scrollTop = this.textarea.scrollTop;
            this.cssContainer.scrollLeft = this.textarea.scrollLeft;
        });

        this.textarea.addEventListener('input', (e) => {
            let formatted = this.colorizeCss(e.target.value);
            if (e.target.value.endsWith('\n')) {
                formatted += ' ';
            }
            this.cssContainer.innerHTML = formatted;
            btnSave.style.boxShadow = '0 0 10px var(--accent-faint)';
            
            // Sync live to canvas
            this.updateCanvasCss(e.target.value);
        });

        editorWrapper.appendChild(this.cssContainer);
        editorWrapper.appendChild(this.textarea);
        
        this.view.appendChild(topbar);
        this.view.appendChild(editorWrapper);
        container.appendChild(this.view);

        window.addEventListener('escms-view-change', (e) => {
            if (e.detail.viewId === 'css') {
                this.show();
            } else {
                this.hide();
            }
        });
        
        this.fetchCss();
    }

    show() {
        if (this.view) this.view.style.display = 'flex';
    }

    hide() {
        if (this.view) this.view.style.display = 'none';
    }

    async fetchCss() {
        try {
            const res = await fetch('/api/css/read');
            const data = await res.json();
            if (data.status === 'success') {
                this.textarea.value = data.css;
                let formatted = this.colorizeCss(data.css);
                if (data.css.endsWith('\n')) formatted += ' ';
                this.cssContainer.innerHTML = formatted;
                this.lastSavedValue = data.css;
                
                // Inject the stylesheet into the shadow DOM initially
                this.updateCanvasCss(data.css);
            }
        } catch (e) {
            console.error('Failed to load CSS', e);
        }
    }

    async saveCss() {
        try {
            const css = this.textarea.value;
            const res = await fetch('/api/css/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ css })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.lastSavedValue = css;
                this.view.querySelector('button:nth-child(2)').style.boxShadow = 'none';
                
                // Shake success feedback
                const btn = this.view.querySelector('button:nth-child(2)');
                btn.textContent = 'Saved!';
                setTimeout(() => { btn.innerHTML = '<span data-i18n="css.save">Save Changes</span>'; }, 2000);
                
                // Update canvas stylesheet
                this.updateCanvasCss(css);
            }
        } catch (e) {
            console.error('Failed to save CSS', e);
        }
    }

    async restoreCss() {
        if (!confirm('Are you sure you want to restore the template default CSS? This will delete your custom changes.')) return;
        
        try {
            const res = await fetch('/api/css/restore', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                this.textarea.value = data.css;
                let formatted = this.colorizeCss(data.css);
                if (data.css.endsWith('\n')) formatted += ' ';
                this.cssContainer.innerHTML = formatted;
                this.lastSavedValue = data.css;
                
                // Update canvas stylesheet
                this.updateCanvasCss(data.css);
            }
        } catch (e) {
            console.error('Failed to restore CSS', e);
        }
    }

    updateCanvasCss(cssString) {
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            let styleEl = host.shadowRoot.getElementById('escms-template-css');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'escms-template-css';
                host.shadowRoot.insertBefore(styleEl, host.shadowRoot.firstChild);
            }
            
            // Re-scope variables from :root and body to the actual shadow DOM root
            let scopedCss = cssString.replace(/:root/g, '#document-root');
            scopedCss = scopedCss.replace(/\bbody\s*{/g, '#document-root {');
            
            styleEl.textContent = scopedCss;
        }
    }

    colorizeCss(css) {
        let escaped = css.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let result = '';
        let state = 0; // 0: Selector, 1: Property, 2: Value
        let buffer = '';
        let inQuote = null; // null, "'", or '"'
        let parens = 0;
        
        let i = 0;
        while (i < escaped.length) {
            // Check for comment
            if (!inQuote && escaped.substring(i, i+2) === '/' + '*') {
                let end = escaped.indexOf('*' + '/', i + 2);
                if (end === -1) end = escaped.length;
                else end += 2;
                let comment = escaped.substring(i, end);
                
                result += formatBuffer(buffer, state);
                buffer = '';
                
                result += `<span style="color: #6b7280; font-style: italic;">${comment}</span>`;
                i = end;
                continue;
            }

            let char = escaped[i];
            
            // Handle quotes
            if (char === '"' || char === "'") {
                if (inQuote === char) {
                    // check if escaped
                    if (i > 0 && escaped[i-1] !== '\\') {
                        inQuote = null;
                    } else if (i > 0 && escaped[i-1] === '\\') {
                        let bsCount = 0;
                        let j = i - 1;
                        while (j >= 0 && escaped[j] === '\\') {
                            bsCount++;
                            j--;
                        }
                        if (bsCount % 2 === 0) {
                            inQuote = null;
                        }
                    }
                } else if (!inQuote) {
                    inQuote = char;
                }
            }
            
            if (!inQuote) {
                if (char === '(') parens++;
                if (char === ')') parens--;
                if (parens < 0) parens = 0;
            }

            if (state === 0) { // Selector
                if (char === '{' && !inQuote) {
                    result += formatBuffer(buffer, 0) + '{';
                    buffer = '';
                    state = 1;
                } else {
                    buffer += char;
                }
            } else if (state === 1) { // Property
                if (char === ':' && !inQuote) {
                    result += formatBuffer(buffer, 1) + ':';
                    buffer = '';
                    state = 2;
                } else if (char === '}' && !inQuote) {
                    result += formatBuffer(buffer, 1) + '}';
                    buffer = '';
                    state = 0;
                } else {
                    buffer += char;
                }
            } else if (state === 2) { // Value
                if (char === ';' && !inQuote && parens === 0) {
                    result += formatBuffer(buffer, 2) + ';';
                    buffer = '';
                    state = 1;
                } else if (char === '}' && !inQuote && parens === 0) {
                    result += formatBuffer(buffer, 2) + '}';
                    buffer = '';
                    state = 0;
                } else {
                    buffer += char;
                }
            }
            i++;
        }
        
        result += formatBuffer(buffer, state);
        return result;

        function formatBuffer(buf, s) {
            if (!buf) return '';
            let leadingMatch = buf.match(/^\s*/);
            let trailingMatch = buf.match(/\s*$/);
            let leading = leadingMatch ? leadingMatch[0] : '';
            let trailing = trailingMatch ? trailingMatch[0] : '';
            
            if (leading.length === buf.length) return buf; // only whitespace
            
            let content = buf.substring(leading.length, buf.length - trailing.length);
            
            if (s === 0) return `${leading}<span style="color: #60a5fa; font-weight: bold;">${content}</span>${trailing}`;
            if (s === 1) return `${leading}<span style="color: #34d399;">${content}</span>${trailing}`;
            if (s === 2) {
                let val = content.replace(/(--[a-zA-Z0-9-]+)/g, '<span style="color: #c084fc;">$1</span>');
                return `${leading}<span style="color: #fb923c;">${val}</span>${trailing}`;
            }
            return buf;
        }
    }
}
