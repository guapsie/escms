import { EscmsToggle, EscmsButtonGroup, EscmsSlider, EscmsSpacing } from '../../controls/editor-controls.js';
import { EscmsLayoutControl } from '../../controls/editor-control-layout.js';
import { EscmsBorderControl } from '../../controls/editor-control-border.js';
import { icons } from '../../../core/editor-icons.js';

export function createLayoutSection(inspector) {
    const section = inspector.createSection('inspector.layout');

    inspector.controls.layoutModel = new EscmsLayoutControl(inspector.i18n, 
        (prop, val) => {
            if (!inspector.selectedNode || inspector.isSyncing) return;
            if (val === '') {
                if (prop === 'data-escms-layout') inspector.selectedNode.removeAttribute(prop);
                else inspector.selectedNode.style.removeProperty(prop);
            } else {
                if (prop === 'data-escms-layout') {
                    inspector.selectedNode.setAttribute(prop, val);
                    if (val === 'flexbox' || val === 'grid') {
                        Array.from(inspector.selectedNode.children).forEach(child => {
                            const m = child.style.margin;
                            const mLeft = child.style.marginLeft;
                            const mRight = child.style.marginRight;
                            if ((mLeft === 'auto' && mRight === 'auto') || m === '0px auto' || m === '0 auto' || 
                                (mLeft === '0px' && mRight === 'auto') || m === '0px auto 0px 0px' ||
                                (mLeft === 'auto' && mRight === '0px') || m === '0px 0px 0px auto') {
                                child.style.marginLeft = '';
                                child.style.marginRight = '';
                                child.style.margin = '';
                                if (child.style.display === 'block') child.style.display = '';
                            }
                        });
                    }
                } else {
                    inspector.selectedNode.style.setProperty(prop, val);
                }
            }
            window.dispatchEvent(new Event('escms-dom-mutated'));
        },
        (prop, val) => {
            if (!inspector.selectedNode || inspector.isSyncing) return;
            if (val === '') inspector.selectedNode.style.removeProperty(prop);
            else inspector.selectedNode.style.setProperty(prop, val);
            window.dispatchEvent(new Event('escms-dom-mutated'));
        }
    );
    section.appendChild(inspector.controls.layoutModel.element);

    inspector.controls.sticky = new EscmsToggle('inspector.sticky', false, (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        if (val) {
            inspector.selectedNode.style.position = 'sticky';
            inspector.selectedNode.style.top = '0px';
            inspector.selectedNode.style.zIndex = '50';
        } else {
            inspector.selectedNode.style.removeProperty('position');
            inspector.selectedNode.style.removeProperty('top');
            inspector.selectedNode.style.removeProperty('z-index');
        }
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.sticky.element);


    inspector.controls.navAlign = new EscmsButtonGroup('inspector.nav_align', [
        { value: 'flex-start', icon: icons.layoutAlignLeft || 'L' },
        { value: 'center', icon: icons.layoutAlignCenter || 'C' },
        { value: 'flex-end', icon: icons.layoutAlignRight || 'R' }
    ], 'flex-start', (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        const computedDisplay = window.getComputedStyle(inspector.selectedNode).display;
        if (computedDisplay !== 'grid' && computedDisplay !== 'flex') {
            inspector.selectedNode.style.display = 'flex';
        }
        inspector.selectedNode.style.justifyContent = val;
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.navAlign.element);

    inspector.controls.contentValign = new EscmsButtonGroup('inspector.content_valign', [
        { value: 'flex-start', icon: icons.layoutAlignTop || 'T' },
        { value: 'center', icon: icons.layoutAlignMiddle || 'M' },
        { value: 'flex-end', icon: icons.layoutAlignBottom || 'B' }
    ], 'stretch', (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        const computedDisplay = window.getComputedStyle(inspector.selectedNode).display;
        if (computedDisplay !== 'grid' && computedDisplay !== 'flex') {
            inspector.selectedNode.style.display = 'flex';
        }
        inspector.selectedNode.style.alignItems = val;
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.contentValign.element);

    inspector.controls.imageAlign = new EscmsButtonGroup('inspector.image_align', [
        { value: 'left', icon: icons.layoutAlignLeft },
        { value: 'center', icon: icons.layoutAlignCenter },
        { value: 'right', icon: icons.layoutAlignRight }
    ], 'left', (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        inspector.selectedNode.style.display = 'block';
        if (val === 'left') {
            inspector.selectedNode.style.marginLeft = '0';
            inspector.selectedNode.style.marginRight = 'auto';
        } else if (val === 'center') {
            inspector.selectedNode.style.marginLeft = 'auto';
            inspector.selectedNode.style.marginRight = 'auto';
        } else if (val === 'right') {
            inspector.selectedNode.style.marginLeft = 'auto';
            inspector.selectedNode.style.marginRight = '0';
        }
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.imageAlign.element);

    inspector.controls.itemAlign = new EscmsButtonGroup('inspector.item_align', [
        { value: 'left', icon: icons.layoutAlignLeft || 'L' },
        { value: 'center', icon: icons.layoutAlignCenter || 'C' },
        { value: 'right', icon: icons.layoutAlignRight || 'R' }
    ], 'left', (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        inspector.selectedNode.style.display = 'block';
        inspector.selectedNode.style.width = 'max-content';
        if (val === 'left') {
            inspector.selectedNode.style.marginLeft = '0';
            inspector.selectedNode.style.marginRight = 'auto';
        } else if (val === 'center') {
            inspector.selectedNode.style.marginLeft = 'auto';
            inspector.selectedNode.style.marginRight = 'auto';
        } else if (val === 'right') {
            inspector.selectedNode.style.marginLeft = 'auto';
            inspector.selectedNode.style.marginRight = '0';
        }
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.itemAlign.element);

    inspector.controls.spacerHeight = new EscmsSlider('inspector.spacer_height', 0, 200, 1, 50, (val) => inspector.applyStyle('height', val + 'px'), 'px');
    section.appendChild(inspector.controls.spacerHeight.element);

    inspector.controls.margin = new EscmsSpacing('inspector.margin', { t: 0, r: 0, b: 0, l: 0 }, (val) => {
        inspector.applyStyle('margin', `${val.t}px ${val.r}px ${val.b}px ${val.l}px`);
    });
    section.appendChild(inspector.controls.margin.element);

    inspector.controls.padding = new EscmsSpacing('inspector.padding', { t: 0, r: 0, b: 0, l: 0 }, (val) => {
        inspector.applyStyle('padding', `${val.t}px ${val.r}px ${val.b}px ${val.l}px`);
    });
    section.appendChild(inspector.controls.padding.element);

    inspector.controls.border = new EscmsBorderControl('inspector.border', inspector.i18n, undefined, (val) => {
        inspector.applyStyle('border', val.cssString);
        inspector.applyStyle('border-radius', val.radius + 'px');
    });
    section.appendChild(inspector.controls.border.element);

    return section;
}
