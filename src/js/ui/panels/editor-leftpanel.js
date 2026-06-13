import { EscmsPageManager } from '../../canvas/editor-pagemanager.js';
import { EscmsParser } from '../../canvas/editor-parser.js';
import { el } from '../../core/escms-dom.js';
import { icons } from '../../core/editor-icons.js';
import { EscmsMediaLibrary } from './editor-medialibrary.js';

import { renderAtoms } from './leftpanel/leftpanel-atoms.js';
import { renderComponents } from './leftpanel/leftpanel-components.js';
import { renderLayers } from './leftpanel/leftpanel-layers.js';

export class EscmsLeftPanel {
    constructor(i18n) {
        this.i18n = i18n;
        this.shadowRoot = null;
        this.selectedNode = null;
        this.draggedDomNode = null;
        this.treeNodes = new Map();
        this.activeTab = 'elements';
        this.elementsSubView = 'atoms';
        this.atomCategories = [];
        this.pageManager = new EscmsPageManager(this.i18n);
        
        this.tabs = [
            { id: 'elements', icon: icons.atom, title: this.i18n.t('leftpanel.tab_elements'), render: () => this.renderElementsTab() },
            { id: 'layers', icon: icons.stack, title: this.i18n.t('leftpanel.tab_layers'), render: () => this.renderLayers() },
            { id: 'pages', icon: icons.file, title: this.i18n.t('leftpanel.tab_pages'), render: () => this.pageManager.init(this.contentArea) }
        ];

    }

    addTab(id, iconSvg, titleLabel, renderCallback) {
        if (!this.tabs.find(t => t.id === id)) {
            this.tabs.push({ id, icon: iconSvg, title: titleLabel, render: renderCallback });
            this.render();
        }
    }

    removeTab(id) {
        this.tabs = this.tabs.filter(t => t.id !== id);
        if (this.activeTab === id) {
            this.activeTab = 'elements';
        }
        this.render();
    }

