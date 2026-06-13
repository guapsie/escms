import { icons } from '../../core/editor-icons.js';
import { EscmsSelect, EscmsButtonGroup, EscmsSlider } from './editor-controls.js';
import { el } from '../../core/escms-dom.js';

export class EscmsTextInput {
    constructor(labelKey, initialValue, onChangeCallback) {
        this.labelKey = labelKey;
        this.value = initialValue || '';
        this.onChange = onChangeCallback;

        this.input = el('input', {
            type: 'text',
            value: this.value,
            class: 'escms-spacing-input',
            style: 'background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 4px; padding: 0.35rem; text-align: left;'
        });

        this.input.addEventListener('input', (e) => {
            this.value = e.target.value;
            if (this.onChange) this.onChange(this.value);
        });

        this.element = el('div', { class: 'escms-control-row' }, [
            el('div', { 'data-i18n': this.labelKey, class: 'escms-ui-label' }),
            this.input
        ]);
    }
    setValue(val, triggerCallback = false) {
        this.value = val;
        this.input.value = val;
        if (triggerCallback && this.onChange) this.onChange(this.value);
    }
}

export class EscmsLayoutControl {
    constructor(i18n, onStyleChange, onVarChange) {
        this.i18n = i18n;
        this.onStyleChange = onStyleChange;
        this.onVarChange = onVarChange;
        
        this.element = el('div', { class: 'escms-layout-control', style: 'margin-bottom: 1rem;' });
        this.controls = {};
        this.isSyncing = false;
        
        this._buildUI();
    }
    
    _buildUI() {
        this.controls.display = new EscmsSelect('inspector.display', [
            { value: '', label: 'Inherit' },
            { value: 'block', label: 'Block' },
            { value: 'inline-block', label: 'Inline Block' },
            { value: 'flexbox', label: 'Flexbox' },
            { value: 'grid', label: 'Grid' },
            { value: 'none', label: 'None' }
        ], '', (val) => {
            if (this.isSyncing) return;
            if (val === 'flexbox' || val === 'grid') {
                this.onStyleChange('display', '');
                this._handleLayoutAttr(val);
                if (val === 'grid') {
                    let view = 'desktop';
                    if (window.escmsEditor && window.escmsEditor.canvas) view = window.escmsEditor.canvas.activeView || 'desktop';
                    const suffix = view === 'phone' ? '-p' : view === 'tablet' ? '-t' : '-d';
                    
                    const node = window.escmsEditor.inspector.selectedNode;
                    if (node) {
                        if (!node.style.getPropertyValue('--l-cols' + suffix)) this.onVarChange('--l-cols' + suffix, '1fr 1fr');
                        if (!node.style.getPropertyValue('--l-rows' + suffix)) this.onVarChange('--l-rows' + suffix, 'auto');
                    }
                }
            } else {
                this._handleLayoutAttr('');
                this.onStyleChange('display', val);
            }
            this._updateVisibility(val);
        });
        
        this.element.appendChild(this.controls.display.element);

        this.flexContainer = el('div', { style: 'display: none; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;' });
        
        this.controls.flexDir = new EscmsButtonGroup('inspector.flex_direction', [
            { value: 'row', icon: icons.arrowRight || '→' },
            { value: 'column', icon: icons.arrowDown || '↓' },
            { value: 'row-reverse', icon: icons.arrowLeft || '←' },
            { value: 'column-reverse', icon: icons.arrowUp || '↑' }
        ], 'row', (val) => this._updateVar('--l-dir', val));
        this.flexContainer.appendChild(this.controls.flexDir.element);
        
        this.controls.flexWrap = new EscmsButtonGroup('inspector.flex_wrap', [
            { value: 'nowrap', icon: 'No Wrap' },
            { value: 'wrap', icon: 'Wrap' }
        ], 'nowrap', (val) => this._updateVar('--l-wrap', val));
        this.flexContainer.appendChild(this.controls.flexWrap.element);

        this.controls.justifyContent = new EscmsButtonGroup('inspector.justify_content', [
            { value: 'flex-start', icon: icons.layoutAlignLeft || 'L' },
            { value: 'center', icon: icons.layoutAlignCenter || 'C' },
            { value: 'flex-end', icon: icons.layoutAlignRight || 'R' },
            { value: 'space-between', icon: icons.layoutAlignHorizontalStretch || 'Spc' }
        ], 'flex-start', (val) => this._updateVar('--l-jc', val));
        this.flexContainer.appendChild(this.controls.justifyContent.element);

        this.controls.alignItems = new EscmsButtonGroup('inspector.align_items', [
            { value: 'flex-start', icon: icons.layoutAlignTop || 'T' },
            { value: 'center', icon: icons.layoutAlignMiddle || 'M' },
            { value: 'flex-end', icon: icons.layoutAlignBottom || 'B' },
            { value: 'stretch', icon: icons.layoutAlignVerticalStretch || 'Str' }
        ], 'stretch', (val) => this._updateVar('--l-ai', val));
        this.flexContainer.appendChild(this.controls.alignItems.element);

        this.element.appendChild(this.flexContainer);

        this.gridContainer = el('div', { style: 'display: none; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;' });
        
        this.controls.gridCols = new EscmsTextInput('inspector.grid_columns', '1fr 1fr', (val) => this._updateVar('--l-cols', val));
        this.gridContainer.appendChild(this.controls.gridCols.element);

        this.controls.gridRows = new EscmsTextInput('inspector.grid_rows', 'auto', (val) => this._updateVar('--l-rows', val));
        this.gridContainer.appendChild(this.controls.gridRows.element);

        this.element.appendChild(this.gridContainer);

        this.sharedContainer = el('div', { style: 'display: none; margin-top: 0.5rem;' });
        this.controls.gap = new EscmsSlider('inspector.gap', 0, 100, 1, 0, (val) => this._updateVar('--l-gap', val + 'px'), 'px');
        this.sharedContainer.appendChild(this.controls.gap.element);
        this.element.appendChild(this.sharedContainer);
    }

