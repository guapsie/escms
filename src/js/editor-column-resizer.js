class EscmsColumnResizer {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.overlayLayer = document.createElement('div');
        this.overlayLayer.id = 'escms-overlay-layer';
        this.overlayLayer.style.position = 'absolute';
        this.overlayLayer.style.top = '0';
        this.overlayLayer.style.left = '0';
        this.overlayLayer.style.width = '100%';
        this.overlayLayer.style.height = '100%';
        this.overlayLayer.style.pointerEvents = 'none';
        this.overlayLayer.style.zIndex = '9999';
        
        this.shadowRoot.appendChild(this.overlayLayer);

        this.selectedColumnsNode = null;
        this.handles = [];
        this.isDragging = false;

        this.init();
    }

    init() {
        window.addEventListener('escms-element-selected', (e) => {
            if (this.isDragging) return;
            const node = e.detail.node;
            this.clearHandles();

            if (!node) {
                this.selectedColumnsNode = null;
                return;
            }

            const columnsNode = node.closest('.escms-columns');
            if (columnsNode) {
                this.selectedColumnsNode = columnsNode;
                this.drawHandles();
            } else {
                this.selectedColumnsNode = null;
            }
        });

        window.addEventListener('resize', () => {
            if (this.selectedColumnsNode && !this.isDragging) {
                this.drawHandles();
            }
        });

        window.addEventListener('escms-dom-mutated', () => {
            if (this.selectedColumnsNode && !this.isDragging) {
                // Pequeño delay para asegurar que el DOM ha repintado
                setTimeout(() => this.drawHandles(), 50);
            }
        });
        
        const viewport = document.getElementById('escms-viewport');
        if (viewport) {
            viewport.addEventListener('scroll', () => {
                if (this.selectedColumnsNode && !this.isDragging) {
                    // Reposicionar usando un requestAnimationFrame para fluidez
                    requestAnimationFrame(() => this.drawHandles());
                }
            });
        }
    }

    clearHandles() {
        this.overlayLayer.innerHTML = '';
        this.handles = [];
    }

    drawHandles() {
        this.clearHandles();
        if (!this.selectedColumnsNode || this.selectedColumnsNode.id === 'document-root') return;

        const children = Array.from(this.selectedColumnsNode.children).filter(c => c.classList.contains('escms-column'));
        if (children.length <= 1) return;

        const hostRect = this.shadowRoot.host.getBoundingClientRect();

        for (let i = 0; i < children.length - 1; i++) {
            const leftCol = children[i];
            const rightCol = children[i+1];
            
            const handleWrapper = document.createElement('div');
            handleWrapper.style.position = 'absolute';
            handleWrapper.style.width = '20px'; // Hitbox más grande
            handleWrapper.style.cursor = 'col-resize';
            handleWrapper.style.pointerEvents = 'auto';
            handleWrapper.style.display = 'flex';
            handleWrapper.style.justifyContent = 'center';
            handleWrapper.style.alignItems = 'center';

            const handleInner = document.createElement('div');
            handleInner.style.width = '4px';
            handleInner.style.height = '100%';
            handleInner.style.backgroundColor = 'var(--accent-solid, #3b82f6)';
            handleInner.style.borderRadius = '2px';
            handleInner.style.boxShadow = '0 0 8px rgba(59,130,246,0.6)';
            handleInner.style.opacity = '0';
            handleInner.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            handleInner.style.transform = 'scaleX(0.5)';
            
            handleWrapper.appendChild(handleInner);
            this.positionHandle(handleWrapper, leftCol, rightCol, hostRect);

            handleWrapper.addEventListener('mouseenter', () => {
                if (!this.isDragging) {
                    handleInner.style.opacity = '1';
                    handleInner.style.transform = 'scaleX(1)';
                }
            });
            handleWrapper.addEventListener('mouseleave', () => {
                if (!this.isDragging) {
                    handleInner.style.opacity = '0';
                    handleInner.style.transform = 'scaleX(0.5)';
                }
            });

            handleWrapper.addEventListener('mousedown', (e) => this.onDragStart(e, i, children, handleInner));

            this.overlayLayer.appendChild(handleWrapper);
            this.handles.push({ wrapper: handleWrapper, leftCol, rightCol });
        }
    }

    positionHandle(handle, leftCol, rightCol, hostRect) {
        const leftRect = leftCol.getBoundingClientRect();
        const rightRect = rightCol.getBoundingClientRect();
        
        const scaleX = hostRect.width / this.shadowRoot.host.offsetWidth;
        const scaleY = hostRect.height / this.shadowRoot.host.offsetHeight;

        const gapCenterPixel = leftRect.right + ((rightRect.left - leftRect.right) / 2);
        
        const x = (gapCenterPixel - hostRect.left) / scaleX;
        const y = (leftRect.top - hostRect.top) / scaleY;
        const h = leftRect.height / scaleY;

        handle.style.left = `${x - 10}px`; // -10 porque el width es 20px (centrado)
        handle.style.top = `${y}px`;
        handle.style.height = `${h}px`;
    }

    onDragStart(e, index, children, handleInner) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        
        handleInner.style.opacity = '1';
        handleInner.style.transform = 'scaleX(1.5)';
        
        const totalGapWidth = Array.from(this.handles).reduce((sum, h) => {
            return sum + (h.rightCol.getBoundingClientRect().left - h.leftCol.getBoundingClientRect().right);
        }, 0);

        const parentRect = this.selectedColumnsNode.getBoundingClientRect();
        // Available space for columns equals total width minus gaps
        const totalColWidths = parentRect.width - totalGapWidth;
        
        let colWidths = children.map(c => c.getBoundingClientRect().width);
        
        // Compute base percentages for each column based on pixel width
        let percentages = colWidths.map(w => (w / totalColWidths) * 100);

        const startX = e.clientX;
        const startLeftPercent = percentages[index];
        const startRightPercent = percentages[index+1];

        // El overlay interceptará los mousemove para que no se pierdan si movemos rápido
        const protector = document.createElement('div');
        protector.style.position = 'fixed';
        protector.style.top = '0';
        protector.style.left = '0';
        protector.style.width = '100vw';
        protector.style.height = '100vh';
        protector.style.zIndex = '99999';
        protector.style.cursor = 'col-resize';
        document.body.appendChild(protector);

        const onMouseMove = (moveEvent) => {
            const screenDeltaX = moveEvent.clientX - startX;
            const percentDelta = (screenDeltaX / totalColWidths) * 100;

            let newLeft = startLeftPercent + percentDelta;
            let newRight = startRightPercent - percentDelta;

            // Restringir a un mínimo de 5% por columna
            if (newLeft < 5) {
                newRight -= (5 - newLeft);
                newLeft = 5;
            }
            if (newRight < 5) {
                newLeft -= (5 - newRight);
                newRight = 5;
            }

            percentages[index] = newLeft;
            percentages[index+1] = newRight;

            // Aplicar el grid-template-columns en formato fr (fractional units)
            // Usamos fr porque grid distribuye automáticamente los gaps y el resto del espacio proporcionalmente a los fr
            const template = percentages.map(p => `${p}fr`).join(' ');
            this.selectedColumnsNode.style.gridTemplateColumns = template;
            
            // Reposicionar dinámicamente los manipuladores para que sigan al ratón
            const hostRect = this.shadowRoot.host.getBoundingClientRect();
            this.handles.forEach((h) => {
                this.positionHandle(h.wrapper, h.leftCol, h.rightCol, hostRect);
            });
        };

        const onMouseUp = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.removeChild(protector);
            handleInner.style.transform = 'scaleX(0.5)';
            handleInner.style.opacity = '0';
            window.dispatchEvent(new Event('escms-dom-mutated'));
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}
