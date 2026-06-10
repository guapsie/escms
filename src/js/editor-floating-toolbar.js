import { icons } from './editor-icons.js';

export class EscmsFloatingToolbar {
    constructor(i18n) {
        this.i18n = i18n;
        this.element = null;
        this.shadowRoot = null;
        this.documentRoot = null;
        this.selectionRange = null;
        this.linkInput = null;
    }

    init(shadowRoot, documentRoot) {
        this.shadowRoot = shadowRoot;
        this.documentRoot = documentRoot;
        this.render();
        
        // Listen for selection changes inside the document root
        document.addEventListener('selectionchange', () => this.handleSelection());
        
        // We also need to listen on the shadow root if supported
        this.documentRoot.addEventListener('mouseup', () => this.handleSelection());
        this.documentRoot.addEventListener('keyup', () => this.handleSelection());
    }

    render() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.display = 'none';
        this.element.style.zIndex = '1000';
        this.element.style.background = '#1a1a1a';
        this.element.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.element.style.borderRadius = '8px';
        this.element.style.padding = '0.35rem';
        this.element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.gap = '2px';

        const createBtn = (iconSvg, command, arg = null) => {
            const btn = document.createElement('button');
            btn.innerHTML = iconSvg;
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.color = 'var(--text-solid)';
            btn.style.width = '28px';
            btn.style.height = '28px';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.transition = 'background 0.2s';
            
            const svg = btn.querySelector('svg');
            if (svg) {
                svg.style.width = '16px';
                svg.style.height = '16px';
            }

            btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255, 255, 255, 0.1)');
            btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.executeCommand(command, arg);
            });
            return btn;
        };

        this.element.appendChild(createBtn(icons.textBolder, 'bold'));
        this.element.appendChild(createBtn(icons.textItalic, 'italic'));
        this.element.appendChild(createBtn(icons.textUnderline, 'underline'));
        this.element.appendChild(createBtn(icons.textStrikethrough, 'strikeThrough'));
        
        const sep = document.createElement('div');
        sep.style.width = '1px';
        sep.style.height = '16px';
        sep.style.background = 'rgba(255, 255, 255, 0.1)';
        sep.style.margin = '0 4px';
        this.element.appendChild(sep);

        this.element.appendChild(createBtn(icons.textAlignLeft, 'justifyLeft'));
        this.element.appendChild(createBtn(icons.textAlignCenter, 'justifyCenter'));
        this.element.appendChild(createBtn(icons.textAlignRight, 'justifyRight'));
        this.element.appendChild(createBtn(icons.textAlignJustify, 'justifyFull'));

        const sep2 = document.createElement('div');
        sep2.style.width = '1px';
        sep2.style.height = '16px';
        sep2.style.background = 'rgba(255, 255, 255, 0.1)';
        sep2.style.margin = '0 4px';
        this.element.appendChild(sep2);

        this.linkBtn = createBtn(icons.link, 'createLink');
        this.linkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleLinkInput();
        });
        this.element.appendChild(this.linkBtn);

        this.linkContainer = document.createElement('div');
        this.linkContainer.style.display = 'none';
        this.linkContainer.style.alignItems = 'center';
        this.linkContainer.style.marginLeft = '4px';

        this.linkInput = document.createElement('input');
        this.linkInput.type = 'text';
        this.linkInput.placeholder = 'https://...';
        this.linkInput.style.background = '#0a0a0a';
        this.linkInput.style.border = '1px solid var(--accent-solid)';
        this.linkInput.style.color = 'var(--text-solid)';
        this.linkInput.style.padding = '4px 8px';
        this.linkInput.style.borderRadius = '4px';
        this.linkInput.style.fontSize = '0.75rem';
        this.linkInput.style.width = '150px';
        
        this.linkInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeCommand('createLink', this.linkInput.value);
                this.linkContainer.style.display = 'none';
                this.hide();
            }
        });

        this.linkContainer.appendChild(this.linkInput);
        this.element.appendChild(this.linkContainer);

        // Prevent focus loss when clicking toolbar buttons
        this.element.addEventListener('mousedown', (e) => {
            if (e.target !== this.linkInput) {
                e.preventDefault();
            }
        });

        // Hide entirely initially
        this.element.style.display = 'none';
        
        this.shadowRoot.appendChild(this.element);
    }

    handleSelection() {
        if (this.linkInput && (document.activeElement === this.linkInput || (this.shadowRoot && this.shadowRoot.activeElement === this.linkInput))) {
            return;
        }

        const sel = this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
            this.hide();
            return;
        }

        const range = sel.getRangeAt(0);
        // Only show if selection is inside an editable text node
        let node = range.commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentNode;
        
        if (!node.isContentEditable) {
            this.hide();
            return;
        }

        this.selectionRange = range;
        
        const rect = range.getBoundingClientRect();
        
        // Convert to shadow root coordinates if necessary
        // Since element is position absolute inside the shadowRoot container (which is relative/static)
        // We'll calculate position relative to documentRoot
        const containerRect = this.documentRoot.getBoundingClientRect();
        
        this.element.style.display = 'flex';
        this.linkContainer.style.display = 'none'; // reset link input
        this.linkInput.value = '';
        
        // Position it above the selection, accounting for canvas zoom scale
        const zoom = (window.escmsEditor && window.escmsEditor.canvas) ? window.escmsEditor.canvas.currentZoom : 1;
        let top = ((rect.top - containerRect.top) / zoom) - this.element.offsetHeight - 8;
        const left = ((rect.left - containerRect.left) / zoom) + ((rect.width / zoom) / 2) - (this.element.offsetWidth / 2);
        
        // If it goes above the canvas, show it below the selection instead
        if (top < 0) {
            top = ((rect.bottom - containerRect.top) / zoom) + 8;
        }
        
        this.element.style.top = `${top}px`;
        this.element.style.left = `${Math.max(10, left)}px`;
    }

    toggleLinkInput() {
        if (this.linkContainer.style.display === 'flex') {
            this.linkContainer.style.display = 'none';
        } else {
            this.linkContainer.style.display = 'flex';
            // Restore selection
            if (this.selectionRange) {
                const sel = this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : window.getSelection();
                sel.removeAllRanges();
                sel.addRange(this.selectionRange);
            }
            this.linkInput.focus();
        }
    }

    executeCommand(command, arg = null) {
        if (this.selectionRange) {
            const sel = this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.selectionRange);
            
            if (command === 'createLink' && !arg) {
                // If it's already a link, unlink it
                let node = this.selectionRange.commonAncestorContainer;
                if (node.nodeType === 3) node = node.parentNode;
                if (node.tagName === 'A' || node.closest('a')) {
                    document.execCommand('unlink', false, null);
                    this.hide();
                    return;
                }
                return; // Wait for toggleLinkInput to get URL
            }
            
            document.execCommand(command, false, arg);
            window.dispatchEvent(new Event('escms-dom-mutated'));
            
            if (command === 'createLink' || ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'].includes(command)) {
                this.hide();
            }
        }
    }

    hide() {
        this.element.style.display = 'none';
        this.selectionRange = null;
        this.linkContainer.style.display = 'none';
    }
}
