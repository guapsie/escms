class EscmsLeftPanel {
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
        if (typeof EscmsCopilot !== 'undefined') {
            this.copilot = new EscmsCopilot(this.i18n);
        }
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
            if (payload && payload.type === 'atom') {
                this.injectAtom(payload.data, targetNode);
            } else if (payload && payload.type === 'component') {
                this.injectComponent(payload.data, targetNode);
            }
        });

        this.fetchAtoms().then(() => {
            this.render();
        });
        this.pageManager.loadPages(true);
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

        header.appendChild(createTab('elements', icons.atom, 'Elements'));
        header.appendChild(createTab('layers', icons.stack, 'Layers'));
        header.appendChild(createTab('pages', icons.file, 'Pages'));
        header.appendChild(createTab('ai', icons.ai, 'Copilot AI'));

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

        if (this.activeTab === 'elements') {
            this.renderElementsTab();
        } else if (this.activeTab === 'pages') {
            this.pageManager.init(this.contentArea);
        } else if (this.activeTab === 'ai') {
            if (this.copilot) {
                this.copilot.init(this.contentArea);
            } else {
                this.contentArea.innerHTML = '<div style="padding: 1rem; color: #ef4444; text-align: center; font-size: 0.8rem;">Copilot module not loaded.</div>';
            }
        } else {
            this.renderLayers();
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

        this.atomCategories.forEach(cat => {
            const header = document.createElement('div');
            header.setAttribute('data-i18n', cat.name);
            header.textContent = this.i18n.dictionary[cat.name] || cat.name;
            header.style.fontSize = '0.75rem';
            header.style.textTransform = 'uppercase';
            header.style.letterSpacing = '1px';
            header.style.color = 'rgba(245, 245, 245, 0.4)';
            header.style.padding = '15px 15px 10px 15px';
            header.style.fontWeight = '600';
            this.contentArea.appendChild(header);

            if (cat.atoms.length === 0) {
                const empty = document.createElement('div');
                empty.textContent = 'No atoms downloaded yet.';
                empty.style.color = 'rgba(245, 245, 245, 0.3)';
                empty.style.fontSize = '0.8rem';
                empty.style.padding = '0 15px 15px 15px';
                empty.style.fontStyle = 'italic';
                this.contentArea.appendChild(empty);
                return;
            }

            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            grid.style.gap = '8px';
            grid.style.padding = '0 15px 15px 15px';

            cat.atoms.forEach(atom => {
                const btn = document.createElement('button');
                btn.title = atom.name;
                btn.innerHTML = icons[atom.icon] || icons.boxModel2 || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.background = '#1f1f1f';
                btn.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                btn.style.borderRadius = '6px';
                btn.style.padding = '0.5rem';
                btn.style.color = 'var(--text-solid)';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.2s ease';

                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.style.width = '20px';
                    svg.style.height = '20px';
                    svg.style.pointerEvents = 'none';
                }

                btn.addEventListener('mouseenter', () => btn.style.borderColor = 'var(--accent-solid)');
                btn.addEventListener('mouseleave', () => btn.style.borderColor = 'rgba(255, 255, 255, 0.05)');

                btn.addEventListener('click', () => this.injectAtom(atom));

                btn.draggable = true;
                btn.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'atom', data: atom }));
                    e.dataTransfer.effectAllowed = 'copy';
                });

                grid.appendChild(btn);
            });

            this.contentArea.appendChild(grid);
        });
    }

    renderComponents() {


        if (!window.escmsComponents || Object.keys(window.escmsComponents).length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No components found.';
            empty.style.color = 'rgba(245, 245, 245, 0.3)';
            empty.style.fontSize = '0.8rem';
            empty.style.padding = '0 15px 15px 15px';
            empty.style.fontStyle = 'italic';
            this.contentArea.appendChild(empty);
            return;
        }

        const grouped = {};
        Object.values(window.escmsComponents).forEach(comp => {
            const tpl = comp.template_id || 'custom';
            if (!grouped[tpl]) grouped[tpl] = [];
            grouped[tpl].push(comp);
        });

        Object.keys(grouped).forEach(tpl => {
            const header = document.createElement('div');
            const i18nKey = tpl === 'custom' ? 'leftpanel.custom_components' : `template.${tpl}`;
            header.setAttribute('data-i18n', i18nKey);
            header.textContent = this.i18n.dictionary[i18nKey] || (tpl === 'custom' ? 'CUSTOM' : tpl.toUpperCase());
            header.style.fontSize = '0.75rem';
            header.style.textTransform = 'uppercase';
            header.style.letterSpacing = '1px';
            header.style.color = 'rgba(245, 245, 245, 0.4)';
            header.style.padding = '15px 15px 10px 15px';
            header.style.fontWeight = '600';
            this.contentArea.appendChild(header);

            const listContainer = document.createElement('div');
            listContainer.style.display = 'flex';
            listContainer.style.flexDirection = 'column';
            listContainer.style.padding = '0 15px 15px 15px';
            listContainer.style.gap = '8px';

            grouped[tpl].forEach(comp => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.background = '#1f1f1f';
                item.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                item.style.borderRadius = '6px';
                item.style.padding = '10px';
                item.style.cursor = 'pointer';
                item.style.transition = 'all 0.2s';
                
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'component', data: comp }));
                    e.dataTransfer.effectAllowed = 'copy';
                });
                
                const leftDiv = document.createElement('div');
                leftDiv.style.display = 'flex';
                leftDiv.style.alignItems = 'center';
                leftDiv.style.gap = '10px';
                
                const iconWrap = document.createElement('div');
                iconWrap.innerHTML = icons.boxModel || icons.square;
                iconWrap.style.color = 'var(--accent-solid)';
                iconWrap.style.width = '16px';
                iconWrap.style.height = '16px';
                
                const svg = iconWrap.querySelector('svg');
                if (svg) {
                    svg.style.width = '100%';
                    svg.style.height = '100%';
                }
                
                const titleSpan = document.createElement('span');
                titleSpan.textContent = comp.name;
                titleSpan.style.fontSize = '0.85rem';
                titleSpan.style.color = 'var(--text-solid)';
                
                leftDiv.appendChild(iconWrap);
                leftDiv.appendChild(titleSpan);
                
                const actionsDiv = document.createElement('div');
                actionsDiv.style.display = 'flex';
                actionsDiv.style.gap = '5px';

                const editBtn = document.createElement('button');
                editBtn.innerHTML = icons.edit || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
                editBtn.title = 'Edit Component';
                editBtn.style.background = 'transparent';
                editBtn.style.border = 'none';
                editBtn.style.color = 'rgba(255, 255, 255, 0.4)';
                editBtn.style.cursor = 'pointer';
                editBtn.style.transition = 'color 0.2s';
                
                const editSvg = editBtn.querySelector('svg');
                if (editSvg) { editSvg.style.width = '14px'; editSvg.style.height = '14px'; }
                
                editBtn.addEventListener('mouseenter', () => editBtn.style.color = 'var(--text-solid)');
                editBtn.addEventListener('mouseleave', () => editBtn.style.color = 'rgba(255, 255, 255, 0.4)');
                
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('escms-component-edit', { detail: { component: comp } }));
                });

                const addBtn = document.createElement('button');
                addBtn.innerHTML = icons.plus;
                addBtn.title = 'Add to Canvas';
                addBtn.style.background = 'transparent';
                addBtn.style.border = 'none';
                addBtn.style.color = 'rgba(255, 255, 255, 0.4)';
                addBtn.style.cursor = 'pointer';
                addBtn.style.transition = 'color 0.2s';
                
                const plusSvg = addBtn.querySelector('svg');
                if (plusSvg) { plusSvg.style.width = '16px'; plusSvg.style.height = '16px'; }
                
                addBtn.addEventListener('mouseenter', () => addBtn.style.color = 'var(--text-solid)');
                addBtn.addEventListener('mouseleave', () => addBtn.style.color = 'rgba(255, 255, 255, 0.4)');
                
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.injectComponent(comp);
                });
                
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(addBtn);
                
                item.appendChild(leftDiv);
                item.appendChild(actionsDiv);
                listContainer.appendChild(item);
            });

            this.contentArea.appendChild(listContainer);
        });
    }

    injectComponent(comp, targetNode = null) {
        const docRoot = this.shadowRoot.getElementById('document-root');
        if (!docRoot) return;
        
        const el = document.createElement('escms-component');
        el.setAttribute('ref', comp.ref_id);
        el.setAttribute('data-name', comp.name || 'Component');
        el.style.outline = '2px dashed #9333ea';
        el.style.display = 'block';
        
        try {
            const compJson = JSON.parse(comp.editor_data);
            const compDom = EscmsParser.jsonToDom(compJson);
            if (compDom) {
                el.appendChild(compDom);
            }
        } catch (e) {
            console.error('[ESCMS] Error inflating component on inject', e);
        }

        let target = targetNode || this.selectedNode;
        if (!target || !['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) && target !== docRoot) {
            target = docRoot;
        }

        if (target) {
            target.appendChild(el);
            setTimeout(() => el.click(), 10);
            if (window.escmsEditor && window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer(); // Trigger autosave
            }
        }
    }

async fetchAtoms() {
    try {
        const res = await fetch('/api/atoms');
        const data = await res.json();
        
        if (data.status === 'success' && data.atoms) {
            const categoriesMap = {};
            data.atoms.forEach(atom => {
                const catId = atom.category || 'downloaded';
                if (!categoriesMap[catId]) {
                    categoriesMap[catId] = {
                        id: catId,
                        name: `leftpanel.cat_${catId}`,
                        atoms: []
                    };
                }
                categoriesMap[catId].atoms.push(atom);
            });
            
            this.atomCategories = Object.values(categoriesMap);
        }
    } catch (err) {
        console.error('Failed to load atoms', err);
        this.atomCategories = [];
    }
}

    renderLayers() {
        this.contentArea.innerHTML = '';
        const docRoot = this.shadowRoot.getElementById('document-root');
        if (!docRoot) return;

        const treeContainer = document.createElement('div');
        treeContainer.style.display = 'flex';
        treeContainer.style.flexDirection = 'column';

        this.treeNodes.clear();

        const buildTree = (domNode, depth) => {
            if (domNode.nodeType !== Node.ELEMENT_NODE) return;
            if (domNode === docRoot) {
                Array.from(domNode.childNodes).forEach(child => buildTree(child, 0));
                return;
            }

            const tag = domNode.tagName.toLowerCase();
            let displayName = tag;
            let iconSvg = icons.square;

            // Check if it's a known Atom
            let isAtom = false;
            for (let cat of this.atomCategories) {
                for (let atom of cat.atoms) {
                    if (atom.className && domNode.classList.contains(atom.className)) {
                        displayName = atom.name;
                        iconSvg = icons[atom.icon] || icons.square;
                        isAtom = true;
                        break;
                    }
                }
                if (isAtom) break;
            }

            if (!isAtom) {
                if (tag === 'escms-component') {
                    displayName = domNode.getAttribute('data-name') || 'Component';
                    iconSvg = icons.box || icons.square; // Un icono genérico si no hay components icon
                } else if (domNode.classList.contains('escms-column')) {
                    displayName = 'Column';
                    iconSvg = icons.columns;
                } else if (domNode.classList.contains('escms-portfolio-item')) {
                    displayName = 'Portfolio Item';
                    iconSvg = icons.grid;
                } else {
                    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a'].includes(tag)) iconSvg = icons.textT;
                    if (['section', 'article', 'main', 'header', 'footer'].includes(tag)) iconSvg = icons.rows;
                    if (tag === 'img') iconSvg = icons.image;
                }
            }

            const treeItem = document.createElement('div');
            treeItem.style.display = 'flex';
            treeItem.style.alignItems = 'center';
            treeItem.style.padding = '0.4rem 0.5rem';
            treeItem.style.paddingLeft = `${depth * 12 + 8}px`;
            treeItem.style.fontSize = '0.8rem';
            treeItem.style.color = 'rgba(245, 245, 245, 0.8)';
            treeItem.style.cursor = 'pointer';
            treeItem.style.borderLeft = '2px solid transparent';
            treeItem.style.position = 'relative';
            treeItem.draggable = true;
            treeItem.style.transition = 'background 0.2s, border-color 0.2s';

            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = iconSvg;
            iconSpan.style.width = '14px';
            iconSpan.style.height = '14px';
            iconSpan.style.marginRight = '8px';
            iconSpan.style.display = 'flex';
            iconSpan.style.alignItems = 'center';
            iconSpan.style.opacity = '0.5';

            const svg = iconSpan.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }

            const textSpan = document.createElement('span');
            textSpan.textContent = displayName;
            textSpan.style.flex = '1';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'tree-actions';
            actionsDiv.style.display = 'flex';
            actionsDiv.style.visibility = 'hidden';
            actionsDiv.style.alignItems = 'center';
            actionsDiv.style.gap = '2px';

            const createActionBtn = (iconSvg, title, onClick) => {
                const btn = document.createElement('div');
                btn.title = title;
                btn.innerHTML = iconSvg;
                btn.style.width = '22px';
                btn.style.height = '22px';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.borderRadius = '4px';
                btn.style.color = 'rgba(245, 245, 245, 0.6)';
                btn.style.transition = 'all 0.2s';

                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.style.width = '14px';
                    svg.style.height = '14px';
                }

                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                    btn.style.color = 'var(--text-solid)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'transparent';
                    btn.style.color = 'rgba(245, 245, 245, 0.6)';
                });

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onClick();
                });

                return btn;
            };

            actionsDiv.appendChild(createActionBtn(icons.copy, 'Duplicate', () => {
                const clone = domNode.cloneNode(true);
                domNode.parentNode.insertBefore(clone, domNode.nextSibling);
                setTimeout(() => clone.click(), 10);
            }));

            actionsDiv.appendChild(createActionBtn(icons.trash, 'Delete', () => {
                const parent = domNode.parentNode;
                domNode.remove();
                if (this.selectedNode === domNode && parent) {
                    setTimeout(() => parent.click(), 10);
                }
            }));

            treeItem.appendChild(iconSpan);
            treeItem.appendChild(textSpan);
            treeItem.appendChild(actionsDiv);

            if (domNode === this.selectedNode) {
                treeItem.style.background = 'rgba(59, 130, 246, 0.1)';
                treeItem.style.borderLeftColor = 'var(--accent-solid)';
                treeItem.style.color = 'var(--text-solid)';
                actionsDiv.style.visibility = 'visible';
            }

            treeItem.addEventListener('mouseenter', () => {
                if (this.draggedDomNode) return;
                if (domNode !== this.selectedNode) treeItem.style.background = 'rgba(255, 255, 255, 0.05)';
                actionsDiv.style.visibility = 'visible';
            });
            treeItem.addEventListener('mouseleave', () => {
                if (this.draggedDomNode) return;
                if (domNode !== this.selectedNode) {
                    treeItem.style.background = 'transparent';
                    actionsDiv.style.visibility = 'hidden';
                }
            });

            treeItem.addEventListener('click', (e) => {
                e.stopPropagation();
                domNode.click(); // Hack para disparar la lógica nativa del Sniper del Shadow DOM
                
                const path = this.getDomPath(domNode);
                window.dispatchEvent(new CustomEvent('escms-layer-selected', { detail: { path } }));
            });

            // --- DRAG & DROP LOGIC ---
            treeItem.addEventListener('dragstart', (e) => {
                this.draggedDomNode = domNode;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', tag);
                setTimeout(() => treeItem.style.opacity = '0.4', 0);
            });

            treeItem.addEventListener('dragend', () => {
                this.draggedDomNode = null;
                treeItem.style.opacity = '1';
                document.querySelectorAll('.tree-dnd-over').forEach(el => {
                    el.classList.remove('tree-dnd-over');
                    el.style.boxShadow = 'none';
                });
            });

            treeItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this.draggedDomNode || this.draggedDomNode === domNode || this.draggedDomNode.contains(domNode)) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }
                e.dataTransfer.dropEffect = 'move';

                const rect = treeItem.getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const isContainer = ['div', 'section', 'article', 'main', 'header', 'footer'].includes(tag);

                treeItem.classList.add('tree-dnd-over');
                treeItem.style.boxShadow = 'none';
                if (domNode !== this.selectedNode) treeItem.style.background = 'transparent';

                if (relY < rect.height * 0.25) {
                    treeItem.style.boxShadow = 'inset 0 2px 0 0 var(--accent-solid)';
                    treeItem.dataset.dropAction = 'before';
                } else if (relY > rect.height * 0.75) {
                    treeItem.style.boxShadow = 'inset 0 -2px 0 0 var(--accent-solid)';
                    treeItem.dataset.dropAction = 'after';
                } else if (isContainer) {
                    treeItem.style.background = 'rgba(59, 130, 246, 0.2)';
                    treeItem.dataset.dropAction = 'inside';
                } else {
                    treeItem.style.boxShadow = 'inset 0 -2px 0 0 var(--accent-solid)';
                    treeItem.dataset.dropAction = 'after';
                }
            });

            treeItem.addEventListener('dragleave', (e) => {
                e.stopPropagation();
                treeItem.classList.remove('tree-dnd-over');
                treeItem.style.boxShadow = 'none';
                if (domNode !== this.selectedNode) treeItem.style.background = 'transparent';
                delete treeItem.dataset.dropAction;
            });

            treeItem.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this.draggedDomNode || this.draggedDomNode === domNode || this.draggedDomNode.contains(domNode)) return;

                const action = treeItem.dataset.dropAction;
                if (action === 'before') domNode.parentNode.insertBefore(this.draggedDomNode, domNode);
                else if (action === 'after') domNode.parentNode.insertBefore(this.draggedDomNode, domNode.nextSibling);
                else if (action === 'inside') domNode.appendChild(this.draggedDomNode);

                const droppedNode = this.draggedDomNode;
                setTimeout(() => { if (droppedNode) droppedNode.click(); }, 10);
            });

            this.treeNodes.set(domNode, treeItem);
            treeContainer.appendChild(treeItem);

            Array.from(domNode.childNodes).forEach(child => buildTree(child, depth + 1));
        };

        buildTree(docRoot, 0);

        if (treeContainer.childNodes.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Canvas is empty';
            empty.style.fontSize = '0.8rem';
            empty.style.color = 'rgba(245,245,245,0.4)';
            empty.style.padding = '1rem';
            empty.style.textAlign = 'center';
            treeContainer.appendChild(empty);
        }

        this.contentArea.appendChild(treeContainer);
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

    injectAtom(atom, targetNode = null) {
        const el = document.createElement(atom.tag);
        if (atom.textKey) el.textContent = this.i18n.dictionary[atom.textKey] || 'New Text';
        if (atom.styles) {
            Object.assign(el.style, atom.styles);
        }
        if (atom.className) {
            el.className = atom.className;
        }
        if (atom.attributes) {
            Object.entries(atom.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
        if (atom.name === 'Nav') {
            el.style.display = 'flex';
            el.style.width = '100%';
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.display = 'flex';
            ul.style.gap = '20px';
            ul.style.margin = '0';
            ul.style.padding = '0';
            ul.className = 'escms-nav-list';
            
            // Try to build tree from PagesManager
            const buildHtml = (nodes) => {
                nodes.forEach(node => {
                    const li = document.createElement('li');
                    li.className = 'escms-nav-item';
                    const a = document.createElement('a');
                    a.className = 'escms-nav-link';
                    a.href = parseInt(node.is_custom_link) === 1 ? node.custom_link_url : '/' + node.slug;
                    a.textContent = node.title;
                    a.style.textDecoration = 'none';
                    a.style.color = 'inherit';
                    li.appendChild(a);
                    
                    if (node.children && node.children.length > 0) {
                        const subul = document.createElement('ul');
                        subul.className = 'escms-nav-sublist';
                        buildHtml(node.children).childNodes.forEach(c => subul.appendChild(c.cloneNode(true)));
                        li.appendChild(subul);
                    }
                    ul.appendChild(li);
                });
                return ul;
            };

            if (this.pageManager && this.pageManager.pages) {
                const roots = this.pageManager.buildTree().filter(p => parseInt(p.is_hidden_menu) !== 1);
                if (roots.length > 0) {
                    buildHtml(roots);
                } else {
                    ul.innerHTML = '<li class="escms-nav-item"><a class="escms-nav-link" href="#" style="text-decoration:none; color:inherit;">Menu Empty</a></li>';
                }
            } else {
                const links = [
                    { text: 'Home', href: '/' },
                    { text: 'About', href: '/about' },
                    { text: 'Contact', href: '/contact' }
                ];
                links.forEach(link => {
                    const li = document.createElement('li');
                    li.className = 'escms-nav-item';
                    const a = document.createElement('a');
                    a.className = 'escms-nav-link';
                    a.href = link.href;
                    a.textContent = link.text;
                    a.style.textDecoration = 'none';
                    a.style.color = 'inherit';
                    li.appendChild(a);
                    ul.appendChild(li);
                });
            }
            el.appendChild(ul);
        } else if (atom.children) {
            atom.children.forEach(childAtom => {
                const childEl = document.createElement(childAtom.tag);
                if (childAtom.textKey) childEl.textContent = this.i18n.dictionary[childAtom.textKey] || 'Item';
                if (childAtom.className) childEl.className = childAtom.className;
                if (childAtom.attributes) {
                    Object.entries(childAtom.attributes).forEach(([k, v]) => childEl.setAttribute(k, v));
                }
                el.appendChild(childEl);
            });
        }

        let target = targetNode || this.selectedNode;
        const docRoot = this.shadowRoot.getElementById('document-root');

        if (!target || !['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) && target !== docRoot) {
            target = docRoot;
        }

        if (target) {
            target.appendChild(el);
            setTimeout(() => el.click(), 10);
            if (window.escmsEditor && window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer(); // Trigger autosave
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