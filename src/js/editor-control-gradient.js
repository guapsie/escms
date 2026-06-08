class EscmsGradientControl {
    constructor(labelKey, i18n, initialValues = { type: 'mesh', position: 'center', animate: false, c1: '#ec4899', a1: 100, c2: '#8b5cf6', a2: 100, c3: '#3b82f6', a3: 100, enabled: false }, onChangeCallback) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.values = { type: 'mesh', position: 'center', animate: false, c1: '#ec4899', a1: 100, c2: '#8b5cf6', a2: 100, c3: '#3b82f6', a3: 100, ...initialValues };
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.marginBottom = '1rem';
        container.style.padding = '0.75rem';
        container.style.background = 'rgba(255, 255, 255, 0.02)';
        container.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        container.style.borderRadius = '6px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.75rem';

        const label = document.createElement('div');
        if (this.labelKey) label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '11px';
        label.style.fontWeight = '600';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.letterSpacing = '0.5px';
        label.style.textTransform = 'uppercase';

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

        this.typeSelect = new EscmsSelect('inspector.gradient_type', [
            { label: 'Linear', value: 'linear' },
            { label: 'Radial', value: 'radial' },
            { label: 'Mesh (Aurora)', value: 'mesh' }
        ], this.values.type, (val) => {
            this.values.type = val;
            this.positionSelect.element.style.display = (val === 'radial' || val === 'mesh') ? 'grid' : 'none';
            this.stopSlider.element.style.display = (val === 'radial' || val === 'mesh') ? 'grid' : 'none';
            this.blurSlider.element.style.display = (val === 'mesh') ? 'grid' : 'none';
            this.triggerChange();
        });
        
        this.positionSelect = new EscmsSelect('inspector.position', [
            { label: 'Center', value: 'center' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' }
        ], this.values.position, (val) => {
            this.values.position = val;
            this.triggerChange();
        });
        this.positionSelect.element.style.display = (this.values.type === 'radial' || this.values.type === 'mesh') ? 'grid' : 'none';

        this.stopSlider = new EscmsSlider('inspector.gradient_stop', 0, 100, 1, this.values.stop !== undefined ? this.values.stop : 60, (val) => {
            this.values.stop = val;
            this.triggerChange();
        }, '%');
        
        this.blurSlider = new EscmsSlider('inspector.gradient_blur', 0, 200, 1, this.values.blur !== undefined ? this.values.blur : 60, (val) => {
            this.values.blur = val;
            this.triggerChange();
        }, 'px');
        this.blurSlider.element.style.display = this.values.type === 'mesh' ? 'grid' : 'none';
        
        this.animateToggle = new EscmsToggle('inspector.animate', this.values.animate, (val) => {
            this.values.animate = val;
            this.triggerChange();
        });

        const colorsRow = document.createElement('div');
        colorsRow.style.display = 'flex';
        colorsRow.style.flexDirection = 'column';
        colorsRow.style.gap = '0.5rem';
        colorsRow.style.marginTop = '0.75rem';
        colorsRow.style.marginBottom = '0.75rem';
        
        this.color1Picker = new EscmsColorPicker('inspector.color_1', this.values.c1, this.values.a1, (val) => {
            this.values.c1 = val.hex; this.values.a1 = val.alpha; this.values.rgba1 = val.rgba; this.triggerChange();
        });

        this.color2Picker = new EscmsColorPicker('inspector.color_2', this.values.c2, this.values.a2, (val) => {
            this.values.c2 = val.hex; this.values.a2 = val.alpha; this.values.rgba2 = val.rgba; this.triggerChange();
        });
        
        this.color3Picker = new EscmsColorPicker('inspector.color_3', this.values.c3, this.values.a3, (val) => {
            this.values.c3 = val.hex; this.values.a3 = val.alpha; this.values.rgba3 = val.rgba; this.triggerChange();
        });

        colorsRow.appendChild(this.color1Picker.element);
        colorsRow.appendChild(this.color2Picker.element);
        colorsRow.appendChild(this.color3Picker.element);
        
        this.bodyWrapper.appendChild(this.typeSelect.element);
        this.bodyWrapper.appendChild(this.positionSelect.element);
        this.bodyWrapper.appendChild(this.stopSlider.element);
        this.bodyWrapper.appendChild(this.blurSlider.element);
        this.bodyWrapper.appendChild(colorsRow);
        this.bodyWrapper.appendChild(this.animateToggle.element);

        container.appendChild(this.bodyWrapper);

        return container;
    }

    _hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16) || 0;
        let g = parseInt(hex.slice(3, 5), 16) || 0;
        let b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
    }

    triggerChange() {
        if (this.onChange) {
            if (!this.values.enabled) {
                this.onChange({ enabled: false, cssString: 'none', animate: false });
                return;
            }

            let rgba1 = this.values.rgba1 || this._hexToRgba(this.values.c1, this.values.a1);
            let rgba2 = this.values.rgba2 || this._hexToRgba(this.values.c2, this.values.a2);
            let rgba3 = this.values.rgba3 || this._hexToRgba(this.values.c3, this.values.a3);
            
            let cssStr = '';
            let bgSize = '';
            let bgRepeat = '';
            let animation = '';
            const pos = this.values.position || 'center';
            const stop = this.values.stop !== undefined ? this.values.stop : 60;
            const midStop = stop / 2;

            if (this.values.type === 'mesh') {
                let p1, p2, p3;
                if (pos === 'bottom') {
                    p1 = '20% 100%'; p2 = '80% 100%'; p3 = '50% 100%';
                } else if (pos === 'top') {
                    p1 = '20% 0%'; p2 = '80% 0%'; p3 = '50% 0%';
                } else if (pos === 'left') {
                    p1 = '0% 20%'; p2 = '0% 80%'; p3 = '0% 50%';
                } else if (pos === 'right') {
                    p1 = '100% 20%'; p2 = '100% 80%'; p3 = '100% 50%';
                } else {
                    p1 = '0% 0%'; p2 = '100% 0%'; p3 = '50% 100%';
                }
                cssStr = `radial-gradient(at ${p1}, ${rgba1} 0px, transparent ${stop}%), radial-gradient(at ${p2}, ${rgba2} 0px, transparent ${stop}%), radial-gradient(at ${p3}, ${rgba3} 0px, transparent ${stop}%)`;
                
                if (this.values.animate) {
                    bgSize = '130% 130%, 130% 130%, 130% 130%';
                    bgRepeat = 'no-repeat, no-repeat, no-repeat';
                    animation = 'escms-mesh-drift 12s ease-in-out infinite alternate';
                }
            } else if (this.values.type === 'radial') {
                cssStr = `radial-gradient(circle at ${pos}, ${rgba1} 0%, ${rgba2} ${midStop}%, ${rgba3} ${stop}%)`;
                if (this.values.animate) {
                    bgSize = '400% 400%';
                    animation = 'escms-bg-pan 15s ease infinite';
                }
            } else {
                cssStr = `linear-gradient(135deg, ${rgba1} 0%, ${rgba2} ${midStop}%, ${rgba3} ${stop}%)`;
                if (this.values.animate) {
                    bgSize = '400% 400%';
                    animation = 'escms-bg-pan 15s ease infinite';
                }
            }
            
            this.onChange({
                enabled: true,
                type: this.values.type,
                position: this.values.position,
                stop: this.values.stop,
                blur: this.values.blur,
                animate: this.values.animate,
                c1: this.values.c1, a1: this.values.a1,
                c2: this.values.c2, a2: this.values.a2,
                c3: this.values.c3, a3: this.values.a3,
                cssString: cssStr,
                bgSize: bgSize,
                bgRepeat: bgRepeat,
                animation: animation
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
            this.positionSelect.element.style.display = (newValues.type === 'radial' || newValues.type === 'mesh') ? 'grid' : 'none';
            changed = true;
        }

        if (newValues.position !== undefined && this.values.position !== newValues.position) {
            this.values.position = newValues.position;
            this.positionSelect.setValue(newValues.position, false);
            changed = true;
        }
        
        if (newValues.animate !== undefined && this.values.animate !== newValues.animate) {
            this.values.animate = newValues.animate;
            this.animateToggle.setValue(newValues.animate, false);
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
        
        if ((newValues.c3 !== undefined && this.values.c3 !== newValues.c3) || (newValues.a3 !== undefined && this.values.a3 !== newValues.a3)) {
            this.values.c3 = newValues.c3 || this.values.c3;
            this.values.a3 = newValues.a3 !== undefined ? newValues.a3 : this.values.a3;
            this.color3Picker.setValue(this.values.c3, this.values.a3, false);
            changed = true;
        }

        if (changed && triggerCallback) {
            this.triggerChange();
        }
    }
}
