class EscmsToggle {
    constructor(labelKey, initialState = false, onChangeCallback) {
        this.labelKey = labelKey;
        this.state = initialState;
        this.onChange = onChangeCallback;
        
        this.ball = el('div', { class: 'escms-toggle-ball' });
        this.pill = el('div', { class: 'escms-toggle-pill' }, this.ball);
        
        this.element = el('div', { 
            class: 'escms-toggle-container escms-ui-mb',
            onclick: () => {
                this.state = !this.state;
                this.updateStyles();
                if (this.onChange) this.onChange(this.state);
            }
        }, [
            el('span', { 'data-i18n': this.labelKey, class: 'escms-toggle-label' }),
            this.pill
        ]);

        this.updateStyles();
    }

    updateStyles() {
        if (this.state) {
            this.pill.classList.add('active');
        } else {
            this.pill.classList.remove('active');
        }
    }

    setValue(newState, triggerCallback = false) {
        if (this.state !== newState) {
            this.state = newState;
            this.updateStyles();
            if (triggerCallback && this.onChange) this.onChange(this.state);
        }
    }
}

class EscmsSelect {
    constructor(labelKey, optionsArray, selectedValue, onChangeCallback) {
        this.labelKey = labelKey;
        this.options = optionsArray;
        this.value = selectedValue;
        this.onChange = onChangeCallback;
        this.isOpen = false;
        
        this.selectedText = el('span', {}, this._getSelectedLabel());
        
        this.button = el('div', { 
            class: 'escms-select-btn',
            onclick: (e) => {
                e.stopPropagation();
                this.toggle();
            }
        }, [
            this.selectedText,
            el('span', { class: 'escms-select-arrow', html: '&#9662;' })
        ]);

        this.dropdown = el('div', { class: 'escms-dropdown escms-select-dropdown' });
        this._renderOptions();

        this.element = el('div', { class: 'escms-select-container escms-ui-mb' }, [
            this.labelKey ? el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label' }) : null,
            this.button,
            this.dropdown
        ]);

        document.addEventListener('click', () => { if (this.isOpen) this.close(); });
    }

    _getSelectedLabel() {
        const opt = this.options.find(o => o.value === this.value);
        return opt ? opt.label : '';
    }

    _renderOptions() {
        this.dropdown.innerHTML = '';
        this.options.forEach(opt => {
            this.dropdown.appendChild(el('div', {
                class: 'escms-select-item',
                onclick: (e) => {
                    e.stopPropagation();
                    this.value = opt.value;
                    this.selectedText.textContent = opt.label;
                    this.close();
                    if (this.onChange) this.onChange(this.value);
                }
            }, opt.label));
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.dropdown.classList.add('open');
            this.button.classList.add('open');
        } else {
            this.dropdown.classList.remove('open');
            this.button.classList.remove('open');
        }
    }

    close() {
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        this.button.classList.remove('open');
    }

    setValue(newVal, triggerCallback = false) {
        if (this.value !== newVal) {
            this.value = newVal;
            this.selectedText.textContent = this._getSelectedLabel();
            if (triggerCallback && this.onChange) this.onChange(this.value);
        }
    }

    updateOptions(newOptions) {
        this.options = newOptions;
        this._renderOptions();
        const selectedOption = this.options.find(o => o.value === this.value);
        if (selectedOption) {
            this.selectedText.textContent = selectedOption.label;
        } else if (this.options.length > 0) {
            this.setValue(this.options[0].value, false);
        } else {
            this.selectedText.textContent = '';
        }
    }
}

class EscmsSlider {
    constructor(labelKey, min = 0, max = 100, step = 1, initialValue = 50, onChangeCallback, unit = '') {
        this.labelKey = labelKey;
        this.min = min;
        this.max = max;
        this.step = step;
        this.value = initialValue;
        this.onChange = onChangeCallback;
        this.unit = unit;
        this.isDragging = false;
        
        this.valDisplay = el('div', { class: 'escms-slider-val' }, `${this.value}${this.unit}`);
        
        this.fill = el('div', { class: 'escms-slider-fill' });
        this.thumb = el('div', { class: 'escms-slider-thumb' });
        this.track = el('div', { class: 'escms-slider-track' }, [this.fill, this.thumb]);
        
        const trackContainer = el('div', { 
            class: 'escms-slider-track-container',
            onmousedown: (e) => {
                this.isDragging = true;
                this.thumb.classList.add('dragging');
                this._updateFromEvent(e);
            }
        }, this.track);

        this.element = el('div', { class: 'escms-ui-mb-lg' }, [
            el('div', { class: 'escms-slider-header' }, [
                this.labelKey ? el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label', style: { marginBottom: '0' } }) : el('div'),
                this.valDisplay
            ]),
            trackContainer
        ]);

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) this._updateFromEvent(e);
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.thumb.classList.remove('dragging');
            }
        });

        this.updateUI();
    }

    _updateFromEvent(e) {
        const rect = this.track.getBoundingClientRect();
        let pct = (e.clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        let rawVal = this.min + pct * (this.max - this.min);
        let steppedVal = Math.round(rawVal / this.step) * this.step;
        this.setValue(steppedVal, true);
    }

    setValue(newVal, triggerCallback = false) {
        newVal = Math.max(this.min, Math.min(this.max, newVal));
        if (this.value !== newVal) {
            this.value = newVal;
            this.updateUI();
            if (triggerCallback && this.onChange) this.onChange(this.value);
        }
    }

    updateUI() {
        const pct = ((this.value - this.min) / (this.max - this.min)) * 100;
        this.fill.style.width = `${pct}%`;
        this.thumb.style.left = `${pct}%`;
        this.valDisplay.textContent = `${this.value}${this.unit}`;
    }
}

