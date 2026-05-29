class EscmsInspector {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
    }

    init() {
        this.container = document.getElementById('escms-inspector');
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.style.padding = '1.5rem';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '2rem';
        this.container.style.overflowY = 'auto';
        this.container.style.height = '100%';
        this.container.style.boxSizing = 'border-box';

        this.activeTagDisplay = document.createElement('div');
        this.activeTagDisplay.style.fontSize = '0.75rem';
        this.activeTagDisplay.style.color = 'var(--accent-solid)';
        this.activeTagDisplay.style.background = '#121212';
        this.activeTagDisplay.style.padding = '0.5rem';
        this.activeTagDisplay.style.borderRadius = '4px';
        this.activeTagDisplay.style.border = '1px solid var(--accent-faint)';
        this.activeTagDisplay.style.textAlign = 'center';
        this.activeTagDisplay.style.fontWeight = '600';
        this.activeTagDisplay.style.letterSpacing = '1px';
        this.activeTagDisplay.textContent = 'NO SELECTION';

        this.container.appendChild(this.activeTagDisplay);

        this.renderSections();

        window.addEventListener('escms-element-selected', (e) => {
            const node = e.detail.node;
            if (node) {
                this.activeTagDisplay.textContent = node.tagName;
            }
        });
    }

    renderSections() {
        const typoSection = this.createSection('inspector.typography');
        const tagSelect = new EscmsSelect(
            'inspector.html_tag',
            [
                { value: 'div', label: 'DIV Block' },
                { value: 'section', label: 'Section' },
                { value: 'p', label: 'Paragraph' },
                { value: 'h1', label: 'Heading 1' },
                { value: 'h2', label: 'Heading 2' }
            ],
            'div',
            (val) => console.log('[Inspector] Tag changed:', val)
        );
        typoSection.appendChild(tagSelect.element);

        const visSection = this.createSection('inspector.visibility');
        const hiddenToggle = new EscmsToggle(
            'inspector.hidden_element',
            false,
            (val) => console.log('[Inspector] Hidden changed:', val)
        );
        visSection.appendChild(hiddenToggle.element);

        const styleSection = this.createSection('inspector.styles');
        
        const colorPicker = new EscmsColorPicker(
            'inspector.text_color',
            '#f5f5f5',
            100,
            (val) => console.log('[Inspector] Text Color:', val)
        );
        styleSection.appendChild(colorPicker.element);

        const paddingControl = new EscmsSpacing(
            'inspector.padding',
            { t: 0, r: 0, b: 0, l: 0 },
            (val) => console.log('[Inspector] Padding:', val)
        );
        styleSection.appendChild(paddingControl.element);

        const opacitySlider = new EscmsSlider(
            'inspector.opacity',
            0, 100, 1, 100,
            (val) => console.log('[Inspector] Opacity:', val),
            '%'
        );
        styleSection.appendChild(opacitySlider.element);

        this.container.appendChild(typoSection);
        this.container.appendChild(visSection);
        this.container.appendChild(styleSection);
    }

    createSection(titleI18n) {
        const section = document.createElement('div');
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '1rem';

        const title = document.createElement('div');
        title.setAttribute('data-i18n', titleI18n);
        title.style.fontSize = '0.75rem';
        title.style.fontWeight = '600';
        title.style.letterSpacing = '1px';
        title.style.textTransform = 'uppercase';
        title.style.color = 'rgba(245, 245, 245, 0.4)';
        title.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        title.style.paddingBottom = '0.5rem';

        section.appendChild(title);
        return section;
    }
}