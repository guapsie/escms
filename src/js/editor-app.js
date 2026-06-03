class EscmsEditor {
    constructor() {
        this.host = null;
        this.shadow = null;
        this.i18n = null;
        this.topbar = null;
        this.inspector = null;
        this.leftpanel = null;
        this.canvas = null;
        this.selection = null;
        this.settings = null;
        this.autosave = null;
        this.history = null;
        this.seoView = null;
        this.htmlView = null;
        this.cssView = null;
    }

    async init() {
        this.i18n = new I18nEngine();
        this.topbar = new EscmsTopBar(this.i18n);
        this.topbar.init();

        this.canvas = new EscmsCanvas();
        this.canvas.init();

        this.host = document.getElementById('escms-canvas-host');
        if (!this.host) return;

        this.shadow = this.host.attachShadow({ mode: 'open' });
        
        const docRoot = document.createElement('div');
        docRoot.id = 'document-root';
        this.shadow.appendChild(docRoot);

        this.settings = new EscmsGlobalSettings(this.i18n);
        this.settings.init();

        this.inspector = new EscmsInspector(this.i18n);
        this.inspector.init();

        this.seoView = new EscmsSeoView();
        this.seoView.init(this.canvas.area);

        this.htmlView = new EscmsHtmlView();
        this.htmlView.init(this.canvas.area);

        this.cssView = new EscmsCssView();
        this.cssView.init(this.canvas.area);

        // Fetch global components
        window.escmsComponents = {};
        try {
            const compRes = await fetch('/api/components/list');
            const compData = await compRes.json();
            if (compData.status === 'success' && compData.components) {
                compData.components.forEach(c => {
                    window.escmsComponents[c.ref_id] = c;
                });
            }
        } catch (err) {
            console.error('[ESCMS] Error loading components', err);
        }
        
        const emptyText = this.i18n.dictionary['editor.drop_atoms'] || 'Drop atoms here';

        this.selection = new EscmsSelection();
        this.selection.init(this.shadow, docRoot, emptyText);

        this.floatingToolbar = new EscmsFloatingToolbar(this.i18n);
        this.floatingToolbar.init(this.shadow, docRoot);

        this.leftpanel = new EscmsLeftPanel(this.i18n);
        this.leftpanel.init(this.shadow);

        const statusIndicator = document.querySelector('#btn-toggle-publish span[data-i18n]');
        this.autosave = new EscmsAutosave(this.i18n);
        this.autosave.init(docRoot, null, statusIndicator);

        this.history = new EscmsHistory();
        this.history.init(docRoot);

        this.setupShortcuts();
        
        window.addEventListener('escms-page-selected', (e) => {
            const page = e.detail.page;
            this.currentPageObj = page;
            
            const existingBanner = document.getElementById('escms-component-banner');
            if (existingBanner) existingBanner.remove();

            docRoot.innerHTML = '';
            
            if (page.editor_data) {
                try {
                    const parsedRoot = EscmsParser.jsonToDom(JSON.parse(page.editor_data));
                    if (parsedRoot) {
                        while(parsedRoot.firstChild) {
                            docRoot.appendChild(parsedRoot.firstChild);
                        }
                    }
                } catch (err) {
                    console.error('[ESCMS] Error parsing page data', err);
                }
            }
            
            if (this.autosave) {
                this.autosave.pageId = page.id;
                this.autosave.componentId = null;
                this.autosave.updateStatus('topbar.saved');
            }
            
            if (this.seoView) {
                this.seoView.setData({
                    slug: page.slug || '',
                    title: page.seo_title || page.title || '',
                    description: page.seo_desc || '',
                    keywords: page.seo_keywords || '',
                    language: page.seo_language || 'en'
                });
            }
            
            if (this.history) {
                this.history.clear();
                this.history.pushState();
            }
        });

        window.addEventListener('escms-component-edit', (e) => {
            const comp = e.detail.component;

            const wrapper = document.getElementById('escms-canvas-wrapper');
            let banner = document.getElementById('escms-component-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'escms-component-banner';
                banner.style.position = 'absolute';
                banner.style.top = '20px';
                banner.style.left = '50%';
                banner.style.transform = 'translateX(-50%)';
                banner.style.zIndex = '100';
                banner.style.display = 'flex';
                banner.style.alignItems = 'center';
                banner.style.gap = '15px';
                banner.style.background = 'rgba(10, 10, 10, 0.7)';
                banner.style.backdropFilter = 'blur(10px)';
                banner.style.border = '1px solid var(--accent-solid)';
                banner.style.borderRadius = '30px';
                banner.style.padding = '8px 20px';
                banner.style.boxShadow = '0 0 15px var(--accent-faint)';
                wrapper.appendChild(banner);
            }
            
            const editingText = this.i18n.dictionary['editor.editing_component'] || 'Editing Component:';
            const backText = this.i18n.dictionary['editor.back_to_page'] || 'Back to Page';
            
            banner.innerHTML = `
                <div style="color: var(--accent-solid); display: flex; align-items: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span style="font-size: 0.85rem; font-weight: 500;">${editingText} <strong style="color: white;">${comp.name}</strong></span>
                </div>
            `;
            
            if (this.currentPageObj) {
                const backBtn = document.createElement('button');
                backBtn.textContent = backText;
                backBtn.style.background = '#1f1f1f';
                backBtn.style.border = '1px solid rgba(255,255,255,0.1)';
                backBtn.style.color = 'var(--text-solid)';
                backBtn.style.borderRadius = '20px';
                backBtn.style.padding = '4px 12px';
                backBtn.style.fontSize = '0.75rem';
                backBtn.style.cursor = 'pointer';
                backBtn.style.transition = 'all 0.2s';
                backBtn.addEventListener('mouseenter', () => backBtn.style.background = 'rgba(255,255,255,0.1)');
                backBtn.addEventListener('mouseleave', () => backBtn.style.background = '#1f1f1f');
                backBtn.addEventListener('click', () => {
                    window.dispatchEvent(new CustomEvent('escms-page-selected', { detail: { page: this.currentPageObj } }));
                });
                banner.appendChild(backBtn);
            }

            docRoot.innerHTML = '';
            
            if (comp.editor_data) {
                try {
                    const parsedRoot = EscmsParser.jsonToDom(JSON.parse(comp.editor_data));
                    if (parsedRoot) {
                        while(parsedRoot.firstChild) {
                            docRoot.appendChild(parsedRoot.firstChild);
                        }
                    }
                } catch (err) {
                    console.error('[ESCMS] Error parsing component data', err);
                }
            }
            
            if (this.autosave) {
                this.autosave.pageId = null;
                this.autosave.componentId = comp.id;
                this.autosave.componentName = comp.name;
                this.autosave.componentRefId = comp.ref_id;
                this.autosave.updateStatus('topbar.saved');
            }
            
            if (this.history) {
                this.history.clear();
                this.history.pushState();
            }
        });

        let seoTimeout = null;
        window.addEventListener('escms-seo-changed', (e) => {
            if (!this.currentPageObj) return;
            const data = e.detail;
            
            clearTimeout(seoTimeout);
            seoTimeout = setTimeout(async () => {
                try {
                    await fetch('/api/pages/save_seo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: this.currentPageObj.id,
                            slug: data.slug,
                            seo_title: data.title,
                            seo_desc: data.description,
                            seo_keywords: data.keywords,
                            seo_language: data.language
                        })
                    });
                    
                    // Update slug in local object
                    if (data.slug) {
                        this.currentPageObj.slug = data.slug.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-');
                    }
                    if (this.autosave) {
                        this.autosave.updateStatus('topbar.saved');
                        setTimeout(() => this.autosave.updateStatus('topbar.draft'), 3000);
                    }
                } catch (err) {
                    console.error('[ESCMS] Error saving SEO', err);
                }
            }, 500);
        });

        await this.loadLocale();
    }

    async loadLocale() {
        this.i18n.translateDOM();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (this.autosave) this.autosave.saveToServer();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (this.history) this.history.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (this.history) this.history.redo();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new EscmsEditor();
    window.escmsEditor = app;
    app.init();
});