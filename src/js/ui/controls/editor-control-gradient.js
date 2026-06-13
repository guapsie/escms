import { EscmsToggle, EscmsSelect, EscmsSlider, EscmsColorPicker } from './editor-controls.js';

export class EscmsGradientControl {
    constructor(labelKey, i18n, initialValues = { type: 'none', posX: 50, posY: 50, angle: 135, animate: false, c1: '#ec4899', a1: 100, c2: '#8b5cf6', a2: 100, c3: '#3b82f6', a3: 100 }, onChangeCallback) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.values = { type: 'none', posX: 50, posY: 50, angle: 135, animate: false, c1: '#ec4899', a1: 100, c2: '#8b5cf6', a2: 100, c3: '#3b82f6', a3: 100, ...initialValues };
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');

        this.typeSelect = new EscmsSelect(this.labelKey, [
            { label: 'None', value: 'none' },
            { label: 'Linear', value: 'linear' },
            { label: 'Radial', value: 'radial' },
            { label: 'Mesh (Aurora)', value: 'mesh' }
        ], this.values.type, (val) => {
            this.values.type = val;
            this.posXSlider.element.style.display = (val === 'radial' || val === 'mesh') ? 'grid' : 'none';
            this.posYSlider.element.style.display = (val === 'radial' || val === 'mesh') ? 'grid' : 'none';
            this.angleSlider.element.style.display = (val === 'linear') ? 'grid' : 'none';
            this.stopSlider.element.style.display = (val !== 'none') ? 'grid' : 'none';
            this.blurSlider.element.style.display = (val !== 'none') ? 'grid' : 'none';
            this.colorsRow.style.display = (val !== 'none') ? 'block' : 'none';
            this.animateToggle.element.style.display = (val !== 'none') ? 'flex' : 'none';
            this.triggerChange();
        });
        
        this.posXSlider = new EscmsSlider('inspector.pos_x', -100, 200, 1, this.values.posX !== undefined ? this.values.posX : 50, (val) => {
            this.values.posX = val;
            this.triggerChange();
        }, '%');
        this.posXSlider.element.style.display = (this.values.type === 'radial' || this.values.type === 'mesh') ? 'grid' : 'none';

        this.posYSlider = new EscmsSlider('inspector.pos_y', -100, 200, 1, this.values.posY !== undefined ? this.values.posY : 50, (val) => {
            this.values.posY = val;
            this.triggerChange();
        }, '%');
        this.posYSlider.element.style.display = (this.values.type === 'radial' || this.values.type === 'mesh') ? 'grid' : 'none';

        this.angleSlider = new EscmsSlider('inspector.angle', 0, 360, 1, this.values.angle !== undefined ? this.values.angle : 135, (val) => {
            this.values.angle = val;
            this.triggerChange();
        }, 'deg');
        this.angleSlider.element.style.display = (this.values.type === 'linear') ? 'grid' : 'none';

        this.stopSlider = new EscmsSlider('inspector.gradient_stop', 0, 100, 1, this.values.stop !== undefined ? this.values.stop : 60, (val) => {
            this.values.stop = val;
            this.triggerChange();
        }, '%');
        this.stopSlider.element.style.display = (this.values.type !== 'none') ? 'grid' : 'none';
        
        this.blurSlider = new EscmsSlider('inspector.gradient_blur', 0, 200, 1, this.values.blur !== undefined ? this.values.blur : 60, (val) => {
            this.values.blur = val;
            this.triggerChange();
        }, 'px');
        this.blurSlider.element.style.display = (this.values.type !== 'none') ? 'grid' : 'none';
        
        this.animateToggle = new EscmsToggle('inspector.animate', this.values.animate, (val) => {
            this.values.animate = val;
            this.triggerChange();
        });

        this.colorsRow = document.createElement('div');
        this.colorsRow.style.display = this.values.type !== 'none' ? 'block' : 'none';
        
        this.color1Picker = new EscmsColorPicker('inspector.color_1', this.values.c1, this.values.a1, (val) => {
            this.values.c1 = val.hex; this.values.a1 = val.alpha; this.values.rgba1 = val.rgba; this.triggerChange();
        });

        this.color2Picker = new EscmsColorPicker('inspector.color_2', this.values.c2, this.values.a2, (val) => {
            this.values.c2 = val.hex; this.values.a2 = val.alpha; this.values.rgba2 = val.rgba; this.triggerChange();
        });
        
        this.color3Picker = new EscmsColorPicker('inspector.color_3', this.values.c3, this.values.a3, (val) => {
            this.values.c3 = val.hex; this.values.a3 = val.alpha; this.values.rgba3 = val.rgba; this.triggerChange();
        });

        this.colorsRow.appendChild(this.color1Picker.element);
        this.colorsRow.appendChild(this.color2Picker.element);
        this.colorsRow.appendChild(this.color3Picker.element);
        
        this.animateToggle.element.style.display = this.values.type !== 'none' ? 'flex' : 'none';

        container.appendChild(this.typeSelect.element);
        container.appendChild(this.posXSlider.element);
        container.appendChild(this.posYSlider.element);
        container.appendChild(this.angleSlider.element);
        container.appendChild(this.stopSlider.element);
        container.appendChild(this.blurSlider.element);
        container.appendChild(this.colorsRow);
        container.appendChild(this.animateToggle.element);

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
            if (this.values.type === 'none') {
                this.onChange({ enabled: false, type: 'none', cssString: 'none', animate: false });
                return;
            }

            let rgba1 = this.values.rgba1 || this._hexToRgba(this.values.c1, this.values.a1);
            let rgba2 = this.values.rgba2 || this._hexToRgba(this.values.c2, this.values.a2);
            let rgba3 = this.values.rgba3 || this._hexToRgba(this.values.c3, this.values.a3);
            
