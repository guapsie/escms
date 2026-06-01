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
    }

    async init() {
        this.i18n = new I18nEngine();
        this.topbar = new EscmsTopBar(this.i18n);
        this.topbar.init();

        this.settings = new EscmsGlobalSettings(this.i18n);
        this.settings.init();

        this.inspector = new EscmsInspector(this.i18n);
        this.inspector.init();

        this.canvas = new EscmsCanvas();
        this.canvas.init();

        this.seoView = new EscmsSeoView();
        this.seoView.init(this.canvas.area);

        this.htmlView = new EscmsHtmlView();
        this.htmlView.init(this.canvas.area);

        this.host = document.getElementById('escms-canvas-host');
        if (!this.host) return;

        this.shadow = this.host.attachShadow({ mode: 'open' });
        
        const docRoot = document.createElement('div');
        docRoot.id = 'document-root';
        
        this.shadow.appendChild(docRoot);
        
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
                this.autosave.updateStatus('topbar.saved');
            }
            
            if (this.history) {
                this.history.clear();
                this.history.pushState();
            }
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