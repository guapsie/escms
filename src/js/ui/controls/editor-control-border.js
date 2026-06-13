import { EscmsSelect, EscmsSlider, EscmsColorPicker } from './editor-controls.js';

export class EscmsBorderControl {
    constructor(labelKey, i18n, initialValues = { width: 0, style: 'solid', color: '#000000', alpha: 100 }, onChangeCallback) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.values = { ...initialValues };
        this.onChange = onChangeCallback;
        this.element = this.render();
    }

    render() {
        const container = document.createElement('div');
        container.style.marginTop = '1rem';
        container.style.paddingTop = '1rem';
        container.style.borderTop = '1px solid rgba(255, 255, 255, 0.05)';
        container.style.marginBottom = '1rem';

        const label = document.createElement('div');
        if (this.labelKey) label.setAttribute('data-i18n', this.labelKey);
        label.style.fontSize = '0.75rem';
        label.style.fontWeight = '600';
        label.style.letterSpacing = '1px';
        label.style.textTransform = 'uppercase';
        label.style.color = 'rgba(245, 245, 245, 0.6)';
        label.style.paddingBottom = '0.25rem';
        label.style.marginBottom = '0.5rem';

        this.widthSlider = new EscmsSlider('inspector.border_width', 0, 20, 1, this.values.width, (val) => {
            this.values.width = val;
            this.triggerChange();
        }, 'px');

        this.styleSelect = new EscmsSelect('inspector.border_style', [
            { value: 'none', label: 'None' },
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' }
        ], this.values.style, (val) => {
            this.values.style = val;
            this.triggerChange();
        });

        this.colorPicker = new EscmsColorPicker('inspector.border_color', this.values.color, this.values.alpha, (val) => {
            this.values.color = val.hex;
            this.values.alpha = val.alpha;
            this.values.rgba = val.rgba;
            this.triggerChange();
        });

        this.radiusSlider = new EscmsSlider('inspector.radius', 0, 500, 1, this.values.radius || 0, (val) => {
            this.values.radius = val;
            this.triggerChange();
        }, 'px');

        container.appendChild(label);
        
        container.appendChild(this.styleSelect.element);
        container.appendChild(this.colorPicker.element);
        container.appendChild(this.widthSlider.element);
        container.appendChild(this.radiusSlider.element);

        return container;
    }

    triggerChange() {
        if (this.onChange) {
            let rgba = this.values.rgba;
            if (!rgba) {
                let r = parseInt(this.values.color.slice(1, 3), 16);
                let g = parseInt(this.values.color.slice(3, 5), 16);
                let b = parseInt(this.values.color.slice(5, 7), 16);
                rgba = `rgba(${r}, ${g}, ${b}, ${this.values.alpha / 100})`;
            }
            this.onChange({
                width: this.values.width,
                style: this.values.style,
                color: this.values.color,
                alpha: this.values.alpha,
                radius: this.values.radius || 0,
                rgba: rgba,
                cssString: this.values.style === 'none' || this.values.width === 0 ? 'none' : `${this.values.width}px ${this.values.style} ${rgba}`
            });
        }
    }

    setValue(newValues, triggerCallback = false) {
        let changed = false;
        if (newValues.width !== undefined && this.values.width !== newValues.width) {
            this.values.width = newValues.width;
            this.widthSlider.setValue(newValues.width, false);
            changed = true;
        }
        if (newValues.style !== undefined && this.values.style !== newValues.style) {
            this.values.style = newValues.style;
            this.styleSelect.setValue(newValues.style, false);
            changed = true;
        }
        if (newValues.color !== undefined && this.values.color !== newValues.color || newValues.alpha !== undefined && this.values.alpha !== newValues.alpha) {
            this.values.color = newValues.color || this.values.color;
            this.values.alpha = newValues.alpha !== undefined ? newValues.alpha : this.values.alpha;
            this.colorPicker.setValue(this.values.color, this.values.alpha, false);
            changed = true;
        }
        if (newValues.radius !== undefined && this.values.radius !== newValues.radius) {
            this.values.radius = newValues.radius;
            this.radiusSlider.setValue(newValues.radius, false);
            changed = true;
        }
        if (changed && triggerCallback) {
            this.triggerChange();
        }
    }
}
