class EscmsEffectsControl {
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

        const label = document.createElement('div');
        label.className = 'inspector-label';
        label.setAttribute('data-i18n', this.labelKey);
        this.element.appendChild(label);

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
        selectContainer.style.display = 'flex';
        selectContainer.style.gap = '0.5rem';
        selectContainer.style.marginBottom = '0.5rem';

        const select = document.createElement('select');
        select.style.flex = '1';
        select.style.background = '#121212';
        select.style.border = '1px solid rgba(255,255,255,0.05)';
        select.style.color = 'var(--text-solid)';
        select.style.padding = '0.4rem';
        select.style.borderRadius = '4px';

        filterTypes.forEach(ft => {
            const opt = document.createElement('option');
            opt.value = ft.id;
            opt.textContent = ft.label;
            select.appendChild(opt);
        });

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Filter';
        addBtn.style.background = 'var(--accent-solid)';
        addBtn.style.color = 'var(--text-solid)';
        addBtn.style.border = 'none';
        addBtn.style.padding = '0.4rem 0.8rem';
        addBtn.style.borderRadius = '4px';
        addBtn.style.cursor = 'pointer';

        selectContainer.appendChild(select);
        selectContainer.appendChild(addBtn);
        this.element.appendChild(selectContainer);

        this.slidersContainer = document.createElement('div');
        this.slidersContainer.style.display = 'flex';
        this.slidersContainer.style.flexDirection = 'column';
        this.slidersContainer.style.gap = '0.5rem';
        this.element.appendChild(this.slidersContainer);

        addBtn.addEventListener('click', () => {
            const filterId = select.value;
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

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '0.5rem';

            const name = document.createElement('span');
            name.textContent = def.label;
            name.style.fontSize = '0.75rem';
            name.style.color = 'var(--text-solid)';
            name.style.width = '60px';

            const numericVal = parseFloat(val);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = def.max;
            slider.value = numericVal;
            slider.style.flex = '1';

            const valDisplay = document.createElement('span');
            valDisplay.textContent = val;
            valDisplay.style.fontSize = '0.75rem';
            valDisplay.style.color = 'var(--text-faint)';
            valDisplay.style.width = '40px';
            valDisplay.style.textAlign = 'right';

            const delBtn = document.createElement('button');
            delBtn.innerHTML = icons.trash;
            delBtn.style.background = 'transparent';
            delBtn.style.border = 'none';
            delBtn.style.color = '#ef4444';
            delBtn.style.cursor = 'pointer';
            delBtn.style.width = '20px';
            delBtn.style.height = '20px';
            const svg = delBtn.querySelector('svg');
            if (svg) { svg.style.width = '12px'; svg.style.height = '12px'; }

            slider.addEventListener('input', (e) => {
                const newVal = e.target.value + def.unit;
                valDisplay.textContent = newVal;
                this.activeFilters[filterId] = newVal;
                this.triggerChange();
            });

            delBtn.addEventListener('click', () => {
                delete this.activeFilters[filterId];
                this.renderSliders(filterTypes);
                this.triggerChange();
            });

            row.appendChild(name);
            row.appendChild(slider);
            row.appendChild(valDisplay);
            row.appendChild(delBtn);
            this.slidersContainer.appendChild(row);
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
