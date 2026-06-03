class EscmsAutosave {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
        this.documentRoot = null;
        this.pageId = null;
        this.statusIndicator = null;
        this.saveTimeout = null;
        this.isSaving = false;
    }

    init(documentRoot, initialPageId, statusIndicator) {
        this.documentRoot = documentRoot;
        this.pageId = initialPageId || null;
        this.statusIndicator = statusIndicator;

        const observer = new MutationObserver(() => {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveToServer(), 3000);
        });

        observer.observe(this.documentRoot, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });
    }

    async saveToServer() {
        if (this.isSaving || !this.documentRoot) return;
        
        this.isSaving = true;
        this.updateStatus('topbar.saving');

        try {
            const editorData = EscmsParser.domToJson(this.documentRoot);
            
            const clone = this.documentRoot.cloneNode(true);
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
            clone.querySelectorAll('.escms-selected').forEach(el => el.classList.remove('escms-selected'));
            clone.querySelectorAll('[class=""]').forEach(el => el.removeAttribute('class'));
            
            // Si estamos guardando un componente en lugar de una página
            if (this.componentId) {
                const payload = {
                    id: this.componentId,
                    name: this.componentName || 'Component',
                    ref_id: this.componentRefId || 'comp',
                    editor_data: JSON.stringify(editorData)
                };

                const res = await fetch('/api/components/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (data.status === 'success') {
                    // Actualizar el cache en memoria para que otras páginas lo usen
                    if (window.escmsComponents && this.componentRefId) {
                        window.escmsComponents[this.componentRefId].editor_data = payload.editor_data;
                    }
                    this.updateStatus('topbar.saved');
                    setTimeout(() => this.updateStatus('topbar.draft'), 3000);
                } else {
                    console.error('[ESCMS Autosave Component Error]', data.msg);
                    this.updateStatus('topbar.draft');
                }
            } else {
                // Guardado normal de página
                const publicHtml = clone.innerHTML;
                const payload = {
                    id: this.pageId,
                    editor_data: JSON.stringify(editorData),
                    public_html: publicHtml, // Dejamos que PHP compile el HTML en el backend
                    status: (window.escmsEditor && window.escmsEditor.currentPage && window.escmsEditor.currentPage.status) ? window.escmsEditor.currentPage.status : 'draft'
                };

                const res = await fetch('/api/pages/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (data.status === 'success') {
                    if (!this.pageId && data.id) this.pageId = data.id;
                    this.updateStatus('topbar.saved');
                    setTimeout(() => this.updateStatus('topbar.draft'), 3000);
                } else {
                    console.error('[ESCMS Autosave Error]', data.msg);
                    this.updateStatus('topbar.draft');
                }
            }
        } catch (err) {
            console.error('[ESCMS Autosave Request Error]', err);
            this.updateStatus('topbar.draft');
        } finally {
            this.isSaving = false;
        }
    }

    updateStatus(i18nKey) {
        if (this.statusIndicator) {
            this.statusIndicator.setAttribute('data-i18n', i18nKey);
            if (this.i18n) {
                this.statusIndicator.textContent = this.i18n.dictionary[i18nKey] || i18nKey;
            }
        }
    }
}