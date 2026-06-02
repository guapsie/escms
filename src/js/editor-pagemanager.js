class EscmsPageManager {
    constructor(i18n) {
        this.i18n = i18n;
        this.container = null;
        this.contextMenu = null;
        this.outsideClickListener = null;
        this.pages = [];
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
            const res = await fetch('/api/pages/create', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                await this.loadPages();
                this.loadPage(data.id);
            }
        } catch (e) {
            console.error('[ESCMS] Error creating page', e);
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
        if (!confirm('Are you sure you want to delete this page?')) return;
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

    // renamePage is handled inline now

    async setSpecialPage(id, type) {
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
            }
        } catch (e) {
            console.error('[ESCMS] Error setting special page', e);
        }
    }

    async loadPage(id) {
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

    renderPages() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // --- Header + Create Button ---
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10px 15px';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        
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
        createBtn.addEventListener('click', () => this.createPage());
        
        header.appendChild(title);
        header.appendChild(createBtn);
        this.container.appendChild(header);

        // --- List Container ---
        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.overflowY = 'auto';

        this.pages.forEach(page => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.padding = '12px 15px';
            item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            item.style.transition = 'background 0.2s';
            item.style.cursor = 'pointer';
            
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255, 255, 255, 0.03)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            item.addEventListener('click', () => this.loadPage(page.id));

            // --- Izquierda: Icono + Título ---
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'center';
            leftDiv.style.gap = '10px';

            let iconSvg = '';
            if (page.is_home) iconSvg = icons.house;
            else if (page.is_blog) iconSvg = icons.scroll;
            else iconSvg = icons.file;

            const iconWrap = document.createElement('div');
            iconWrap.innerHTML = iconSvg;
            iconWrap.style.display = 'flex';
            iconWrap.style.alignItems = 'center';
            iconWrap.style.color = (page.is_home || page.is_blog) ? 'var(--accent-solid)' : 'rgba(245, 245, 245, 0.4)';
            const svg = iconWrap.querySelector('svg');
            if (svg) { svg.style.width = '16px'; svg.style.height = '16px'; }

            const titleSpan = document.createElement('span');
            titleSpan.textContent = page.title;
            titleSpan.style.fontSize = '0.85rem';
            titleSpan.style.color = 'var(--text-solid)';
            titleSpan.style.fontWeight = (page.is_home || page.is_blog) ? '500' : 'normal';

            leftDiv.appendChild(iconWrap);
            leftDiv.appendChild(titleSpan);

            // --- Derecha: Views + Opciones ---
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.alignItems = 'center';
            rightDiv.style.gap = '12px';

            const viewsBadge = document.createElement('div');
            viewsBadge.style.display = 'flex';
            viewsBadge.style.alignItems = 'center';
            viewsBadge.style.gap = '4px';
            viewsBadge.style.fontSize = '0.75rem';
            viewsBadge.style.color = 'rgba(245, 245, 245, 0.4)';
            viewsBadge.innerHTML = `<div style="width: 14px; height: 14px; display: flex; align-items: center;">${icons.eye}</div> <span>${page.views || 0}</span>`;
            const eyeSvg = viewsBadge.querySelector('svg');
            if (eyeSvg) { eyeSvg.style.width = '100%'; eyeSvg.style.height = '100%'; }

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
                this.openContextMenu(e, page, titleSpan);
            });

            rightDiv.appendChild(viewsBadge);
            rightDiv.appendChild(menuBtn);

            item.appendChild(leftDiv);
            item.appendChild(rightDiv);
            listContainer.appendChild(item);
        });

        this.container.appendChild(listContainer);
    }

    openContextMenu(e, page, titleSpan) {
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

        const createItem = (i18nKey, onClick, isDanger = false) => {
            const item = document.createElement('div');
            item.setAttribute('data-i18n', i18nKey);
            item.textContent = this.i18n.dictionary[i18nKey] || i18nKey;
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

        this.contextMenu.appendChild(createItem('set_home', () => this.setSpecialPage(page.id, 'home')));
        this.contextMenu.appendChild(createItem('set_blog', () => this.setSpecialPage(page.id, 'blog')));
        
        this.contextMenu.appendChild(createItem('rename_page', () => {
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
        }));

        this.contextMenu.appendChild(createItem('duplicate_page', () => this.duplicatePage(page.id)));
        this.contextMenu.appendChild(createItem('delete_page', () => this.deletePage(page.id), true));

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