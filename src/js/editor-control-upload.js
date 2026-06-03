class EscmsUploadControl {
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

        const label = document.createElement('div');
        label.className = 'inspector-label';
        label.setAttribute('data-i18n', this.labelKey);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'center';

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.value = this.value;
        this.input.style.flex = '1';
        this.input.style.background = '#121212';
        this.input.style.border = '1px solid rgba(255,255,255,0.05)';
        this.input.style.color = 'var(--text-solid)';
        this.input.style.padding = '4px 8px';
        this.input.style.borderRadius = '4px';
        this.input.style.fontSize = '0.75rem';
        this.input.style.boxSizing = 'border-box';

        this.input.addEventListener('input', (e) => {
            this.value = e.target.value;
            if (this.onChange) this.onChange(this.value);
        });

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = '<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="128" y1="216" x2="128" y2="40"></line><polyline points="56 112 128 40 200 112"></polyline></svg>';
        this.uploadBtn.title = 'Upload File';
        this.uploadBtn.style.background = 'var(--accent-solid)';
        this.uploadBtn.style.border = 'none';
        this.uploadBtn.style.color = 'var(--text-solid)';
        this.uploadBtn.style.padding = '0';
        this.uploadBtn.style.width = '28px';
        this.uploadBtn.style.height = '28px';
        this.uploadBtn.style.borderRadius = '4px';
        this.uploadBtn.style.cursor = 'pointer';
        this.uploadBtn.style.display = 'flex';
        this.uploadBtn.style.alignItems = 'center';
        this.uploadBtn.style.justifyContent = 'center';
        this.uploadBtn.style.flexShrink = '0';

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

        row.appendChild(this.input);
        row.appendChild(this.uploadBtn);
        row.appendChild(this.fileInput);

        this.element.appendChild(label);
        this.element.appendChild(row);
    }

    setValue(val, triggerChange = true) {
        this.value = val;
        if (this.input) this.input.value = val;
        if (triggerChange && this.onChange) {
            this.onChange(val);
        }
    }
}

class EscmsBgImageControl {
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
        this.preview.textContent = 'No Image';

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = '<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="128" y1="216" x2="128" y2="40"></line><polyline points="56 112 128 40 200 112"></polyline></svg>';
        this.uploadBtn.title = 'Upload Background Image';
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
        this.clearBtn.title = 'Clear Image';
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

        this.element.appendChild(label);
        this.element.appendChild(row);

        // Dropdown Mode
        const modeOptions = [
            { label: 'Cover (Fill)', value: 'cover' },
            { label: 'Contain (Fit)', value: 'contain' },
            { label: 'Pattern (Repeat)', value: 'pattern' }
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
        } else {
            this.preview.style.backgroundImage = 'none';
            this.preview.textContent = 'No Image';
            this.modeSelect.element.style.display = 'none'; // Ocultar dropdown si no hay imagen
        }
    }
}
