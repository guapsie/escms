import { icons } from '../../../core/editor-icons.js';

export function createAddonsTab(settings) {
    const tab = settings.createTabContent('settings.tab_addons');
    tab.classList.add('escms-view-content');
    
    const desc = document.createElement('p');
    desc.setAttribute('data-i18n', 'settings.addons_desc');
    desc.textContent = settings.i18n ? (settings.i18n.dictionary['settings.addons_desc'] || 'Expand the capabilities of ESCMS with community addons.') : 'Expand the capabilities of ESCMS with community addons.';
    desc.style.fontSize = '0.85rem';
    desc.style.color = 'rgba(245, 245, 245, 0.7)';
    desc.style.marginBottom = '2rem';
    desc.style.lineHeight = '1.5';
    tab.appendChild(desc);
    
    const grid = document.createElement('div');
    grid.className = 'escms-grid';
    tab.appendChild(grid);

    const loadAddons = async () => {
        const loadingText = settings.i18n ? (settings.i18n.dictionary['settings.addons_loading'] || 'Loading addons...') : 'Loading addons...';
        grid.innerHTML = `<div style="color: rgba(245,245,245,0.4); grid-column: 1/-1;">${loadingText}</div>`;
        try {
            const res = await fetch('/api/settings?route=api/addons&action=list');
            const data = await res.json();
            if (data.status === 'success' && data.data) {
                grid.innerHTML = '';
                if (data.data.length === 0) {
                    const emptyText = settings.i18n ? (settings.i18n.dictionary['settings.addons_empty'] || 'No addons found.') : 'No addons found.';
                    grid.innerHTML = `<div style="color: rgba(245,245,245,0.4); grid-column: 1/-1;">${emptyText}</div>`;
                    return;
                }
                data.data.forEach(addon => {
                    const card = document.createElement('div');
                    card.className = 'escms-card';
                    
                    const header = document.createElement('div');
                    header.className = 'escms-card-header';
                    
                    const title = document.createElement('h4');
                    title.textContent = addon.name;
                    
                    const badge = document.createElement('span');
                    badge.style.fontSize = '0.7rem';
                    badge.style.padding = '2px 6px';
                    badge.style.borderRadius = '12px';
                    badge.style.background = addon.installed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                    badge.style.color = addon.installed ? '#22c55e' : 'rgba(255,255,255,0.6)';
                    badge.textContent = addon.installed ? 'v' + addon.installed_version : 'v' + addon.version;
                    
                    header.appendChild(title);
                    header.appendChild(badge);
                    card.appendChild(header);
                    
                    const description = document.createElement('div');
                    description.className = 'escms-card-body';
                    description.textContent = addon.description;
                    card.appendChild(description);
                    
                    const actions = document.createElement('div');
                    actions.className = 'escms-card-footer';
                    actions.style.justifyContent = 'flex-end';
                    
                    const createBtn = (icon, titleKey, variantClass, onClick) => {
                        const btn = document.createElement('button');
                        btn.className = 'escms-btn ' + variantClass;
                        btn.innerHTML = icon;
                        btn.title = settings.i18n ? (settings.i18n.dictionary[titleKey] || titleKey) : titleKey;
                        btn.style.width = '32px';
                        btn.style.height = '32px';
                        btn.style.padding = '0';
                        btn.onclick = onClick;
                        const svg = btn.querySelector('svg');
                        if (svg) { svg.style.width = '18px'; svg.style.height = '18px'; }
                        return btn;
                    };
                    
                    if (!addon.installed) {
                        actions.appendChild(createBtn(icons.download || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>', 'settings.addons_btn_install', 'escms-btn--primary', async () => {
                            await fetch('/api/settings?route=api/addons&action=install', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({id: addon.id})
                            });
                            
                            // Inject scripts immediately without refresh
                            if (!document.querySelector(`script[src*="/data/addons/${addon.id}"]`)) {
                                const script = document.createElement('script');
                                script.type = 'module';
                                script.src = `/data/addons/${addon.id}/${addon.id}.js?v=` + Date.now();
                                script.onload = () => window.dispatchEvent(new CustomEvent('escms:addons:refresh'));
                                document.head.appendChild(script);
                            } else {
                                window.dispatchEvent(new CustomEvent('escms:addons:refresh'));
                            }
                            if (!document.querySelector(`link[href*="/data/addons/${addon.id}"]`)) {
                                const link = document.createElement('link');
                                link.rel = 'stylesheet';
                                link.href = `/data/addons/${addon.id}/${addon.id}.css?v=` + Date.now();
                                document.head.appendChild(link);
                            }
                            
                            loadAddons();
                        }));
                    } else {
                        if (addon.has_update) {
                            actions.appendChild(createBtn(icons.refresh || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>', 'settings.addons_btn_update', 'escms-btn--primary', async () => {
                                await fetch('/api/settings?route=api/addons&action=install', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({id: addon.id})
                                });
                                loadAddons();
                            }));
                        }
                        actions.appendChild(createBtn(icons.trash || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>', 'settings.addons_btn_delete', 'escms-btn--danger', async () => {
                            await fetch('/api/settings?route=api/addons&action=uninstall', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({id: addon.id})
                            });
                            window.dispatchEvent(new CustomEvent('escms:addon:uninstall', {detail: {id: addon.id}}));
                            loadAddons();
                        }));
                    }
                    
                    card.appendChild(actions);
                    grid.appendChild(card);
                });
            }
        } catch(e) { console.error('Addons list failed', e); }
    };
    
    loadAddons();
    
    return tab;
}
