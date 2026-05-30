class EscmsSelection {
    constructor() {
        this.selectedNode = null;
    }

    init(shadowRoot, documentRoot) {
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
                outline: 1px dotted rgba(255, 255, 255, 0.15) !important;
                outline-offset: -1px;
                min-height: 50px;
                min-width: 10px;
                background-color: rgba(255, 255, 255, 0.02);
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
                detail: { node: this.selectedNode }
            });
            window.dispatchEvent(event);
        });
    }
}