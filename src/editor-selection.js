class EscmsSelection {
    constructor() {
        this.selectedNode = null;
    }

    init(shadowRoot, documentRoot, emptyText = 'Drop atoms here') {
        const style = document.createElement('style');
        style.textContent = `
            * { outline: none !important; }
            #document-root {
                color: var(--text-color, #0a0a0a);
                background-color: var(--bg-color, #ffffff);
                font-family: var(--font-family, inherit);
                flex: 1;
                width: 100%;
                box-sizing: border-box;
            }
            #document-root a {
                color: var(--link-color, #3b82f6);
                text-decoration: none;
            }
            #document-root a:hover {
                color: var(--link-hover-color, #2563eb);
                text-decoration: underline;
            }
            #document-root div,
            #document-root section,
            #document-root article,
            #document-root main,
            #document-root aside,
            #document-root header,
            #document-root footer {
                outline: 1px dotted #cccccc;
                outline-offset: -1px;
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
            .escms-column:empty::after, .escms-grid-item:empty::after, .escms-container:empty::after, .escms-section:empty::after {
                content: '${emptyText}';
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                inset: 0;
                color: rgba(59, 130, 246, 0.6);
                font-family: monospace;
                font-size: 0.75rem;
                pointer-events: none;
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
        `;
        shadowRoot.appendChild(style);

        documentRoot.addEventListener('click', (e) => {
            e.stopPropagation();

            // Si el usuario ha arrastrado para seleccionar texto (subrayar), 
            // ignoramos el clic para no perder el foco ni seleccionar al padre por accidente.
            const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            if (sel && !sel.isCollapsed) return;

            // Si hacemos clic en el nodo que ya está seleccionado, 
            // abortamos para no destruir el cursor ni la selección de texto.
            if (this.selectedNode === e.target) return;

            if (this.selectedNode) {
                this.selectedNode.classList.remove('escms-selected');
                if (this.selectedNode.hasAttribute('contenteditable')) {
                    this.selectedNode.removeAttribute('contenteditable');
                }
            }

            this.selectedNode = e.target;
            this.selectedNode.classList.add('escms-selected');

            const editableTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'LABEL'];
            if (editableTags.includes(this.selectedNode.tagName)) {
                this.selectedNode.setAttribute('contenteditable', 'true');
                setTimeout(() => this.selectedNode.focus(), 10);
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

        documentRoot.addEventListener('keydown', (e) => {
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