import { EscmsColorPicker } from '../../controls/editor-controls.js';
import { EscmsGradientControl } from '../../controls/editor-control-gradient.js';

export function createBackgroundSection(inspector) {
    const section = inspector.createSection('inspector.background');

    inspector.controls.bgColor = new EscmsColorPicker('inspector.solid_color', 'rgba(0,0,0,0)', 0, (val) => inspector.applyStyle('background-color', val.rgba));
    section.appendChild(inspector.controls.bgColor.element);

    inspector.controls.bgGradient = new EscmsGradientControl('inspector.linear_gradient', inspector.i18n, undefined, (val) => inspector.applyStyle('background-image', val.cssString));
    section.appendChild(inspector.controls.bgGradient.element);

    return section;
}
