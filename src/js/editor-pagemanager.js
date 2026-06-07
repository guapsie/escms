class EscmsPageManager {
    constructor(i18n) {
        this.i18n = i18n;
        this.container = null;
        this.contextMenu = null;
        this.outsideClickListener = null;
        this.pages = [];
        this.draggedPageNode = null;
        this.draggedDomNode = null;
    }

    init(container) {
        this.container = container;
        this.renderPages();
    }

    async loadPages(autoLoad = false) {
        try {
            const res = await fetch('/api/pages/list');
            const data = await res.json();
            if (data.status === 'success') {
                this.pages = data.pages;
                this.renderPages();
                
                if (autoLoad && this.pages.length > 0) {
                    const homePage = this.pages.find(p => p.is_home) || this.pages[0];
                    this.loadPage(homePage.id);
                }
            }
        } catch (e) {
            console.error('[ESCMS] Error loading pages', e);
        }
    }

    async createPage() {
        try {
            const res = await fetch('/api/pages/create', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
                this.loadPage(data.id);
            } else {
                alert(data.msg || 'Error creating page');
            }
        } catch (e) {
            console.error('[ESCMS] Error creating page', e);
        }
    }

    async createLink() {
        try {
            const res = await fetch('/api/pages/create_link', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
            }
        } catch (e) {
            console.error('[ESCMS] Error creating link', e);
        }
    }

    async createPost() {
        try {
            const res = await fetch('/api/pages/create_post', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
                this.loadPage(data.id);
            } else {
                alert(data.msg || 'Error creating post');
            }
        } catch (e) {
            console.error('[ESCMS] Error creating post', e);
        }
    }

    async duplicatePage(id) {
        try {
            const res = await fetch('/api/pages/duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
            }
        } catch (e) {
            console.error('[ESCMS] Error duplicating page', e);
        }
    }

    async deletePage(id) {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            const res = await fetch('/api/pages/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
            }
        } catch (e) {
            console.error('[ESCMS] Error deleting page', e);
        }
    }

    async toggleHidden(id) {
        try {
            const res = await fetch('/api/pages/toggle_hidden', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
            }
        } catch (e) {
            console.error('[ESCMS] Error toggling hidden status', e);
        }
    }

    async setSpecialPage(id, type) {
        const msg = type === 'home' 
            ? 'Are you sure? This will replace your current design with the template\'s Home layout. All existing content on this page will be lost.' 
            : 'Are you sure? This will replace your current design with the template\'s Blog layout. All existing content on this page will be lost.';
            
        if (!confirm(msg)) return;
        
        try {
            const endpoint = type === 'home' ? '/api/pages/set_home' : '/api/pages/set_blog';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
                this.loadPage(id); // Reload the page to show the new template
            }
        } catch (e) {
            console.error('[ESCMS] Error setting special page', e);
        }
    }

    async loadPage(id) {
        // Find if it's a link. If it's a link, we don't load it into canvas
        const p = this.pages.find(x => parseInt(x.id) === parseInt(id));
        if (p && parseInt(p.is_custom_link) === 1) return; // Ignore clicks on links for canvas loading

        try {
            const res = await fetch(`/api/pages/get?id=${id}`);
            const data = await res.json();
            if (data.status === 'success') {
                window.dispatchEvent(new CustomEvent('escms-page-selected', { detail: { page: data.page } }));
            }
        } catch (e) {
            console.error('[ESCMS] Error fetching page details', e);
        }
    }

    async saveOrder(updates) {
        try {
            const res = await fetch('/api/pages/update_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
            }
        } catch (e) {
            console.error('[ESCMS] Error updating order', e);
        }
    }

    buildTree() {
        const map = new Map();
        const roots = [];
        this.pages.forEach(p => map.set(parseInt(p.id), { ...p, children: [] }));
        
        this.pages.forEach(p => {
            const node = map.get(parseInt(p.id));
            if (p.parent_id && map.has(parseInt(p.parent_id))) {
                map.get(parseInt(p.parent_id)).children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    }

    renderPages() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // --- Header + Create Dropdown ---
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10px 15px';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        header.style.position = 'relative'; // For dropdown positioning
        
        const title = document.createElement('h3');
        title.setAttribute('data-i18n', 'pages');
        title.textContent = this.i18n.dictionary.pages || 'Pages';
        title.style.margin = '0';
        title.style.fontSize = '0.85rem';
        title.style.fontWeight = '500';
        title.style.color = 'var(--text-solid)';
        
        const createBtn = document.createElement('button');
        createBtn.innerHTML = icons.plus;
        createBtn.style.background = 'transparent';
        createBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        createBtn.style.color = 'var(--text-solid)';
        createBtn.style.cursor = 'pointer';
        createBtn.style.padding = '4px 8px';
        createBtn.style.borderRadius = '4px';
        createBtn.style.display = 'flex';
        createBtn.style.alignItems = 'center';
        createBtn.style.transition = 'all 0.2s';
        
        const svgAdd = createBtn.querySelector('svg');
        if (svgAdd) { svgAdd.style.width = '14px'; svgAdd.style.height = '14px'; }
        
        createBtn.addEventListener('mouseenter', () => createBtn.style.background = 'rgba(255, 255, 255, 0.1)');
        createBtn.addEventListener('mouseleave', () => createBtn.style.background = 'transparent');
        
        // Create Dropdown Menu
        const dropdown = document.createElement('div');
        dropdown.style.position = 'absolute';
        dropdown.style.right = '15px';
        dropdown.style.top = '40px';
        dropdown.style.background = '#1f1f1f';
        dropdown.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        dropdown.style.borderRadius = '6px';
        dropdown.style.boxShadow = '0 0 15px var(--accent-faint)';
        dropdown.style.zIndex = '1000';
        dropdown.style.display = 'none';
        dropdown.style.flexDirection = 'column';
        dropdown.style.padding = '4px';
        dropdown.style.minWidth = '120px';

        const addPageItem = document.createElement('div');
        addPageItem.innerHTML = `<span style="width:14px; display:flex; align-items:center; justify-content:center; margin-right:8px;">${icons.file}</span> <span data-i18n="add_page">${this.i18n.dictionary['add_page'] || 'Add Page'}</span>`;
        const addPageSvg = addPageItem.querySelector('svg');
        if (addPageSvg) { addPageSvg.style.width = '14px'; addPageSvg.style.height = '14px'; }
        addPageItem.style.padding = '8px 12px';
        addPageItem.style.fontSize = '0.75rem';
        addPageItem.style.color = 'var(--text-solid)';
        addPageItem.style.cursor = 'pointer';
        addPageItem.style.borderRadius = '4px';
        addPageItem.style.display = 'flex';
        addPageItem.style.alignItems = 'center';
        addPageItem.addEventListener('mouseenter', () => addPageItem.style.background = 'var(--accent-faint)');
        addPageItem.addEventListener('mouseleave', () => addPageItem.style.background = 'transparent');
        addPageItem.addEventListener('click', () => { dropdown.style.display = 'none'; this.createPage(); });

        const addPostItem = document.createElement('div');
        addPostItem.innerHTML = `<span style="width:14px; display:flex; align-items:center; justify-content:center; margin-right:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-article"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h10" /></svg></span> <span data-i18n="add_post">${this.i18n.dictionary['add_post'] || 'Add Post'}</span>`;
        const addPostSvg = addPostItem.querySelector('svg');
        if (addPostSvg) { addPostSvg.style.width = '14px'; addPostSvg.style.height = '14px'; }
        addPostItem.style.padding = '8px 12px';
        addPostItem.style.fontSize = '0.75rem';
        addPostItem.style.color = 'var(--text-solid)';
        addPostItem.style.cursor = 'pointer';
        addPostItem.style.borderRadius = '4px';
        addPostItem.style.display = 'flex';
        addPostItem.style.alignItems = 'center';
        addPostItem.addEventListener('mouseenter', () => addPostItem.style.background = 'var(--accent-faint)');
        addPostItem.addEventListener('mouseleave', () => addPostItem.style.background = 'transparent');
        addPostItem.addEventListener('click', () => { dropdown.style.display = 'none'; this.createPost(); });

        const addLinkItem = document.createElement('div');
        addLinkItem.innerHTML = `<span style="width:14px; display:flex; align-items:center; justify-content:center; margin-right:8px;">${icons.link}</span> <span data-i18n="add_link">${this.i18n.dictionary['add_link'] || 'Add Link'}</span>`;
        const addLinkSvg = addLinkItem.querySelector('svg');
        if (addLinkSvg) { addLinkSvg.style.width = '14px'; addLinkSvg.style.height = '14px'; }
        addLinkItem.style.padding = '8px 12px';
        addLinkItem.style.fontSize = '0.75rem';
        addLinkItem.style.color = 'var(--text-solid)';
        addLinkItem.style.cursor = 'pointer';
        addLinkItem.style.borderRadius = '4px';
        addLinkItem.style.display = 'flex';
        addLinkItem.style.alignItems = 'center';
        addLinkItem.addEventListener('mouseenter', () => addLinkItem.style.background = 'var(--accent-faint)');
        addLinkItem.addEventListener('mouseleave', () => addLinkItem.style.background = 'transparent');
        addLinkItem.addEventListener('click', () => { dropdown.style.display = 'none'; this.createLink(); });

        dropdown.appendChild(addPageItem);
        dropdown.appendChild(addPostItem);
        dropdown.appendChild(addLinkItem);
        header.appendChild(dropdown);

        createBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !dropdown.contains(e.target) && e.target !== createBtn) {
                dropdown.style.display = 'none';
            }
        });
        
        header.appendChild(title);
        header.appendChild(createBtn);
        this.container.appendChild(header);

        // --- List Container ---
        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.overflowY = 'auto';

        const treeRoots = this.buildTree();
        
        const renderNode = (node, depth) => {
            const item = document.createElement('div');
            item.className = 'page-tree-item';
            item.dataset.pageId = node.id;
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.padding = '12px 15px';
            item.style.paddingLeft = `${15 + (depth * 20)}px`;
            item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            item.style.transition = 'background 0.2s, box-shadow 0.2s';
            item.style.cursor = parseInt(node.is_custom_link) === 1 ? 'default' : 'pointer';
            item.draggable = true;
            
            // Drag & Drop logic
            item.addEventListener('dragstart', (e) => {
                this.draggedPageNode = node;
                this.draggedDomNode = item;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.style.opacity = '0.4', 0);
            });

            item.addEventListener('dragend', () => {
                this.draggedPageNode = null;
                this.draggedDomNode = null;
                item.style.opacity = '1';
                document.querySelectorAll('.page-dnd-over').forEach(el => {
                    el.classList.remove('page-dnd-over');
                    el.style.boxShadow = 'none';
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.draggedDomNode || this.draggedDomNode === item) return;
                
                e.dataTransfer.dropEffect = 'move';
                const rect = item.getBoundingClientRect();
                const relY = e.clientY - rect.top;

                item.classList.add('page-dnd-over');
                item.style.boxShadow = 'none';
                
                if (relY < rect.height * 0.25) {
                    item.style.boxShadow = 'inset 0 2px 0 0 var(--accent-solid)';
                    item.dataset.dropAction = 'before';
                } else if (relY > rect.height * 0.75) {
                    item.style.boxShadow = 'inset 0 -2px 0 0 var(--accent-solid)';
                    item.dataset.dropAction = 'after';
                } else {
                    item.style.boxShadow = 'inset 0 0 0 2px rgba(59, 130, 246, 0.5)';
                    item.dataset.dropAction = 'inside';
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('page-dnd-over');
                item.style.boxShadow = 'none';
                delete item.dataset.dropAction;
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.draggedDomNode || this.draggedDomNode === item) return;
                
                const action = item.dataset.dropAction;
                const sourcePage = this.draggedPageNode;
                const targetPage = node;
                
                // Block nesting if creating infinite loop (parent dropped into child) - simplify by skipping deep check for now
                if (action === 'before' || action === 'after') {
                    sourcePage.parent_id = targetPage.parent_id;
                } else if (action === 'inside') {
                    sourcePage.parent_id = targetPage.id;
                }

                if (action === 'before') item.parentNode.insertBefore(this.draggedDomNode, item);
                else if (action === 'after') item.parentNode.insertBefore(this.draggedDomNode, item.nextSibling);
                else if (action === 'inside') item.parentNode.insertBefore(this.draggedDomNode, item.nextSibling);

                const allItems = Array.from(listContainer.querySelectorAll('.page-tree-item'));
                const updates = allItems.map((el, index) => {
                    const pid = parseInt(el.dataset.pageId, 10);
                    const p = this.pages.find(x => parseInt(x.id) === pid);
                    // Use updated parent for dragged item, old parent for others
                    const parentId = (p.id === sourcePage.id) ? sourcePage.parent_id : p.parent_id;
                    return { id: p.id, parent_id: parentId, menu_order: index };
                });
                
                this.saveOrder(updates);
            });

            
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255, 255, 255, 0.03)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            if (parseInt(node.is_custom_link) !== 1) {
                item.addEventListener('click', () => this.loadPage(node.id));
            }

            // --- Izquierda: Icono + Título ---
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'center';
            leftDiv.style.gap = '10px';
            leftDiv.style.flex = '1';
            leftDiv.style.minWidth = '0'; // For text ellipsis

            let iconSvg = '';
            if (parseInt(node.is_custom_link) === 1) iconSvg = icons.link;
            else if (node.is_home) iconSvg = icons.house;
            else if (node.is_blog) iconSvg = icons.scroll;
            else iconSvg = icons.file;

            const iconWrap = document.createElement('div');
            iconWrap.innerHTML = iconSvg;
            iconWrap.style.display = 'flex';
            iconWrap.style.alignItems = 'center';
            iconWrap.style.color = (node.is_home || node.is_blog || parseInt(node.is_custom_link) === 1) ? 'var(--accent-solid)' : 'rgba(245, 245, 245, 0.4)';
            const svg = iconWrap.querySelector('svg');
            if (svg) { svg.style.width = '16px'; svg.style.height = '16px'; }

            const titleSpan = document.createElement('span');
            titleSpan.textContent = node.title;
            titleSpan.style.fontSize = '0.85rem';
            titleSpan.style.color = parseInt(node.is_hidden_menu) === 1 ? 'rgba(245,245,245,0.4)' : 'var(--text-solid)';
            titleSpan.style.fontWeight = (node.is_home || node.is_blog) ? '500' : 'normal';
            titleSpan.style.whiteSpace = 'nowrap';
            titleSpan.style.overflow = 'hidden';
            titleSpan.style.textOverflow = 'ellipsis';
            if (parseInt(node.is_hidden_menu) === 1) {
                titleSpan.style.textDecoration = 'line-through';
                titleSpan.style.textDecorationColor = 'var(--accent-faint)';
            }

            leftDiv.appendChild(iconWrap);
            leftDiv.appendChild(titleSpan);

            // --- Derecha: Views + Opciones ---
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.alignItems = 'center';
            rightDiv.style.gap = '12px';
            rightDiv.style.flexShrink = '0';

            if (parseInt(node.is_custom_link) !== 1) {
                const viewsBadge = document.createElement('div');
                viewsBadge.style.display = 'flex';
                viewsBadge.style.alignItems = 'center';
                viewsBadge.style.gap = '4px';
                viewsBadge.style.fontSize = '0.75rem';
                viewsBadge.style.color = 'rgba(245, 245, 245, 0.4)';
                viewsBadge.innerHTML = `<div style="width: 14px; height: 14px; display: flex; align-items: center;">${icons.eye}</div> <span>${node.views || 0}</span>`;
                const eyeSvg = viewsBadge.querySelector('svg');
                if (eyeSvg) { eyeSvg.style.width = '100%'; eyeSvg.style.height = '100%'; }
                rightDiv.appendChild(viewsBadge);
            }

            const menuBtn = document.createElement('button');
            menuBtn.innerHTML = icons.dotsThreeVertical;
            menuBtn.style.background = 'transparent';
            menuBtn.style.border = 'none';
            menuBtn.style.color = 'rgba(245, 245, 245, 0.4)';
            menuBtn.style.cursor = 'pointer';
            menuBtn.style.padding = '4px';
            menuBtn.style.display = 'flex';
            menuBtn.style.alignItems = 'center';
            menuBtn.style.justifyContent = 'center';
            menuBtn.style.borderRadius = '4px';
            menuBtn.style.transition = 'all 0.2s';
            
            const dotSvg = menuBtn.querySelector('svg');
            if (dotSvg) { dotSvg.style.width = '16px'; dotSvg.style.height = '16px'; }
            
            menuBtn.addEventListener('mouseenter', () => { menuBtn.style.background = 'rgba(255, 255, 255, 0.1)'; menuBtn.style.color = 'var(--text-solid)'; });
            menuBtn.addEventListener('mouseleave', () => { menuBtn.style.background = 'transparent'; menuBtn.style.color = 'rgba(245, 245, 245, 0.4)'; });

            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openContextMenu(e, node, titleSpan, leftDiv);
            });

            rightDiv.appendChild(menuBtn);

            item.appendChild(leftDiv);
            item.appendChild(rightDiv);
            listContainer.appendChild(item);

            node.children.forEach(child => renderNode(child, depth + 1));
        };

        treeRoots.forEach(root => renderNode(root, 0));
        this.container.appendChild(listContainer);
    }

    openContextMenu(e, page, titleSpan, leftDiv) {
        this.closeContextMenu();

        this.contextMenu = document.createElement('div');
        this.contextMenu.style.position = 'fixed';
        this.contextMenu.style.background = '#1f1f1f';
        this.contextMenu.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        this.contextMenu.style.borderRadius = '6px';
        this.contextMenu.style.boxShadow = '0 0 15px var(--accent-faint)';
        this.contextMenu.style.zIndex = '10000';
        this.contextMenu.style.display = 'flex';
        this.contextMenu.style.flexDirection = 'column';
        this.contextMenu.style.padding = '4px';
        this.contextMenu.style.minWidth = '160px';

        const rect = e.currentTarget.getBoundingClientRect();
        this.contextMenu.style.top = `${rect.bottom + 4}px`;
        
        const menuLeft = rect.left - 130;
        this.contextMenu.style.left = menuLeft < 10 ? '10px' : `${menuLeft}px`;

        const createItem = (i18nKey, defaultText, onClick, isDanger = false) => {
            const item = document.createElement('div');
            item.setAttribute('data-i18n', i18nKey);
            item.textContent = this.i18n.dictionary[i18nKey] || defaultText;
            item.style.padding = '8px 12px';
            item.style.fontSize = '0.8rem';
            item.style.color = isDanger ? '#ef4444' : 'var(--text-solid)';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.style.transition = 'background 0.2s';
            
            item.addEventListener('mouseenter', () => item.style.background = isDanger ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-faint)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            
            item.addEventListener('click', (evt) => {
                evt.stopPropagation();
                this.closeContextMenu();
                onClick();
            });
            return item;
        };

        const inlineRename = () => {
            titleSpan.contentEditable = 'true';
            titleSpan.style.background = 'rgba(255, 255, 255, 0.1)';
            titleSpan.style.padding = '2px 4px';
            titleSpan.style.borderRadius = '4px';
            titleSpan.style.outline = '1px solid var(--accent-solid)';
            titleSpan.focus();
            
            const range = document.createRange();
            range.selectNodeContents(titleSpan);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            const finishRename = async () => {
                titleSpan.contentEditable = 'false';
                titleSpan.style.background = 'transparent';
                titleSpan.style.padding = '0';
                titleSpan.style.outline = 'none';
                
                const newTitle = titleSpan.textContent.trim();
                if (newTitle !== '' && newTitle !== page.title) {
                    try {
                        const res = await fetch('/api/pages/rename', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: page.id, title: newTitle })
                        });
                        const data = await res.json();
                        if (data.status === 'success') {
                            page.title = newTitle;
                            const originalPage = this.pages.find(p => parseInt(p.id) === parseInt(page.id));
                            if (originalPage) originalPage.title = newTitle;
                            
                            if (window.escmsEditor && window.escmsEditor.currentPageObj && parseInt(window.escmsEditor.currentPageObj.id) === parseInt(page.id)) {
                                window.escmsEditor.currentPageObj.title = newTitle;
                            }
                        } else {
                            titleSpan.textContent = page.title;
                        }
                    } catch (err) {
                        titleSpan.textContent = page.title;
                    }
                } else {
                    titleSpan.textContent = page.title;
                }
            };

            const onKeyDown = (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    titleSpan.blur();
                } else if (evt.key === 'Escape') {
                    evt.preventDefault();
                    titleSpan.textContent = page.title;
                    titleSpan.blur();
                }
            };

            titleSpan.addEventListener('blur', finishRename, { once: true });
            titleSpan.addEventListener('keydown', onKeyDown);
        };

        if (parseInt(page.is_custom_link) === 1) {
            // CUSTOM LINK MENU
            this.contextMenu.appendChild(createItem('edit_link', 'Edit URL', () => {
                // Inline Edit URL - Option B
                const urlInput = document.createElement('input');
                urlInput.type = 'text';
                urlInput.value = page.custom_link_url || '';
                urlInput.placeholder = 'https://...';
                urlInput.style.width = '100%';
                urlInput.style.background = 'rgba(0, 0, 0, 0.5)';
                urlInput.style.color = 'var(--accent-solid)';
                urlInput.style.border = '1px solid var(--accent-solid)';
                urlInput.style.borderRadius = '4px';
                urlInput.style.padding = '4px 8px';
                urlInput.style.fontSize = '0.8rem';
                urlInput.style.marginTop = '4px';
                urlInput.style.outline = 'none';
                
                // Hide title, show input
                titleSpan.style.display = 'none';
                leftDiv.appendChild(urlInput);
                urlInput.focus();
                
                const saveUrl = async () => {
                    const newUrl = urlInput.value.trim();
                    try {
                        await fetch('/api/pages/update_url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: page.id, url: newUrl })
                        });
                        page.custom_link_url = newUrl;
                        const originalPage = this.pages.find(p => parseInt(p.id) === parseInt(page.id));
                        if (originalPage) originalPage.custom_link_url = newUrl;
                    } catch (err) {}
                    urlInput.remove();
                    titleSpan.style.display = '';
                };

                urlInput.addEventListener('blur', saveUrl, { once: true });
                urlInput.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') { evt.preventDefault(); urlInput.blur(); }
                    else if (evt.key === 'Escape') { 
                        evt.preventDefault(); 
                        urlInput.removeEventListener('blur', saveUrl);
                        urlInput.remove(); 
                        titleSpan.style.display = ''; 
                    }
                });
            }));
            
            this.contextMenu.appendChild(createItem('rename_link', 'Rename', inlineRename));
            this.contextMenu.appendChild(createItem('delete_link', 'Delete Link', () => this.deletePage(page.id), true));
        } else {
            // STANDARD PAGE MENU
            this.contextMenu.appendChild(createItem('set_home', 'Set as Homepage', () => this.setSpecialPage(page.id, 'home')));
            this.contextMenu.appendChild(createItem('set_blog', 'Set as Blog', () => this.setSpecialPage(page.id, 'blog')));
            
            const hiddenText = parseInt(page.is_hidden_menu) === 1 ? 'Show in Menu' : 'Hide from Menu';
            this.contextMenu.appendChild(createItem('toggle_menu_visibility', hiddenText, () => this.toggleHidden(page.id)));
            
            this.contextMenu.appendChild(createItem('rename_page', 'Rename', inlineRename));
            this.contextMenu.appendChild(createItem('duplicate_page', 'Duplicate', () => this.duplicatePage(page.id)));
            this.contextMenu.appendChild(createItem('delete_page', 'Delete Page', () => this.deletePage(page.id), true));
        }

        document.body.appendChild(this.contextMenu);

        setTimeout(() => {
            this.outsideClickListener = (evt) => {
                if (this.contextMenu && !this.contextMenu.contains(evt.target)) {
                    this.closeContextMenu();
                }
            };
            document.addEventListener('click', this.outsideClickListener);
        }, 0);
    }

    closeContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
        if (this.outsideClickListener) {
            document.removeEventListener('click', this.outsideClickListener);
            this.outsideClickListener = null;
        }
    }
}