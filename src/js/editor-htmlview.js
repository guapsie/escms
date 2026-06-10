class EscmsHtmlView {
    constructor() {
        this.view = null;
        this.htmlContainer = null;
        this.textarea = null;
        this.isTyping = false;
        this.lastSavedValue = '';
        this.syncTimeout = null;
    }

    init(container) {
        this.view = document.createElement('div');
        this.view.id = 'escms-html-view';
        this.view.style.flex = '1';
        this.view.style.position = 'relative';
        this.view.style.backgroundColor = '#0a0a0a';
        this.view.style.display = 'none';
        
        // Editor "Zero-Bloat" con superposición
        const editorWrapper = document.createElement('div');
        editorWrapper.style.position = 'absolute';
        editorWrapper.style.top = '0';
        editorWrapper.style.left = '0';
        editorWrapper.style.right = '0';
        editorWrapper.style.bottom = '0';
        editorWrapper.style.padding = '2rem';
        editorWrapper.style.overflow = 'hidden';

        this.htmlContainer = document.createElement('pre');
        this.htmlContainer.style.margin = '0';
        this.htmlContainer.style.padding = '0';
        this.htmlContainer.style.boxSizing = 'border-box';
        this.htmlContainer.style.fontFamily = 'monospace';
        this.htmlContainer.style.fontSize = '0.85rem';
        this.htmlContainer.style.lineHeight = '1.5';
        this.htmlContainer.style.color = '#e5e7eb';
        this.htmlContainer.style.whiteSpace = 'pre-wrap';
        this.htmlContainer.style.wordWrap = 'break-word';
        this.htmlContainer.style.position = 'absolute';
        this.htmlContainer.style.top = '2rem';
        this.htmlContainer.style.left = '2rem';
        this.htmlContainer.style.right = '2rem';
        this.htmlContainer.style.bottom = '2rem';
        this.htmlContainer.style.overflow = 'hidden'; // Hide its own scrollbar, sync with textarea
        this.htmlContainer.style.pointerEvents = 'none'; // Para que los clicks pasen al textarea
        this.htmlContainer.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.02) 50%, transparent 50%)';
        this.htmlContainer.style.backgroundSize = '100% 3em';
        this.htmlContainer.style.backgroundAttachment = 'local';

        this.textarea = document.createElement('textarea');
        this.textarea.style.margin = '0';
        this.textarea.style.padding = '0';
        this.textarea.style.boxSizing = 'border-box';
        this.textarea.style.fontFamily = 'monospace';
        this.textarea.style.fontSize = '0.85rem';
        this.textarea.style.lineHeight = '1.5';
        this.textarea.style.whiteSpace = 'pre-wrap';
        this.textarea.style.wordWrap = 'break-word';
        this.textarea.style.position = 'absolute';
        this.textarea.style.top = '2rem';
        this.textarea.style.left = '2rem';
        this.textarea.style.right = '2rem';
        this.textarea.style.bottom = '2rem';
        this.textarea.style.width = 'calc(100% - 4rem)';
        this.textarea.style.height = 'calc(100% - 4rem)';
        this.textarea.style.overflow = 'auto';
        this.textarea.style.background = 'transparent';
        this.textarea.style.color = 'transparent'; // Ocultamos el texto
        this.textarea.style.caretColor = '#f5f5f5'; // Pero mostramos el cursor
        this.textarea.style.border = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.resize = 'none';
        this.textarea.spellcheck = false;

        // Sincronizar scroll
        this.textarea.addEventListener('scroll', () => {
            this.htmlContainer.scrollTop = this.textarea.scrollTop;
            this.htmlContainer.scrollLeft = this.textarea.scrollLeft;
        });

        // Sincronizar coloreado en vivo
        this.textarea.addEventListener('input', (e) => {
            this.htmlContainer.innerHTML = this.colorizeHtml(e.target.value);
            this.isTyping = true;
            
            if (this.syncTimeout) clearTimeout(this.syncTimeout);
            this.syncTimeout = setTimeout(() => {
                this.parseAndSync(true); // silent
            }, 1000);
        });

        // Tracking del cursor para las Layers
        const trackCursor = () => {
            if (this.view.style.display === 'none') return;
            const pos = this.textarea.selectionStart;
            const html = this.textarea.value.substring(0, pos);
            const path = this.getDomPathFromHtml(html);
            if (path) {
                window.dispatchEvent(new CustomEvent('escms-html-cursor-moved', { detail: { path } }));
            }
        };

        this.textarea.addEventListener('click', trackCursor);
        this.textarea.addEventListener('keyup', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                trackCursor();
            }
        });

        // Escuchar selección desde Layers
        window.addEventListener('escms-layer-selected', (e) => {
            if (this.view.style.display !== 'none' && e.detail.path) {
                this.highlightHtmlFromPath(e.detail.path);
            }
        });

        editorWrapper.appendChild(this.htmlContainer);
        editorWrapper.appendChild(this.textarea);
        this.view.appendChild(editorWrapper);
        container.appendChild(this.view);

        window.addEventListener('escms-view-change', (e) => {
            if (e.detail.viewId === 'html') {
                this.generateFullDocument();
                this.show();
            } else {
                if (this.view.style.display !== 'none' && this.isTyping) {
                    this.parseAndSync();
                }
                this.hide();
            }
        });
    }

    show() {
        if (this.view) this.view.style.display = 'block';
    }

    hide() {
        if (this.view) this.view.style.display = 'none';
    }

    generateFullDocument() {
        const host = document.getElementById('escms-canvas-host');
        if (!host) return;

        // Extraemos Body
        const clone = host.cloneNode(true);
        if (host.shadowRoot) {
            const root = host.shadowRoot.getElementById('document-root');
            if (root) {
                clone.innerHTML = root.innerHTML;
            }
        }
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.escms-selected').forEach(el => el.classList.remove('escms-selected'));
        clone.querySelectorAll('[class=""]').forEach(el => el.removeAttribute('class'));
        let bodyContent = clone.innerHTML;

        // Recuperamos datos SEO globales
        let seoData = { title: 'ESCMS Page', description: '', keywords: '', language: 'en' };
        if (window.escmsEditor && window.escmsEditor.seoView) {
            seoData = window.escmsEditor.seoView.data;
        }

        let docHtml = `<!DOCTYPE html>\n<html lang="${seoData.language || 'en'}">\n<head>\n`;
        docHtml += `    <meta charset="UTF-8">\n`;
        docHtml += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        if (seoData.title) docHtml += `    <title>${seoData.title}</title>\n`;
        if (seoData.description) docHtml += `    <meta name="description" content="${seoData.description}">\n`;
        if (seoData.keywords) docHtml += `    <meta name="keywords" content="${seoData.keywords}">\n`;
        
        // Settings (Fonts, CSS vars...) 
        if (window.escmsEditor && window.escmsEditor.settings) {
            const fonts = window.escmsEditor.settings.googleFonts;
            if (fonts && fonts.length > 0) {
                fonts.forEach(f => docHtml += `    <link href="${f}" rel="stylesheet">\n`);
            }
            // Aquí idealmente inyectaríamos las variables CSS globales, pero lo simplificaremos por legibilidad
        }

        docHtml += `</head>\n<body>\n${this.formatHtml(bodyContent)}\n</body>\n</html>`;
        
        this.textarea.value = docHtml;
        this.htmlContainer.innerHTML = this.colorizeHtml(docHtml);
        this.lastSavedValue = docHtml;
        this.isTyping = false;
    }

    parseAndSync(silent = false) {
        const newHtml = this.textarea.value;
        if (newHtml === this.lastSavedValue) return; // No hay cambios

        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, 'text/html');

        // 1. Sincronizar SEO
        if (window.escmsEditor && window.escmsEditor.seoView) {
            const newTitle = doc.title;
            const newDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const newKw = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
            const newLang = doc.documentElement.getAttribute('lang') || 'en';
            
            window.escmsEditor.seoView.setData({
                title: newTitle,
                description: newDesc,
                keywords: newKw,
                language: newLang
            });
        }

        // 2. Sincronizar Body
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            const root = host.shadowRoot.getElementById('document-root');
            if (root) {
                root.innerHTML = doc.body.innerHTML;
            }
        }

        this.lastSavedValue = newHtml;
        if (!silent) this.isTyping = false;
        
        // Forzar autoguardado
        if (window.escmsEditor && window.escmsEditor.autosave) {
            clearTimeout(window.escmsEditor.autosave.saveTimeout);
            window.escmsEditor.autosave.saveToServer();
        }
    }

    formatHtml(html) {
        let formatted = '';
        let indent = 0;
        
        const tags = html.split(/(<\/?[^>]+>)/g).filter(item => item.trim() !== '');
        
        tags.forEach(item => {
            if (item.match(/^<\/[^>]+>$/)) {
                indent--;
                formatted += '  '.repeat(Math.max(0, indent)) + item + '\n';
            } else if (item.match(/^<[^>]+>$/) && !item.match(/<br>|<hr>|<img>|<input>|<meta>|<link>/i)) {
                formatted += '  '.repeat(Math.max(0, indent)) + item + '\n';
                if (!item.match(/<[^>]+?\/>/)) indent++;
            } else if (item.match(/^<[^>]+?\/>$/) || item.match(/<br>|<hr>|<img>|<input>|<meta>|<link>/i)) {
                formatted += '  '.repeat(Math.max(0, indent)) + item + '\n';
            } else {
                formatted += '  '.repeat(Math.max(0, indent)) + item.trim() + '\n';
            }
        });
        
        return formatted.trim();
    }

    colorizeHtml(html) {
        let escaped = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        escaped = escaped.replace(/([a-zA-Z-]+)=(".*?")/g, '<span style="color: #34d399;">$1</span>=<span style="color: #fb923c;">$2</span>');
        
        escaped = escaped.replace(/(&lt;\/?)([a-zA-Z1-6-]+)(\s|&gt;)/g, '$1<span style="color: #60a5fa;">$2</span>$3');
        
        escaped = escaped.replace(/&lt;/g, '<span style="color: #9ca3af;">&lt;</span>');
        escaped = escaped.replace(/&gt;/g, '<span style="color: #9ca3af;">&gt;</span>');
        
        return escaped;
    }

    getDomPathFromHtml(htmlToCursor) {
        const tags = htmlToCursor.match(/<\/?([a-zA-Z1-6-]+)[^>]*>/g) || [];
        const stack = [];
        const counters = [];
        let inBody = false;

        for (let tagString of tags) {
            const isClosing = tagString.startsWith('</');
            const isSelfClosing = tagString.match(/<[^>]+\/>$/) || tagString.match(/<br>|<hr>|<img>|<input>|<meta>|<link>/i);
            const tagNameMatch = tagString.match(/<\/?([a-zA-Z1-6-]+)/);
            if (!tagNameMatch) continue;
            const tagName = tagNameMatch[1].toLowerCase();

            if (tagName === 'body' && !isClosing) {
                inBody = true;
                continue;
            }
            if (!inBody) continue;

            if (isClosing) {
                stack.pop();
                counters.pop();
            } else if (!isSelfClosing) {
                const parentCounts = counters.length > 0 ? counters[counters.length - 1] : {};
                parentCounts[tagName] = (parentCounts[tagName] || 0) + 1;
                
                stack.push(tagName);
                counters.push({ _index: parentCounts[tagName] });
            } else {
                const parentCounts = counters.length > 0 ? counters[counters.length - 1] : {};
                parentCounts[tagName] = (parentCounts[tagName] || 0) + 1;
            }
        }

        let path = [];
        for (let i = 0; i < stack.length; i++) {
            const tag = stack[i];
            const idx = counters[i]._index;
            path.push(`${tag}:nth-of-type(${idx})`);
        }
        return path.join(' > ');
    }

    highlightHtmlFromPath(path) {
        if (!path) return;
        const html = this.textarea.value;
        const parts = path.split(' > ');
        
        let searchIndex = html.indexOf('<body>');
        if (searchIndex === -1) return;
        searchIndex += 6;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const match = part.match(/([a-zA-Z1-6-]+):nth-of-type\((\d+)\)/);
            if (!match) return;
            const tag = match[1];
            const targetCount = parseInt(match[2], 10);
            
            let currentCount = 0;
            let tagRegex = new RegExp(`<(${tag})[\\s>]`, 'gi');
            tagRegex.lastIndex = searchIndex;
            
            let found = false;
            while (true) {
                const m = tagRegex.exec(html);
                if (!m) break;
                currentCount++;
                if (currentCount === targetCount) {
                    searchIndex = m.index;
                    found = true;
                    break;
                }
            }
            if (!found) return; // Nodo no encontrado en string
            if (i < parts.length - 1) {
                searchIndex += tag.length + 1; // avanzar para buscar hijos
            }
        }

        // Si encontramos el nodo final, seleccionamos su etiqueta de apertura
        const endOfTag = html.indexOf('>', searchIndex);
        if (endOfTag !== -1) {
            this.textarea.focus();
            this.textarea.setSelectionRange(searchIndex, endOfTag + 1);
            
            // Hacer scroll hasta esa línea
            const textToCursor = html.substring(0, searchIndex);
            const lines = textToCursor.split('\n').length;
            const lineHeight = 20; // aprox en CSS
            this.textarea.scrollTop = Math.max(0, (lines - 5) * lineHeight);
        }
    }
}
