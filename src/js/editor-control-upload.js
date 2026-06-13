import { EscmsSelect } from './editor-controls.js';
import { EscmsMediaLibrary } from './editor-medialibrary.js';

export class EscmsUploadControl {
    constructor(labelKey, i18n, value = '', onChange = null) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.value = value;
        this.onChange = onChange;
        this.element = null;
        this.input = null;
        this.uploadBtn = null;
        this.fileInput = null;
        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'inspector-control';

        const labelRow = document.createElement('div');
        labelRow.style.display = 'flex';
        labelRow.style.justifyContent = 'space-between';
        labelRow.style.alignItems = 'center';
        labelRow.style.marginBottom = '0.35rem';

        const label = document.createElement('div');
        label.className = 'inspector-label';
        label.setAttribute('data-i18n', this.labelKey);

        labelRow.appendChild(label);

        this.preview = document.createElement('div');
        this.preview.style.height = '60px';
        this.preview.style.background = '#121212';
        this.preview.style.border = '1px solid rgba(255,255,255,0.05)';
        this.preview.style.borderRadius = '4px';
        this.preview.style.marginBottom = '0.5rem';
        this.preview.style.backgroundSize = 'contain';
        this.preview.style.backgroundRepeat = 'no-repeat';
        this.preview.style.backgroundPosition = 'center';
        this.preview.style.display = 'none';

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'flex-start';

        this.input = document.createElement('textarea');
        this.input.value = this.value;
        this.input.style.flex = '1';
        this.input.style.background = '#121212';
        this.input.style.border = '1px solid rgba(255,255,255,0.05)';
        this.input.style.color = 'var(--text-solid)';
        this.input.style.padding = '6px 8px';
        this.input.style.borderRadius = '4px';
        this.input.style.fontSize = '0.75rem';
        this.input.style.boxSizing = 'border-box';
        this.input.style.resize = 'vertical';
        this.input.style.minHeight = '32px';
        this.input.style.fontFamily = 'monospace';

