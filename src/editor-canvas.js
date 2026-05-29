/**
 * @class EscmsCanvas
 * Controla el lienzo central y los viewports responsivos del editor.
 */
class EscmsCanvas {
    constructor() {
        this.area = null;
        this.viewport = null;
        this.scaler = null;
        this.host = null;
        this.activeView = 'desktop';
        this.currentZoom = 1;
        this.buttons = {};
    }

    init() {
        this.area = document.getElementById('escms-canvas-area') || document.getElementById('escms-canvas-wrapper');
        this.host = document.getElementById('escms-canvas-host');

        if (!this.area || !this.host) return;

        this.area.style.display = 'flex';
        this.area.style.flexDirection = 'column';
        this.area.style.overflow = 'hidden';
        this.area.style.height = '100%';
        this.area.style.position = 'relative';

        const toolbar = this.createToolbar();
        this.area.insertBefore(toolbar, this.host);

        this.viewport = document.createElement('div');
        this.viewport.id = 'escms-viewport';
        this.viewport.style.flex = '1';
        this.viewport.style.overflow = 'auto';
        this.viewport.style.position = 'relative';
        this.viewport.style.backgroundColor = '#0a0a0a';
        this.viewport.style.display = 'block';

        this.scaler = document.createElement('div');
        this.scaler.id = 'escms-canvas-scaler';
        this.scaler.style.margin = '0 auto';
        this.scaler.style.position = 'relative';
        this.scaler.style.transition = 'width 0.3s ease, height 0.3s ease';
        this.scaler.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)';

        this.host.style.margin = '0';
        this.host.style.transformOrigin = 'top left';
        this.host.style.transition = 'transform 0.3s ease, width 0.3s ease';
        this.host.style.backgroundColor = 'transparent';
        this.host.style.position = 'absolute';
        this.host.style.top = '0';
        this.host.style.left = '0';
        this.host.style.display = 'flex';
        this.host.style.flexDirection = 'column';
        this.host.style.minHeight = '100%';
        
        this.scaler.appendChild(this.host);
        this.viewport.appendChild(this.scaler);
        this.area.appendChild(this.viewport);

        this.setView('desktop', '100%');

        window.addEventListener('escms-element-selected', (e) => {
            const node = e.detail.node;
            if (node) {
                this.focusNode(node);
            }
        });

        const ro = new ResizeObserver(() => {
            if (this.currentZoom > 0) this.updateScaler();
        });
        ro.observe(this.host);
        
        window.addEventListener('resize', () => {
            if (this.activeView === 'desktop') {
                this.host.style.width = `${this.area.clientWidth}px`;
            }
            this.updateScaler();
        });
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.justifyContent = 'center';
        toolbar.style.padding = '0.5rem';
        toolbar.style.flexShrink = '0';
        toolbar.style.zIndex = '10';
        toolbar.style.position = 'relative';
        toolbar.style.backgroundColor = '#0a0a0a';
        toolbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';

        const pillGroup = document.createElement('div');
        pillGroup.style.display = 'flex';
        pillGroup.style.background = '#1f1f1f';
        pillGroup.style.borderRadius = '9999px';
        pillGroup.style.padding = '2px';
        pillGroup.style.gap = '2px';

        const views = [
            { id: 'desktop', icon: icons.monitor, width: '100%' },
            { id: 'tablet', icon: icons.tablet, width: '768px' },
            { id: 'phone', icon: icons.deviceMobile, width: '390px' }
        ];

        views.forEach(view => {
            const btn = document.createElement('button');
            btn.innerHTML = view.icon;
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.width = '32px';
            btn.style.height = '32px';
            btn.style.border = 'none';
            btn.style.borderRadius = '9999px';
            btn.style.background = 'transparent';
            btn.style.color = 'rgba(245, 245, 245, 0.4)';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s ease';

            const svg = btn.querySelector('svg');
            if (svg) {
                svg.style.width = '18px';
                svg.style.height = '18px';
            }

            btn.addEventListener('click', () => this.setView(view.id, view.width));

            this.buttons[view.id] = btn;
            pillGroup.appendChild(btn);
        });

        const zoomGroup = document.createElement('div');
        zoomGroup.style.display = 'flex';
        zoomGroup.style.alignItems = 'center';
        zoomGroup.style.background = '#1f1f1f';
        zoomGroup.style.borderRadius = '9999px';
        zoomGroup.style.padding = '2px 8px';
        zoomGroup.style.gap = '0.5rem';
        zoomGroup.style.marginLeft = '1rem';

        const magnifierIcon = document.createElement('div');
        magnifierIcon.innerHTML = icons.magnifyingGlass;
        magnifierIcon.style.color = 'rgba(245, 245, 245, 0.4)';
        magnifierIcon.style.display = 'flex';
        const svgMag = magnifierIcon.querySelector('svg');
        if (svgMag) { svgMag.style.width = '14px'; svgMag.style.height = '14px'; }

