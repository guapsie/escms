class EscmsToggle {
    constructor(labelKey, initialState = false, onChangeCallback) {
        this.labelKey = labelKey;
        this.state = initialState;
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';
        container.style.marginBottom = '0.5rem';
        container.style.cursor = 'pointer';

        const label = document.createElement('span');
        label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.85rem';
        label.style.color = 'var(--text-solid)';

        this.pill = document.createElement('div');
        this.pill.style.width = '36px';
        this.pill.style.height = '20px';
        this.pill.style.borderRadius = '12px';
        this.pill.style.position = 'relative';
        this.pill.style.transition = 'all 0.2s ease';
        this.pill.style.border = '1px solid rgba(255, 255, 255, 0.05)';

        this.ball = document.createElement('div');
        this.ball.style.width = '16px';
        this.ball.style.height = '16px';
        this.ball.style.borderRadius = '50%';
        this.ball.style.background = '#ffffff';
        this.ball.style.position = 'absolute';
        this.ball.style.top = '2px';
        this.ball.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';

        this.updateStyles();

        this.pill.appendChild(this.ball);
        container.appendChild(label);
        container.appendChild(this.pill);

        container.addEventListener('click', () => {
            this.state = !this.state;
            this.updateStyles();
            if (this.onChange) this.onChange(this.state);
        });

        return container;
    }

    updateStyles() {
        if (this.state) {
            this.pill.style.background = 'var(--accent-solid)';
            this.pill.style.borderColor = 'var(--accent-solid)';
            this.pill.style.boxShadow = '0 0 10px var(--accent-faint)';
            this.ball.style.transform = 'translateX(18px)';
        } else {
            this.pill.style.background = '#1f1f1f';
            this.pill.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            this.pill.style.boxShadow = 'none';
            this.ball.style.transform = 'translateX(2px)';
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
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.marginBottom = '0.5rem';

        const label = document.createElement('div');
        label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.marginBottom = '0.35rem';

        this.button = document.createElement('div');
        this.button.style.display = 'flex';
        this.button.style.justifyContent = 'space-between';
        this.button.style.alignItems = 'center';
        this.button.style.background = '#121212';
        this.button.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        this.button.style.borderRadius = '6px';
        this.button.style.padding = '0.5rem 0.75rem';
        this.button.style.fontSize = '0.85rem';
        this.button.style.cursor = 'pointer';
        this.button.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
        
        this.selectedText = document.createElement('span');
        const selectedOption = this.options.find(o => o.value === this.value);
        this.selectedText.textContent = selectedOption ? selectedOption.label : '';

        const arrow = document.createElement('span');
        arrow.innerHTML = '&#9662;'; // Triángulo nativo para evitar cargar más SVGs de la cuenta
        arrow.style.fontSize = '0.7rem';
        arrow.style.color = 'rgba(245, 245, 245, 0.4)';

        this.button.appendChild(this.selectedText);
        this.button.appendChild(arrow);

        this.dropdown = document.createElement('div');
        this.dropdown.style.position = 'absolute';
        this.dropdown.style.top = '100%';
        this.dropdown.style.left = '0';
        this.dropdown.style.width = '100%';
        this.dropdown.style.marginTop = '0.25rem';
        this.dropdown.style.background = 'rgba(10, 10, 10, 0.8)';
        this.dropdown.style.backdropFilter = 'blur(10px)';
        this.dropdown.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.dropdown.style.borderRadius = '6px';
        this.dropdown.style.zIndex = '100';
        this.dropdown.style.display = 'none';
        this.dropdown.style.flexDirection = 'column';
        this.dropdown.style.overflow = 'hidden';
        this.dropdown.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';

        this.options.forEach(opt => {
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.style.padding = '0.5rem 0.75rem';
            item.style.fontSize = '0.85rem';
            item.style.cursor = 'pointer';
            item.style.transition = 'background 0.2s';
            
            item.addEventListener('mouseenter', () => item.style.background = 'var(--accent-faint)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.value = opt.value;
                this.selectedText.textContent = opt.label;
                this.close();
                if (this.onChange) this.onChange(this.value);
            });
            this.dropdown.appendChild(item);
        });

        container.appendChild(label);
        container.appendChild(this.button);
        container.appendChild(this.dropdown);

        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', () => {
            if (this.isOpen) this.close();
        });

        return container;
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.dropdown.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.button.style.borderColor = 'var(--accent-faint)';
            this.button.style.boxShadow = '0 0 10px var(--accent-faint)';
        } else {
            this.button.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            this.button.style.boxShadow = 'none';
        }
    }

    close() {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
        this.button.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        this.button.style.boxShadow = 'none';
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
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.marginBottom = '1rem';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.5rem';

        const label = document.createElement('div');
        if (this.labelKey) label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.color = 'rgba(245, 245, 245, 0.6)';

        this.valDisplay = document.createElement('div');
        this.valDisplay.style.fontSize = '0.75rem';
        this.valDisplay.style.color = 'var(--text-solid)';
        this.valDisplay.style.fontFamily = 'monospace';
        this.valDisplay.textContent = `${this.value}${this.unit}`;

        header.appendChild(label);
        header.appendChild(this.valDisplay);

        const trackContainer = document.createElement('div');
        trackContainer.style.position = 'relative';
        trackContainer.style.height = '16px';
        trackContainer.style.display = 'flex';
        trackContainer.style.alignItems = 'center';
        trackContainer.style.cursor = 'pointer';

        this.track = document.createElement('div');
        this.track.style.width = '100%';
        this.track.style.height = '4px';
        this.track.style.background = 'rgba(255, 255, 255, 0.1)';
        this.track.style.borderRadius = '2px';
        this.track.style.position = 'relative';

        this.fill = document.createElement('div');
        this.fill.style.height = '100%';
        this.fill.style.background = 'var(--accent-solid)';
        this.fill.style.borderRadius = '2px';
        this.fill.style.width = '0%';
        this.fill.style.pointerEvents = 'none';

        this.thumb = document.createElement('div');
        this.thumb.style.width = '12px';
        this.thumb.style.height = '12px';
        this.thumb.style.background = '#fff';
        this.thumb.style.borderRadius = '50%';
        this.thumb.style.position = 'absolute';
        this.thumb.style.top = '50%';
        this.thumb.style.transform = 'translate(-50%, -50%)';
        this.thumb.style.left = '0%';
        this.thumb.style.transition = 'box-shadow 0.2s ease';
        this.thumb.style.pointerEvents = 'none';

        this.track.appendChild(this.fill);
        this.track.appendChild(this.thumb);
        trackContainer.appendChild(this.track);

        container.appendChild(header);
        container.appendChild(trackContainer);

        const updateFromEvent = (e) => {
            const rect = this.track.getBoundingClientRect();
            let pct = (e.clientX - rect.left) / rect.width;
            pct = Math.max(0, Math.min(1, pct));
            
            let rawVal = this.min + pct * (this.max - this.min);
            let steppedVal = Math.round(rawVal / this.step) * this.step;
            this.setValue(steppedVal, true);
        };

        trackContainer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.thumb.style.boxShadow = '0 0 0 4px var(--accent-faint)';
            updateFromEvent(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            updateFromEvent(e);
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.thumb.style.boxShadow = 'none';
            }
        });

        this.updateUI();
        return container;
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
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.marginBottom = '0.5rem';

        const label = document.createElement('div');
        label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.marginBottom = '0.35rem';

        this.button = document.createElement('div');
        this.button.style.display = 'flex';
        this.button.style.alignItems = 'center';
        this.button.style.gap = '0.5rem';
        this.button.style.background = '#121212';
        this.button.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        this.button.style.borderRadius = '6px';
        this.button.style.padding = '0.4rem 0.5rem';
        this.button.style.cursor = 'pointer';
        
        this.swatchContainer = document.createElement('div');
        this.swatchContainer.style.width = '24px';
        this.swatchContainer.style.height = '24px';
        this.swatchContainer.style.borderRadius = '4px';
        this.swatchContainer.style.position = 'relative';
        this.swatchContainer.style.overflow = 'hidden';
        this.swatchContainer.style.border = '1px solid rgba(255,255,255,0.1)';
        this.swatchContainer.style.background = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'><rect width=\'4\' height=\'4\' fill=\'%23333\'/><rect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23333\'/><rect x=\'4\' width=\'4\' height=\'4\' fill=\'%23555\'/><rect y=\'4\' width=\'4\' height=\'4\' fill=\'%23555\'/></svg>")';

        this.swatchColor = document.createElement('div');
        this.swatchColor.style.width = '100%';
        this.swatchColor.style.height = '100%';
        this.swatchColor.style.pointerEvents = 'none';

        this.nativeInput = document.createElement('input');
        this.nativeInput.type = 'color';
        this.nativeInput.value = this.hex;
        this.nativeInput.style.position = 'absolute';
        this.nativeInput.style.inset = '-5px';
        this.nativeInput.style.width = '40px';
        this.nativeInput.style.height = '40px';
        this.nativeInput.style.opacity = '0';
        this.nativeInput.style.cursor = 'pointer';

        this.swatchContainer.appendChild(this.swatchColor);
        this.swatchContainer.appendChild(this.nativeInput);

        this.hexInput = document.createElement('input');
        this.hexInput.type = 'text';
        this.hexInput.style.fontFamily = 'monospace';
        this.hexInput.style.fontSize = '0.85rem';
        this.hexInput.style.color = 'var(--text-solid)';
        this.hexInput.style.background = 'transparent';
        this.hexInput.style.border = 'none';
        this.hexInput.style.outline = 'none';
        this.hexInput.style.width = '70px';
        this.hexInput.style.flex = '1';
        this.hexInput.style.textTransform = 'uppercase';

        this.alphaDisplay = document.createElement('div');
        this.alphaDisplay.style.fontSize = '0.75rem';
        this.alphaDisplay.style.color = 'rgba(245, 245, 245, 0.4)';

        this.button.appendChild(this.swatchContainer);
        this.button.appendChild(this.hexInput);
        this.button.appendChild(this.alphaDisplay);

        this.dropdown = document.createElement('div');
        this.dropdown.style.position = 'absolute';
        this.dropdown.style.top = '100%';
        this.dropdown.style.left = '0';
        this.dropdown.style.width = '100%';
        this.dropdown.style.marginTop = '0.25rem';
        this.dropdown.style.background = 'rgba(10, 10, 10, 0.95)';
        this.dropdown.style.backdropFilter = 'blur(10px)';
        this.dropdown.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        this.dropdown.style.borderRadius = '6px';
        this.dropdown.style.zIndex = '100';
        this.dropdown.style.display = 'none';
        this.dropdown.style.padding = '1rem 1rem 0.5rem 1rem';
        this.dropdown.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        this.dropdown.style.boxSizing = 'border-box';

        this.alphaSlider = new EscmsSlider(null, 0, 100, 1, this.alpha, (val) => {
            this.alpha = val;
            this.updateUI();
            this.triggerChange();
        }, '%');

        this.dropdown.appendChild(this.alphaSlider.element);

        container.appendChild(label);
        container.appendChild(this.button);
        container.appendChild(this.dropdown);

        this.nativeInput.addEventListener('input', (e) => {
            this.hex = e.target.value;
            this.updateUI();
            this.triggerChange();
        });

        this.hexInput.addEventListener('change', (e) => {
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
                this.updateUI();
            }
        });

        this.hexInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.hexInput.blur();
        });

        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target !== this.nativeInput && e.target !== this.hexInput) {
                this.toggle();
            }
        });

        this.dropdown.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => { if (this.isOpen) this.close(); });

        this.updateUI();
        return container;
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
        this.dropdown.style.display = this.isOpen ? 'block' : 'none';
        this.button.style.borderColor = this.isOpen ? 'var(--accent-faint)' : 'rgba(255, 255, 255, 0.05)';
        this.button.style.boxShadow = this.isOpen ? '0 0 10px var(--accent-faint)' : 'none';
    }

    close() {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
        this.button.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        this.button.style.boxShadow = 'none';
    }
}

