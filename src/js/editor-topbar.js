import { EscmsMediaLibrary } from './editor-medialibrary.js';
import { icons } from './editor-icons.js';

export class EscmsTopBar {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
        this.isPublished = false;
    }

    init() {
        this.container = document.getElementById('escms-topbar');
        if (!this.container) return;

        this.render();
        this.attachEvents();
        this.checkUpdate();
    }

    checkUpdate() {
        fetch('/api/settings?action=check_update', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.has_update) {
                    const center = this.container.querySelector('#escms-topbar-center');
                    if (center) {
                        center.innerHTML = `
                            <button id="btn-test-update" class="pill-btn" style="background: var(--accent-solid); border-color: var(--accent-solid); color: white; display: flex; gap: 6px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                                Update available
                            </button>
                        `;
                        const btnUpdate = center.querySelector('#btn-test-update');
                        btnUpdate.addEventListener('click', () => {
                            btnUpdate.innerHTML = '<span style="animation: pulse 1s infinite;">Updating...</span>';
                            fetch('/api/settings?action=update_core', { method: 'POST' })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.status === 'success') {
                                        window.location.reload();
                                    } else {
                                        alert('Update failed: ' + (data.error || data.msg));
                                        btnUpdate.innerHTML = 'Update Error';
                                    }
                                })
                                .catch(err => {
                                    alert('Network error');
                                    btnUpdate.innerHTML = 'Update Error';
                                });
                        });
                    }
                }
            })
            .catch(err => console.error('Failed to check for updates', err));
    }

    render() {
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'space-between';
        this.container.style.alignItems = 'center';
        this.container.style.padding = '0 1.5rem';
        this.container.style.height = '100%';

        this.container.style.position = 'relative';

        this.container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="font-weight: 600; letter-spacing: 1px;">ESCMS</div>
                <button id="btn-toggle-publish" class="pill-btn">
                    <span class="icon-slot">${icons.pencil}</span>
                    <span data-i18n="topbar.draft"></span>
                </button>
            </div>
            
            <div id="escms-topbar-center" style="position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; height: 100%;">
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="icon-btn" id="btn-media" data-i18n-title="topbar.media">
                    ${icons.libraryPhoto}
                </button>
                <button class="icon-btn" id="btn-settings" data-i18n-title="topbar.settings">
                    ${icons.gearFine}
                </button>
                <button class="icon-btn" id="btn-fullscreen" data-i18n-title="topbar.fullscreen">
                    ${icons.arrowsOut}
                </button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .pill-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: #1f1f1f;
                color: var(--text-solid);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 999px;
                padding: 0.35rem 1rem 0.35rem 0.75rem;
                font-size: 0.85rem;
                font-family: inherit;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .pill-btn:hover { background: rgba(255, 255, 255, 0.05); }
            .pill-btn .icon-slot svg { width: 16px; height: 16px; }
            .pill-btn.published {
                color: #3b82f6;
                border-color: rgba(59, 130, 246, 0.3);
                background: rgba(59, 130, 246, 0.1);
            }
            .icon-btn {
                display: flex; align-items: center; justify-content: center;
                background: transparent; color: var(--text-solid); border: 1px solid transparent;
                border-radius: 6px; width: 32px; height: 32px; cursor: pointer; transition: all 0.2s ease;
            }
            .icon-btn:hover { background: #1f1f1f; border-color: rgba(255, 255, 255, 0.05); }
            .icon-btn svg { width: 18px; height: 18px; }
        `;
        this.container.appendChild(style);
    }

    attachEvents() {
        const btnToggle = this.container.querySelector('#btn-toggle-publish');
        const iconSlot = btnToggle.querySelector('.icon-slot');
        const textSlot = btnToggle.querySelector('[data-i18n]');

        btnToggle.addEventListener('click', () => {
            if (!window.escmsEditor || !window.escmsEditor.currentPageObj) return;
            this.isPublished = !this.isPublished;
            const newStatus = this.isPublished ? 'published' : 'draft';
            window.escmsEditor.currentPageObj.status = newStatus;
            
            this.setStatus(newStatus);
            
            if (window.escmsEditor.autosave) {
                window.escmsEditor.autosave.saveToServer();
            }
        });

        const btnMedia = this.container.querySelector('#btn-media');
        if (btnMedia) {
            btnMedia.addEventListener('click', () => {
                if (window.escmsEditor && window.escmsEditor.settings && window.escmsEditor.settings.overlay.style.display === 'block') {
                    window.escmsEditor.settings.overlay.style.display = 'none';
                }
                if (!window.escmsMediaLibrary) {
                    window.escmsMediaLibrary = new EscmsMediaLibrary(this.i18n);
                }
                window.escmsMediaLibrary.open();
            });
        }
        
        
        // ... (resto intacto)

        const btnFullscreen = this.container.querySelector('#btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {});
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            });
            document.addEventListener('fullscreenchange', () => {
                btnFullscreen.innerHTML = document.fullscreenElement ? icons.arrowsIn : icons.arrowsOut;
            });
        }
    }

    setStatus(status) {
        this.isPublished = (status === 'published');
        const btnToggle = this.container.querySelector('#btn-toggle-publish');
        if (!btnToggle) return;
        const iconSlot = btnToggle.querySelector('.icon-slot');
        const textSlot = btnToggle.querySelector('[data-i18n]');
        
        btnToggle.classList.toggle('published', this.isPublished);
        iconSlot.innerHTML = this.isPublished ? icons.globe : icons.pencil;
        textSlot.setAttribute('data-i18n', this.isPublished ? 'topbar.published' : 'topbar.draft');
        
        if (this.i18n) {
            this.i18n.translateDOM(btnToggle);
        }
    }



}