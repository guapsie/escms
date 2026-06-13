import { icons } from '../../../core/editor-icons.js';

export function renderLayers(panel) {
    panel.contentArea.innerHTML = '';
    const docRoot = panel.shadowRoot.getElementById('document-root');
    if (!docRoot) return;

    const treeContainer = document.createElement('div');
    treeContainer.style.display = 'flex';
    treeContainer.style.flexDirection = 'column';

    panel.treeNodes.clear();

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
        const categories = window.escmsAtomCategories || [];
        for (let cat of categories) {
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

        actionsDiv.appendChild(createActionBtn(icons.copy, panel.i18n.t('leftpanel.duplicate'), () => {
            const clone = domNode.cloneNode(true);
            domNode.parentNode.insertBefore(clone, domNode.nextSibling);
            setTimeout(() => clone.click(), 10);
        }));

        actionsDiv.appendChild(createActionBtn(icons.trash, panel.i18n.t('leftpanel.delete'), () => {
            const parent = domNode.parentNode;
            domNode.remove();
            if (panel.selectedNode === domNode && parent) {
                setTimeout(() => parent.click(), 10);
            }
        }));

        treeItem.appendChild(iconSpan);
        treeItem.appendChild(textSpan);
        treeItem.appendChild(actionsDiv);

        if (domNode === panel.selectedNode) {
            treeItem.style.background = 'rgba(59, 130, 246, 0.1)';
            treeItem.style.borderLeftColor = 'var(--accent-solid)';
            treeItem.style.color = 'var(--text-solid)';
            actionsDiv.style.visibility = 'visible';
        }

        treeItem.addEventListener('mouseenter', () => {
            if (panel.draggedDomNode) return;
            if (domNode !== panel.selectedNode) treeItem.style.background = 'rgba(255, 255, 255, 0.05)';
            actionsDiv.style.visibility = 'visible';
        });
        treeItem.addEventListener('mouseleave', () => {
            if (panel.draggedDomNode) return;
            if (domNode !== panel.selectedNode) {
                treeItem.style.background = 'transparent';
                actionsDiv.style.visibility = 'hidden';
            }
        });

        treeItem.addEventListener('click', (e) => {
            e.stopPropagation();
            domNode.click(); // Hack para disparar la lógica nativa del Sniper del Shadow DOM
            
            const path = panel.getDomPath(domNode);
            window.dispatchEvent(new CustomEvent('escms-layer-selected', { detail: { path } }));
        });

        // --- DRAG & DROP LOGIC ---
        treeItem.addEventListener('dragstart', (e) => {
            panel.draggedDomNode = domNode;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tag);
            setTimeout(() => treeItem.style.opacity = '0.4', 0);
        });

        treeItem.addEventListener('dragend', () => {
            panel.draggedDomNode = null;
            treeItem.style.opacity = '1';
            document.querySelectorAll('.tree-dnd-over').forEach(el => {
                el.classList.remove('tree-dnd-over');
                el.style.boxShadow = 'none';
            });
        });

        treeItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!panel.draggedDomNode || panel.draggedDomNode === domNode || panel.draggedDomNode.contains(domNode)) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }
            e.dataTransfer.dropEffect = 'move';

            const rect = treeItem.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const isContainer = ['div', 'section', 'article', 'main', 'header', 'footer'].includes(tag);

            treeItem.classList.add('tree-dnd-over');
            treeItem.style.boxShadow = 'none';
            if (domNode !== panel.selectedNode) treeItem.style.background = 'transparent';

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
            if (domNode !== panel.selectedNode) treeItem.style.background = 'transparent';
            delete treeItem.dataset.dropAction;
        });

        treeItem.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!panel.draggedDomNode || panel.draggedDomNode === domNode || panel.draggedDomNode.contains(domNode)) return;

            const action = treeItem.dataset.dropAction;
            if (action === 'before') domNode.parentNode.insertBefore(panel.draggedDomNode, domNode);
            else if (action === 'after') domNode.parentNode.insertBefore(panel.draggedDomNode, domNode.nextSibling);
            else if (action === 'inside') domNode.appendChild(panel.draggedDomNode);

            const droppedNode = panel.draggedDomNode;
            setTimeout(() => { if (droppedNode) droppedNode.click(); }, 10);
        });

        panel.treeNodes.set(domNode, treeItem);
        treeContainer.appendChild(treeItem);

        Array.from(domNode.childNodes).forEach(child => buildTree(child, depth + 1));
    };

    buildTree(docRoot, 0);

    if (treeContainer.childNodes.length === 0) {
        const empty = document.createElement('div');
        empty.setAttribute('data-i18n', 'leftpanel.empty_canvas');
        empty.textContent = panel.i18n.t('leftpanel.empty_canvas');
        empty.style.fontSize = '0.8rem';
        empty.style.color = 'rgba(245,245,245,0.4)';
        empty.style.padding = '1rem';
        empty.style.textAlign = 'center';
        treeContainer.appendChild(empty);
    }

    panel.contentArea.appendChild(treeContainer);
}