class EscmsColorPicker {
    constructor(labelKey, initialHex = '#3b82f6', initialAlpha = 100, onChangeCallback) {
        this.labelKey = labelKey;
        this.hex = initialHex;
        this.alpha = initialAlpha;
        this.onChange = onChangeCallback;
        this.isOpen = false;
        
        this.swatchColor = el('div', { class: 'escms-color-swatch' });
        this.nativeInput = el('input', { 
            type: 'color', 
            class: 'escms-color-native-input', 
            value: this.hex,
            oninput: (e) => {
                this.hex = e.target.value;
                this.updateUI();
                this.triggerChange();
            }
        });

        this.hexInput = el('input', {
            type: 'text',
            class: 'escms-color-hex-input',
            onchange: (e) => this._handleHexInputChange(e),
            onkeydown: (e) => { if (e.key === 'Enter') this.hexInput.blur(); }
        });

        this.alphaDisplay = el('div', { class: 'escms-color-alpha-display' });
        
        this.button = el('div', { 
            class: 'escms-color-btn',
            onclick: (e) => {
                e.stopPropagation();
                if (e.target !== this.nativeInput && e.target !== this.hexInput) this.toggle();
            }
        }, [
            el('div', { class: 'escms-color-swatch-container' }, [this.swatchColor, this.nativeInput]),
            this.hexInput,
            this.alphaDisplay
        ]);

        this.alphaSlider = new EscmsSlider(null, 0, 100, 1, this.alpha, (val) => {
            this.alpha = val;
            this.updateUI();
            this.triggerChange();
        }, '%');

        this.dropdown = el('div', { 
            class: 'escms-dropdown escms-color-dropdown',
            onclick: (e) => e.stopPropagation()
        }, this.alphaSlider.element);

        this.element = el('div', { class: 'escms-ui-mb' }, [
            this.labelKey ? el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label' }) : null,
            this.button,
            this.dropdown
        ]);

        document.addEventListener('click', () => { if (this.isOpen) this.close(); });
        this.updateUI();
    }

    _handleHexInputChange(e) {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        
        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(val)) {
            if (val.length === 4) {
                this.hex = `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
                this.alpha = 100;
            } else if (val.length === 5) {
                this.hex = `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
                this.alpha = Math.round((parseInt(val[4] + val[4], 16) / 255) * 100);
            } else if (val.length === 7) {
                this.hex = val;
                this.alpha = 100;
            } else if (val.length === 9) {
                this.hex = val.slice(0, 7);
                this.alpha = Math.round((parseInt(val.slice(7, 9), 16) / 255) * 100);
            }
            
            this.alphaSlider.setValue(this.alpha, false);
            this.updateUI();
            this.triggerChange();
        } else {
            this.updateUI(); // Revert on invalid
        }
    }

    updateUI() {
        let alphaHex = Math.round((this.alpha / 100) * 255).toString(16).padStart(2, '0');
        let displayHex = this.alpha === 100 ? this.hex : this.hex + alphaHex;
        
        this.swatchColor.style.background = displayHex;
        this.hexInput.value = displayHex.toUpperCase();
        this.alphaDisplay.textContent = `${this.alpha}%`;
        this.nativeInput.value = this.hex;
    }

    triggerChange() {
        if (this.onChange) {
            let r = parseInt(this.hex.slice(1, 3), 16);
            let g = parseInt(this.hex.slice(3, 5), 16);
            let b = parseInt(this.hex.slice(5, 7), 16);
            this.onChange({ hex: this.hex, alpha: this.alpha, rgba: `rgba(${r}, ${g}, ${b}, ${this.alpha / 100})` });
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.dropdown.classList.add('open-block');
            this.button.classList.add('open');
        } else {
            this.dropdown.classList.remove('open-block');
            this.button.classList.remove('open');
        }
    }

    close() {
        this.isOpen = false;
        this.dropdown.classList.remove('open-block');
        this.button.classList.remove('open');
    }

    setValue(hex, alpha = 100, triggerCallback = false) {
        if (this.hex !== hex || this.alpha !== alpha) {
            this.hex = hex;
            this.alpha = alpha;
            this.alphaSlider.setValue(this.alpha, false);
            this.updateUI();
            if (triggerCallback) this.triggerChange();
        }
    }
}