        this.input.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val.startsWith('<svg') && val.endsWith('</svg>')) {
                val = 'data:image/svg+xml;utf8,' + encodeURIComponent(val);
                this.input.value = val;
            }
            this.value = val;
            this.updatePreview();
            if (this.onChange) this.onChange(this.value);
        });

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.setAttribute('data-i18n', 'inspector.open_media_manager');
        this.uploadBtn.textContent = this.i18n ? (this.i18n.dictionary['inspector.open_media_manager'] || 'Open Media Manager') : 'Open Media Manager';
        this.uploadBtn.style.background = 'var(--accent-solid)';
        this.uploadBtn.style.border = 'none';
        this.uploadBtn.style.color = 'var(--text-solid)';
        this.uploadBtn.style.padding = '0.5rem';
        this.uploadBtn.style.width = '100%';
        this.uploadBtn.style.borderRadius = '4px';
        this.uploadBtn.style.cursor = 'pointer';
        this.uploadBtn.style.display = 'flex';
        this.uploadBtn.style.alignItems = 'center';
        this.uploadBtn.style.justifyContent = 'center';
        this.uploadBtn.style.fontSize = '0.75rem';
        this.uploadBtn.style.fontWeight = '500';

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.style.display = 'none';

        this.uploadBtn.addEventListener('click', async () => {
            if (!window.escmsMediaLibrary) {
                window.escmsMediaLibrary = new EscmsMediaLibrary(this.i18n);
            }
            const url = await window.escmsMediaLibrary.open();
            if (url) {
                this.setValue(url, true);
            }
        });

        row.appendChild(this.uploadBtn);
        row.appendChild(this.fileInput);

        // Size Toggle Row
        this.sizeToggleRow = document.createElement('div');
        this.sizeToggleRow.style.display = 'none';
        this.sizeToggleRow.style.justifyContent = 'space-between';
        this.sizeToggleRow.style.marginTop = '1rem';
        this.sizeToggleRow.style.alignItems = 'center';

        const sizeLabel = document.createElement('div');
        sizeLabel.className = 'escms-ui-label';
        sizeLabel.setAttribute('data-i18n', 'controls.size');
        sizeLabel.textContent = window.escmsEditor?.i18n?.t('controls.size') || 'Size';

        const btnsWrap = document.createElement('div');
        btnsWrap.style.display = 'flex';
        btnsWrap.style.gap = '4px';

        const styleSizeBtn = (btn) => {
            btn.style.padding = '2px 8px';
            btn.style.fontSize = '0.7rem';
            btn.style.background = 'transparent';
            btn.style.border = '1px solid rgba(255,255,255,0.2)';
            btn.style.color = 'rgba(255,255,255,0.6)';
            btn.style.borderRadius = '12px';
            btn.style.cursor = 'pointer';
        };

        this.thumbBtn = document.createElement('button');
        this.thumbBtn.setAttribute('data-i18n', 'controls.thumb');
        this.thumbBtn.textContent = window.escmsEditor?.i18n?.t('controls.thumb') || 'Thumb';
        styleSizeBtn(this.thumbBtn);

        this.fullBtn = document.createElement('button');
        this.fullBtn.setAttribute('data-i18n', 'controls.full');
        this.fullBtn.textContent = window.escmsEditor?.i18n?.t('controls.full') || 'Full';
        styleSizeBtn(this.fullBtn);

        this.thumbBtn.addEventListener('click', () => {
            if (this.value && this.value.includes('/data/media/') && !this.value.includes('/thumbs/')) {
                const newVal = this.value.replace('/data/media/', '/data/media/thumbs/');
                this.setValue(newVal, true);
            }
        });

        this.fullBtn.addEventListener('click', () => {
            if (this.value && this.value.includes('/thumbs/')) {
                const newVal = this.value.replace('/data/media/thumbs/', '/data/media/');
                this.setValue(newVal, true);
            }
        });

        btnsWrap.appendChild(this.thumbBtn);
        btnsWrap.appendChild(this.fullBtn);

        this.sizeToggleRow.appendChild(sizeLabel);
        this.sizeToggleRow.appendChild(btnsWrap);

        if (this.labelKey !== 'inspector.src_url') {
            this.element.appendChild(labelRow);
            this.element.appendChild(this.preview);
        }
        this.element.appendChild(row);
        this.element.appendChild(this.sizeToggleRow);
        
        this.updatePreview();
    }

    updatePreview() {
        if (this.value) {
            this.preview.style.display = 'block';
            this.preview.style.backgroundImage = `url("${this.value}")`;
            
            // Show size toggle if it's a media image
            const isMedia = this.value.includes('/data/media/');
            if (isMedia) {
                this.sizeToggleRow.style.display = 'flex';
                if (this.value.includes('/thumbs/')) {
                    this.thumbBtn.style.background = 'var(--accent-solid)';
                    this.thumbBtn.style.color = '#fff';
                    this.thumbBtn.style.border = '1px solid var(--accent-solid)';
                    
                    this.fullBtn.style.background = 'transparent';
                    this.fullBtn.style.color = 'rgba(255,255,255,0.6)';
                    this.fullBtn.style.border = '1px solid rgba(255,255,255,0.2)';
                } else {
                    this.fullBtn.style.background = 'var(--accent-solid)';
                    this.fullBtn.style.color = '#fff';
                    this.fullBtn.style.border = '1px solid var(--accent-solid)';
                    
                    this.thumbBtn.style.background = 'transparent';
                    this.thumbBtn.style.color = 'rgba(255,255,255,0.6)';
                    this.thumbBtn.style.border = '1px solid rgba(255,255,255,0.2)';
                }
            } else {
                this.sizeToggleRow.style.display = 'none';
            }
        } else {
            this.preview.style.display = 'none';
            this.sizeToggleRow.style.display = 'none';
        }
    }

    setValue(val, triggerChange = true) {
        this.value = val;
        if (this.input) {
            this.input.value = val;
        }
        this.updatePreview();
        if (triggerChange && this.onChange) {
            this.onChange(val);
        }
    }
}

export class EscmsBgImageControl {
    constructor(labelKey, i18n, initialValue = {}, onChange = null) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.imageUrl = initialValue.image || '';
        this.bgSize = initialValue.size || 'cover';
        this.bgRepeat = initialValue.repeat || 'no-repeat';
        this.bgPosition = initialValue.position || 'center';
        
        this.onChange = onChange;
        this.element = null;
        this.preview = null;
        this.uploadBtn = null;
        this.clearBtn = null;
        this.fileInput = null;
        this.modeSelect = null;
        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'inspector-control';
        this.element.style.marginBottom = '1rem';
        this.element.style.display = 'none';

        const label = document.createElement('div');
        label.className = 'inspector-label';
        label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.marginBottom = '0.35rem';

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'center';

