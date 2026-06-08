class EscmsSelection {
    constructor() {
        this.selectedNode = null;
    }

    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.classList.remove('escms-selected');
            if (this.selectedNode.hasAttribute('contenteditable')) {
                this.selectedNode.removeAttribute('contenteditable');
            }
            this.selectedNode = null;
            window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: null } }));
        }
    }

    init(shadowRoot, documentRoot, emptyText = 'Drop atoms here') {
        const style = document.createElement('style');
        style.textContent = `
            * { outline: none !important; }
            :where(#document-root) {
                color: var(--color-text, #0a0a0a);
                background-color: var(--color-background, #ffffff);
                font-family: var(--font-body, inherit);
                flex: 1;
                width: 100%;
                box-sizing: border-box;
            }
            :where(#document-root) a {
                color: var(--color-link, var(--color-accent, #3b82f6));
                text-decoration: none;
            }
            :where(#document-root) a:hover {
                color: var(--color-link-hover, var(--color-accent, #2563eb));
                text-decoration: underline;
            }
            :where(#document-root) div,
            :where(#document-root) section,
            :where(#document-root) article,
            :where(#document-root) main,
            :where(#document-root) aside,
            :where(#document-root) header,
            :where(#document-root) footer {
                outline: 1px dotted #cccccc;
                outline-offset: -1px;
            }
            .escms-main {
                min-height: 100px;
                width: 100%;
                box-sizing: border-box;
            }
            .escms-section {
                min-height: 50px;
                padding: 2rem;
                width: 100%;
                box-sizing: border-box;
            }
            .escms-container {
                min-height: 20px;
                width: 100%;
                max-width: var(--max-width, 1200px);
                margin: 0 auto;
                box-sizing: border-box;
            }
            .escms-column, .escms-grid-item {
                outline: 1px dotted rgba(59, 130, 246, 0.5) !important;
                outline-offset: -1px;
                min-height: 50px;
                min-width: 10px;
                background-color: rgba(59, 130, 246, 0.05);
                position: relative;
            }

            blockquote {
                border-left: 4px solid var(--accent-solid, #3b82f6);
                padding-left: 1rem;
                margin-left: 0;
                color: rgba(245, 245, 245, 0.8);
                font-style: italic;
            }
            .escms-selected {
                outline: 2px solid var(--accent-faint) !important;
                outline-offset: -2px;
                background-color: rgba(59, 130, 246, 0.05) !important;
            }
            .escms-drag-target {
                outline: 2px dashed var(--accent-faint) !important;
                outline-offset: -2px;
                background-color: rgba(59, 130, 246, 0.05) !important;
            }
            .escms-hover {
                outline: 1px solid rgba(59, 130, 246, 0.4) !important;
                outline-offset: -1px;
                background-color: rgba(59, 130, 246, 0.05) !important;
            }
            
            /* Component Highlight Styles (Malva) */
            escms-component {
                outline: 2px dashed #9333ea !important;
                outline-offset: -2px;
                display: block;
            }
            escms-component.escms-hover {
                outline: 2px solid rgba(147, 51, 234, 0.6) !important;
                background-color: rgba(147, 51, 234, 0.05) !important;
            }
            escms-component.escms-selected {
                outline: 3px solid #9333ea !important;
                background-color: rgba(147, 51, 234, 0.1) !important;
            }

            .escms-drag-top {
                box-shadow: inset 0 4px 0 0 var(--accent-solid, #3b82f6) !important;
            }
            .escms-drag-bottom {
                box-shadow: inset 0 -4px 0 0 var(--accent-solid, #3b82f6) !important;
            }
            .escms-drag-inside {
                background-color: rgba(59, 130, 246, 0.15) !important;
                outline: 2px solid var(--accent-solid, #3b82f6) !important;
                outline-offset: -2px;
            }
            @keyframes escmsDropIn {
                0% { transform: scale(0.98); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
            .escms-dropped {
                animation: escmsDropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes escms-bg-pan {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes escms-mesh-drift {
                0% { background-position: 0% 0%, 100% 100%, 50% 0%; }
                33% { background-position: 100% 0%, 0% 50%, 100% 100%; }
                66% { background-position: 50% 100%, 0% 0%, 0% 100%; }
                100% { background-position: 0% 0%, 100% 100%, 50% 0%; }
            }
            [data-escms-mesh="true"] {
                position: relative;
                isolation: isolate;
            }
            [data-escms-mesh="true"]::before {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                pointer-events: none;
                border-radius: inherit;
                background-image: var(--escms-mesh-bg);
                background-size: var(--escms-mesh-size, 100% 100%);
                background-repeat: var(--escms-mesh-repeat, no-repeat);
                animation: var(--escms-mesh-anim, none);
                filter: blur(var(--escms-mesh-blur, 60px));
                clip-path: inset(0);
            }
        `;
        shadowRoot.appendChild(style);

        let currentHoverNode = null;

        const handle = document.createElement('div');
        handle.className = 'escms-global-drag-handle';
        handle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
        handle.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: var(--accent-solid, #3b82f6);
            color: white;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: grab;
            z-index: 10000;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: opacity 0.2s, background 0.2s;
        `;
        const svg = handle.querySelector('svg');
        svg.style.width = '14px';
        svg.style.height = '14px';
        svg.style.pointerEvents = 'none';
        
        handle.draggable = true;
        
        handle.addEventListener('mouseenter', () => handle.style.background = 'var(--accent-hover, #2563eb)');
        handle.addEventListener('mouseleave', (e) => {
            handle.style.background = 'var(--accent-solid, #3b82f6)';
            if (e.relatedTarget !== currentHoverNode && (!currentHoverNode || !currentHoverNode.contains(e.relatedTarget))) {
                if (currentHoverNode) {
                    currentHoverNode.classList.remove('escms-hover');
                    currentHoverNode = null;
                    updateHandlePosition(this.selectedNode);
                }
            }
        });

        shadowRoot.appendChild(handle);

        // Setup Resize Handles
        const resizeHandles = {};
        const corners = ['nw', 'ne', 'sw', 'se'];
        let activeResizeCorner = null;
        let initialResizeWidth = 0;
        let initialMouseX = 0;
        let isResizing = false;

        corners.forEach(corner => {
            const el = document.createElement('div');
            el.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ffffff;
                border: 2px solid var(--accent-solid, #3b82f6);
                z-index: 10001;
                display: none;
                cursor: ${corner}-resize;
                box-sizing: border-box;
            `;
            
            el.addEventListener('mousedown', (e) => {
                if (!this.selectedNode || this.selectedNode.tagName !== 'IMG') return;
                e.preventDefault();
                e.stopPropagation();
                
                isResizing = true;
                activeResizeCorner = corner;
                initialMouseX = e.clientX;
                const rect = this.selectedNode.getBoundingClientRect();
                initialResizeWidth = rect.width;
                
                const zoom = (window.escmsEditor && window.escmsEditor.canvas) ? window.escmsEditor.canvas.currentZoom : 1;
                
                const onMouseMove = (moveEvent) => {
                    if (!isResizing) return;
                    const deltaX = (moveEvent.clientX - initialMouseX) / zoom;
                    let newWidth = initialResizeWidth;
                    
                    if (activeResizeCorner === 'se' || activeResizeCorner === 'ne') {
                        newWidth = initialResizeWidth + deltaX;
                    } else if (activeResizeCorner === 'sw' || activeResizeCorner === 'nw') {
                        newWidth = initialResizeWidth - deltaX;
                    }
                    
                    if (newWidth > 10) {
                        this.selectedNode.style.width = newWidth + 'px';
                        this.selectedNode.style.height = 'auto';
                        updateHandlePosition(this.selectedNode);
                    }
                };
                
                const onMouseUp = () => {
                    isResizing = false;
                    activeResizeCorner = null;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    window.dispatchEvent(new Event('escms-dom-mutated'));
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            shadowRoot.appendChild(el);
            resizeHandles[corner] = el;
        });

        const updateHandlePosition = (targetNode) => {
            if (!targetNode || targetNode.id === 'document-root') {
                handle.style.display = 'none';
                corners.forEach(c => resizeHandles[c].style.display = 'none');
                return;
            }
            const host = document.getElementById('escms-canvas-host');
            if (!host) return;
            const hostRect = host.getBoundingClientRect();
            const targetRect = targetNode.getBoundingClientRect();
            const zoom = (window.escmsEditor && window.escmsEditor.canvas) ? window.escmsEditor.canvas.currentZoom : 1;
            
            let handleTop = ((targetRect.top - hostRect.top) / zoom - 10);
            let handleLeft = ((targetRect.left - hostRect.left) / zoom - 10);
            
            if (handleTop < 0) handleTop = 4;
            if (handleLeft < 0) handleLeft = 4;
            
            handle.style.top = handleTop + 'px';
            handle.style.left = handleLeft + 'px';
            handle.style.display = 'flex';
            
            // Image Resizers
            if (targetNode.tagName === 'IMG') {
                const top = (targetRect.top - hostRect.top) / zoom;
                const bottom = (targetRect.bottom - hostRect.top) / zoom;
                const left = (targetRect.left - hostRect.left) / zoom;
                const right = (targetRect.right - hostRect.left) / zoom;
                
                resizeHandles['nw'].style.top = (top - 4) + 'px';
                resizeHandles['nw'].style.left = (left - 4) + 'px';
                
                resizeHandles['ne'].style.top = (top - 4) + 'px';
                resizeHandles['ne'].style.left = (right - 4) + 'px';
                
                resizeHandles['sw'].style.top = (bottom - 4) + 'px';
                resizeHandles['sw'].style.left = (left - 4) + 'px';
                
                resizeHandles['se'].style.top = (bottom - 4) + 'px';
                resizeHandles['se'].style.left = (right - 4) + 'px';
                
                corners.forEach(c => resizeHandles[c].style.display = 'block');
            } else {
                corners.forEach(c => resizeHandles[c].style.display = 'none');
            }
        };

        window.addEventListener('scroll', () => {
            const active = currentHoverNode || this.selectedNode;
            if (active) updateHandlePosition(active);
        }, true);

        window.addEventListener('escms-element-selected', (e) => {
            if (!currentHoverNode || e.detail.node === currentHoverNode) {
                 updateHandlePosition(e.detail.node);
            }
        });

        handle.addEventListener('dragstart', (e) => {
            window.escmsDraggedNode = currentHoverNode || this.selectedNode;
            if (!window.escmsDraggedNode) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move', action: 'canvas-move' }));
            
            setTimeout(() => {
                if (window.escmsDraggedNode) {
                    window.escmsDraggedNode.style.opacity = '0.5';
                }
            }, 0);
        });

        handle.addEventListener('dragend', (e) => {
            if (window.escmsDraggedNode) {
                window.escmsDraggedNode.style.opacity = '';
                window.escmsDraggedNode = null;
            }
            documentRoot.querySelectorAll('.escms-drag-target').forEach(el => el.classList.remove('escms-drag-target'));
            updateHandlePosition(currentHoverNode || this.selectedNode);
        });

        const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
        const resolveTarget = (target) => {
            const closestBlock = target.closest(textBlockTags.join(','));
            if (closestBlock && closestBlock.id !== 'document-root') target = closestBlock;
            const compParent = target.closest('escms-component');
            if (compParent) target = compParent;
            return target;
        };

        documentRoot.addEventListener('click', (e) => {
            e.stopPropagation();

            const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            
            // Guardamos el rango de selección actual por si el usuario ha arrastrado para seleccionar texto
            // en un nodo que aún no era editable. Así podremos restaurar su selección tras hacerlo editable.
            let savedRange = null;
            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                savedRange = sel.getRangeAt(0).cloneRange();
            }

            // Encontrar el bloque de texto padre si hacemos clic en una etiqueta inline (strong, span, a, etc.)
            let target = resolveTarget(e.target);

            // Si hacemos clic en el nodo que ya está seleccionado, 
            // abortamos para no destruir el cursor ni la selección de texto.
            if (this.selectedNode === target) return;

            if (this.selectedNode) {
                this.selectedNode.classList.remove('escms-selected');
                if (this.selectedNode.hasAttribute('contenteditable')) {
                    this.selectedNode.removeAttribute('contenteditable');
                }
            }

            this.selectedNode = target;
            if (this.selectedNode.id !== 'document-root') {
                this.selectedNode.classList.add('escms-selected');
            }

            const editableTags = [...textBlockTags, 'SPAN', 'A']; // SPAN y A como fallback
            if (editableTags.includes(this.selectedNode.tagName)) {
                this.selectedNode.setAttribute('contenteditable', 'true');
                setTimeout(() => {
                    this.selectedNode.focus();
                    
                    // Si el usuario había seleccionado texto dentro de este nodo antes de que fuera editable,
                    // restauramos su selección para que pueda escribir directamente y reemplazar el texto.
                    if (savedRange && this.selectedNode.contains(savedRange.commonAncestorContainer)) {
                        const newSel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
                        newSel.removeAllRanges();
                        newSel.addRange(savedRange);
                    }
                }, 10);
            }

            const event = new CustomEvent('escms-element-selected', {
                detail: { 
                    node: this.selectedNode,
                    clientX: e.clientX,
                    clientY: e.clientY
                }
            });
            window.dispatchEvent(event);
        });

        documentRoot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // First select the node exactly like left click
            let target = resolveTarget(e.target);

            if (this.selectedNode !== target) {
                if (this.selectedNode) {
                    this.selectedNode.classList.remove('escms-selected');
                    if (this.selectedNode.hasAttribute('contenteditable')) {
                        this.selectedNode.removeAttribute('contenteditable');
                    }
                }
                this.selectedNode = target;
                if (this.selectedNode && this.selectedNode.id !== 'document-root') {
                    this.selectedNode.classList.add('escms-selected');
                }
                window.dispatchEvent(new CustomEvent('escms-element-selected', {
                    detail: { node: this.selectedNode }
                }));
            }

            // Then dispatch context menu event to the window so EscmsContextMenu can show up
            window.dispatchEvent(new CustomEvent('escms-context-menu', {
                detail: {
                    node: this.selectedNode,
                    clientX: e.clientX,
                    clientY: e.clientY
                }
            }));
        });

        documentRoot.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isAllowed = e.dataTransfer.types.includes('application/json');
            if (!isAllowed) return;

            if (window.escmsDraggedNode) {
                e.dataTransfer.dropEffect = 'move';
                let currentTarget = e.target;
                if (currentTarget === window.escmsDraggedNode || window.escmsDraggedNode.contains(currentTarget)) {
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }
            } else {
                e.dataTransfer.dropEffect = 'copy';
            }

            documentRoot.querySelectorAll('.escms-drag-target, .escms-drag-top, .escms-drag-bottom, .escms-drag-inside').forEach(el => el.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside'));
            
            let target = resolveTarget(e.target);

            if (target) {
                const rect = target.getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);
                
                if (target.id === 'document-root') {
                    if (relY < rect.height * 0.5 && target.firstChild) {
                        target.classList.add('escms-drag-top');
                    } else {
                        target.classList.add('escms-drag-bottom');
                    }
                } else {
                    if (relY < rect.height * 0.25) {
                        target.classList.add('escms-drag-top');
                    } else if (relY > rect.height * 0.75) {
                        target.classList.add('escms-drag-bottom');
                    } else if (isContainer) {
                        target.classList.add('escms-drag-inside');
                    } else {
                        target.classList.add('escms-drag-bottom');
                    }
                }
            }
        });

        documentRoot.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            if (e.target && e.target.classList) {
                e.target.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside');
            }
        });

        documentRoot.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            documentRoot.querySelectorAll('.escms-drag-target, .escms-drag-top, .escms-drag-bottom, .escms-drag-inside').forEach(el => el.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside'));

            const dataString = e.dataTransfer.getData('application/json');
            if (dataString) {
                try {
                    const payload = JSON.parse(dataString);
                    let target = resolveTarget(e.target);
                    
                    if (payload.action === 'canvas-move' && window.escmsDraggedNode) {
                        if (target && target !== window.escmsDraggedNode && !window.escmsDraggedNode.contains(target)) {
                            const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);
                            const rect = target.getBoundingClientRect();
                            const relY = e.clientY - rect.top;
                            
                            window.escmsDraggedNode.remove();
                            
                            if (target.id === 'document-root') {
                                if (relY < rect.height * 0.5 && target.firstChild) {
                                    target.insertBefore(window.escmsDraggedNode, target.firstChild);
                                } else {
                                    target.appendChild(window.escmsDraggedNode);
                                }
                            } else {
                                if (relY < rect.height * 0.25) {
                                    target.parentNode.insertBefore(window.escmsDraggedNode, target);
                                } else if (relY > rect.height * 0.75) {
                                    target.parentNode.insertBefore(window.escmsDraggedNode, target.nextSibling);
                                } else if (isContainer) {
                                    target.appendChild(window.escmsDraggedNode);
                                } else {
                                    target.parentNode.insertBefore(window.escmsDraggedNode, target.nextSibling);
                                }
                            }

                            const droppedNode = window.escmsDraggedNode;
                            droppedNode.classList.add('escms-dropped');
                            setTimeout(() => {
                                droppedNode.classList.remove('escms-dropped');
                            }, 300);

                            setTimeout(() => {
                                droppedNode.click();
                                window.dispatchEvent(new Event('escms-dom-mutated'));
                            }, 10);
                        }
                    } else {
                        // Calculate dropAction for new atoms/components
                        let dropAction = 'inside';
                        if (target && target.id !== 'document-root') {
                            const rect = target.getBoundingClientRect();
                            const relY = e.clientY - rect.top;
                            const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);
                            
                            if (relY < rect.height * 0.25) dropAction = 'before';
                            else if (relY > rect.height * 0.75) dropAction = 'after';
                            else if (!isContainer) dropAction = 'after';
                        } else if (target && target.id === 'document-root') {
                            const rect = target.getBoundingClientRect();
                            const relY = e.clientY - rect.top;
                            if (relY < rect.height * 0.5 && target.firstChild) dropAction = 'first';
                        }
                        
                        window.dispatchEvent(new CustomEvent('escms-canvas-drop', {
                            detail: { 
                                payload: payload, 
                                targetNode: target,
                                dropAction: dropAction
                            }
                        }));
                    }
                } catch (err) {}
            }
        });

        documentRoot.addEventListener('mouseover', (e) => {
            if (window.escmsEditor && window.escmsEditor.leftpanel && window.escmsEditor.leftpanel.draggedDomNode) return;
            if (window.escmsDraggedNode) return;
            
            let target = resolveTarget(e.target);
            
            if (target === documentRoot) {
                if (currentHoverNode) {
                    currentHoverNode.classList.remove('escms-hover');
                    currentHoverNode = null;
                    updateHandlePosition(this.selectedNode);
                }
                return;
            }
            
            if (currentHoverNode !== target) {
                if (currentHoverNode) currentHoverNode.classList.remove('escms-hover');
                currentHoverNode = target;
                currentHoverNode.classList.add('escms-hover');
                updateHandlePosition(currentHoverNode);
            }
        });

        documentRoot.addEventListener('mouseout', (e) => {
            if (e.relatedTarget === handle || handle.contains(e.relatedTarget)) {
                return;
            }
            if (!e.relatedTarget || (currentHoverNode && !currentHoverNode.contains(e.relatedTarget))) {
                if (currentHoverNode) {
                    currentHoverNode.classList.remove('escms-hover');
                    currentHoverNode = null;
                    updateHandlePosition(this.selectedNode);
                }
            }
        });

        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
                const isEditable = this.selectedNode.hasAttribute('contenteditable');
                const isEmpty = this.selectedNode.textContent.trim() === '';

                if (!isEditable || isEmpty) {
                    e.preventDefault();
                    if (this.selectedNode.id !== 'document-root') {
                        const parent = this.selectedNode.parentNode;
                        this.selectedNode.remove();
                        this.selectedNode = null;
                        
                        if (parent && parent.id !== 'document-root') {
                            setTimeout(() => parent.click(), 10);
                        } else {
                            window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: null } }));
                        }
                    }
                }
            }

            if (e.key === 'Enter' && this.selectedNode) {
                if (this.selectedNode.tagName === 'LI') {
                    e.preventDefault();
                    const parentList = this.selectedNode.closest('ul, ol');
                    if (parentList) {
                        const newLi = document.createElement('li');
                        newLi.textContent = 'New Item';
                        // Insert after current selected node
                        if (this.selectedNode.nextSibling) {
                            parentList.insertBefore(newLi, this.selectedNode.nextSibling);
                        } else {
                            parentList.appendChild(newLi);
                        }
                        // Trigger click to select it
                        newLi.click();
                    }
                } else if (this.selectedNode.hasAttribute('contenteditable')) {
                    // Prevent default paragraph splitting (which creates divs/spans)
                    e.preventDefault();
                    document.execCommand('insertLineBreak');
                }
            }
        });
    }
}