import { EscmsUploadControl } from '../../controls/editor-control-upload.js';

export function createAttributesSection(inspector) {
    const section = inspector.createSection('inspector.attributes');
    section.style.display = 'none';

    inspector.attrInputs = {
        src: new EscmsUploadControl('inspector.src_url', inspector.i18n, '', (val) => inspector.applyAttribute('src', val)),
        alt: inspector.createTextInput('inspector.alt_text', (val) => inspector.applyAttribute('alt', val)),
        href: inspector.createTextInput('inspector.href_url', (val) => inspector.applyAttribute('href', val)),
        ariaLabel: inspector.createTextInput('inspector.aria_label', (val) => inspector.applyAttribute('aria-label', val))
    };

    section.appendChild(inspector.attrInputs.src.element);
    section.appendChild(inspector.attrInputs.alt.element);
    section.appendChild(inspector.attrInputs.href.element);
    section.appendChild(inspector.attrInputs.ariaLabel.element);

    return section;
}
