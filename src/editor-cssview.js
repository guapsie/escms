class EscmsCssView {
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

        this.cssContainer = document.createElement('pre');
        this.cssContainer.style.margin = '0';
        this.cssContainer.style.fontFamily = 'monospace';
        this.cssContainer.style.fontSize = '0.85rem';
        this.cssContainer.style.lineHeight = '1.5';
        this.cssContainer.style.color = '#e5e7eb';
        this.cssContainer.style.whiteSpace = 'pre-wrap';
        this.cssContainer.style.position = 'absolute';
        this.cssContainer.style.top = '2rem';
        this.cssContainer.style.left = '2rem';
        this.cssContainer.style.right = '2rem';
        this.cssContainer.style.bottom = '2rem';
        this.cssContainer.style.overflow = 'hidden'; // Hide its own scrollbar, sync with textarea
        this.cssContainer.style.pointerEvents = 'none';
        // Diferente zebra stripe
        this.cssContainer.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.15) 50%, transparent 50%)';
        this.cssContainer.style.backgroundSize = '100% 3em';
        this.cssContainer.style.backgroundAttachment = 'local';

        this.textarea = document.createElement('textarea');
        this.textarea.style.margin = '0';
        this.textarea.style.fontFamily = 'monospace';
        this.textarea.style.fontSize = '0.85rem';
        this.textarea.style.lineHeight = '1.5';
        this.textarea.style.whiteSpace = 'pre-wrap';
        this.textarea.style.position = 'absolute';
        this.textarea.style.top = '2rem';
        this.textarea.style.left = '2rem';
        this.textarea.style.right = '2rem';
        this.textarea.style.bottom = '2rem';
        this.textarea.style.width = 'calc(100% - 4rem)';
        this.textarea.style.height = 'calc(100% - 4rem)';
        this.textarea.style.overflow = 'auto';
        this.textarea.style.background = 'transparent';
        this.textarea.style.color = 'transparent';
        this.textarea.style.caretColor = '#34d399'; // Emerald cursor para CSS
        this.textarea.style.border = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.resize = 'none';
        this.textarea.spellcheck = false;

        this.textarea.addEventListener('scroll', () => {
            this.cssContainer.scrollTop = this.textarea.scrollTop;
            this.cssContainer.scrollLeft = this.textarea.scrollLeft;
        });

        this.textarea.addEventListener('input', (e) => {
            this.cssContainer.innerHTML = this.colorizeCss(e.target.value);
            btnSave.style.boxShadow = '0 0 10px var(--accent-faint)';
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
                this.cssContainer.innerHTML = this.colorizeCss(data.css);
                this.lastSavedValue = data.css;
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
                this.cssContainer.innerHTML = this.colorizeCss(data.css);
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
            styleEl.textContent = cssString;
        }
    }

    colorizeCss(css) {
        let escaped = css.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Comentarios
        escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6b7280; font-style: italic;">$1</span>');
        
        // Selectores (antes de { )
        escaped = escaped.replace(/([^{]+)(?=\{)/g, '<span style="color: #60a5fa; font-weight: bold;">$1</span>');
        
        // Propiedades (antes de : )
        escaped = escaped.replace(/([{;]\s*)([a-zA-Z-]+)(\s*:)/g, '$1<span style="color: #34d399;">$2</span>$3');
        
        // Valores (después de : hasta ; o })
        escaped = escaped.replace(/(:\s*)([^;}]+)([;}])/g, '$1<span style="color: #fb923c;">$2</span>$3');
        
        // Variables css (--var-name)
        escaped = escaped.replace(/(--[a-zA-Z0-9-]+)/g, '<span style="color: #c084fc;">$1</span>');

        return escaped;
    }
}
