import { EscmsParser } from './editor-parser.js';
import { el } from './escms-dom.js';

export class EscmsAutosave {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
        this.documentRoot = null;
        this.pageId = null;
        this.statusIndicator = null;
        this.localSaveTimeout = null;
        this.syncInterval = null;
        this.isSaving = false;
        this.needsSync = false;
        this.isReady = true;
    }

    pause() {
        this.isReady = false;
        clearTimeout(this.localSaveTimeout);
    }

    resume() {
        setTimeout(() => { this.isReady = true; }, 100);
    }

    init(documentRoot, initialPageId, statusIndicator) {
        this.documentRoot = documentRoot;
        this.pageId = initialPageId || null;
        this.statusIndicator = statusIndicator;

        const observer = new MutationObserver(() => {
            if (!this.isReady) return;
            clearTimeout(this.localSaveTimeout);
            this.localSaveTimeout = setTimeout(() => this.saveToLocal(), 500);
        });

        observer.observe(this.documentRoot, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });

        // Background server sync every 60 seconds
        this.syncInterval = setInterval(() => {
            const autoSaveEnabled = window.escmsEditor && window.escmsEditor.settings ? window.escmsEditor.settings.config.auto_save_server !== false : true;
            if (autoSaveEnabled && this.needsSync && !this.isSaving) {
                this.saveToServer();
            }
        }, 60000);

        // Ensure data is sent on tab close
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.needsSync) {
                this.saveToServer(true); // true = use keepalive
            }
        });
    }

    saveToLocal() {
        if (!this.documentRoot) return;
        
        try {
            const editorData = this.getCleanData();
            const key = this.componentId ? `escms_comp_${this.componentId}` : `escms_page_${this.pageId}`;
            
            const previousDataRaw = localStorage.getItem(key);
            if (previousDataRaw) {
                try {
                    const previousData = JSON.parse(previousDataRaw);
                    // Comparamos el AST (json) en lugar de todo el string, porque el HTML 
                    // en crudo puede cambiar por extensiones del navegador o atributos temporales
                    if (JSON.stringify(previousData.json) === JSON.stringify(editorData.json)) {
                        return; 
                    }
                } catch(e) {}
            }
            
            const currentJson = JSON.stringify(editorData);
            localStorage.setItem(key, currentJson);
            
            this.needsSync = true;
            this.updateStatus('Saved (Local)');
        } catch(e) {
            console.error('LocalStorage limit reached or error', e);
        }
    }

    getCleanData() {
        const clone = this.documentRoot.cloneNode(true);
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.escms-selected').forEach(el => el.classList.remove('escms-selected'));
        clone.querySelectorAll('[class=""]').forEach(el => el.removeAttribute('class'));
        
        clone.removeAttribute('id');
        clone.removeAttribute('style');

        return {
            json: EscmsParser.domToJson(clone),
            html: clone.innerHTML
        };
    }

    async saveToServer(useKeepAlive = false, isManual = false) {
        if (this.isSaving || !this.documentRoot) return;
        if (!this.needsSync) {
            if (isManual && window.escmsToast) {
                window.escmsToast(this.i18n ? (this.i18n.dictionary['topbar.saved'] || 'Saved') : 'Saved', 'success');
            }
            return;
        }
        
        this.isSaving = true;
        this.updateStatus('topbar.saving');

        try {
            const dataCache = this.getCleanData();
            
            // Auto-save inline modified components
            if (!this.componentId && window.escmsComponents) {
                const componentsInDom = this.documentRoot.querySelectorAll('escms-component');
                const componentSavePromises = [];
                for (const compNode of componentsInDom) {
                    const ref = compNode.getAttribute('ref');
                    if (!ref || !window.escmsComponents[ref]) continue;

                    const currentChildren = [];
                    const cloneComp = compNode.cloneNode(true);
                    cloneComp.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
                    cloneComp.querySelectorAll('.escms-selected').forEach(el => el.classList.remove('escms-selected'));
                    cloneComp.querySelectorAll('[class=""]').forEach(el => el.removeAttribute('class'));

                    cloneComp.childNodes.forEach(child => {
                        const cJson = EscmsParser.domToJson(child);
                        if (cJson) currentChildren.push(cJson);
                    });

                    const savedJsonStr = window.escmsComponents[ref].editor_data;
                    let originalJson = { tag: 'div', classes: ['escms-component'] };
                    try {
                        originalJson = JSON.parse(savedJsonStr);
                    } catch(e) {}

                    originalJson.children = currentChildren;
                    
                    if (cloneComp.hasAttribute('style')) {
                        originalJson.styles = cloneComp.getAttribute('style');
                    } else {
                        delete originalJson.styles;
                    }

                    const allowedAttrs = ['data-escms-anim', 'data-escms-layout', 'data-escms-mesh', 'data-columns', 'data-item-width', 'data-collection'];
                    originalJson.attributes = originalJson.attributes || {};
                    for (let attr of allowedAttrs) {
                        if (cloneComp.hasAttribute(attr)) {
                            originalJson.attributes[attr] = cloneComp.getAttribute(attr);
                        } else {
                            delete originalJson.attributes[attr];
                        }
                    }

                    const currentJsonStr = JSON.stringify(originalJson);

                    if (currentJsonStr !== savedJsonStr) {
                        const outTag = originalJson.tag || 'div';
                        const outClasses = originalJson.classes ? originalJson.classes.join(' ') : '';
                        const outStyles = originalJson.styles ? ` style="${originalJson.styles}"` : '';
                        let outAttrs = '';
                        if (originalJson.attributes) {
                            for (let k in originalJson.attributes) {
                                outAttrs += ` ${k}="${originalJson.attributes[k]}"`;
                            }
                        }
                        const publicHtml = `<${outTag}${outClasses ? ` class="${outClasses}"` : ''}${outStyles}${outAttrs}>${cloneComp.innerHTML}</${outTag}>`;

                        const payload = {
                            id: window.escmsComponents[ref].id,
                            name: window.escmsComponents[ref].name,
                            ref_id: ref,
                            editor_data: currentJsonStr,
                            public_html: publicHtml
                        };

                        componentSavePromises.push(
                            fetch('/api/components/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                                keepalive: useKeepAlive
                            }).then(res => res.json()).then(data => {
                                if (data.status === 'success') {
                                    window.escmsComponents[ref].editor_data = currentJsonStr;
                                    window.escmsComponents[ref].public_html = payload.public_html;
                                }
                            }).catch(err => console.error('[ESCMS] Error autosaving component inline', err))
                        );
                    }
                }
                if (componentSavePromises.length > 0) {
                    await Promise.all(componentSavePromises);
                }
            }

            // Si estamos guardando un componente en lugar de una página
            if (this.componentId) {
                const payload = {
                    id: this.componentId,
                    name: this.componentName || 'Component',
                    ref_id: this.componentRefId || 'comp',
                    editor_data: JSON.stringify(dataCache.json),
                    public_html: dataCache.html
                };

                const res = await fetch('/api/components/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: useKeepAlive
                });
                
                const data = await res.json();
                if (data.status === 'success') {
                    // Actualizar el cache en memoria para que otras páginas lo usen
                    if (window.escmsComponents && this.componentRefId) {
                        window.escmsComponents[this.componentRefId].editor_data = payload.editor_data;
                    }
                    this.needsSync = false;
                    this.updateStatus('topbar.saved');
                    if (isManual && window.escmsToast) {
                        window.escmsToast(this.i18n ? (this.i18n.dictionary['topbar.saved'] || 'Saved') : 'Saved', 'success');
                    }
                    setTimeout(() => {
                        const st = (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status === 'published') ? 'topbar.published' : 'topbar.draft';
                        this.updateStatus(st);
                    }, 3000);
                } else {
                    console.error('[ESCMS Autosave Component Error]', data.msg);
                    if (window.escmsToast) window.escmsToast(data.msg || 'Error saving component', 'error');
                    const st = (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status === 'published') ? 'topbar.published' : 'topbar.draft';
                    this.updateStatus(st);
                }
            } else {
                // Guardado normal de página
                const payload = {
                    id: this.pageId,
                    editor_data: JSON.stringify(dataCache.json),
                    public_html: dataCache.html, // Dejamos que PHP compile el HTML en el backend
                    status: (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status) ? window.escmsEditor.currentPageObj.status : 'draft'
                };

                const res = await fetch('/api/pages/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: useKeepAlive
                });

                const data = await res.json();

                if (data.status === 'success') {
                    if (!this.pageId && data.id) this.pageId = data.id;
                    this.needsSync = false;
                    this.updateStatus('topbar.saved');
                    if (isManual && window.escmsToast) {
                        window.escmsToast(this.i18n ? (this.i18n.dictionary['topbar.saved'] || 'Saved') : 'Saved', 'success');
                    }
                    setTimeout(() => {
                        const st = (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status === 'published') ? 'topbar.published' : 'topbar.draft';
                        this.updateStatus(st);
                    }, 3000);
                } else {
                    console.error('[ESCMS Autosave Error]', data.msg);
                    if (window.escmsToast) window.escmsToast(data.msg || 'Error saving page', 'error');
                    const st = (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status === 'published') ? 'topbar.published' : 'topbar.draft';
                    this.updateStatus(st);
                }
            }
        } catch (err) {
            console.error('[ESCMS Autosave Request Error]', err);
            if (window.escmsToast) window.escmsToast('Network error saving page', 'error');
            const st = (window.escmsEditor && window.escmsEditor.currentPageObj && window.escmsEditor.currentPageObj.status === 'published') ? 'topbar.published' : 'topbar.draft';
            this.updateStatus(st);
        } finally {
            this.isSaving = false;
        }
    }

    updateStatus(i18nKey, isError = false) {
        if (this.i18n) {
            const text = this.i18n.dictionary[i18nKey] || i18nKey;
            
            if (isError && window.escmsToast) {
                window.escmsToast(text, 'error');
            }
        }
    }
}