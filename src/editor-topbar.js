class EscmsTopBar {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
        this.isPublished = false;
    }

    init() {
        this.container = document.getElementById('escms-topbar');
        if (!this.container) return;

        this.render();
        this.attachEvents();
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
            
            <div id="escms-topbar-center" style="position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; height: 100%;"></div>
            
            <div style="display: flex; gap: 0.5rem;">
                <button class="icon-btn" id="btn-network" data-i18n-title="topbar.network_btn">
                    ${icons.shareNetwork}
                </button>
                <button class="icon-btn" id="btn-fullscreen" data-i18n-title="topbar.fullscreen">
                    ${icons.cornersOut}
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
            this.isPublished = !this.isPublished;
            
            btnToggle.classList.toggle('published', this.isPublished);
            iconSlot.innerHTML = this.isPublished ? icons.globe : icons.pencil;
            textSlot.setAttribute('data-i18n', this.isPublished ? 'topbar.published' : 'topbar.draft');
            
            if (this.i18n) {
                this.i18n.translateDOM(btnToggle);
            }
        });

        const btnNetwork = this.container.querySelector('#btn-network');
        if (btnNetwork) {
            btnNetwork.addEventListener('click', () => this.showNetworkModal());
        }

        const btnFullscreen = this.container.querySelector('#btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error('[ESCMS Fullscreen Error]', err);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            });

            document.addEventListener('fullscreenchange', () => {
                btnFullscreen.innerHTML = document.fullscreenElement ? icons.cornersIn : icons.cornersOut;
            });
        }
    }

    showNetworkModal() {
        let modal = document.getElementById('escms-network-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'escms-network-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.background = 'rgba(0, 0, 0, 0.7)';
            modal.style.backdropFilter = 'blur(8px)';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';

            const card = document.createElement('div');
            card.style.background = '#0a0a0a';
            card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            card.style.borderRadius = '8px';
            card.style.padding = '2rem';
            card.style.maxWidth = '450px';
            card.style.width = '100%';
            card.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.15)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '1.5rem';
            card.style.boxSizing = 'border-box';
            card.addEventListener('click', (e) => e.stopPropagation());

            card.innerHTML = `
                <h2 data-i18n="network.modal_title" style="margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-solid);"></h2>
                <p data-i18n="network.modal_desc" style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: rgba(245, 245, 245, 0.7);"></p>
                <div style="padding: 1rem; background: rgba(245, 158, 11, 0.05); border-left: 3px solid rgba(245, 158, 11, 0.5); border-radius: 0 4px 4px 0;">
                    <span data-i18n="network.modal_warning" style="font-size: 0.85rem; color: rgba(245, 158, 11, 0.8); line-height: 1.4;"></span>
                </div>
            `;

            const isEnabled = localStorage.getItem('escms_p2p_enabled') === 'true';
            const toggle = new EscmsToggle('network.toggle_label', isEnabled, (val) => {
                localStorage.setItem('escms_p2p_enabled', val);
            });
            toggle.element.style.marginTop = '0.5rem';

            card.appendChild(toggle.element);
            modal.appendChild(card);
            modal.addEventListener('click', () => modal.remove());
            document.body.appendChild(modal);

            if (this.i18n) {
                this.i18n.translateDOM(modal);
            }
        }
    }
}