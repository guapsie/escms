class EscmsGradientControl {
    constructor(labelKey, i18n, initialValues = { type: 'linear', angle: 90, c1: '#3b82f6', a1: 100, stop1: 0, c2: '#1e3a8a', a2: 100, stop2: 100, enabled: false }, onChangeCallback) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.values = { type: 'linear', stop1: 0, stop2: 100, ...initialValues };
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.marginBottom = '1rem';
        container.style.padding = '0.75rem';
        container.style.background = '#121212';
        container.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        container.style.borderRadius = '6px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.75rem';

        const label = document.createElement('div');
        if (this.labelKey) label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.fontWeight = '600';
        label.style.color = 'rgba(245, 245, 245, 0.8)';
        label.style.letterSpacing = '0.5px';

        this.enableToggle = new EscmsToggle(null, this.values.enabled, (val) => {
            this.values.enabled = val;
            this.bodyWrapper.style.display = val ? 'block' : 'none';
            this.triggerChange();
        });

        header.appendChild(label);
        header.appendChild(this.enableToggle.element);
        container.appendChild(header);

        this.bodyWrapper = document.createElement('div');
        this.bodyWrapper.style.display = this.values.enabled ? 'block' : 'none';
        this.bodyWrapper.style.marginTop = '0.5rem';

        this.typeSelect = new EscmsSelect(null, [
            { label: 'Linear', value: 'linear' },
            { label: 'Radial (Glow)', value: 'radial' }
        ], this.values.type, (val) => {
            this.values.type = val;
            this.angleSlider.element.style.display = val === 'linear' ? 'block' : 'none';
            this.triggerChange();
        });

        this.angleSlider = new EscmsSlider(null, 0, 360, 1, this.values.angle, (val) => {
            this.values.angle = val;
            this.triggerChange();
        }, 'deg');
        this.angleSlider.element.style.display = this.values.type === 'linear' ? 'block' : 'none';
        
        const colorsRow = document.createElement('div');
        colorsRow.style.display = 'grid';
        colorsRow.style.gridTemplateColumns = '1fr';
        colorsRow.style.gap = '0.5rem';
        
        this.color1Picker = new EscmsColorPicker(null, this.values.c1, this.values.a1, (val) => {
            this.values.c1 = val.hex;
            this.values.a1 = val.alpha;
            this.values.rgba1 = val.rgba;
            this.triggerChange();
        });

        this.stop1Slider = new EscmsSlider(null, 0, 100, 1, this.values.stop1, (val) => {
            this.values.stop1 = val;
            this.triggerChange();
        }, '%');
        this.stop1Slider.element.style.marginTop = '0.5rem';

        this.color2Picker = new EscmsColorPicker(null, this.values.c2, this.values.a2, (val) => {
            this.values.c2 = val.hex;
            this.values.a2 = val.alpha;
            this.values.rgba2 = val.rgba;
            this.triggerChange();
        });

        this.stop2Slider = new EscmsSlider(null, 0, 100, 1, this.values.stop2, (val) => {
            this.values.stop2 = val;
            this.triggerChange();
        }, '%');
        this.stop2Slider.element.style.marginTop = '0.5rem';

        const col1Wrap = document.createElement('div');
        col1Wrap.appendChild(this.color1Picker.element);
        col1Wrap.appendChild(this.stop1Slider.element);
        
        const col2Wrap = document.createElement('div');
        col2Wrap.appendChild(this.color2Picker.element);
        col2Wrap.appendChild(this.stop2Slider.element);

        colorsRow.appendChild(col1Wrap);
        colorsRow.appendChild(col2Wrap);
        
        this.bodyWrapper.appendChild(this.typeSelect.element);
        this.bodyWrapper.appendChild(this.angleSlider.element);
        this.bodyWrapper.appendChild(colorsRow);

        container.appendChild(this.bodyWrapper);

        return container;
    }

    _hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
    }

    triggerChange() {
        if (this.onChange) {
            if (!this.values.enabled) {
                this.onChange({ enabled: false, cssString: 'none' });
                return;
            }

            let rgba1 = this.values.rgba1 || this._hexToRgba(this.values.c1, this.values.a1);
            let rgba2 = this.values.rgba2 || this._hexToRgba(this.values.c2, this.values.a2);
            
            let cssStr = '';
            if (this.values.type === 'radial') {
                cssStr = `radial-gradient(circle, ${rgba1} ${this.values.stop1}%, ${rgba2} ${this.values.stop2}%)`;
            } else {
                cssStr = `linear-gradient(${this.values.angle}deg, ${rgba1} ${this.values.stop1}%, ${rgba2} ${this.values.stop2}%)`;
            }
            
            this.onChange({
                enabled: true,
                type: this.values.type,
                angle: this.values.angle,
                c1: this.values.c1,
                a1: this.values.a1,
                stop1: this.values.stop1,
                c2: this.values.c2,
                a2: this.values.a2,
                stop2: this.values.stop2,
                cssString: cssStr
            });
        }
    }

    setValue(newValues, triggerCallback = false) {
        let changed = false;
        
        if (newValues.enabled !== undefined && this.values.enabled !== newValues.enabled) {
            this.values.enabled = newValues.enabled;
            this.enableToggle.setValue(newValues.enabled, false);
            this.bodyWrapper.style.display = newValues.enabled ? 'block' : 'none';
            changed = true;
        }

        if (newValues.type !== undefined && this.values.type !== newValues.type) {
            this.values.type = newValues.type;
            this.typeSelect.setValue(newValues.type, false);
            this.angleSlider.element.style.display = newValues.type === 'linear' ? 'block' : 'none';
            changed = true;
        }

        if (newValues.angle !== undefined && this.values.angle !== newValues.angle) {
            this.values.angle = newValues.angle;
            this.angleSlider.setValue(newValues.angle, false);
            changed = true;
        }

        if ((newValues.c1 !== undefined && this.values.c1 !== newValues.c1) || (newValues.a1 !== undefined && this.values.a1 !== newValues.a1)) {
            this.values.c1 = newValues.c1 || this.values.c1;
            this.values.a1 = newValues.a1 !== undefined ? newValues.a1 : this.values.a1;
            this.color1Picker.setValue(this.values.c1, this.values.a1, false);
            changed = true;
        }

        if ((newValues.c2 !== undefined && this.values.c2 !== newValues.c2) || (newValues.a2 !== undefined && this.values.a2 !== newValues.a2)) {
            this.values.c2 = newValues.c2 || this.values.c2;
            this.values.a2 = newValues.a2 !== undefined ? newValues.a2 : this.values.a2;
            this.color2Picker.setValue(this.values.c2, this.values.a2, false);
            changed = true;
        }

        if (newValues.stop1 !== undefined && this.values.stop1 !== newValues.stop1) {
            this.values.stop1 = newValues.stop1;
            this.stop1Slider.setValue(newValues.stop1, false);
            changed = true;
        }

        if (newValues.stop2 !== undefined && this.values.stop2 !== newValues.stop2) {
            this.values.stop2 = newValues.stop2;
            this.stop2Slider.setValue(newValues.stop2, false);
            changed = true;
        }

        if (changed && triggerCallback) {
            this.triggerChange();
        }
    }
}
