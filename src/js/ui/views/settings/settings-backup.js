export function createBackupTab(settings) {
    const tab = settings.createTabContent('settings.tab_backup');
    
    const desc = document.createElement('div');
    desc.setAttribute('data-i18n', 'settings.backup_desc');
    desc.style.fontSize = '0.85rem';
    desc.style.color = 'rgba(245, 245, 245, 0.7)';
    desc.style.marginBottom = '2rem';
    desc.style.lineHeight = '1.5';
    tab.appendChild(desc);

    const actionsContainer = document.createElement('div');
    actionsContainer.style.display = 'flex';
    actionsContainer.style.flexDirection = 'column';
    actionsContainer.style.gap = '1rem';
    actionsContainer.style.alignItems = 'flex-start';
    
    fetch('/api/settings?action=zip_check').then(r => r.json()).then(data => {
        if (data.status === 'success' && data.has_zip) {
            // Export Button
            const exportBtn = document.createElement('button');
            exportBtn.className = 'escms-btn';
            exportBtn.setAttribute('data-i18n', 'settings.btn_export');
            exportBtn.textContent = settings.i18n ? (settings.i18n.dictionary['settings.btn_export'] || 'Export Site') : 'Export Site';
            exportBtn.style.padding = '12px 24px';
            exportBtn.style.background = 'var(--accent-solid)';
            exportBtn.style.color = '#fff';
            exportBtn.style.border = 'none';
            exportBtn.style.borderRadius = '6px';
            exportBtn.style.fontWeight = '600';
            exportBtn.style.cursor = 'pointer';
            exportBtn.style.width = '200px';
            exportBtn.onclick = () => {
                window.location.href = '/api/settings?action=export';
            };
            
            // Import
            const importWrapper = document.createElement('div');
            importWrapper.style.position = 'relative';
            importWrapper.style.overflow = 'hidden';
            importWrapper.style.display = 'inline-block';
            importWrapper.style.width = '200px';
            
            const importBtn = document.createElement('button');
            importBtn.className = 'escms-btn';
            importBtn.setAttribute('data-i18n', 'settings.btn_import');
            importBtn.textContent = settings.i18n ? (settings.i18n.dictionary['settings.btn_import'] || 'Import Site') : 'Import Site';
            importBtn.style.padding = '12px 24px';
            importBtn.style.background = 'transparent';
            importBtn.style.color = 'var(--text-solid)';
            importBtn.style.border = '1px solid rgba(255,255,255,0.2)';
            importBtn.style.borderRadius = '6px';
            importBtn.style.fontWeight = '600';
            importBtn.style.cursor = 'pointer';
            importBtn.style.width = '100%';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.zip';
            fileInput.style.position = 'absolute';
            fileInput.style.left = '0';
            fileInput.style.top = '0';
            fileInput.style.width = '100%';
            fileInput.style.height = '100%';
            fileInput.style.opacity = '0';
            fileInput.style.cursor = 'pointer';
            
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const msg = settings.i18n ? (settings.i18n.dictionary['settings.import_warn'] || 'Are you sure?') : 'Are you sure?';
                if (!confirm(msg)) {
                    fileInput.value = '';
                    return;
                }
                
                importBtn.textContent = '...';
                importBtn.style.opacity = '0.5';
                fileInput.disabled = true;
                
                const formData = new FormData();
                formData.append('backup', file);
                
                try {
                    const res = await fetch('/api/settings?action=import', {
                        method: 'POST',
                        body: formData
                    });
                    const resData = await res.json();
                    if (resData.status === 'success') {
                        window.location.reload();
                    } else {
                        alert(resData.error || 'Import failed');
                    }
                } catch(err) {
                    alert(settings.i18n ? (settings.i18n.dictionary['settings.import_size_warn'] || 'Import failed (size limit?)') : 'Import failed');
                }
                
                importBtn.textContent = settings.i18n ? (settings.i18n.dictionary['settings.btn_import'] || 'Import Site') : 'Import Site';
                importBtn.style.opacity = '1';
                fileInput.disabled = false;
                fileInput.value = '';
            };
            
            importWrapper.appendChild(importBtn);
            importWrapper.appendChild(fileInput);
            
            actionsContainer.appendChild(exportBtn);
            actionsContainer.appendChild(importWrapper);
        } else {
            const warn = document.createElement('div');
            warn.setAttribute('data-i18n', 'settings.zip_missing');
            warn.textContent = settings.i18n ? (settings.i18n.dictionary['settings.zip_missing'] || 'Zip missing') : 'Zip missing';
            warn.style.color = '#ef4444';
            warn.style.background = 'rgba(239, 68, 68, 0.1)';
            warn.style.borderLeft = '3px solid #ef4444';
            warn.style.padding = '1rem';
            warn.style.borderRadius = '0 4px 4px 0';
            actionsContainer.appendChild(warn);
        }
    }).catch(err => {
        console.error('Failed to check ZipArchive support', err);
    });

    tab.appendChild(actionsContainer);
    return tab;
}
