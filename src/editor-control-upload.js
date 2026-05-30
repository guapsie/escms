class EscmsUploadControl {
    constructor(labelKey, i18n, value = '', onChange = null) {
        this.labelKey = labelKey;
        this.i18n = i18n;
        this.value = value;
        this.onChange = onChange;
        this.element = null;
        this.input = null;
        this.uploadBtn = null;
        this.fileInput = null;
        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'inspector-control';

        const label = document.createElement('div');
        label.className = 'inspector-label';
        label.setAttribute('data-i18n', this.labelKey);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'center';

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.value = this.value;
        this.input.style.flex = '1';
        this.input.style.background = '#121212';
        this.input.style.border = '1px solid rgba(255,255,255,0.05)';
        this.input.style.color = 'var(--text-solid)';
        this.input.style.padding = '4px 8px';
        this.input.style.borderRadius = '4px';
        this.input.style.fontSize = '0.75rem';
        this.input.style.boxSizing = 'border-box';

        this.input.addEventListener('input', (e) => {
            this.value = e.target.value;
            if (this.onChange) this.onChange(this.value);
        });

        this.uploadBtn = document.createElement('button');
        this.uploadBtn.innerHTML = '<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="128" y1="216" x2="128" y2="40"></line><polyline points="56 112 128 40 200 112"></polyline></svg>';
        this.uploadBtn.title = 'Upload File';
        this.uploadBtn.style.background = 'var(--accent-solid)';
        this.uploadBtn.style.border = 'none';
        this.uploadBtn.style.color = 'var(--text-solid)';
        this.uploadBtn.style.padding = '0';
        this.uploadBtn.style.width = '28px';
        this.uploadBtn.style.height = '28px';
        this.uploadBtn.style.borderRadius = '4px';
        this.uploadBtn.style.cursor = 'pointer';
        this.uploadBtn.style.display = 'flex';
        this.uploadBtn.style.alignItems = 'center';
        this.uploadBtn.style.justifyContent = 'center';
        this.uploadBtn.style.flexShrink = '0';

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.style.display = 'none';

        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Optional: Show loading state
            this.uploadBtn.style.opacity = '0.5';
            this.uploadBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (data.status === 'success' && data.url) {
                    this.setValue(data.url, true);
                } else {
                    alert('Upload failed: ' + (data.msg || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Upload error');
            } finally {
                this.uploadBtn.style.opacity = '1';
                this.uploadBtn.disabled = false;
                this.fileInput.value = ''; // Reset
            }
        });

        row.appendChild(this.input);
        row.appendChild(this.uploadBtn);
        row.appendChild(this.fileInput);

        this.element.appendChild(label);
        this.element.appendChild(row);
    }

    setValue(val, triggerChange = true) {
        this.value = val;
        if (this.input) this.input.value = val;
        if (triggerChange && this.onChange) {
            this.onChange(val);
        }
    }
}