        const createZoomBtn = (text) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.color = 'var(--text-solid)';
            btn.style.cursor = 'pointer';
            btn.style.padding = '4px 8px';
            btn.style.borderRadius = '4px';
            btn.style.transition = 'all 0.2s ease';
            btn.style.fontSize = text === '100%' ? '0.75rem' : '1rem';
            btn.style.fontWeight = text === '100%' ? '600' : 'normal';
            btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255, 255, 255, 0.1)');
            btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
            return btn;
        };

        const btnMinus = createZoomBtn('-');
        const btnReset = createZoomBtn('100%');
        const btnPlus = createZoomBtn('+');
        
        btnMinus.addEventListener('click', () => this.setZoom(this.currentZoom - 0.25));
        btnPlus.addEventListener('click', () => this.setZoom(this.currentZoom + 0.25));
        btnReset.addEventListener('click', () => this.setZoom(1));

        zoomGroup.appendChild(magnifierIcon);
        zoomGroup.appendChild(btnMinus);
        zoomGroup.appendChild(btnReset);
        zoomGroup.appendChild(btnPlus);

        toolbar.appendChild(pillGroup);
        toolbar.appendChild(zoomGroup);

        return toolbar;
    }

    setView(viewId, width) {
        this.activeView = viewId;
        let targetZoom = 1;
        
        if (viewId === 'desktop') {
            this.host.style.width = `${this.area.clientWidth}px`;
        } else {
            this.host.style.width = width;
            
            const targetWidth = parseInt(width);
            const availableWidth = this.viewport.clientWidth - 40; // 20px de margen seguro por lado
            
            if (targetWidth > availableWidth) {
                targetZoom = Math.floor((availableWidth / targetWidth) * 100) / 100;
            }
        }

        Object.entries(this.buttons).forEach(([id, btn]) => {
            if (id === viewId) {
                btn.style.background = 'var(--accent-solid)';
                btn.style.color = 'var(--text-solid)';
                btn.style.boxShadow = '0 0 10px var(--accent-faint)';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'rgba(245, 245, 245, 0.4)';
                btn.style.boxShadow = 'none';
            }
        });

        this.setZoom(targetZoom);
    }

    setZoom(scale) {
        this.currentZoom = Math.max(0.25, Math.min(3, scale));
        this.host.style.transform = `scale(${this.currentZoom})`;
        this.updateScaler();
    }

    updateScaler() {
        if (!this.host || !this.scaler) return;
        
        // Pausamos el min-height temporalmente para medir la altura real sin retroalimentación
        this.host.style.minHeight = '0';
        
        let baseWidth;
        if (this.activeView === 'desktop') {
            baseWidth = this.area.clientWidth;
        } else {
            baseWidth = parseInt(this.host.style.width) || 768;
        }
        
        const baseHeight = Math.max(this.host.scrollHeight, this.viewport.clientHeight);
        this.host.style.minHeight = `${baseHeight}px`;

        this.scaler.style.width = `${baseWidth * this.currentZoom}px`;
        this.scaler.style.height = `${baseHeight * this.currentZoom}px`;

        // Añadimos márgenes externos dinámicos al hacer zoom para poder centrar cualquier esquina
        if (this.currentZoom > 1) {
            const padX = Math.round(this.viewport.clientWidth / 2);
            const padY = Math.round(this.viewport.clientHeight / 2);
            this.scaler.style.margin = `${padY}px ${padX}px`;
        } else {
            this.scaler.style.margin = '0 auto';
        }

        // Matamos el scroll horizontal nativamente en Desktop al 100%
        if (this.currentZoom === 1 && this.activeView === 'desktop') {
            this.viewport.style.overflowX = 'hidden';
        } else {
            this.viewport.style.overflowX = 'auto';
        }
    }

    focusNode(node) {
        this.setZoom(1.5);
        
        let offsetLeft = 0;
        let offsetTop = 0;
        let curr = node;
        
        while (curr && curr.tagName !== 'BODY' && curr !== this.host && !curr.id?.includes('escms-canvas-host')) {
            offsetLeft += curr.offsetLeft || 0;
            offsetTop += curr.offsetTop || 0;
            curr = curr.offsetParent;
        }

        const clientWidth = node.clientWidth || node.offsetWidth || 0;
        const clientHeight = node.clientHeight || node.offsetHeight || 0;

        const scaledLeft = offsetLeft * this.currentZoom;
        const scaledTop = offsetTop * this.currentZoom;
        const scaledWidth = clientWidth * this.currentZoom;
        const scaledHeight = clientHeight * this.currentZoom;
        
        setTimeout(() => {
            const padX = this.currentZoom > 1 ? Math.round(this.viewport.clientWidth / 2) : 0;
            const padY = this.currentZoom > 1 ? Math.round(this.viewport.clientHeight / 2) : 0;

            let targetScrollLeft;
            if (scaledWidth > this.viewport.clientWidth * 0.8) {
                targetScrollLeft = (padX + scaledLeft) - 40;
            } else {
                targetScrollLeft = (padX + scaledLeft + (scaledWidth / 2)) - (this.viewport.clientWidth / 2);
            }

            let targetScrollTop;
            if (scaledHeight > this.viewport.clientHeight * 0.8) {
                targetScrollTop = (padY + scaledTop) - 40;
            } else {
                targetScrollTop = (padY + scaledTop + (scaledHeight / 2)) - (this.viewport.clientHeight / 2);
            }
            
            this.viewport.scrollTo({
                left: Math.max(0, targetScrollLeft),
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }, 50);
    }
}