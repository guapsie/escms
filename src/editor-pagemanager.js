class EscmsPageManager {
    constructor(i18n) {
        this.i18n = i18n;
        this.container = null;
        this.contextMenu = null;
        this.outsideClickListener = null;
        
        // Mock Data Inicial
        this.pages = [
            { id: 1, title: 'Inicio', views: 1420, is_home: true, is_blog: false },
            { id: 2, title: 'Blog', views: 340, is_home: false, is_blog: true },
            { id: 3, title: 'About Us', views: 125, is_home: false, is_blog: false },
            { id: 4, title: 'Contact', views: 89, is_home: false, is_blog: false }
        ];
    }

    init(container) {
        this.container = container;
        this.renderPages(this.pages);
    }

    renderPages(pagesArray) {
        this.container.innerHTML = '';
        
        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';

        pagesArray.forEach(page => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.padding = '12px 10px';
            item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            item.style.transition = 'background 0.2s';
            item.style.cursor = 'pointer';
            
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255, 255, 255, 0.03)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');

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
            viewsBadge.innerHTML = `<div style="width: 14px; height: 14px; display: flex; align-items: center;">${icons.eye}</div> <span>${page.views}</span>`;
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
                this.openContextMenu(e, page);
            });

            rightDiv.appendChild(viewsBadge);
            rightDiv.appendChild(menuBtn);

            item.appendChild(leftDiv);
            item.appendChild(rightDiv);
            listContainer.appendChild(item);
        });

        this.container.appendChild(listContainer);
    }

    openContextMenu(e, page) {
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
        
        // Calcular posición para que no se salga de la pantalla
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
                onClick();
                this.closeContextMenu();
            });
            return item;
        };

        this.contextMenu.appendChild(createItem('set_home', () => console.log('Set home:', page.id)));
        this.contextMenu.appendChild(createItem('set_blog', () => console.log('Set blog:', page.id)));
        this.contextMenu.appendChild(createItem('duplicate_page', () => console.log('Duplicate:', page.id)));
        this.contextMenu.appendChild(createItem('delete_page', () => console.log('Delete:', page.id), true));

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