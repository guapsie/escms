import { EscmsSelect, EscmsColorPicker, EscmsSlider, EscmsButtonGroup } from '../../controls/editor-controls.js';
import { icons } from '../../../core/editor-icons.js';

export function createTypographySection(inspector) {
    const section = inspector.createSection('inspector.typography');

    inspector.controls.tagSwap = new EscmsSelect('inspector.html_tag', [
        { value: 'h1', label: 'H1' },
        { value: 'h2', label: 'H2' },
        { value: 'h3', label: 'H3' },
        { value: 'h4', label: 'H4' },
        { value: 'h5', label: 'H5' },
        { value: 'h6', label: 'H6' },
        { value: 'p', label: 'P' },
        { value: 'span', label: 'SPAN' }
    ], 'p', (val) => inspector.swapTag(val));
    section.appendChild(inspector.controls.tagSwap.element);

    inspector.controls.fontFamily = new EscmsSelect('inspector.font_family', inspector.getInstalledFonts(), '', (val) => {
        inspector.applyStyle('font-family', val);
    });
    section.appendChild(inspector.controls.fontFamily.element);

    inspector.controls.fontWeight = new EscmsSelect('inspector.font_weight', [
        { value: '', label: 'Default' },
        { value: '300', label: 'Light' },
        { value: '400', label: 'Regular' },
        { value: '500', label: 'Medium' },
        { value: '600', label: 'Semi-Bold' },
        { value: '700', label: 'Bold' },
        { value: '900', label: 'Black' }
    ], '', (val) => inspector.applyStyle('font-weight', val));
    section.appendChild(inspector.controls.fontWeight.element);

    inspector.controls.color = new EscmsColorPicker('inspector.text_color', '#ffffff', 100, (val) => inspector.applyStyle('color', val.rgba));
    section.appendChild(inspector.controls.color.element);

    inspector.controls.fontSize = new EscmsSlider('inspector.font_size', 0, 150, 1, 16, (val) => inspector.applyStyle('font-size', val === 0 ? '' : val + 'px'), 'px');
    section.appendChild(inspector.controls.fontSize.element);

    inspector.controls.letterSpacing = new EscmsSlider('inspector.letter_spacing', -5, 20, 0.5, 0, (val) => inspector.applyStyle('letter-spacing', val === 0 ? '' : val + 'px'), 'px');
    section.appendChild(inspector.controls.letterSpacing.element);

    inspector.controls.lineHeight = new EscmsSlider('inspector.line_height', 0.5, 3, 0.1, 1.5, (val) => inspector.applyStyle('line-height', val === 0 ? '' : val), '');
    section.appendChild(inspector.controls.lineHeight.element);

    inspector.controls.textAlign = new EscmsButtonGroup('inspector.text_align', [
        { value: 'left', icon: icons.textAlignLeft },
        { value: 'center', icon: icons.textAlignCenter },
        { value: 'right', icon: icons.textAlignRight },
        { value: 'justify', icon: icons.textAlignJustify }
    ], 'left', (val) => inspector.applyStyle('text-align', val));
    section.appendChild(inspector.controls.textAlign.element);

    inspector.controls.textStyle = new EscmsButtonGroup('inspector.styles', [
        { value: 'bold', icon: icons.textBolder },
        { value: 'italic', icon: icons.textItalic },
        { value: 'underline', icon: icons.textUnderline },
        { value: 'strikethrough', icon: icons.textStrikethrough }
    ], [], (vals) => inspector.applyTextStyles(vals), true);
    section.appendChild(inspector.controls.textStyle.element);

    return section;
}
