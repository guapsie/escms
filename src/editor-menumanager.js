class EscmsMenuManager {
    constructor(i18n) {
        this.i18n = i18n;
        this.container = null;
        this.treeContainer = null;
        this.menus = [];
        this.pages = [];
        this.draggedNode = null;
        this.saveTimeout = null;
    }

    async init(container) {
        this.container = container;
        this.container.innerHTML = '<div style="padding: 1rem; color: rgba(245,245,245,0.4); text-align: center; font-size: 0.85rem;">Loading Menu...</div>';
        
        await Promise.all([
            this.fetchPages(),
            this.fetchMenus()
        ]);

        if (this.menus.length === 0 && this.pages.length > 0) {
            // Auto inject home page if menu is empty
            const homePage = this.pages.find(p => p.is_home) || this.pages[0];
            if (homePage) {
                this.menus.push({
                    id: 'menu-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    label: homePage.title,
                    type: 'page',
                    url: '/' + (homePage.is_home ? '' : homePage.slug),
                    page_id: homePage.id,
                    children: []
                });
                this.saveMenus(); // Auto-save initial
            }
        }

        this.render();
    }

    async fetchPages() {
        try {
            const res = await fetch('/api/pages/list');
            const data = await res.json();
            if (data.status === 'success') {
                this.pages = data.pages;
            }
        } catch (err) {
            console.error('Failed to load pages', err);
        }
    }

    async fetchMenus() {
        try {
            const res = await fetch('/api/menus');
            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.menus)) {
                this.menus = data.menus;
            }
        } catch (err) {
            console.error('Failed to load menus', err);
        }
    }

    async saveMenus() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(async () => {
            try {
                const res = await fetch('/api/menus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ menus: this.menus })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    // Feedback opcional
                }
            } catch (err) {
                console.error('Failed to save menus', err);
            }
        }, 500); // Debounce de 500ms
    }

    render() {
        this.container.innerHTML = '';

        this.treeContainer = document.createElement('div');
        this.treeContainer.className = 'escms-menu-tree';
        this.treeContainer.style.padding = '0.5rem';

        this.renderTree(this.menus, this.treeContainer);
        
        if (this.menus.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Menu is empty';
            empty.style.fontSize = '0.8rem';
            empty.style.color = 'rgba(245,245,245,0.4)';
            empty.style.padding = '1rem';
            empty.style.textAlign = 'center';
            this.treeContainer.appendChild(empty);
        }

        this.container.appendChild(this.treeContainer);
        this.container.appendChild(this.renderAddForm());
    }

    renderTree(menuArray, parentElement, depth = 0) {
        menuArray.forEach((item, index) => {
            const treeItem = document.createElement('div');
            treeItem.className = 'menu-tree-item';
            treeItem.style.display = 'flex';
            treeItem.style.alignItems = 'center';
            treeItem.style.padding = '0.5rem 0.5rem 0.5rem ' + (0.5 + depth * 1.5) + 'rem';
            treeItem.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            treeItem.style.cursor = 'grab';
            treeItem.style.color = 'rgba(245, 245, 245, 0.8)';
            treeItem.draggable = true;

            const gripIcon = document.createElement('div');
            gripIcon.innerHTML = icons.file || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" /></svg>';
            const gripSvg = gripIcon.querySelector('svg');
            if (gripSvg) {
                gripSvg.style.width = '16px';
                gripSvg.style.height = '16px';
            }
            gripIcon.style.opacity = '0.3';
            gripIcon.style.marginRight = '0.5rem';
            gripIcon.style.display = 'flex';
            gripIcon.style.alignItems = 'center';

            const textSpan = document.createElement('span');
            textSpan.style.flex = '1';
            textSpan.style.fontSize = '0.85rem';
            textSpan.style.whiteSpace = 'nowrap';
            textSpan.style.overflow = 'hidden';
            textSpan.style.textOverflow = 'ellipsis';
            // User requested support for HTML tags in labels
            textSpan.innerHTML = item.label || 'Untitled';

            const typeSpan = document.createElement('span');
            typeSpan.textContent = item.type;
            typeSpan.style.fontSize = '0.65rem';
            typeSpan.style.background = 'rgba(255,255,255,0.1)';
            typeSpan.style.padding = '2px 6px';
            typeSpan.style.borderRadius = '4px';
            typeSpan.style.marginLeft = '0.5rem';
            typeSpan.style.textTransform = 'uppercase';
            typeSpan.style.color = 'rgba(255,255,255,0.5)';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'tree-actions';
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '0.25rem';
            actionsDiv.style.visibility = 'visible'; // Siempre visible
            actionsDiv.style.marginLeft = '0.5rem';

            const delBtn = document.createElement('div');
            delBtn.innerHTML = icons.trash || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>';
            const delSvg = delBtn.querySelector('svg');
            if (delSvg) {
                delSvg.style.width = '16px';
                delSvg.style.height = '16px';
            }
            delBtn.style.cursor = 'pointer';
            delBtn.style.color = 'rgba(239, 68, 68, 0.8)';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.title = 'Delete';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this menu item?')) {
                    menuArray.splice(index, 1);
                    this.saveMenus();
                    this.render();
                }
            });

            actionsDiv.appendChild(delBtn);

            treeItem.appendChild(gripIcon);
            treeItem.appendChild(textSpan);
            treeItem.appendChild(typeSpan);
            treeItem.appendChild(actionsDiv);

            // Quitados los event listeners de hover para ocultar/mostrar la basura
            // treeItem.addEventListener('mouseenter', () => actionsDiv.style.visibility = 'visible');
            // treeItem.addEventListener('mouseleave', () => actionsDiv.style.visibility = 'hidden');

            // --- DRAG & DROP LOGIC ---
            treeItem.addEventListener('dragstart', (e) => {
                this.draggedNode = { item, array: menuArray, index };
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.id);
                setTimeout(() => treeItem.style.opacity = '0.4', 0);
            });

            treeItem.addEventListener('dragend', () => {
                this.draggedNode = null;
                treeItem.style.opacity = '1';
                document.querySelectorAll('.menu-dnd-over').forEach(el => {
                    el.classList.remove('menu-dnd-over');
                    el.style.boxShadow = 'none';
                    el.style.background = 'transparent';
                });
            });

            treeItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this.draggedNode || this.draggedNode.item.id === item.id) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }
                
                // Evitar soltar dentro de sus propios hijos
                if (this._isDescendant(this.draggedNode.item, item)) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }

                e.dataTransfer.dropEffect = 'move';

                const rect = treeItem.getBoundingClientRect();
                const relY = e.clientY - rect.top;

                treeItem.classList.add('menu-dnd-over');
                treeItem.style.boxShadow = 'none';
                treeItem.style.background = 'transparent';

                if (relY < rect.height * 0.25) {
                    treeItem.style.boxShadow = 'inset 0 2px 0 0 var(--accent-solid)';
                    treeItem.dataset.dropAction = 'before';
                } else if (relY > rect.height * 0.75) {
                    treeItem.style.boxShadow = 'inset 0 -2px 0 0 var(--accent-solid)';
                    treeItem.dataset.dropAction = 'after';
                } else {
                    treeItem.style.background = 'rgba(59, 130, 246, 0.2)';
                    treeItem.dataset.dropAction = 'inside';
                }
            });

            treeItem.addEventListener('dragleave', (e) => {
                e.stopPropagation();
                treeItem.classList.remove('menu-dnd-over');
                treeItem.style.boxShadow = 'none';
                treeItem.style.background = 'transparent';
                delete treeItem.dataset.dropAction;
            });

            treeItem.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this.draggedNode || this.draggedNode.item.id === item.id) return;
                if (this._isDescendant(this.draggedNode.item, item)) return;

                const action = treeItem.dataset.dropAction;
                const draggedItem = this.draggedNode.item;
                
                // Remove from old array
                this.draggedNode.array.splice(this.draggedNode.index, 1);

                if (action === 'before') {
                    menuArray.splice(index, 0, draggedItem);
                } else if (action === 'after') {
                    // Recalculate index in case we removed from the same array before this element
                    const newIndex = menuArray.indexOf(item);
                    menuArray.splice(newIndex + 1, 0, draggedItem);
                } else if (action === 'inside') {
                    item.children = item.children || [];
                    item.children.push(draggedItem);
                }

                this.saveMenus();
                this.render();
            });

            parentElement.appendChild(treeItem);

            if (item.children && item.children.length > 0) {
                this.renderTree(item.children, parentElement, depth + 1);
            }
        });
    }

    _isDescendant(parentItem, childItem) {
        if (!parentItem.children) return false;
        for (let child of parentItem.children) {
            if (child.id === childItem.id) return true;
            if (this._isDescendant(child, childItem)) return true;
        }
        return false;
    }

    renderAddForm() {
        const formDiv = document.createElement('div');
        formDiv.style.padding = '1rem';
        formDiv.style.borderTop = '1px solid rgba(255,255,255,0.05)';
        formDiv.style.background = 'rgba(0,0,0,0.2)';
        formDiv.style.marginTop = 'auto';

        const title = document.createElement('div');
        title.textContent = 'Add Menu Item';
        title.style.fontSize = '0.75rem';
        title.style.textTransform = 'uppercase';
        title.style.color = 'rgba(255,255,255,0.4)';
        title.style.marginBottom = '0.75rem';

        const typeSelect = document.createElement('select');
        typeSelect.innerHTML = '<option value="page">Existing Page</option><option value="custom">Custom Link</option>';
        typeSelect.style.width = '100%';
        typeSelect.style.padding = '0.5rem';
        typeSelect.style.background = '#121212';
        typeSelect.style.border = '1px solid rgba(255,255,255,0.1)';
        typeSelect.style.color = '#fff';
        typeSelect.style.borderRadius = '4px';
        typeSelect.style.marginBottom = '0.5rem';

        const pageSelect = document.createElement('select');
        pageSelect.style.width = '100%';
        pageSelect.style.padding = '0.5rem';
        pageSelect.style.background = '#121212';
        pageSelect.style.border = '1px solid rgba(255,255,255,0.1)';
        pageSelect.style.color = '#fff';
        pageSelect.style.borderRadius = '4px';
        pageSelect.style.marginBottom = '0.5rem';

        if (this.pages.length === 0) {
            pageSelect.innerHTML = '<option value="">No pages available</option>';
            pageSelect.disabled = true;
        } else {
            this.pages.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.title;
                opt.dataset.slug = p.slug;
                opt.dataset.is_home = p.is_home;
                pageSelect.appendChild(opt);
            });
        }

        const customDiv = document.createElement('div');
        customDiv.style.display = 'none';
        
        const customLabel = document.createElement('input');
        customLabel.type = 'text';
        customLabel.placeholder = 'Label (supports HTML)';
        customLabel.style.width = '100%';
        customLabel.style.padding = '0.5rem';
        customLabel.style.background = '#121212';
        customLabel.style.border = '1px solid rgba(255,255,255,0.1)';
        customLabel.style.color = '#fff';
        customLabel.style.borderRadius = '4px';
        customLabel.style.marginBottom = '0.5rem';
        customLabel.style.boxSizing = 'border-box';

        const customUrl = document.createElement('input');
        customUrl.type = 'text';
        customUrl.placeholder = 'URL (e.g. https://...)';
        customUrl.style.width = '100%';
        customUrl.style.padding = '0.5rem';
        customUrl.style.background = '#121212';
        customUrl.style.border = '1px solid rgba(255,255,255,0.1)';
        customUrl.style.color = '#fff';
        customUrl.style.borderRadius = '4px';
        customUrl.style.marginBottom = '0.5rem';
        customUrl.style.boxSizing = 'border-box';

        customDiv.appendChild(customLabel);
        customDiv.appendChild(customUrl);

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'page') {
                pageSelect.style.display = 'block';
                customDiv.style.display = 'none';
            } else {
                pageSelect.style.display = 'none';
                customDiv.style.display = 'block';
            }
        });

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Item';
        addBtn.style.width = '100%';
        addBtn.style.padding = '0.5rem';
        addBtn.style.background = 'var(--accent-solid)';
        addBtn.style.border = 'none';
        addBtn.style.color = '#fff';
        addBtn.style.borderRadius = '4px';
        addBtn.style.cursor = 'pointer';

        addBtn.addEventListener('click', () => {
            const newItem = {
                id: 'menu-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                children: []
            };

            if (typeSelect.value === 'page') {
                const opt = pageSelect.selectedOptions[0];
                if (!opt) return;
                newItem.type = 'page';
                newItem.label = opt.textContent;
                newItem.page_id = parseInt(opt.value);
                newItem.url = '/' + (opt.dataset.is_home === 'true' ? '' : opt.dataset.slug);
            } else {
                if (!customLabel.value.trim() || !customUrl.value.trim()) {
                    alert('Label and URL are required.');
                    return;
                }
                newItem.type = 'custom';
                newItem.label = customLabel.value.trim();
                newItem.url = customUrl.value.trim();
            }

            this.menus.push(newItem);
            this.saveMenus();
            this.render();
        });

        formDiv.appendChild(title);
        formDiv.appendChild(typeSelect);
        formDiv.appendChild(pageSelect);
        formDiv.appendChild(customDiv);
        formDiv.appendChild(addBtn);

        return formDiv;
    }
}
