import { icons } from '../../core/editor-icons.js';
import { EscmsSlider, EscmsSelect } from './editor-controls.js';

export class EscmsEffectsControl {
    constructor(labelKey, i18n, value = '', onChange = null) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.value = value || '';
        this.onChange = onChange;
        this.element = null;
        this.activeFilters = {};
        this.parseValue();
        this.render();
    }

    parseValue() {
        this.activeFilters = {};
        if (!this.value || this.value === 'none') return;
        const matches = this.value.match(/([a-z-]+)\(([^)]+)\)/g);
        if (matches) {
            matches.forEach(match => {
                const parts = match.match(/([a-z-]+)\(([^)]+)\)/);
                if (parts) {
                    this.activeFilters[parts[1]] = parts[2];
                }
            });
        }
    }

    buildCssString() {
        const parts = [];
        for (const [filter, val] of Object.entries(this.activeFilters)) {
            if (val && val !== '0%' && val !== '0px') {
                parts.push(`${filter}(${val})`);
            }
        }
        return parts.length > 0 ? parts.join(' ') : 'none';
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'inspector-control';
        this.element.style.marginBottom = '1rem';

        const topRow = document.createElement('div');
        topRow.className = 'escms-control-row';
        topRow.style.marginBottom = '0.5rem';

        const label = document.createElement('div');
        label.className = 'escms-ui-label';
        label.setAttribute('data-i18n', this.labelKey);

        const filterTypes = [
            { id: 'grayscale', label: 'Grayscale', unit: '%', max: 100 },
            { id: 'sepia', label: 'Sepia', unit: '%', max: 100 },
            { id: 'saturate', label: 'Saturate', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'blur', label: 'Blur', unit: 'px', max: 20 },
            { id: 'brightness', label: 'Brightness', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'contrast', label: 'Contrast', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'hue-rotate', label: 'Hue Rotate', unit: 'deg', max: 360 },
            { id: 'invert', label: 'Invert', unit: '%', max: 100 }
        ];

        const selectContainer = document.createElement('div');
        selectContainer.style.display = 'grid';
        selectContainer.style.gridTemplateColumns = '1fr auto';
        selectContainer.style.gap = '4px';

        const filterSelect = new EscmsSelect(null, filterTypes.map(f => ({ value: f.id, label: f.label })), filterTypes[0].id, () => {});
        const selectInner = filterSelect.element.querySelector('.escms-select-container');

        const addBtn = document.createElement('button');
        addBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"></path><path d="M5 12l14 0"></path></svg>`;
        addBtn.style.background = 'var(--accent-solid)';
        addBtn.style.color = 'var(--text-solid)';
        addBtn.style.border = 'none';
        addBtn.style.padding = '0';
        addBtn.style.width = '24px';
        addBtn.style.height = '24px';
        addBtn.style.borderRadius = '4px';
        addBtn.style.cursor = 'pointer';
        addBtn.style.display = 'flex';
        addBtn.style.alignItems = 'center';
        addBtn.style.justifyContent = 'center';

        selectContainer.appendChild(selectInner);
        selectContainer.appendChild(addBtn);

        topRow.appendChild(label);
        topRow.appendChild(selectContainer);
        this.element.appendChild(topRow);

        this.slidersContainer = document.createElement('div');
        this.slidersContainer.style.display = 'flex';
        this.slidersContainer.style.flexDirection = 'column';
        this.slidersContainer.style.gap = '0.5rem';
        this.element.appendChild(this.slidersContainer);

        addBtn.addEventListener('click', () => {
            const filterId = filterSelect.value;
            if (this.activeFilters[filterId]) return; // Already exists
            
            const def = filterTypes.find(f => f.id === filterId);
            this.activeFilters[filterId] = def.defaultVal || ('0' + def.unit);
            this.renderSliders(filterTypes);
            this.triggerChange();
        });

        this.renderSliders(filterTypes);
    }

    renderSliders(filterTypes) {
        this.slidersContainer.innerHTML = '';
        for (const [filterId, val] of Object.entries(this.activeFilters)) {
            const def = filterTypes.find(f => f.id === filterId);
            if (!def) continue;

            const numericVal = parseFloat(val);

            const slider = new EscmsSlider(null, 0, def.max, 1, numericVal, (newVal) => {
                const strVal = newVal + def.unit;
                this.activeFilters[filterId] = strVal;
                this.triggerChange();
            }, def.unit);

            // Set the left label
            const labelContainer = slider.element.children[0];
            labelContainer.textContent = def.label;
            labelContainer.className = 'escms-ui-label';
            labelContainer.style.width = '80px';
            labelContainer.style.flexShrink = '0';

            // Set the right column to fill remaining space
            const rightSide = slider.element.children[1];
            rightSide.style.flex = '1';

            // Add delete button to header
            const header = slider.element.querySelector('.escms-slider-header');
            if (header) {
                header.style.display = 'flex';
                header.style.justifyContent = 'flex-end';
                header.style.alignItems = 'center';
                header.style.gap = '8px';

                const delBtn = document.createElement('button');
                delBtn.innerHTML = icons.trash;
                delBtn.style.background = 'transparent';
                delBtn.style.border = 'none';
                delBtn.style.color = '#ef4444';
                delBtn.style.cursor = 'pointer';
                delBtn.style.width = '14px';
                delBtn.style.height = '14px';
                delBtn.style.padding = '0';
                delBtn.style.display = 'flex';
                delBtn.style.alignItems = 'center';
                delBtn.style.justifyContent = 'center';
                
                const svg = delBtn.querySelector('svg');
                if (svg) { svg.style.width = '12px'; svg.style.height = '12px'; }

                delBtn.addEventListener('click', () => {
                    delete this.activeFilters[filterId];
                    this.renderSliders(filterTypes);
                    this.triggerChange();
                });

                header.appendChild(delBtn);
            }

            this.slidersContainer.appendChild(slider.element);
        }
    }

    triggerChange() {
        this.value = this.buildCssString();
        if (this.onChange) this.onChange(this.value);
    }

    setValue(val, triggerChange = true) {
        this.value = val || '';
        this.parseValue();
        // re-render sliders with empty list? No, we just recreate the element entirely to make it simpler, but we can't because it's attached.
        // We will just clear the container and re-render.
        // Wait, we need filterTypes to re-render.
        const filterTypes = [
            { id: 'grayscale', label: 'Grayscale', unit: '%', max: 100 },
            { id: 'sepia', label: 'Sepia', unit: '%', max: 100 },
            { id: 'saturate', label: 'Saturate', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'blur', label: 'Blur', unit: 'px', max: 20 },
            { id: 'brightness', label: 'Brightness', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'contrast', label: 'Contrast', unit: '%', max: 200, defaultVal: '100%' },
            { id: 'hue-rotate', label: 'Hue Rotate', unit: 'deg', max: 360 },
            { id: 'invert', label: 'Invert', unit: '%', max: 100 }
        ];
        this.renderSliders(filterTypes);
        if (triggerChange && this.onChange) this.onChange(this.value);
    }
}
