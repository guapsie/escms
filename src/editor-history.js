class EscmsHistory {
    constructor() {
        this.stack = [];
        this.currentIndex = -1;
        this.maxSteps = 50;
        this.documentRoot = null;
        this.observer = null;
        this.saveTimeout = null;
        this.isRestoring = false;
    }

    init(documentRoot) {
        this.documentRoot = documentRoot;
        
        // Initial state
        this.clear();
        this.pushState();

        this.observer = new MutationObserver(() => {
            if (this.isRestoring) return;
            
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.pushState();
            }, 1500); // 1.5s debounce
        });

        this.observer.observe(this.documentRoot, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });
    }

    clear() {
        this.stack = [];
        this.currentIndex = -1;
    }

    pushState() {
        if (!this.documentRoot) return;

        // Limpiar clases temporales de seleccion antes de guardar la snapshot
        const clone = this.documentRoot.cloneNode(true);
        clone.querySelectorAll('.escms-selected').forEach(el => el.classList.remove('escms-selected'));
        
        const editorData = EscmsParser.domToJson(clone);
        const snapshot = JSON.stringify(editorData);

        // Si es identico al estado actual, no hacemos nada
        if (this.currentIndex >= 0 && this.stack[this.currentIndex] === snapshot) {
            return;
        }

        // Si hemos hecho undo y estamos en un indice medio, cortamos el futuro
        if (this.currentIndex < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.currentIndex + 1);
        }

        this.stack.push(snapshot);
        
        if (this.stack.length > this.maxSteps) {
            this.stack.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.restoreState(this.stack[this.currentIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.currentIndex < this.stack.length - 1) {
            this.currentIndex++;
            this.restoreState(this.stack[this.currentIndex]);
            return true;
        }
        return false;
    }

    restoreState(snapshot) {
        if (!this.documentRoot || !snapshot) return;
        
        this.isRestoring = true;
        
        try {
            const data = JSON.parse(snapshot);
            const parsedRoot = EscmsParser.jsonToDom(data);
            
            this.documentRoot.innerHTML = '';
            if (parsedRoot) {
                while(parsedRoot.firstChild) {
                    this.documentRoot.appendChild(parsedRoot.firstChild);
                }
            }
            
            // Re-vincular seleccion si habia algo seleccionado
            if (window.escmsEditor && window.escmsEditor.selection) {
                window.escmsEditor.selection.clearSelection();
            }
            
            if (window.escmsEditor && window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer(); // Trigger full save
            }
        } catch (err) {
            console.error('[ESCMS History] Error restoring state', err);
        } finally {
            // Un pequeño delay para asegurar que los mutadores ignoran la inyeccion masiva
            setTimeout(() => {
                this.isRestoring = false;
            }, 100);
        }
    }
}
