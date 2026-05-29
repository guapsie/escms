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

        this.host = document.getElementById('escms-canvas-host');
        if (!this.host) return;

        this.shadow = this.host.attachShadow({ mode: 'open' });
        
        const docRoot = document.createElement('div');
        docRoot.id = 'document-root';
        docRoot.contentEditable = 'true';
        
        docRoot.innerHTML = '';
        
        this.shadow.appendChild(docRoot);

        this.selection = new EscmsSelection();
        this.selection.init(this.shadow, docRoot);

        this.leftpanel = new EscmsLeftPanel(this.i18n);
        this.leftpanel.init(this.shadow);

        this.setupShortcuts();
        await this.loadLocale();
    }

    async loadLocale() {
        this.i18n.translateDOM();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                console.log('[ESCMS] Guardado simulado (Ctrl+S)');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new EscmsEditor();
    app.init();
});