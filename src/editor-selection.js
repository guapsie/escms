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
            .escms-selected {
                outline: 2px solid var(--accent-faint) !important;
                outline-offset: -2px;
            }
        `;
        shadowRoot.appendChild(style);

        documentRoot.addEventListener('click', (e) => {
            e.stopPropagation();

            if (this.selectedNode) {
                this.selectedNode.classList.remove('escms-selected');
            }

            this.selectedNode = e.target;
            this.selectedNode.classList.add('escms-selected');

            const event = new CustomEvent('escms-element-selected', {
                detail: { node: this.selectedNode }
            });
            window.dispatchEvent(event);
        });
    }
}