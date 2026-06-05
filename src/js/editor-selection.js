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


        `;
        shadowRoot.appendChild(style);

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
            let target = e.target;
            const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
            const closestBlock = target.closest(textBlockTags.join(','));
            
            if (closestBlock && closestBlock.id !== 'document-root') {
                target = closestBlock;
            }

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
            this.selectedNode.classList.add('escms-selected');

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
            let target = e.target;
            const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
            const closestBlock = target.closest(textBlockTags.join(','));
            
            if (closestBlock && closestBlock.id !== 'document-root') {
                target = closestBlock;
            }

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

            e.dataTransfer.dropEffect = 'copy';

            documentRoot.querySelectorAll('.escms-drag-target').forEach(el => el.classList.remove('escms-drag-target'));
            
            let target = e.target;
            const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
            const closestBlock = target.closest(textBlockTags.join(','));
            
            if (closestBlock && closestBlock.id !== 'document-root') {
                target = closestBlock;
            }

            if (target && target.id !== 'document-root') {
                target.classList.add('escms-drag-target');
            }
        });

        documentRoot.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            if (e.target && e.target.classList) {
                e.target.classList.remove('escms-drag-target');
            }
        });

        documentRoot.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            documentRoot.querySelectorAll('.escms-drag-target').forEach(el => el.classList.remove('escms-drag-target'));

            const dataString = e.dataTransfer.getData('application/json');
            if (dataString) {
                try {
                    const payload = JSON.parse(dataString);
                    let target = e.target;
                    const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
                    const closestBlock = target.closest(textBlockTags.join(','));
                    
                    if (closestBlock && closestBlock.id !== 'document-root') {
                        target = closestBlock;
                    }
                    
                    window.dispatchEvent(new CustomEvent('escms-canvas-drop', {
                        detail: { 
                            payload: payload, 
                            targetNode: target 
                        }
                    }));
                } catch (err) {}
            }
        });

        let currentHoverNode = null;
        documentRoot.addEventListener('mouseover', (e) => {
            if (window.escmsEditor && window.escmsEditor.leftpanel && window.escmsEditor.leftpanel.draggedDomNode) return;
            
            let target = e.target;
            const textBlockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'LABEL', 'BLOCKQUOTE', 'A'];
            const closestBlock = target.closest(textBlockTags.join(','));
            if (closestBlock && closestBlock.id !== 'document-root') target = closestBlock;
            
            if (target === documentRoot) {
                if (currentHoverNode) {
                    currentHoverNode.classList.remove('escms-hover');
                    currentHoverNode = null;
                }
                return;
            }
            
            if (currentHoverNode !== target) {
                if (currentHoverNode) currentHoverNode.classList.remove('escms-hover');
                currentHoverNode = target;
                currentHoverNode.classList.add('escms-hover');
            }
        });

        documentRoot.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget || (currentHoverNode && !currentHoverNode.contains(e.relatedTarget))) {
                if (currentHoverNode) {
                    currentHoverNode.classList.remove('escms-hover');
                    currentHoverNode = null;
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

            if (e.key === 'Enter' && this.selectedNode && this.selectedNode.tagName === 'LI') {
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
            }
        });
    }
}