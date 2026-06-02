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
        this.modal.style.inset = '0';
        this.modal.style.backgroundColor = 'rgba(10, 10, 10, 0.85)';
        this.modal.style.backdropFilter = 'blur(10px)';
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
        leftControls.style.gap = '1rem';
        leftControls.style.alignItems = 'center';
        
        const title = document.createElement('h2');
        title.textContent = 'ESMedia Library';
        title.style.color = '#fff';
        title.style.margin = '0';
        title.style.fontWeight = '500';
        
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'search';
        this.searchInput.placeholder = 'Search media...';
        this.searchInput.style.padding = '0.5rem 1rem';
        this.searchInput.style.borderRadius = '20px';
        this.searchInput.style.border = '1px solid rgba(255,255,255,0.1)';
        this.searchInput.style.background = 'rgba(0,0,0,0.5)';
        this.searchInput.style.color = '#fff';
        this.searchInput.style.outline = 'none';
        this.searchInput.style.width = '250px';
        this.searchInput.addEventListener('input', (e) => this.filterMedia(e.target.value));

        const rightControls = document.createElement('div');
        rightControls.style.display = 'flex';
        rightControls.style.gap = '1rem';
        rightControls.style.alignItems = 'center';

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

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        this.uploadBtn.title = 'Upload Files';
        this.uploadBtn.style.padding = '0';
        this.uploadBtn.style.width = '36px';
        this.uploadBtn.style.height = '36px';
        this.uploadBtn.style.borderRadius = '50%';
        this.uploadBtn.style.border = '1px solid rgba(255,255,255,0.2)';
        this.uploadBtn.style.background = 'rgba(255,255,255,0.05)';
        this.uploadBtn.style.color = '#fff';
        this.uploadBtn.style.cursor = 'pointer';
        this.uploadBtn.style.display = 'flex';
        this.uploadBtn.style.alignItems = 'center';
        this.uploadBtn.style.justifyContent = 'center';
        this.uploadBtn.style.transition = 'background 0.2s';
        this.uploadBtn.addEventListener('mouseenter', () => this.uploadBtn.style.background = 'rgba(255,255,255,0.1)');
        this.uploadBtn.addEventListener('mouseleave', () => this.uploadBtn.style.background = 'rgba(255,255,255,0.05)');
        this.uploadBtn.addEventListener('click', () => this.hiddenFileInput.click());

        this.deleteToggleBtn = document.createElement('button');
        this.deleteToggleBtn.textContent = 'Select to Delete';
        this.deleteToggleBtn.style.padding = '0.5rem 1rem';
        this.deleteToggleBtn.style.borderRadius = '4px';
        this.deleteToggleBtn.style.border = '1px solid rgba(239, 68, 68, 0.5)';
        this.deleteToggleBtn.style.background = 'transparent';
        this.deleteToggleBtn.style.color = 'rgb(239, 68, 68)';
        this.deleteToggleBtn.style.cursor = 'pointer';
        this.deleteToggleBtn.addEventListener('click', () => this.toggleDeleteMode());

        this.executeDeleteBtn = document.createElement('button');
        this.executeDeleteBtn.textContent = 'Delete (0)';
        this.executeDeleteBtn.style.padding = '0.5rem 1rem';
        this.executeDeleteBtn.style.borderRadius = '4px';
        this.executeDeleteBtn.style.border = 'none';
        this.executeDeleteBtn.style.background = 'rgb(239, 68, 68)';
        this.executeDeleteBtn.style.color = '#fff';
        this.executeDeleteBtn.style.cursor = 'pointer';
        this.executeDeleteBtn.style.display = 'none';
        this.executeDeleteBtn.addEventListener('click', () => this.deleteSelected());

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = icons.close || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;"><path d="M18 6l-12 12M6 6l12 12"/></svg>';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.6';
        closeBtn.addEventListener('click', () => this.close(null));

        leftControls.appendChild(title);
        leftControls.appendChild(this.searchInput);
        
        rightControls.appendChild(this.uploadBtn);
        rightControls.appendChild(this.deleteToggleBtn);
        rightControls.appendChild(this.executeDeleteBtn);
        rightControls.appendChild(closeBtn);

        header.appendChild(leftControls);
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
                    this.executeDeleteBtn.textContent = `Delete (${this.selectedForDeletion.size})`;
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
            this.deleteToggleBtn.textContent = 'Cancel Delete';
            this.deleteToggleBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            this.executeDeleteBtn.style.display = 'block';
            this.executeDeleteBtn.textContent = 'Delete (0)';
        } else {
            this.deleteToggleBtn.textContent = 'Select to Delete';
            this.deleteToggleBtn.style.background = 'transparent';
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
