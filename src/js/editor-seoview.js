class EscmsSeoView {
    constructor() {
        this.view = null;
        this.inputs = {};
        this.data = {
            slug: '',
            title: '',
            description: '',
            keywords: '',
            language: 'en'
        };
    }

    init(container) {
        this.view = document.createElement('div');
        this.view.id = 'escms-seo-view';
        this.view.style.flex = '1';
        this.view.style.overflow = 'auto';
        this.view.style.backgroundColor = '#0a0a0a';
        this.view.style.display = 'none';
        this.view.style.flexDirection = 'column';
        this.view.style.alignItems = 'center';
        this.view.style.padding = '3rem 2rem';

        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '600px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '1.5rem';

        const title = document.createElement('h2');
        title.textContent = 'Page SEO Settings';
        title.style.margin = '0 0 1rem 0';
        title.style.fontSize = '1.25rem';
        title.style.fontWeight = '600';
        title.style.color = 'var(--text-solid)';
        wrapper.appendChild(title);

        const createInput = (key, label, type = 'text', placeholder = '') => {
            const group = document.createElement('div');
            group.style.display = 'flex';
            group.style.flexDirection = 'column';
            group.style.gap = '0.5rem';

            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.fontSize = '0.85rem';
            lbl.style.color = 'rgba(245, 245, 245, 0.8)';

            let input;
            if (type === 'textarea') {
                input = document.createElement('textarea');
                input.style.resize = 'vertical';
                input.style.minHeight = '100px';
            } else {
                input = document.createElement('input');
                input.type = type;
            }

            input.placeholder = placeholder;
            input.style.width = '100%';
            input.style.backgroundColor = '#1f1f1f';
            input.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            input.style.color = '#f5f5f5';
            input.style.borderRadius = '6px';
            input.style.padding = '0.75rem 1rem';
            input.style.fontFamily = 'inherit';
            input.style.fontSize = '0.9rem';
            input.style.boxSizing = 'border-box';
            input.style.outline = 'none';
            input.style.transition = 'box-shadow 0.2s ease, border-color 0.2s ease';

            input.addEventListener('focus', () => {
                input.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                input.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                input.style.boxShadow = 'none';
            });

            input.addEventListener('input', (e) => {
                this.data[key] = e.target.value;
                window.dispatchEvent(new CustomEvent('escms-seo-changed', { detail: this.data }));
            });

            this.inputs[key] = input;
            group.appendChild(lbl);
            group.appendChild(input);
            return group;
        };

        wrapper.appendChild(createInput('slug', 'URL Slug', 'text', 'my-page-url'));
        wrapper.appendChild(createInput('title', 'Page Title', 'text', 'My Awesome Page'));
        wrapper.appendChild(createInput('description', 'Meta Description', 'textarea', 'A brief description of this page...'));
        wrapper.appendChild(createInput('keywords', 'Keywords', 'text', 'keyword1, keyword2, keyword3'));
        wrapper.appendChild(createInput('language', 'Language Code', 'text', 'en'));

        this.view.appendChild(wrapper);
        container.appendChild(this.view);

        window.addEventListener('escms-view-change', (e) => {
            if (e.detail.viewId === 'seo') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    show() {
        if (this.view) this.view.style.display = 'flex';
    }

    hide() {
        if (this.view) this.view.style.display = 'none';
    }

    setData(data) {
        this.data = { ...this.data, ...data };
        Object.keys(this.inputs).forEach(key => {
            if (this.data[key] !== undefined) {
                this.inputs[key].value = this.data[key];
            }
        });
    }
}
