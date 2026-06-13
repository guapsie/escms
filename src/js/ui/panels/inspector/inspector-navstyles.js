import { EscmsColorPicker } from '../../controls/editor-controls.js';
import { EscmsBorderControl } from '../../controls/editor-control-border.js';

export function createNavStylesSection(inspector) {
    const section = inspector.createSection('inspector.nav_styles');
    section.style.display = 'none';

    inspector.controls.navHoverBg = new EscmsColorPicker('inspector.nav_hover_bg', 'rgba(59, 130, 246, 0.3)', 100, (val) => inspector.applyStyle('--nav-hover-bg', val.rgba));
    section.appendChild(inspector.controls.navHoverBg.element);

    inspector.controls.navSubBg = new EscmsColorPicker('inspector.nav_sub_bg', '#0a0a0a', 100, (val) => inspector.applyStyle('--nav-sub-bg', val.rgba));
    section.appendChild(inspector.controls.navSubBg.element);

    inspector.controls.navSubGlow = new EscmsColorPicker('inspector.nav_sub_glow', 'transparent', 0, (val) => inspector.applyStyle('--nav-sub-glow', val.rgba));
    section.appendChild(inspector.controls.navSubGlow.element);

    inspector.controls.navSubBorder = new EscmsBorderControl('inspector.nav_sub_border', inspector.i18n, undefined, (val) => {
        inspector.applyStyle('--nav-sub-border-width', val.width + 'px');
        inspector.applyStyle('--nav-sub-border-style', val.style);
        inspector.applyStyle('--nav-sub-border-color', val.color);
        inspector.applyStyle('--nav-sub-radius', val.radius + 'px');
    });
    section.appendChild(inspector.controls.navSubBorder.element);

    return section;
}