    _handleLayoutAttr(val) {
        if (!window.escmsEditor || !window.escmsEditor.inspector.selectedNode) return;
        const node = window.escmsEditor.inspector.selectedNode;
        if (val) node.setAttribute('data-escms-layout', val);
        else node.removeAttribute('data-escms-layout');
        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    _updateVar(baseVar, val) {
        if (this.isSyncing) return;
        
        let view = 'desktop';
        if (window.escmsEditor && window.escmsEditor.canvas) {
            view = window.escmsEditor.canvas.activeView || 'desktop';
        }
        
        const suffix = view === 'phone' ? '-p' : view === 'tablet' ? '-t' : '-d';
        this.onVarChange(baseVar + suffix, val);
    }

    _updateVisibility(displayMode) {
        this.flexContainer.style.display = displayMode === 'flexbox' ? 'flex' : 'none';
        this.gridContainer.style.display = displayMode === 'grid' ? 'flex' : 'none';
        this.sharedContainer.style.display = (displayMode === 'flexbox' || displayMode === 'grid') ? 'block' : 'none';
    }

    setValue(node) {
        this.isSyncing = true;
        
        let layoutAttr = node.getAttribute('data-escms-layout');
        let inlineDisplay = node.style.display;
        
        let currentMode = layoutAttr || inlineDisplay || '';
        this.controls.display.setValue(currentMode, false);
        this._updateVisibility(currentMode);

        let view = 'desktop';
        if (window.escmsEditor && window.escmsEditor.canvas) {
            view = window.escmsEditor.canvas.activeView || 'desktop';
        }
        const suffix = view === 'phone' ? '-p' : view === 'tablet' ? '-t' : '-d';

        const getVar = (baseVar, defaultVal) => node.style.getPropertyValue(baseVar + suffix) || defaultVal;

        if (currentMode === 'flexbox') {
            this.controls.flexDir.setValue(getVar('--l-dir', 'row'), false);
            this.controls.flexWrap.setValue(getVar('--l-wrap', 'nowrap'), false);
            this.controls.justifyContent.setValue(getVar('--l-jc', 'flex-start'), false);
            this.controls.alignItems.setValue(getVar('--l-ai', 'stretch'), false);
        } else if (currentMode === 'grid') {
            this.controls.gridCols.setValue(getVar('--l-cols', '1fr 1fr'), false);
            this.controls.gridRows.setValue(getVar('--l-rows', 'auto'), false);
        }

        if (currentMode === 'flexbox' || currentMode === 'grid') {
            let gapStr = getVar('--l-gap', '0px');
            this.controls.gap.setValue(parseInt(gapStr) || 0, false);
        }

        this.isSyncing = false;
    }
}