        this.preview = document.createElement('div');
        this.preview.style.flex = '1';
        this.preview.style.height = '32px';
        this.preview.style.background = '#121212';
        this.preview.style.border = '1px solid rgba(255,255,255,0.05)';
        this.preview.style.borderRadius = '4px';
        this.preview.style.backgroundSize = 'cover';
        this.preview.style.backgroundPosition = 'center';
        this.preview.style.display = 'flex';
        this.preview.style.alignItems = 'center';
        this.preview.style.justifyContent = 'center';
        this.preview.style.fontSize = '0.7rem';
        this.preview.style.color = 'rgba(255,255,255,0.3)';
        this.preview.textContent = window.escmsEditor?.i18n?.t('controls.no_image') || 'No Image';

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = '<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="128" y1="216" x2="128" y2="40"></line><polyline points="56 112 128 40 200 112"></polyline></svg>';
        this.uploadBtn.setAttribute('data-i18n-title', 'controls.upload_bg');
        this.uploadBtn.title = window.escmsEditor?.i18n?.t('controls.upload_bg') || 'Upload Background Image';
        this.uploadBtn.style.background = 'var(--accent-solid)';
        this.uploadBtn.style.border = 'none';
        this.uploadBtn.style.color = 'var(--text-solid)';
        this.uploadBtn.style.width = '32px';
        this.uploadBtn.style.height = '32px';
        this.uploadBtn.style.borderRadius = '4px';
        this.uploadBtn.style.cursor = 'pointer';
        this.uploadBtn.style.display = 'flex';
        this.uploadBtn.style.alignItems = 'center';
        this.uploadBtn.style.justifyContent = 'center';

        this.clearBtn = document.createElement('button');
        this.clearBtn.innerHTML = '<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="200" y1="56" x2="56" y2="200"></line><line x1="200" y1="200" x2="56" y2="56"></line></svg>';
        this.clearBtn.setAttribute('data-i18n-title', 'controls.clear_image');
        this.clearBtn.title = window.escmsEditor?.i18n?.t('controls.clear_image') || 'Clear Image';
        this.clearBtn.style.background = '#333';
        this.clearBtn.style.border = 'none';
        this.clearBtn.style.color = 'var(--text-solid)';
        this.clearBtn.style.width = '32px';
        this.clearBtn.style.height = '32px';
        this.clearBtn.style.borderRadius = '4px';
        this.clearBtn.style.cursor = 'pointer';
        this.clearBtn.style.display = 'flex';
        this.clearBtn.style.alignItems = 'center';
        this.clearBtn.style.justifyContent = 'center';

        this.uploadBtn.addEventListener('click', async () => {
            if (!window.escmsMediaLibrary) {
                window.escmsMediaLibrary = new EscmsMediaLibrary(this.i18n);
            }
            const url = await window.escmsMediaLibrary.open();
            if (url) {
                this.setValue({ image: url, size: this.bgSize, repeat: this.bgRepeat, position: this.bgPosition }, true);
            }
        });

        this.clearBtn.addEventListener('click', () => {
            this.setValue({ image: '', size: 'cover', repeat: 'no-repeat', position: 'center' }, true);
        });

        row.appendChild(this.preview);
        row.appendChild(this.uploadBtn);
        row.appendChild(this.clearBtn);

        // Size Toggle Row
        this.sizeToggleRow = document.createElement('div');
        this.sizeToggleRow.style.display = 'none';
        this.sizeToggleRow.style.gap = '0.25rem';
        this.sizeToggleRow.style.marginTop = '0.5rem';
        this.sizeToggleRow.style.alignItems = 'center';

        const sizeLabel = document.createElement('span');
        sizeLabel.setAttribute('data-i18n', 'controls.size');
        sizeLabel.textContent = window.escmsEditor?.i18n?.t('controls.size') || 'Size';
        sizeLabel.style.fontSize = '0.7rem';
        sizeLabel.style.color = 'rgba(255,255,255,0.5)';
        sizeLabel.style.marginRight = '0.25rem';

        const styleSizeBtn = (btn) => {
            btn.style.padding = '2px 8px';
            btn.style.fontSize = '0.7rem';
            btn.style.background = 'transparent';
            btn.style.border = '1px solid rgba(255,255,255,0.2)';
            btn.style.color = 'rgba(255,255,255,0.6)';
            btn.style.borderRadius = '12px';
            btn.style.cursor = 'pointer';
        };

        this.thumbBtn = document.createElement('button');
        this.thumbBtn.setAttribute('data-i18n', 'controls.thumb');
        this.thumbBtn.textContent = window.escmsEditor?.i18n?.t('controls.thumb') || 'Thumb';
        styleSizeBtn(this.thumbBtn);

        this.fullBtn = document.createElement('button');
        this.fullBtn.setAttribute('data-i18n', 'controls.full');
        this.fullBtn.textContent = window.escmsEditor?.i18n?.t('controls.full') || 'Full';
        styleSizeBtn(this.fullBtn);

        this.thumbBtn.addEventListener('click', () => {
            if (this.imageUrl && this.imageUrl.includes('/data/media/') && !this.imageUrl.includes('/thumbs/')) {
                const newVal = this.imageUrl.replace('/data/media/', '/data/media/thumbs/');
                this.setValue({ image: newVal, size: this.bgSize, repeat: this.bgRepeat, position: this.bgPosition }, true);
            }
        });