class EscmsSpacing {
    constructor(labelKey, initialValues = {t:0, r:0, b:0, l:0}, onChangeCallback) {
        this.labelKey = labelKey;
        this.values = { ...initialValues };
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.marginBottom = '1rem';

        const label = document.createElement('div');
        label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.marginBottom = '0.5rem';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '0.5rem';

        const sides = [
            { key: 't', icon: '&#8593;' },
            { key: 'r', icon: '&#8594;' },
            { key: 'b', icon: '&#8595;' },
            { key: 'l', icon: '&#8592;' }
        ];

        sides.forEach(side => {
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.alignItems = 'center';
            wrap.style.background = '#121212';
            wrap.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            wrap.style.borderRadius = '4px';
            wrap.style.padding = '0.25rem';
            wrap.style.transition = 'border-color 0.2s';

            const icon = document.createElement('div');
            icon.innerHTML = side.icon;
            icon.style.fontSize = '0.65rem';
            icon.style.color = 'rgba(245, 245, 245, 0.3)';
            icon.style.marginBottom = '0.1rem';

            const input = document.createElement('input');
            input.type = 'number';
            input.value = this.values[side.key];
            input.style.width = '100%';
            input.style.background = 'transparent';
            input.style.border = 'none';
            input.style.color = 'var(--text-solid)';
            input.style.fontSize = '0.8rem';
            input.style.textAlign = 'center';
            input.style.outline = 'none';
            input.style.padding = '0';
            
            // Css inline hack to hide arrows across all browsers seamlessly
            input.style.appearance = 'textfield';
            input.style.MozAppearance = 'textfield';
            
            input.addEventListener('focus', () => wrap.style.borderColor = 'var(--accent-faint)');
            input.addEventListener('blur', () => wrap.style.borderColor = 'rgba(255, 255, 255, 0.05)');

            input.addEventListener('input', (e) => {
                this.values[side.key] = parseInt(e.target.value) || 0;
                if (this.onChange) this.onChange(this.values);
            });

            wrap.appendChild(icon);
            wrap.appendChild(input);
            grid.appendChild(wrap);
        });

        const style = document.createElement('style');
        style.textContent = `
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none; margin: 0;
            }
        `;
        container.appendChild(style);
        container.appendChild(label);
        container.appendChild(grid);

        return container;
    }
}