class EscmsSpacing {
    constructor(labelKey, initialValues = {t:0, r:0, b:0, l:0}, onChangeCallback) {
        this.labelKey = labelKey;
        this.values = { ...initialValues };
        this.onChange = onChangeCallback;
        this.inputs = {};
        
        const sides = [
            { key: 't', icon: '&#8593;' },
            { key: 'r', icon: '&#8594;' },
            { key: 'b', icon: '&#8595;' },
            { key: 'l', icon: '&#8592;' }
        ];

        const grid = el('div', { class: 'escms-spacing-grid' }, sides.map(side => {
            const input = el('input', {
                type: 'number',
                class: 'escms-spacing-input',
                value: this.values[side.key],
                oninput: (e) => {
                    this.values[side.key] = parseInt(e.target.value) || 0;
                    if (this.onChange) this.onChange(this.values);
                }
            });
            this.inputs[side.key] = input;
            
            return el('div', { class: 'escms-spacing-wrap' }, [
                el('div', { class: 'escms-spacing-icon', html: side.icon }),
                input
            ]);
        }));

        this.element = el('div', { class: 'escms-ui-mb-lg' }, [
            this.labelKey ? el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label' }) : null,
            grid
        ]);
    }

    setValue(newValues, triggerCallback = false) {
        let changed = false;
        ['t', 'r', 'b', 'l'].forEach(key => {
            if (newValues[key] !== undefined && this.values[key] !== newValues[key]) {
                this.values[key] = newValues[key];
                if (this.inputs[key]) this.inputs[key].value = this.values[key];
                changed = true;
            }
        });
        if (changed && triggerCallback && this.onChange) {
            this.onChange(this.values);
        }
    }
}

class EscmsButtonGroup {
    constructor(labelKey, buttons, initialValue, onChangeCallback, isMulti = false) {
        this.labelKey = labelKey;
        this.buttons = buttons;
        this.isMulti = isMulti;
        this.value = isMulti && !Array.isArray(initialValue) ? (initialValue ? [initialValue] : []) : initialValue;
        this.onChange = onChangeCallback;
        this.btnElements = {};
        
        const group = el('div', { class: 'escms-btn-group' }, this.buttons.map(btnInfo => {
            const isActive = this.isMulti ? this.value.includes(btnInfo.value) : this.value === btnInfo.value;
            const btn = el('button', {
                class: 'escms-btn-group-btn ' + (isActive ? 'active' : ''),
                html: btnInfo.icon,
                onclick: () => {
                    if (this.isMulti) {
                        let newValues = [...this.value];
                        if (newValues.includes(btnInfo.value)) {
                            newValues = newValues.filter(v => v !== btnInfo.value);
                        } else {
                            newValues.push(btnInfo.value);
                        }
                        this.setValue(newValues, true);
                    } else {
                        this.setValue(btnInfo.value, true);
                    }
                }
            });
            this.btnElements[btnInfo.value] = btn;
            return btn;
        }));

        this.element = el('div', { class: 'escms-ui-mb' }, [
            this.labelKey ? el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label' }) : null,
            group
        ]);
    }

    setValue(newValue, triggerCallback = false) {
        let changed = false;
        if (this.isMulti) {
            changed = JSON.stringify(this.value) !== JSON.stringify(newValue);
            this.value = [...newValue];
        } else {
            changed = this.value !== newValue;
            this.value = newValue;
        }

        if (changed || !triggerCallback) {
            Object.keys(this.btnElements).forEach(val => {
                const btn = this.btnElements[val];
                const isActive = this.isMulti ? this.value.includes(val) : this.value === val;
                if (isActive) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            if (triggerCallback && this.onChange) this.onChange(this.value);
        }
    }
}