    init(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.container = document.getElementById('escms-left-panel');
        if (!this.container) return;

        window.addEventListener('escms-element-selected', (e) => {
            this.selectedNode = e.detail.node;
            if (this.activeTab === 'layers') {
                this.highlightTreeNode();
            }
        });

        window.addEventListener('escms-html-cursor-moved', (e) => {
            if (this.activeTab === 'layers' && e.detail.path) {
                const docRoot = this.shadowRoot.getElementById('document-root');
                if (docRoot) {
                    try {
                        const targetNode = docRoot.querySelector(e.detail.path);
                        if (targetNode && targetNode !== this.selectedNode) {
                            this.selectedNode = targetNode;
                            this.highlightTreeNode();
                        }
                    } catch (err) {}
                }
            }
        });

        const docRoot = this.shadowRoot.getElementById('document-root');
        if (docRoot) {
            const observer = new MutationObserver(() => {
                if (this.activeTab === 'layers') {
                    this.renderLayers();
                }
            });
            observer.observe(docRoot, { childList: true, subtree: true });
        }

        window.addEventListener('escms-canvas-drop', (e) => {
            const payload = e.detail.payload;
            const targetNode = e.detail.targetNode;
            const dropAction = e.detail.dropAction || 'inside';
            
            if (payload && payload.type === 'atom') {
                this.injectAtom(payload.data, targetNode, dropAction);
            } else if (payload && payload.type === 'component') {
                this.injectComponent(payload.data, targetNode, dropAction);
            }
        });

        this.render();
        this.pageManager.loadPages(true);

        // Broadcast ready event and listen for refresh
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('escms:leftpanel:ready', { detail: { leftPanel: this } }));
        }, 10);
        
        window.addEventListener('escms:addons:refresh', () => {
            window.dispatchEvent(new CustomEvent('escms:leftpanel:ready', { detail: { leftPanel: this } }));
        });
    }

    render() {
        this.container.innerHTML = '';
        this.container.style.padding = '1rem';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.boxSizing = 'border-box';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        header.style.marginBottom = '1rem';
        header.style.flexShrink = '0';

        const createTab = (id, iconSvg, titleLabel) => {
            const tab = document.createElement('button');
            tab.innerHTML = iconSvg;
            tab.title = titleLabel;
            tab.style.flex = '1';
            tab.style.background = 'transparent';
            tab.style.border = 'none';
            tab.style.borderBottom = this.activeTab === id ? '2px solid var(--accent-solid)' : '2px solid transparent';
            tab.style.color = this.activeTab === id ? 'var(--text-solid)' : 'rgba(245, 245, 245, 0.4)';
            tab.style.padding = '0.65rem';
            tab.style.cursor = 'pointer';
            tab.style.display = 'flex';
            tab.style.alignItems = 'center';
            tab.style.justifyContent = 'center';
            tab.style.transition = 'all 0.2s';

            const svg = tab.querySelector('svg');
            if (svg) {
                svg.style.width = '20px';
                svg.style.height = '20px';
                svg.style.pointerEvents = 'none';
            }

            tab.addEventListener('click', () => {
                this.activeTab = id;
                this.render();
            });
            return tab;
        };

        this.tabs.forEach(t => {
            header.appendChild(createTab(t.id, t.icon, t.title));
        });

        this.contentArea = document.createElement('div');
        this.contentArea.style.flex = '1';
        this.contentArea.style.overflowY = 'auto';
        this.contentArea.style.display = 'flex';
        this.contentArea.style.flexDirection = 'column';
        this.contentArea.style.paddingBottom = '4rem';

        this.container.appendChild(header);
        this.container.appendChild(this.contentArea);

        // Animate tab content change
        this.contentArea.classList.remove('escms-anim-fade');
        void this.contentArea.offsetWidth; // Force reflow
        this.contentArea.classList.add('escms-anim-fade');

        const activeTabObj = this.tabs.find(t => t.id === this.activeTab);
        if (activeTabObj) {
            activeTabObj.render();
        } else {
            this.renderElementsTab();
        }
    }

    renderElementsTab() {
        this.contentArea.innerHTML = '';
        
        const subHeader = document.createElement('div');
        subHeader.style.display = 'flex';
        subHeader.style.gap = '15px';
        subHeader.style.padding = '0 15px 15px 15px';
        subHeader.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        subHeader.style.marginBottom = '10px';
        subHeader.style.position = 'sticky';
        subHeader.style.top = '0';
        subHeader.style.background = 'var(--color-background, #0a0a0a)';
        subHeader.style.zIndex = '10';

        const createSubTab = (id, i18nKey, defaultText) => {
            const btn = document.createElement('button');
            btn.setAttribute('data-i18n', i18nKey);
            btn.textContent = this.i18n.dictionary[i18nKey] || defaultText;
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.fontSize = '0.75rem';
            btn.style.textTransform = 'uppercase';
            btn.style.letterSpacing = '1px';
            btn.style.fontWeight = '600';
            btn.style.cursor = 'pointer';
            btn.style.padding = '0';
            btn.style.color = this.elementsSubView === id ? 'var(--accent-solid)' : 'rgba(245, 245, 245, 0.4)';
            btn.style.transition = 'color 0.2s';
            
            btn.addEventListener('click', () => {
                this.elementsSubView = id;
                this.renderElementsTab();
            });
            return btn;
        };

        subHeader.appendChild(createSubTab('atoms', 'leftpanel.atoms', 'ATOMS'));
        subHeader.appendChild(createSubTab('components', 'leftpanel.components', 'COMPONENTS'));
        
        this.contentArea.appendChild(subHeader);

        if (this.elementsSubView === 'atoms') {
            this.renderElements();
        } else {
            this.renderComponents();
        }
    }

    renderElements() {
        renderAtoms(this);
    }

    renderComponents() {
        renderComponents(this);
    }

    renderLayers() {
        renderLayers(this);
    }

    highlightTreeNode() {
        if (this.activeTab !== 'layers') return;

        this.treeNodes.forEach((uiNode, domNode) => {
            const actionsDiv = uiNode.querySelector('.tree-actions');

            if (domNode === this.selectedNode) {
                uiNode.style.background = 'rgba(59, 130, 246, 0.1)';
                uiNode.style.borderLeftColor = 'var(--accent-solid)';
                uiNode.style.color = 'var(--text-solid)';
                if (actionsDiv) actionsDiv.style.visibility = 'visible';
                uiNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                uiNode.style.background = 'transparent';
                uiNode.style.borderLeftColor = 'transparent';
                uiNode.style.color = 'rgba(245, 245, 245, 0.8)';
                if (actionsDiv) actionsDiv.style.visibility = 'hidden';
            }
        });
    }

    injectAtom(atom, targetNode = null, dropAction = 'inside') {
        const atomJson = { atom: atom.name };
        const el = EscmsParser.jsonToDom(atomJson);
        if (!el) return;

        const docRoot = this.shadowRoot.getElementById('document-root');
        let target = targetNode || this.selectedNode;
        
        // Prevent nesting atoms that shouldn't be nested (basic heuristic)
        if (!target || (!['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) && target !== docRoot)) {
            target = docRoot;
        }

        if (target) {
            if (dropAction === 'before') {
                target.parentNode.insertBefore(el, target);
            } else if (dropAction === 'after') {
                target.parentNode.insertBefore(el, target.nextSibling);
            } else if (dropAction === 'first' && target.firstChild) {
                target.insertBefore(el, target.firstChild);
            } else {
                target.appendChild(el);
            }
            setTimeout(() => {
                el.click();
                if (el.tagName.toLowerCase() === 'img') {
                    if (!window.escmsMediaLibrary) {
                        window.escmsMediaLibrary = new EscmsMediaLibrary(this.i18n);
                    }
                    window.escmsMediaLibrary.open({ windowed: true }).then(url => {
                        if (url) {
                            el.setAttribute('src', url);
                            window.dispatchEvent(new Event('escms-dom-mutated'));
                            if (window.escmsEditor && window.escmsEditor.inspector) {
                                window.escmsEditor.inspector.syncDOMToUI();
                            }
                        }
                    });
                }
            }, 10);
            if (window.escmsEditor && window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer();
            }
        }
    }

    injectComponent(compData, targetNode = null, dropAction = 'inside') {
        const comp = window.escmsComponents && window.escmsComponents[compData.ref_id];
        if (!comp) return;

        // Instead of hard-copying HTML, inject a linked component reference
        const el = EscmsParser.jsonToDom({ tag: 'escms-component', ref: compData.ref_id });
        if (!el) return;

        const docRoot = this.shadowRoot.getElementById('document-root');
        let target = targetNode || this.selectedNode;
        
        if (!target || (!['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) && target !== docRoot)) {
            target = docRoot;
        }

        if (target) {
            if (dropAction === 'before') {
                target.parentNode.insertBefore(el, target);
            } else if (dropAction === 'after') {
                target.parentNode.insertBefore(el, target.nextSibling);
            } else if (dropAction === 'first' && target.firstChild) {
                target.insertBefore(el, target.firstChild);
            } else {
                target.appendChild(el);
            }
            setTimeout(() => el.click(), 10);
            if (window.escmsEditor && window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer();
            }
        }
    }

    getDomPath(node) {
        const docRoot = this.shadowRoot.getElementById('document-root');
        const path = [];
        let current = node;
        while (current && current !== docRoot) {
            let tag = current.tagName.toLowerCase();
            let parent = current.parentNode;
            if (!parent) break;
            
            let siblings = Array.from(parent.children).filter(n => n.tagName.toLowerCase() === tag);
            let index = siblings.indexOf(current) + 1;
            
            path.unshift(`${tag}:nth-of-type(${index})`);
            current = parent;
        }
        return path.join(' > ');
    }
}