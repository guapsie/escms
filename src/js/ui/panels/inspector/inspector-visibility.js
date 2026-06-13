import { EscmsSlider } from '../../controls/editor-controls.js';

export function createVisibilitySection(inspector) {
    const section = inspector.createSection('inspector.visibility');
    inspector.controls.opacity = new EscmsSlider('inspector.opacity', 0, 100, 1, 100, (val) => inspector.applyStyle('opacity', val / 100), '%');
    section.appendChild(inspector.controls.opacity.element);

    return section;
}