        this.fullBtn.addEventListener('click', () => {
            if (this.imageUrl && this.imageUrl.includes('/thumbs/')) {
                const newVal = this.imageUrl.replace('/data/media/thumbs/', '/data/media/');
                this.setValue({ image: newVal, size: this.bgSize, repeat: this.bgRepeat, position: this.bgPosition }, true);
            }
        });

        this.sizeToggleRow.appendChild(sizeLabel);
        this.sizeToggleRow.appendChild(this.thumbBtn);
        this.sizeToggleRow.appendChild(this.fullBtn);

        this.element.appendChild(label);
        this.element.appendChild(row);
        this.element.appendChild(this.sizeToggleRow);

        // Dropdown Mode
        const modeOptions = [
            { label: window.escmsEditor?.i18n?.t('controls.cover') || 'Cover (Fill)', value: 'cover' },
            { label: window.escmsEditor?.i18n?.t('controls.contain') || 'Contain (Fit)', value: 'contain' },
            { label: window.escmsEditor?.i18n?.t('controls.pattern') || 'Pattern (Repeat)', value: 'pattern' }
        ];

        let currentMode = this._getMode();
        this.modeSelect = new EscmsSelect(null, modeOptions, currentMode, (modeVal) => {
            this._applyMode(modeVal);
            this.triggerChange();
        });
        
        this.modeSelect.element.style.marginTop = '0.5rem';
        this.element.appendChild(this.modeSelect.element);

        this.updateUI();
    }

    _getMode() {
        if (this.bgSize === 'contain') return 'contain';
        if (this.bgRepeat === 'repeat') return 'pattern';
        return 'cover';
    }

    _applyMode(mode) {
        if (mode === 'cover') {
            this.bgSize = 'cover';
            this.bgRepeat = 'no-repeat';
            this.bgPosition = 'center';
        } else if (mode === 'contain') {
            this.bgSize = 'contain';
            this.bgRepeat = 'no-repeat';
            this.bgPosition = 'center';
        } else if (mode === 'pattern') {
            this.bgSize = 'auto';
            this.bgRepeat = 'repeat';
            this.bgPosition = 'top left';
        }
    }

    setValue(valObj, triggerChange = true) {
        let rawImg = valObj.image || '';
        if (rawImg.startsWith('url(')) {
            rawImg = rawImg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        }
        if (rawImg === 'none') rawImg = '';

        this.imageUrl = rawImg;
        this.bgSize = valObj.size || 'cover';
        this.bgRepeat = valObj.repeat || 'no-repeat';
        this.bgPosition = valObj.position || 'center';

        this.modeSelect.setValue(this._getMode(), false);
        this.updateUI();

        if (triggerChange) {
            this.triggerChange();
        }
    }

    triggerChange() {
        if (this.onChange) {
            this.onChange({
                image: this.imageUrl ? `url("${this.imageUrl}")` : '',
                size: this.bgSize,
                repeat: this.bgRepeat,
                position: this.bgPosition
            });
        }
    }

    updateUI() {
        if (this.imageUrl) {
            this.preview.style.backgroundImage = `url("${this.imageUrl}")`;
            this.preview.textContent = '';
            this.modeSelect.element.style.display = 'block';

            // Show size toggle if it's a media image
            const isMedia = this.imageUrl.includes('/data/media/');
            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(this.imageUrl);
            if (isMedia && isImage) {
                this.sizeToggleRow.style.display = 'flex';
                if (this.imageUrl.includes('/thumbs/')) {
                    this.thumbBtn.style.background = 'var(--accent-solid)';
                    this.thumbBtn.style.color = '#fff';
                    this.thumbBtn.style.border = '1px solid var(--accent-solid)';
                    
                    this.fullBtn.style.background = 'transparent';
                    this.fullBtn.style.color = 'rgba(255,255,255,0.6)';
                    this.fullBtn.style.border = '1px solid rgba(255,255,255,0.2)';
                } else {
                    this.fullBtn.style.background = 'var(--accent-solid)';
                    this.fullBtn.style.color = '#fff';
                    this.fullBtn.style.border = '1px solid var(--accent-solid)';
                    
                    this.thumbBtn.style.background = 'transparent';
                    this.thumbBtn.style.color = 'rgba(255,255,255,0.6)';
                    this.thumbBtn.style.border = '1px solid rgba(255,255,255,0.2)';
                }
            } else {
                this.sizeToggleRow.style.display = 'none';
            }
        } else {
            this.preview.style.backgroundImage = 'none';
            this.preview.textContent = window.escmsEditor?.i18n?.t('controls.no_image') || 'No Image';
            this.modeSelect.element.style.display = 'none';
            this.sizeToggleRow.style.display = 'none';
        }
    }
}