            let cssStr = '';
            let bgSize = '100% 100%';
            let bgRepeat = 'no-repeat';
            let animation = '';
            const posX = this.values.posX !== undefined ? this.values.posX : 50;
            const posY = this.values.posY !== undefined ? this.values.posY : 50;
            const stop = this.values.stop !== undefined ? this.values.stop : 60;
            const midStop = stop / 2;

            if (this.values.type === 'mesh') {
                let p1 = `${posX - 30}% ${posY + 50}%`;
                let p2 = `${posX + 30}% ${posY + 50}%`;
                let p3 = `${posX}% ${posY - 50}%`;
                
                cssStr = `radial-gradient(at ${p1}, ${rgba1} 0px, transparent ${stop}%), radial-gradient(at ${p2}, ${rgba2} 0px, transparent ${stop}%), radial-gradient(at ${p3}, ${rgba3} 0px, transparent ${stop}%)`;
                
                if (this.values.animate) {
                    bgSize = '130% 130%, 130% 130%, 130% 130%';
                    bgRepeat = 'no-repeat, no-repeat, no-repeat';
                    animation = 'escms-mesh-drift 12s ease-in-out infinite alternate';
                }
            } else if (this.values.type === 'radial') {
                cssStr = `radial-gradient(circle at ${posX}% ${posY}%, ${rgba1} 0%, ${rgba2} ${midStop}%, ${rgba3} ${stop}%)`;
                if (this.values.animate) {
                    bgSize = '400% 400%';
                    animation = 'escms-bg-pan 15s ease infinite';
                }
            } else {
                const ang = this.values.angle !== undefined ? this.values.angle : 135;
                cssStr = `linear-gradient(${ang}deg, ${rgba1} 0%, ${rgba2} ${midStop}%, ${rgba3} ${stop}%)`;
                if (this.values.animate) {
                    bgSize = '400% 400%';
                    animation = 'escms-bg-pan 15s ease infinite';
                }
            }
            
            this.onChange({
                enabled: true,
                type: this.values.type,
                posX: this.values.posX,
                posY: this.values.posY,
                angle: this.values.angle,
                stop: this.values.stop,
                blur: this.values.blur,
                animate: this.values.animate,
                c1: this.values.c1, a1: this.values.a1,
                c2: this.values.c2, a2: this.values.a2,
                c3: this.values.c3, a3: this.values.a3,
                rgba1: rgba1, rgba2: rgba2, rgba3: rgba3,
                cssString: cssStr,
                bgSize: bgSize,
                bgRepeat: bgRepeat,
                animation: animation
            });
        }
    }

    setValue(newValues, triggerCallback = false) {
        let changed = false;

        if (newValues.type !== undefined && this.values.type !== newValues.type) {
            this.values.type = newValues.type;
            this.typeSelect.setValue(newValues.type, false);
            this.posXSlider.element.style.display = (newValues.type === 'radial' || newValues.type === 'mesh') ? 'grid' : 'none';
            this.posYSlider.element.style.display = (newValues.type === 'radial' || newValues.type === 'mesh') ? 'grid' : 'none';
            this.angleSlider.element.style.display = (newValues.type === 'linear') ? 'grid' : 'none';
            this.stopSlider.element.style.display = (newValues.type !== 'none') ? 'grid' : 'none';
            this.blurSlider.element.style.display = (newValues.type !== 'none') ? 'grid' : 'none';
            this.colorsRow.style.display = (newValues.type !== 'none') ? 'block' : 'none';
            this.animateToggle.element.style.display = (newValues.type !== 'none') ? 'flex' : 'none';
            changed = true;
        }

        if (newValues.posX !== undefined && this.values.posX !== newValues.posX) {
            this.values.posX = newValues.posX;
            this.posXSlider.setValue(newValues.posX, false);
            changed = true;
        }

        if (newValues.posY !== undefined && this.values.posY !== newValues.posY) {
            this.values.posY = newValues.posY;
            this.posYSlider.setValue(newValues.posY, false);
            changed = true;
        }

        if (newValues.angle !== undefined && this.values.angle !== newValues.angle) {
            this.values.angle = newValues.angle;
            this.angleSlider.setValue(newValues.angle, false);
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
            if (newValues.rgba1) this.values.rgba1 = newValues.rgba1;
            this.color1Picker.setValue(this.values.c1, this.values.a1, false);
            changed = true;
        }

        if ((newValues.c2 !== undefined && this.values.c2 !== newValues.c2) || (newValues.a2 !== undefined && this.values.a2 !== newValues.a2)) {
            this.values.c2 = newValues.c2 || this.values.c2;
            this.values.a2 = newValues.a2 !== undefined ? newValues.a2 : this.values.a2;
            if (newValues.rgba2) this.values.rgba2 = newValues.rgba2;
            this.color2Picker.setValue(this.values.c2, this.values.a2, false);
            changed = true;
        }
        
        if ((newValues.c3 !== undefined && this.values.c3 !== newValues.c3) || (newValues.a3 !== undefined && this.values.a3 !== newValues.a3)) {
            this.values.c3 = newValues.c3 || this.values.c3;
            this.values.a3 = newValues.a3 !== undefined ? newValues.a3 : this.values.a3;
            if (newValues.rgba3) this.values.rgba3 = newValues.rgba3;
            this.color3Picker.setValue(this.values.c3, this.values.a3, false);
            changed = true;
        }

        if (changed && triggerCallback) {
            this.triggerChange();
        }
    }
}
