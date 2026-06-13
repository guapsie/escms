import { el } from './escms-dom.js';
import { icons } from './editor-icons.js';

export class EscmsMediaLibrary {
    constructor(i18n) {
        this.i18n = i18n;
        this.media = [];
        this.filteredMedia = [];
        this.selectedForDeletion = new Set();
        this.isDeleteMode = false;
        this.isMultiSelect = false;
        this.selectedItems = new Set();
        
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

    async open(options = {}) {
        if (this.modal) return;
        this.isMultiSelect = options.multi || false;
        this.isWindowed = options.windowed || false;
        this.selectedItems.clear();
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

    insertSelected() {
        if (this.selectedItems.size > 0) {
            this.close(Array.from(this.selectedItems));
        }
    }

    buildUI() {
        this.modal = document.createElement('div');
        this.modal.className = 'escms-media-library escms-anim-fade';
        this.modal.style.backgroundColor = 'rgba(10, 10, 10, 0.85)';
        this.modal.style.backdropFilter = 'blur(16px)';
        this.modal.style.webkitBackdropFilter = 'blur(16px)';
        this.modal.style.zIndex = '99999';
        this.modal.style.display = 'flex';
        this.modal.style.flexDirection = 'column';
        this.modal.style.boxSizing = 'border-box';
        
        if (this.isWindowed) {
            this.modal.style.position = 'fixed';
            this.modal.style.top = '100px';
            this.modal.style.right = '320px';
            this.modal.style.width = '380px';
            this.modal.style.height = '500px';
            this.modal.style.borderRadius = '12px';
            this.modal.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            this.modal.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
            this.modal.style.padding = '1.5rem';
        } else {
            this.modal.style.position = 'fixed';
            this.modal.style.inset = '50px 0 0 0';
            this.modal.style.padding = '2rem';
        }
        
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = this.isWindowed ? '1rem' : '2rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '10px';
        
        const leftControls = document.createElement('div');
        leftControls.style.display = 'flex';
        leftControls.style.alignItems = 'center';
        leftControls.style.width = this.isWindowed ? 'auto' : '250px';
        leftControls.style.flex = this.isWindowed ? '1' : 'none';
        
        const title = document.createElement('h2');
        title.innerHTML = '<span style="color:var(--text-solid, #fff); opacity:1;">ES</span><span style="color:var(--text-solid, #fff); opacity:0.5;">Media Manager</span>';
        title.style.margin = '0';
        title.style.fontWeight = '500';
        title.style.fontSize = '0.85rem';
        title.style.letterSpacing = '1px';
        title.setAttribute('data-i18n', 'medialibrary.title');
        title.textContent = this.i18n ? (this.i18n.dictionary['medialibrary.title'] || 'Media Manager') : 'Media Manager';
        // We override textContent above, wait, if we use textContent we lose the span structure!
        // We must translate just the "Media Manager" part if we want spans, or just let i18n handle it if we inject spans.
        // Actually, if we use data-i18n, i18nEngine replaces innerHTML. Let's just set innerHTML with the translated text.
        const translatedTitle = this.i18n ? (this.i18n.dictionary['medialibrary.title'] || 'Media manager') : 'Media manager';
        title.innerHTML = '<span style="color:var(--text-solid, #fff); opacity:1;">ES</span><span style="color:var(--text-solid, #fff); opacity:0.5;">' + translatedTitle + '</span>';
        
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
                    btn.style.background = 'var(--accent-solid, #3b82f6)';
                    btn.style.color = '#fff';
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
        this.uploadBtn.innerHTML = icons && icons.upload ? icons.upload : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        const svgUpload = this.uploadBtn.querySelector('svg');
        if (svgUpload) { svgUpload.style.width = '16px'; svgUpload.style.height = '16px'; }
        this.uploadBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.upload'] || 'Upload Files') : 'Upload Files';
        stylePillBtn(this.uploadBtn);
        this.uploadBtn.addEventListener('click', () => this.hiddenFileInput.click());

        this.deleteToggleBtn = document.createElement('button');
        this.deleteToggleBtn.innerHTML = icons && icons.trash ? icons.trash : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>';
        // Ajustar el SVG en caso de usar icons.trash
        const svgTrash = this.deleteToggleBtn.querySelector('svg');
        if (svgTrash) { svgTrash.style.width = '14px'; svgTrash.style.height = '14px'; }
        this.deleteToggleBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.select_delete'] || 'Select to Delete') : 'Select to Delete';
        stylePillBtn(this.deleteToggleBtn);
        this.deleteToggleBtn.addEventListener('click', () => this.toggleDeleteMode());

        this.executeDeleteBtn = document.createElement('button');
        this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Delete (0)</span>';
        this.executeDeleteBtn.title = this.i18n?.t ? this.i18n.t('medialibrary.confirm_deletion') : 'Confirm Deletion';
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

        this.uploadingIndicatorBtn = document.createElement('div');
        this.uploadingIndicatorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="escms-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg><span style="font-size:0.75rem; font-weight:bold; margin-left:6px;">Uploading...</span>';
        this.uploadingIndicatorBtn.style.padding = '0 1rem';
        this.uploadingIndicatorBtn.style.height = '32px';
        this.uploadingIndicatorBtn.style.borderRadius = '16px';
        this.uploadingIndicatorBtn.style.background = 'var(--accent-solid)';
        this.uploadingIndicatorBtn.style.color = '#fff';
        this.uploadingIndicatorBtn.style.display = 'none';
        this.uploadingIndicatorBtn.style.alignItems = 'center';
        this.uploadingIndicatorBtn.style.position = 'absolute';
        this.uploadingIndicatorBtn.style.left = 'calc(100% + 8px)';
        this.uploadingIndicatorBtn.style.whiteSpace = 'nowrap';
        
        // Add spin animation dynamically if it doesn't exist
        if (!document.getElementById('escms-spin-style')) {
            const style = document.createElement('style');
            style.id = 'escms-spin-style';
            style.innerHTML = '@keyframes escms-spin { 100% { transform: rotate(360deg); } } .escms-spin { animation: escms-spin 1s linear infinite; }';
            document.head.appendChild(style);
        }

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'search';
        this.searchInput.placeholder = this.i18n ? (this.i18n.dictionary['medialibrary.search'] || 'Search media...') : 'Search media...';
        this.searchInput.style.padding = '0 1rem';
        this.searchInput.style.borderRadius = '16px';
        this.searchInput.style.border = 'none';
        this.searchInput.style.background = 'transparent';
        this.searchInput.style.color = '#fff';
        this.searchInput.style.outline = 'none';
        this.searchInput.style.width = this.isWindowed ? '90px' : '140px';
        this.searchInput.style.height = '32px';
        this.searchInput.style.fontSize = '0.85rem';
        this.searchInput.style.transition = 'width 0.2s, background 0.2s';
        this.searchInput.addEventListener('focus', () => {
            this.searchInput.style.background = 'rgba(255,255,255,0.05)';
            this.searchInput.style.width = this.isWindowed ? '130px' : '180px';
        });
        this.searchInput.addEventListener('blur', () => {
            this.searchInput.style.background = 'transparent';
            this.searchInput.style.width = this.isWindowed ? '90px' : '140px';
        });
        this.searchInput.addEventListener('input', (e) => this.filterMedia(e.target.value));

        middleControls.appendChild(this.searchInput);
        middleControls.appendChild(this.uploadBtn);
        middleControls.appendChild(this.deleteToggleBtn);
        middleControls.appendChild(this.executeDeleteBtn);
        middleControls.appendChild(this.uploadingIndicatorBtn);

        const rightControls = document.createElement('div');
        rightControls.style.display = 'flex';
        rightControls.style.gap = '1rem';
        rightControls.style.alignItems = 'center';
        rightControls.style.width = this.isWindowed ? 'auto' : '250px';
        rightControls.style.justifyContent = 'flex-end';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = icons && icons.close ? icons.close : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M18 6l-12 12M6 6l12 12"/></svg>';

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
        rightControls.appendChild(closeBtn);
        
        if (this.isMultiSelect) {
            this.insertBtn = document.createElement('button');
            this.insertBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Insert (0)</span>';
            this.insertBtn.style.background = 'var(--accent-solid)';
            this.insertBtn.style.color = 'var(--text-solid)';
            this.insertBtn.style.border = 'none';
            this.insertBtn.style.borderRadius = '20px';
            this.insertBtn.style.padding = '0 16px';
            this.insertBtn.style.height = '32px';
            this.insertBtn.style.cursor = 'pointer';
            this.insertBtn.style.display = 'none';
            this.insertBtn.style.alignItems = 'center';
            this.insertBtn.style.justifyContent = 'center';
            this.insertBtn.addEventListener('click', () => this.insertSelected());
            middleControls.appendChild(this.insertBtn);
        }

        header.appendChild(leftControls);
        header.appendChild(middleControls);
        header.appendChild(rightControls);

        this.grid = document.createElement('div');
        this.grid.style.display = 'grid';
        this.grid.style.gridTemplateColumns = this.isWindowed ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))';
        this.grid.style.gap = '1rem';
        this.grid.style.alignContent = 'start';
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
        dropText.textContent = this.i18n?.t ? this.i18n.t('medialibrary.drop_files') : 'Drop files to upload';
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
            wrapper.style.paddingBottom = '100%';
            wrapper.style.height = '0';
            wrapper.style.width = '100%';
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
            img.src = '/data/media/thumbs/' + item.name;
            img.onerror = () => { img.src = item.url; };
            img.loading = 'lazy';
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
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

            // Re-eval delete/multi mode visuals on hover/render
            if (this.isDeleteMode || this.isMultiSelect) {
                check.style.display = 'flex';
                if (this.isMultiSelect && this.selectedItems.has(item.url)) {
                    check.style.backgroundColor = 'var(--accent-solid)';
                    check.style.border = '2px solid var(--accent-solid)';
                }
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
                    const deleteText = this.i18n ? (this.i18n.dictionary['medialibrary.confirm_delete'] || 'Delete') : 'Delete';
                    this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">' + deleteText + ' (' + this.selectedForDeletion.size + ')</span>';
                } else if (this.isMultiSelect) {
                    if (this.selectedItems.has(item.url)) {
                        this.selectedItems.delete(item.url);
                        check.style.backgroundColor = 'rgba(0,0,0,0.5)';
                        check.style.border = '2px solid #fff';
                    } else {
                        this.selectedItems.add(item.url);
                        check.style.backgroundColor = 'var(--accent-solid)';
                        check.style.border = '2px solid var(--accent-solid)';
                    }
                    if (this.selectedItems.size > 0) {
                        this.insertBtn.style.display = 'flex';
                        this.insertBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">Insert (' + this.selectedItems.size + ')</span>';
                    } else {
                        this.insertBtn.style.display = 'none';
                    }
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
            this.deleteToggleBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.cancel_delete'] || 'Cancel Delete') : 'Cancel Delete';
            this.deleteToggleBtn.style.background = 'rgba(239, 68, 68, 0.2)';
            this.deleteToggleBtn.style.color = '#ef4444';
            this.executeDeleteBtn.style.display = 'flex';
            const deleteText = this.i18n ? (this.i18n.dictionary['medialibrary.confirm_delete'] || 'Delete') : 'Delete';
            this.executeDeleteBtn.innerHTML = '<span style="font-size:0.75rem; font-weight:bold;">' + deleteText + ' (0)</span>';
        } else {
            this.deleteToggleBtn.classList.remove('active-pill');
            this.deleteToggleBtn.title = this.i18n ? (this.i18n.dictionary['medialibrary.select_delete'] || 'Select to Delete') : 'Select to Delete';
            this.deleteToggleBtn.style.background = 'transparent';
            this.deleteToggleBtn.style.color = 'rgba(255,255,255,0.6)';
            this.executeDeleteBtn.style.display = 'none';
        }

        // Force re-render to show/hide checkboxes
        this.filterMedia(this.searchInput.value);
    }

    async deleteSelected() {
        if (this.selectedForDeletion.size === 0) return;
        const msg = this.i18n?.t ? this.i18n.t('medialibrary.confirm_delete_msg').replace('{count}', this.selectedForDeletion.size) : `Are you sure you want to delete ${this.selectedForDeletion.size} items?`;
        if (!confirm(msg)) return;

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
        if (!files || files.length === 0) return;

        this.uploadingIndicatorBtn.style.display = 'flex';
        const span = this.uploadingIndicatorBtn.querySelector('span');
        const uploadText = this.i18n ? (this.i18n.dictionary['medialibrary.uploading'] || 'Uploading') : 'Uploading';
        span.textContent = `${uploadText} ${files.length} files...`;

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

        this.uploadingIndicatorBtn.style.display = 'none';

        // Force refresh
        this.filterMedia(this.searchInput.value);
    }
}
