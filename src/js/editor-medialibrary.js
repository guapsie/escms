class EscmsMediaLibrary {
    constructor(i18n) {
        this.i18n = i18n;
        this.media = [];
        this.filteredMedia = [];
        this.selectedForDeletion = new Set();
        this.isDeleteMode = false;
        
        this.pageSize = 40;
        this.currentPage = 0;
        
        this.modal = null;
        this.grid = null;
        this.resolvePromise = null;
        
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.renderNextPage();
            }
        }, { rootMargin: '100px' });
        
        this.sentinel = document.createElement('div');
        this.sentinel.style.height = '20px';
    }

    async open() {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.buildUI();
            this.loadMedia();
        });
    }

    close(result = null) {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }

    buildUI() {
        this.modal = document.createElement('div');
        this.modal.className = 'escms-media-library';
        this.modal.style.position = 'fixed';
        this.modal.style.inset = '50px 0 0 0';
        this.modal.style.backgroundColor = 'var(--bg-base, #0a0a0a)';
        this.modal.style.zIndex = '99999';
        this.modal.style.display = 'flex';
        this.modal.style.flexDirection = 'column';
        this.modal.style.padding = '2rem';
        this.modal.style.boxSizing = 'border-box';
        
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';
        
        const leftControls = document.createElement('div');
        leftControls.style.display = 'flex';
        leftControls.style.alignItems = 'center';
        leftControls.style.width = '250px';
        
        const title = document.createElement('h2');
        title.innerHTML = '<span style="color:var(--text-solid, #fff); opacity:1;">ES</span><span style="color:var(--text-solid, #fff); opacity:0.5;">Media Manager</span>';
        title.style.margin = '0';
        title.style.fontWeight = '500';
        title.style.fontSize = '0.85rem';
        title.style.letterSpacing = '1px';
        
        leftControls.appendChild(title);

        const middleControls = document.createElement('div');
        middleControls.style.position = 'relative';
        middleControls.style.display = 'flex';
        middleControls.style.alignItems = 'center';
        middleControls.style.background = 'rgba(255, 255, 255, 0.03)';
        middleControls.style.borderRadius = '20px';
        middleControls.style.padding = '4px';
        middleControls.style.gap = '4px';
        
        this.hiddenFileInput = document.createElement('input');
        this.hiddenFileInput.type = 'file';
        this.hiddenFileInput.multiple = true;
        this.hiddenFileInput.style.display = 'none';
        this.hiddenFileInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                await this.uploadFiles(e.target.files);
                this.hiddenFileInput.value = '';
            }
        });

        const stylePillBtn = (btn) => {
            btn.style.padding = '0';
            btn.style.width = '32px';
            btn.style.height = '32px';
            btn.style.borderRadius = '16px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.color = 'rgba(255,255,255,0.6)';
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.transition = 'all 0.2s';
            btn.addEventListener('mouseenter', () => {
                if (!btn.classList.contains('active-pill')) {
                    btn.style.background = 'rgba(255,255,255,0.08)';
                    btn.style.color = 'var(--accent-solid, #3b82f6)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (!btn.classList.contains('active-pill')) {
                    btn.style.background = 'transparent';
                    btn.style.color = 'rgba(255,255,255,0.6)';
                }
            });
        };

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = window.icons && window.icons.upload ? window.icons.upload : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        const svgUpload = this.uploadBtn.querySelector('svg');
        if (svgUpload) { svgUpload.style.width = '16px'; svgUpload.style.height = '16px'; }
        this.uploadBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.upload'] || 'Upload Files') : 'Upload Files';
        stylePillBtn(this.uploadBtn);
        this.uploadBtn.addEventListener('click', () => this.hiddenFileInput.click());

        this.deleteToggleBtn = document.createElement('button');
        this.deleteToggleBtn.innerHTML = window.icons && window.icons.trash ? window.icons.trash : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>';
        // Ajustar el SVG en caso de usar window.icons.trash
        const svgTrash = this.deleteToggleBtn.querySelector('svg');
        if (svgTrash) { svgTrash.style.width = '14px'; svgTrash.style.height = '14px'; }
        this.deleteToggleBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.select_delete'] || 'Select to Delete') : 'Select to Delete';
        stylePillBtn(this.deleteToggleBtn);
        this.deleteToggleBtn.addEventListener('click', () => this.toggleDeleteMode());

        this.executeDeleteBtn = document.createElement('button');
        this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Delete (0)</span>';
        this.executeDeleteBtn.title = 'Confirm Deletion';
        this.executeDeleteBtn.style.padding = '0 1rem';
        this.executeDeleteBtn.style.height = '32px';
        this.executeDeleteBtn.style.borderRadius = '16px';
        this.executeDeleteBtn.style.border = 'none';
        this.executeDeleteBtn.style.background = '#ef4444';
        this.executeDeleteBtn.style.color = '#fff';
        this.executeDeleteBtn.style.cursor = 'pointer';
        this.executeDeleteBtn.style.display = 'none';
        this.executeDeleteBtn.style.alignItems = 'center';
        this.executeDeleteBtn.style.position = 'absolute';
        this.executeDeleteBtn.style.left = 'calc(100% + 8px)';
        this.executeDeleteBtn.style.whiteSpace = 'nowrap';
        this.executeDeleteBtn.addEventListener('click', () => this.deleteSelected());

        middleControls.appendChild(this.uploadBtn);
        middleControls.appendChild(this.deleteToggleBtn);
        middleControls.appendChild(this.executeDeleteBtn);

        const rightControls = document.createElement('div');
        rightControls.style.display = 'flex';
        rightControls.style.gap = '1rem';
        rightControls.style.alignItems = 'center';
        rightControls.style.width = '250px';
        rightControls.style.justifyContent = 'flex-end';

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'search';
        this.searchInput.placeholder = 'Search media...';
        this.searchInput.style.padding = '0.4rem 1rem';
        this.searchInput.style.borderRadius = '20px';
        this.searchInput.style.border = '1px solid var(--accent-fade, rgba(59,130,246,0.7))';
        this.searchInput.style.background = 'var(--accent-faint, rgba(59,130,246,0.3))';
        this.searchInput.style.color = '#fff';
        this.searchInput.style.outline = 'none';
        this.searchInput.style.width = '180px';
        this.searchInput.style.fontSize = '0.85rem';
        this.searchInput.style.transition = 'box-shadow 0.2s';
        this.searchInput.addEventListener('focus', () => {
            this.searchInput.style.boxShadow = '0 0 0 2px var(--accent-solid, #3b82f6)';
        });
        this.searchInput.addEventListener('blur', () => {
            this.searchInput.style.boxShadow = 'none';
        });
        this.searchInput.addEventListener('input', (e) => this.filterMedia(e.target.value));

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = window.icons && window.icons.close ? window.icons.close : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M18 6l-12 12M6 6l12 12"/></svg>';
        const svgClose = closeBtn.querySelector('svg');
        if (svgClose) { svgClose.style.width = '20px'; svgClose.style.height = '20px'; }
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.4';
        closeBtn.style.padding = '0';
        closeBtn.style.transition = 'opacity 0.2s';
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.4');
        closeBtn.addEventListener('click', () => this.close(null));
        
        rightControls.appendChild(this.searchInput);
        rightControls.appendChild(closeBtn);

        header.appendChild(leftControls);
        header.appendChild(middleControls);
        header.appendChild(rightControls);

        this.grid = document.createElement('div');
        this.grid.style.display = 'grid';
        this.grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        this.grid.style.gap = '1rem';
        this.grid.style.overflowY = 'auto';
        this.grid.style.flex = '1';
        this.grid.style.paddingRight = '1rem';
        
        // Scrollbar styling for grid
        this.grid.style.scrollbarWidth = 'thin';
        this.grid.style.scrollbarColor = 'rgba(255,255,255,0.2) transparent';

        this.modal.appendChild(header);
        this.modal.appendChild(this.grid);

        // Drag and drop overlay
        this.dropOverlay = document.createElement('div');
        this.dropOverlay.style.position = 'absolute';
        this.dropOverlay.style.inset = '0';
        this.dropOverlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        this.dropOverlay.style.border = '4px dashed var(--accent-solid)';
        this.dropOverlay.style.zIndex = '10';
        this.dropOverlay.style.display = 'none';
        this.dropOverlay.style.alignItems = 'center';
        this.dropOverlay.style.justifyContent = 'center';
        this.dropOverlay.style.pointerEvents = 'none';
        
        const dropText = document.createElement('h2');
        dropText.textContent = 'Drop files to upload';
        dropText.style.color = 'var(--accent-solid)';
        this.dropOverlay.appendChild(dropText);
        
        this.modal.appendChild(this.dropOverlay);

        this.setupDragAndDrop();

        document.body.appendChild(this.modal);
    }

    async loadMedia() {
        try {
            const res = await fetch('/api/media/list');
            const data = await res.json();
            if (data.status === 'success') {
                this.media = data.media;
                this.filterMedia('');
            }
        } catch (err) {
            console.error('Failed to load media', err);
        }
    }

    filterMedia(query) {
        query = query.toLowerCase();
        this.filteredMedia = this.media.filter(item => item.name.toLowerCase().includes(query));
        this.currentPage = 0;
        this.grid.innerHTML = '';
        this.renderNextPage();
    }

    renderNextPage() {
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.filteredMedia.slice(start, end);
        
        if (pageItems.length === 0) return;

        const fragment = document.createDocumentFragment();

        pageItems.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item';
            wrapper.style.position = 'relative';
            wrapper.style.aspectRatio = '1';
            wrapper.style.backgroundColor = 'rgba(255,255,255,0.05)';
            wrapper.style.borderRadius = '8px';
            wrapper.style.overflow = 'hidden';
            wrapper.style.cursor = 'pointer';
            wrapper.style.transition = 'transform 0.2s, box-shadow 0.2s';
            
            // Checkbox for delete mode
            const check = document.createElement('div');
            check.style.position = 'absolute';
            check.style.top = '8px';
            check.style.right = '8px';
            check.style.width = '20px';
            check.style.height = '20px';
            check.style.borderRadius = '50%';
            check.style.border = '2px solid #fff';
            check.style.display = 'none';
            check.style.alignItems = 'center';
            check.style.justifyContent = 'center';
            check.style.backgroundColor = 'rgba(0,0,0,0.5)';
            check.style.zIndex = '2';
            
            if (this.selectedForDeletion.has(item.name)) {
                check.style.backgroundColor = 'rgb(239, 68, 68)';
                check.style.border = '2px solid rgb(239, 68, 68)';
            }
            wrapper.appendChild(check);

            const img = document.createElement('img');
            img.src = item.url;
            img.loading = 'lazy';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            const nameOverlay = document.createElement('div');
            nameOverlay.textContent = item.name;
            nameOverlay.style.position = 'absolute';
            nameOverlay.style.bottom = '0';
            nameOverlay.style.left = '0';
            nameOverlay.style.right = '0';
            nameOverlay.style.padding = '0.5rem';
            nameOverlay.style.background = 'linear-gradient(transparent, rgba(0,0,0,0.8))';
            nameOverlay.style.color = '#fff';
            nameOverlay.style.fontSize = '0.7rem';
            nameOverlay.style.whiteSpace = 'nowrap';
            nameOverlay.style.overflow = 'hidden';
            nameOverlay.style.textOverflow = 'ellipsis';
            nameOverlay.style.opacity = '0';
            nameOverlay.style.transition = 'opacity 0.2s';

            wrapper.appendChild(img);
            wrapper.appendChild(nameOverlay);

            wrapper.addEventListener('mouseenter', () => {
                nameOverlay.style.opacity = '1';
                if (!this.isDeleteMode) wrapper.style.transform = 'scale(1.02)';
            });
            wrapper.addEventListener('mouseleave', () => {
                nameOverlay.style.opacity = '0';
                wrapper.style.transform = 'none';
            });

            // Re-eval delete mode visuals on hover/render
            if (this.isDeleteMode) {
                check.style.display = 'flex';
            }

            wrapper.addEventListener('click', () => {
                if (this.isDeleteMode) {
                    if (this.selectedForDeletion.has(item.name)) {
                        this.selectedForDeletion.delete(item.name);
                        check.style.backgroundColor = 'rgba(0,0,0,0.5)';
                        check.style.border = '2px solid #fff';
                    } else {
                        this.selectedForDeletion.add(item.name);
                        check.style.backgroundColor = 'rgb(239, 68, 68)';
                        check.style.border = '2px solid rgb(239, 68, 68)';
                    }
                    this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Delete (' + this.selectedForDeletion.size + ')</span>';
                } else {
                    this.close(item.url);
                }
            });

            fragment.appendChild(wrapper);
        });

        // Remove old sentinel
        if (this.sentinel.parentNode) {
            this.sentinel.parentNode.removeChild(this.sentinel);
        }

        this.grid.appendChild(fragment);
        this.currentPage++;

        // Add sentinel if more items
        if (this.currentPage * this.pageSize < this.filteredMedia.length) {
            this.grid.appendChild(this.sentinel);
            this.observer.observe(this.sentinel);
        }
    }

    toggleDeleteMode() {
        this.isDeleteMode = !this.isDeleteMode;
        this.selectedForDeletion.clear();
        
        if (this.isDeleteMode) {
            this.deleteToggleBtn.classList.add('active-pill');
            this.deleteToggleBtn.title = 'Cancel Delete';
            this.deleteToggleBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            this.deleteToggleBtn.style.color = '#ef4444';
            this.executeDeleteBtn.style.display = 'flex';
            this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Delete (0)</span>';
        } else {
            this.deleteToggleBtn.classList.remove('active-pill');
            this.deleteToggleBtn.title = 'Select to Delete';
            this.deleteToggleBtn.style.background = 'transparent';
            this.deleteToggleBtn.style.color = 'rgba(255,255,255,0.6)';
            this.executeDeleteBtn.style.display = 'none';
        }

        // Force re-render to show/hide checkboxes
        this.filterMedia(this.searchInput.value);
    }

    async deleteSelected() {
        if (this.selectedForDeletion.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${this.selectedForDeletion.size} items?`)) return;

        try {
            const res = await fetch('/api/media/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: Array.from(this.selectedForDeletion) })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.selectedForDeletion.clear();
                this.toggleDeleteMode();
                this.loadMedia(); // Reload
            } else {
                alert('Error deleting files');
            }
        } catch (err) {
            console.error(err);
        }
    }

    setupDragAndDrop() {
        let dragCounter = 0;

        this.modal.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            this.dropOverlay.style.display = 'flex';
        });

        this.modal.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                this.dropOverlay.style.display = 'none';
            }
        });

        this.modal.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.modal.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.dropOverlay.style.display = 'none';

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                await this.uploadFiles(e.dataTransfer.files);
            }
        });
    }

    async uploadFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.status === 'success') {
                    // Prepend to media array and re-render
                    this.media.unshift(data.media);
                } else {
                    console.error('Upload failed for', file.name, data.msg);
                }
            } catch (err) {
                console.error('Upload error', err);
            }
        }
        // Force refresh
        this.filterMedia(this.searchInput.value);
    }
}
