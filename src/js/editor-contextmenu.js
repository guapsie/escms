class EscmsContextMenu {
    constructor(i18n) {
        this.i18n = i18n;
        this.menu = null;
        this.targetNode = null;
    }

    init() {
        this.menu = document.createElement('div');
        this.menu.className = 'escms-context-menu';
        this.menu.style.position = 'fixed';
        this.menu.style.background = 'rgba(10, 10, 10, 0.75)';
        this.menu.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.menu.style.borderRadius = '8px';
        this.menu.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6), 0 0 10px rgba(59, 130, 246, 0.2)';
        this.menu.style.padding = '6px';
        this.menu.style.minWidth = '160px';
        this.menu.style.zIndex = '999999';
        this.menu.style.display = 'none';
        this.menu.style.flexDirection = 'column';
        this.menu.style.backdropFilter = 'blur(20px)';
        this.menu.style.webkitBackdropFilter = 'blur(20px)';

        document.body.appendChild(this.menu);

        window.addEventListener('escms-context-menu', (e) => {
            this.targetNode = e.detail.node;
            this.showMenu(e.detail.clientX, e.detail.clientY);
        });

        document.addEventListener('click', () => {
            this.hideMenu();
        });
        
        // Clicks inside the shadow DOM also hide the menu
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            host.shadowRoot.addEventListener('click', () => this.hideMenu());
        }
    }

    showMenu(x, y) {
        this.menu.innerHTML = '';
        if (!this.targetNode || this.targetNode.id === 'document-root') {
            this.hideMenu();
            return;
        }

        const items = [
            {
                id: 'select_parent',
                label: this.i18n.dictionary['select_parent'] || 'Select Parent',
                icon: icons.chevronUp || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>',
                action: () => {
                    const parent = this.targetNode.parentElement;
                    if (parent && parent.id !== 'document-root') {
                        parent.click();
                    }
                }
            },
            {
                id: 'clone',
                label: this.i18n.dictionary['clone'] || 'Clone',
                icon: icons.copy || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
                action: () => {
                    const clone = this.targetNode.cloneNode(true);
                    this.targetNode.parentNode.insertBefore(clone, this.targetNode.nextSibling);
                    setTimeout(() => clone.click(), 10);
                }
            },
            {
                id: 'copy_styles',
                label: this.i18n.dictionary['copy_styles'] || 'Copy Styles',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path></svg>',
                action: () => {
                    window.escmsCopiedStyles = this.targetNode.getAttribute('style') || '';
                }
            }
        ];

        if (typeof window.escmsCopiedStyles !== 'undefined') {
            items.push({
                id: 'paste_styles',
                label: this.i18n.dictionary['paste_styles'] || 'Paste Styles',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
                action: () => {
                    if (window.escmsCopiedStyles) {
                        this.targetNode.setAttribute('style', window.escmsCopiedStyles);
                    } else {
                        this.targetNode.removeAttribute('style');
                    }
                    window.dispatchEvent(new Event('escms-dom-mutated'));
                    window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: this.targetNode } }));
                }
            });
        }

        items.push(
            {
                id: 'save_atom',
                label: this.i18n.dictionary['save_atom'] || 'Save as Atom',
                icon: icons.box || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
                action: () => {
                    const name = prompt(this.i18n.dictionary['atom_name'] || 'Atom Name', 'MyAtom');
                    if (name) {
                        alert("Coming soon: Custom Atom saving will be available in the Market update!");
                    }
                }
            },
            {
                id: 'ask_ai',
                label: this.i18n.dictionary['ask_ai'] || 'Ask AI',
                icon: icons.cpu || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
                action: () => {
                    if (window.escmsEditor && window.escmsEditor.leftpanel) {
                        window.escmsEditor.leftpanel.activeTab = 'ai';
                        window.escmsEditor.leftpanel.render();
                    }
                }
            },
            {
                id: 'delete',
                label: this.i18n.dictionary['delete'] || 'Delete',
                icon: icons.trash || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
                action: () => {
                    const parent = this.targetNode.parentNode;
                    this.targetNode.remove();
                    if (parent && parent.id !== 'document-root') {
                        setTimeout(() => parent.click(), 10);
                    } else {
                        window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: null } }));
                    }
                }
            }
        );

        items.forEach(item => {
            const btn = document.createElement('div');
            btn.style.padding = '8px 12px';
            btn.style.fontSize = '0.8rem';
            btn.style.color = 'var(--text-solid)';
            btn.style.cursor = 'pointer';
            btn.style.borderRadius = '4px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '8px';
            btn.style.transition = 'background 0.2s';
            
            btn.addEventListener('mouseenter', () => btn.style.background = 'var(--accent-faint)');
            btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
            
            if (item.id === 'delete') {
                btn.style.color = '#ef4444'; // Red for delete
            }

            const iconSpan = document.createElement('span');
            iconSpan.style.width = '14px';
            iconSpan.style.height = '14px';
            iconSpan.style.display = 'inline-flex';
            iconSpan.innerHTML = item.icon;
            const svg = iconSpan.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }

            const textSpan = document.createElement('span');
            textSpan.textContent = item.label;

            btn.appendChild(iconSpan);
            btn.appendChild(textSpan);

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                this.hideMenu();
            });

            this.menu.appendChild(btn);
        });

        this.menu.style.display = 'flex';

        // Adjust position so it doesn't overflow
        const rect = this.menu.getBoundingClientRect();
        let posX = x;
        let posY = y;
        if (posX + rect.width > window.innerWidth) posX = window.innerWidth - rect.width - 10;
        if (posY + rect.height > window.innerHeight) posY = window.innerHeight - rect.height - 10;

        this.menu.style.left = `${posX}px`;
        this.menu.style.top = `${posY}px`;
    }

    hideMenu() {
        if (this.menu) {
            this.menu.style.display = 'none';
            this.targetNode = null;
        }
    }
}
