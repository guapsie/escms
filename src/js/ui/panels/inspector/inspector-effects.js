import { EscmsSelect } from '../../controls/editor-controls.js';
import { EscmsEffectsControl } from '../../controls/editor-control-effects.js';

export function createEffectsSection(inspector) {
    const section = inspector.createSection('inspector.effects_section');

    inspector.controls.effects = new EscmsEffectsControl('inspector.filters', inspector.i18n, '', (val) => inspector.applyStyle('filter', val));
    section.appendChild(inspector.controls.effects.element);

    inspector.controls.animation = new EscmsSelect('inspector.animation', [
        { value: '', label: 'None' },
        { value: 'fade-in', label: 'Fade In' },
        { value: 'fade-up', label: 'Fade Up' },
        { value: 'fade-down', label: 'Fade Down' },
        { value: 'fade-left', label: 'Fade Left' },
        { value: 'fade-right', label: 'Fade Right' },
        { value: 'zoom-in', label: 'Zoom In' },
        { value: 'zoom-out', label: 'Zoom Out' }
    ], '', (val) => {
        if (!inspector.selectedNode || inspector.isSyncing) return;
        if (val) {
            inspector.selectedNode.setAttribute('data-escms-anim', val);
        } else {
            inspector.selectedNode.removeAttribute('data-escms-anim');
        }
        window.dispatchEvent(new Event('escms-dom-mutated'));
    });
    section.appendChild(inspector.controls.animation.element);

    return section;
}
