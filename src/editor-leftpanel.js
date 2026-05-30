class EscmsLeftPanel {
    constructor(i18n) {
        this.i18n = i18n;
        this.shadowRoot = null;
        this.selectedNode = null;
        this.draggedDomNode = null;
        this.activeTab = 'elements';
        this.atomCategories = [
            {
                id: 'layout',
                name: 'leftpanel.cat_layout',
                atoms: [
                    { name: 'Section', tag: 'section', icon: icons.rows, className: 'escms-section' },
                    { name: 'Container', tag: 'div', icon: icons.square, className: 'escms-container' },
                    { name: 'Columns', tag: 'div', icon: icons.columns, className: 'escms-columns' },
                    { name: 'Grid', tag: 'div', icon: icons.grid, className: 'escms-grid' },
                    { name: 'Separator', tag: 'hr', icon: icons.separator, className: 'escms-separator' },
                    { name: 'Spacer', tag: 'div', icon: icons.spacer, className: 'escms-spacer', styles: { height: '50px' } }
                ]
            },
            {
                id: 'content',
                name: 'leftpanel.cat_content',
                atoms: [
                    { name: 'Heading', tag: 'h2', icon: icons.heading, textKey: 'leftpanel.default_heading' },
                    { name: 'Paragraph', tag: 'p', icon: icons.textT, textKey: 'leftpanel.default_paragraph' },
                    { name: 'Cite', tag: 'blockquote', icon: icons.quotes, textKey: 'leftpanel.default_cite' },
                    { name: 'List', tag: 'ul', icon: icons.list, children: [{tag:'li', textKey:'leftpanel.default_list_item'}] },
                    { name: 'Code', tag: 'pre', icon: icons.code, textKey: 'leftpanel.default_code' },
                    { name: 'Image', tag: 'img', icon: icons.image, attributes: { src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg==', alt: 'Placeholder', style: 'max-width: 100%; height: auto;' } },
                    { name: 'Button', tag: 'button', icon: icons.button, textKey: 'leftpanel.default_button' }
                ]
            },
            {
                id: 'embeds',
                name: 'leftpanel.cat_embeds',
                atoms: [
                    { name: 'Video', tag: 'video', icon: icons.videoCamera, attributes: { controls: 'true', style: 'width: 100%;' } },
                    { name: 'Audio', tag: 'audio', icon: icons.speakerHigh, attributes: { controls: 'true', style: 'width: 100%;' } },
                    { name: 'YouTube', tag: 'iframe', icon: icons.youtubeLogo, attributes: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', frameborder: '0', allowfullscreen: 'true', style: 'width: 100%; aspect-ratio: 16/9;' } },
                    { name: 'Vimeo', tag: 'iframe', icon: icons.playCircle, attributes: { src: 'https://player.vimeo.com/video/76979871', frameborder: '0', allowfullscreen: 'true', style: 'width: 100%; aspect-ratio: 16/9;' } }
                ]
            },
            {
                id: 'downloaded',
                name: 'leftpanel.cat_downloaded',
                atoms: []
            }
        ];
        
        this.pageManager = new EscmsPageManager(this.i18n);
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

        const docRoot = this.shadowRoot.getElementById('document-root');
        if (docRoot) {
            const observer = new MutationObserver(() => {
                if (this.activeTab === 'layers') {
                    this.renderLayers();
                }
            });
            observer.observe(docRoot, { childList: true, subtree: true });
        }

        this.render();
        this.pageManager.loadPages(true);
    }

    render() {
        this.container.innerHTML = '';
        this.container.style.padding = '1rem';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.boxSizing = 'border-box';
        this.container.style.height = '100%';

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

        this.contentArea = document.createElement('div');
        this.contentArea.style.flex = '1';
        this.contentArea.style.overflowY = 'auto';
        this.contentArea.style.display = 'flex';
        this.contentArea.style.flexDirection = 'column';

        this.container.appendChild(header);
        this.container.appendChild(this.contentArea);

        if (this.activeTab === 'elements') {
            this.renderElements();
        } else if (this.activeTab === 'pages') {
            this.pageManager.init(this.contentArea);
        } else {
            this.renderLayers();
        }
    }

    renderElements() {
        this.contentArea.innerHTML = '';
        
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
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '8px';
            grid.style.padding = '0 15px 15px 15px';

            cat.atoms.forEach(atom => {
                const btn = document.createElement('button');
                btn.title = atom.name;
                btn.innerHTML = atom.icon;
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.background = '#1f1f1f';
                btn.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                btn.style.borderRadius = '6px';
                btn.style.padding = '1rem';
                btn.style.color = 'var(--text-solid)';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.2s ease';
                
                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.style.width = '24px';
                    svg.style.height = '24px';
                    svg.style.pointerEvents = 'none';
                }

                btn.addEventListener('mouseenter', () => btn.style.borderColor = 'var(--accent-solid)');
                btn.addEventListener('mouseleave', () => btn.style.borderColor = 'rgba(255, 255, 255, 0.05)');

                btn.addEventListener('click', () => this.injectAtom(atom));

                grid.appendChild(btn);
            });

            this.contentArea.appendChild(grid);
        });
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
            let iconSvg = icons.square;
            if (['h1','h2','h3','h4','h5','h6','p','span','a'].includes(tag)) iconSvg = icons.textT;
            if (['section','article','main','header','footer'].includes(tag)) iconSvg = icons.rows;
            if (tag === 'img') iconSvg = icons.image;
            
            iconSpan.innerHTML = iconSvg;
            iconSpan.style.width = '14px';
            iconSpan.style.height = '14px';
            iconSpan.style.marginRight = '8px';
            iconSpan.style.display = 'flex';
            iconSpan.style.alignItems = 'center';
            iconSpan.style.opacity = '0.5';
            
            const svg = iconSpan.querySelector('svg');
            if(svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }
            
            const textSpan = document.createElement('span');
            textSpan.textContent = tag;
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
                if(svg) {
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

    injectAtom(atom) {
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
        if (atom.children) {
            atom.children.forEach(childAtom => {
                const childEl = document.createElement(childAtom.tag);
                if (childAtom.textKey) childEl.textContent = this.i18n.dictionary[childAtom.textKey] || 'Item';
                el.appendChild(childEl);
            });
        }

        let target = this.selectedNode;
        const docRoot = this.shadowRoot.getElementById('document-root');
        
        if (!target || !['DIV', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE'].includes(target.tagName) && target !== docRoot) {
            target = docRoot;
        }

        if (target) {
            target.appendChild(el);
            setTimeout(() => el.click(), 10);
        }
    }
}