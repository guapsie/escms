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
        this.contextMenu = null;
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

        this.contextMenu = new EscmsContextMenu(this.i18n);
        this.contextMenu.init();

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

        this.columnResizer = new EscmsColumnResizer(this.shadow);

        this.setupShortcuts();
        
        window.addEventListener('escms-page-selected', (e) => {
            const page = e.detail.page;
            this.currentPageObj = page;
            
            // Premium Canvas Transition
            docRoot.style.transition = 'none';
            docRoot.style.opacity = '0';
            docRoot.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
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
                
                void docRoot.offsetWidth; // Force reflow
                docRoot.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                docRoot.style.opacity = '1';
                docRoot.style.transform = 'scale(1)';
            
            if (this.autosave) {
                this.autosave.pageId = page.id;
                this.autosave.componentId = null;
                this.autosave.updateStatus('topbar.saved');
            }
            
            if (this.topbar) {
                this.topbar.setStatus(page.status || 'draft');
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
            }, 50);
        });

        window.addEventListener('escms-component-edit', async (e) => {
            const comp = e.detail.component;

            if (this.autosave && this.autosave.pageId && !this.autosave.componentId) {
                await this.autosave.saveToServer();
            }

            const wrapper = document.getElementById('escms-canvas-wrapper');
            let banner = document.getElementById('escms-component-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'escms-component-banner';
                banner.style.position = 'absolute';
                banner.style.bottom = '100px';
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
                backBtn.addEventListener('click', async () => {
                    if (this.autosave) {
                        await this.autosave.saveToServer();
                    }
                    if (this.leftpanel && this.leftpanel.pageManager) {
                        this.leftpanel.pageManager.loadPage(this.currentPageObj.id);
                    } else {
                        window.dispatchEvent(new CustomEvent('escms-page-selected', { detail: { page: this.currentPageObj } }));
                    }
                });
                banner.appendChild(backBtn);
            }

            // Premium Canvas Transition
            docRoot.style.transition = 'none';
            docRoot.style.opacity = '0';
            docRoot.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
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
                
                void docRoot.offsetWidth; // Force reflow
                docRoot.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                docRoot.style.opacity = '1';
                docRoot.style.transform = 'scale(1)';
            
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
            }, 50);
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

// Global Toast System (Premium UX)
window.escmsToast = function(msg, type = 'info') {
    let container = document.getElementById('escms-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'escms-toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.zIndex = '99999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.style.background = 'rgba(10, 10, 10, 0.85)';
    toast.style.backdropFilter = 'blur(12px)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.85rem';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    
    let glowColor = 'var(--accent-solid)';
    if (type === 'error') glowColor = '#ef4444';
    
    toast.style.border = `1px solid ${glowColor}`;
    toast.style.boxShadow = `0 4px 20px ${type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`;

    let iconSvg = '';
    if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${glowColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${glowColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }

    toast.innerHTML = `${iconSvg} <span style="font-weight: 500;">${msg}</span>`;
    container.appendChild(toast);
    
    // Play sound
    try {
        const wantsSound = !(window.escmsEditor && window.escmsEditor.settings && window.escmsEditor.settings.config.ide_play_sounds === false);
        
        // Only attempt to play sound if the user has interacted with the page.
        // This prevents the "AudioContext was not allowed to start" warning.
        const canPlayAudio = wantsSound && (!navigator.userActivation || navigator.userActivation.hasBeenActive);
        
        if (canPlayAudio) {
            if (!window.escmsAudioCtx) {
                window.escmsAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = window.escmsAudioCtx;
            
            // If it's suspended, we try to resume it. This might fail/warn if not in a gesture, 
            // but checking state avoids throwing fatal errors.
            if (audioCtx.state === 'running' || audioCtx.state === 'suspended') {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(()=>{});
                }
                
                if (audioCtx.state === 'running') {
                    const osc = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    osc.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                
                if (type === 'error') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.2);
                } else {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.5);
                }
            }
        }
        }
    } catch (e) {}

    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    if (type === 'error') {
        toast.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300, easing: 'ease-in-out' });
    }

    setTimeout(() => {
        toast.style.transform = 'translateY(10px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};