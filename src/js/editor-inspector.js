import { EscmsBorderControl } from './editor-control-border.js';
import { EscmsEffectsControl } from './editor-control-effects.js';
import { EscmsGradientControl } from './editor-control-gradient.js';
import { EscmsUploadControl, EscmsBgImageControl } from './editor-control-upload.js';
import { EscmsToggle, EscmsSelect, EscmsSlider, EscmsColorPicker, EscmsSpacing, EscmsButtonGroup, EscmsCollectionControl } from './editor-controls.js';
import { EscmsLayoutControl } from './editor-control-layout.js';
import { icons } from './editor-icons.js';

export class EscmsInspector {
    constructor(i18nEngine) {
        this.i18n = i18nEngine;
        this.selectedNode = null;
        this.isSyncing = false;

        this.controls = {};
    }

    init() {
        this.container = document.getElementById('escms-inspector');
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.style.padding = '1.5rem 1.5rem 5rem 1.5rem';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '1rem';
        this.container.style.overflowY = 'auto';
        this.container.style.height = '100%';
        this.container.style.boxSizing = 'border-box';
        this.sectionsContainer = document.createElement('div');
        this.sectionsContainer.style.display = 'none'; // Hide by default until selection
        this.container.appendChild(this.sectionsContainer);

        this.emptyState = document.createElement('div');
        this.emptyState.style.display = 'flex';
        this.emptyState.style.flexDirection = 'column';
        this.emptyState.style.alignItems = 'center';
        this.emptyState.style.justifyContent = 'center';
        this.emptyState.style.height = '100%';
        this.emptyState.style.color = 'rgba(245,245,245,0.3)';
        this.emptyState.style.textAlign = 'center';
        this.emptyState.style.gap = '1rem';
        this.emptyState.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
                <path d="m12 12 4 10 1.7-4.3L22 16Z" />
            </svg>
            <div style="font-size: 0.85rem; font-weight: 500;" data-i18n="inspector.empty_state">${this.i18n ? (this.i18n.dictionary['inspector.empty_state'] || 'Select an element to edit') : 'Select an element to edit'}</div>
        `;
        this.container.appendChild(this.emptyState);

        this.renderSections();

        window.addEventListener('escms-element-selected', (e) => {
            const node = e.detail.node;
            this.selectedNode = node;

            if (node && node.id !== 'document-root') {
                this.emptyState.style.display = 'none';
                this.sectionsContainer.style.display = 'block';
                this.syncDOMToUI();
            } else {
                this.sectionsContainer.style.display = 'none';
                this.emptyState.style.display = 'flex';
            }
        });

        window.addEventListener('escms-view-change', () => {
            if (this.selectedNode) {
                this.syncDOMToUI();
            }
        });

        window.addEventListener('escms-fonts-updated', () => {
            if (this.controls && this.controls.fontFamily) {
                this.controls.fontFamily.updateOptions(this.getInstalledFonts());
                if (this.selectedNode) {
                    const comp = window.getComputedStyle(this.selectedNode);
                    let fFamily = comp.fontFamily;
                    if (fFamily) {
                        let firstFont = fFamily.split(',')[0].trim().replace(/['"]/g, '');
                        let fontOpt = this.controls.fontFamily.options.find(o => o.label === firstFont);
                        if (fontOpt) this.controls.fontFamily.setValue(fontOpt.value, false);
                        else this.controls.fontFamily.setValue('', false);
                    }
                }
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            .escms-inspector-text-input:focus {
                border-color: var(--accent-faint) !important;
                box-shadow: 0 0 10px var(--accent-faint) !important;
                outline: none !important;
            }
        `;
        this.container.appendChild(style);
    }

    createSection(titleI18n) {
        const section = document.createElement('div');
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '0.5rem';
        section.style.marginBottom = '1rem';
        section.style.paddingTop = '1rem';
        section.style.borderTop = '1px solid rgba(255, 255, 255, 0.05)';

        const title = document.createElement('div');
        title.setAttribute('data-i18n', titleI18n);
        title.style.fontSize = '0.75rem';
        title.style.fontWeight = '600';
        title.style.letterSpacing = '1px';
        title.style.textTransform = 'uppercase';
        title.style.color = 'rgba(245, 245, 245, 0.6)';
        title.style.paddingBottom = '0.25rem';

        section.appendChild(title);
        return section;
    }

    applyStyle(prop, value) {
        if (!this.selectedNode || this.isSyncing) return;
        
        if (this.selectedNode.classList.contains('escms-portfolio')) {
            // Portfolio intercepts background/border/etc to style its children via CSS variables
            if (['background', 'background-color', 'background-image', 'border', 'border-radius', 'border-width', 'border-color', 'border-style'].includes(prop)) {
                if (value === '' || value === 'none') {
                    this.selectedNode.style.removeProperty(`--item-${prop}`);
                } else {
                    this.selectedNode.style.setProperty(`--item-${prop}`, value);
                }
                window.dispatchEvent(new Event('escms-dom-mutated'));
                return;
            }
        }

        if (value === '' || value === 'none') {
            if (prop.startsWith('--')) {
                this.selectedNode.style.removeProperty(prop);
            } else {
                this.selectedNode.style.removeProperty(prop);
            }
        } else {
            if (prop.startsWith('--')) {
                this.selectedNode.style.setProperty(prop, value);
            } else {
                this.selectedNode.style[prop] = value;
            }
        }
        window.dispatchEvent(new Event('escms-dom-mutated')); // Trigger autosave
    }

    applyAttribute(attr, value) {
        if (!this.selectedNode || this.isSyncing) return;
        
        let finalValue = value;
        let isValidEmbed = true;

        if (attr === 'src' && this.selectedNode.tagName.toLowerCase() === 'iframe') {
            if (this.selectedNode.classList.contains('escms-youtube')) {
                let match = finalValue.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                if (match && match[1]) {
                    finalValue = `https://www.youtube.com/embed/${match[1]}`;
                } else if (finalValue !== '') {
                    isValidEmbed = false; // Wait until they finish typing
                }
            } else if (this.selectedNode.classList.contains('escms-vimeo')) {
                let match = finalValue.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
                if (match && match[1]) {
                    finalValue = `https://player.vimeo.com/video/${match[1]}`;
                } else if (finalValue !== '') {
                    isValidEmbed = false;
                }
            }
        }

        if (!isValidEmbed) {
            // Do not update the DOM attribute if it's an invalid/incomplete YouTube/Vimeo URL
            return;
        }

        if (finalValue === '') {
            this.selectedNode.removeAttribute(attr);
        } else {
            this.selectedNode.setAttribute(attr, finalValue);
        }
        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    swapTag(newTag) {
        if (!this.selectedNode || this.isSyncing) return;
        const oldTag = this.selectedNode.tagName.toLowerCase();
        if (oldTag === newTag) return;

        const newNode = document.createElement(newTag);
        Array.from(this.selectedNode.attributes).forEach(attr => newNode.setAttribute(attr.name, attr.value));
        newNode.innerHTML = this.selectedNode.innerHTML;

        this.selectedNode.replaceWith(newNode);
        this.selectedNode = newNode;
        window.dispatchEvent(new Event('escms-dom-mutated'));
        window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: newNode } }));
    }

    getInstalledFonts() {
        let fonts = [{ value: '', label: 'Default' }];
        const host = document.getElementById('escms-canvas-host');
        if (host && host.shadowRoot) {
            const links = host.shadowRoot.querySelectorAll('link[data-type="escms-google-font"]');
            links.forEach(l => {
                try {
                    const url = new URL(l.href);
                    const families = url.searchParams.getAll('family');
                    families.forEach(f => {
                        const name = f.split(':')[0];
                        fonts.push({ value: `"${name.replace(/\+/g, ' ')}"`, label: name.replace(/\+/g, ' ') });
                    });
                } catch (e) { }
            });
        }
        return fonts;
    }

    updateColumns(val) {
        if (!this.selectedNode || this.isSyncing) return;
        this.selectedNode.setAttribute('data-columns', val);
        this.selectedNode.style.gridTemplateColumns = `repeat(${val}, 1fr)`;

        // Append missing columns
        while (this.selectedNode.children.length < val) {
            const col = document.createElement('div');
            col.className = this.selectedNode.classList.contains('escms-grid') ? 'escms-grid-item' : 'escms-column';
            this.selectedNode.appendChild(col);
        }

        // Remove trailing empty columns
        while (this.selectedNode.children.length > val) {
            const lastChild = this.selectedNode.lastElementChild;
            if (lastChild.innerHTML.trim() === '' || lastChild.textContent.trim() === '') {
                this.selectedNode.removeChild(lastChild);
            } else {
                break; // Stop removing if not empty
            }
        }

        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    updateGridItemWidth(val) {
        if (!this.selectedNode || this.isSyncing) return;
        this.selectedNode.setAttribute('data-item-width', val);
        this.selectedNode.style.gridTemplateColumns = `repeat(auto-fill, minmax(${val}px, 1fr))`;
        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    updateImageCollection(urls) {
        if (!this.selectedNode || this.isSyncing) return;
        this.selectedNode.setAttribute('data-collection', JSON.stringify(urls));
        
        // Clear current children
        this.selectedNode.innerHTML = '';
        
        // Append new images
        urls.forEach(url => {
            const item = document.createElement('div');
            item.className = 'escms-portfolio-item';
            
            // Link item to parent's CSS variables
            item.style.background = 'var(--item-background, transparent)';
            item.style.backgroundColor = 'var(--item-background-color, transparent)';
            item.style.backgroundImage = 'var(--item-background-image, none)';
            item.style.border = 'var(--item-border, none)';
            item.style.borderRadius = 'var(--item-border-radius, 0)';
            item.style.overflow = 'hidden';

            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            item.appendChild(img);
            this.selectedNode.appendChild(item);
        });

        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    renderSections() {
        // --- STRUCTURE ---
        this.structureSection = this.createSection('inspector.structure');
        this.structureSection.style.display = 'none'; // Hidden by default

        this.controls.columnsCount = new EscmsSlider('inspector.columns_count', 1, 12, 1, 2, (val) => this.updateColumns(val), '');
        this.structureSection.appendChild(this.controls.columnsCount.element);

        this.controls.gridItemWidth = new EscmsSlider('inspector.grid_item_width', 100, 1000, 10, 250, (val) => this.updateGridItemWidth(val), 'px');
        this.structureSection.appendChild(this.controls.gridItemWidth.element);

        this.controls.imageCollection = new EscmsCollectionControl('inspector.image_collection', this.i18n, [], (val) => this.updateImageCollection(val));
        this.structureSection.appendChild(this.controls.imageCollection.element);

        this.sectionsContainer.appendChild(this.structureSection);

        // --- ATTRIBUTES (Dynamic) ---
        this.attrSection = this.createSection('inspector.attributes');
        this.attrSection.style.display = 'none'; // Hidden initially

        this.attrInputs = {
            src: new EscmsUploadControl('inspector.src_url', this.i18n, '', (val) => this.applyAttribute('src', val)),
            alt: this.createTextInput('inspector.alt_text', (val) => this.applyAttribute('alt', val)),
            href: this.createTextInput('inspector.href_url', (val) => this.applyAttribute('href', val)),
            ariaLabel: this.createTextInput('inspector.aria_label', (val) => this.applyAttribute('aria-label', val))
        };

        this.attrSection.appendChild(this.attrInputs.src.element);
        this.attrSection.appendChild(this.attrInputs.alt.element);
        this.attrSection.appendChild(this.attrInputs.href.element);
        this.attrSection.appendChild(this.attrInputs.ariaLabel.element);
        this.sectionsContainer.appendChild(this.attrSection);

        // --- TYPOGRAPHY ---
        const typoSection = this.createSection('inspector.typography');

        this.controls.tagSwap = new EscmsSelect('inspector.html_tag', [
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
            { value: 'h4', label: 'H4' },
            { value: 'h5', label: 'H5' },
            { value: 'h6', label: 'H6' }
        ], 'h2', (val) => this.swapTag(val));
        typoSection.appendChild(this.controls.tagSwap.element);

        this.controls.fontFamily = new EscmsSelect('inspector.font_family', [{ value: '', label: 'Default' }], '', (val) => this.applyStyle('font-family', val));
        typoSection.appendChild(this.controls.fontFamily.element);

        this.controls.fontWeight = new EscmsSelect('inspector.font_weight', [
            { value: '', label: 'Default' },
            { value: '100', label: '100 - Thin' },
            { value: '200', label: '200 - Extra Light' },
            { value: '300', label: '300 - Light' },
            { value: '400', label: '400 - Normal' },
            { value: '500', label: '500 - Medium' },
            { value: '600', label: '600 - Semi Bold' },
            { value: '700', label: '700 - Bold' },
            { value: '800', label: '800 - Extra Bold' },
            { value: '900', label: '900 - Black' }
        ], '', (val) => this.applyStyle('font-weight', val));
        typoSection.appendChild(this.controls.fontWeight.element);

        this.controls.color = new EscmsColorPicker('inspector.text_color', '#f5f5f5', 100, (val) => this.applyStyle('color', val.rgba));
        typoSection.appendChild(this.controls.color.element);

        this.controls.fontSize = new EscmsSlider('inspector.font_size', 8, 120, 1, 16, (val) => this.applyStyle('font-size', `${val}px`), 'px');
        typoSection.appendChild(this.controls.fontSize.element);

        this.controls.letterSpacing = new EscmsSlider('inspector.letter_spacing', -5, 20, 0.5, 0, (val) => this.applyStyle('letter-spacing', `${val}px`), 'px');
        typoSection.appendChild(this.controls.letterSpacing.element);

        this.controls.textAlign = new EscmsButtonGroup('inspector.text_align', [
            { value: 'left', icon: icons.textAlignLeft || 'L' },
            { value: 'center', icon: icons.textAlignCenter || 'C' },
            { value: 'right', icon: icons.textAlignRight || 'R' },
            { value: 'justify', icon: icons.textAlignJustify || 'J' }
        ], 'left', (val) => this.applyStyle('text-align', val));
        typoSection.appendChild(this.controls.textAlign.element);

        this.controls.textStyle = new EscmsButtonGroup('inspector.text_style', [
            { value: 'bold', icon: icons.textBolder || 'B' },
            { value: 'italic', icon: icons.textItalic || 'I' },
            { value: 'underline', icon: icons.textUnderline || 'U' },
            { value: 'strikethrough', icon: icons.textStrikethrough || 'S' }
        ], [], (vals) => this.applyTextStyles(vals), true); // true for multi-select
        typoSection.appendChild(this.controls.textStyle.element);

        this.sectionsContainer.appendChild(typoSection);

        // --- BACKGROUND ---
        const bgSection = this.createSection('inspector.background');

        this.controls.bgColor = new EscmsColorPicker('inspector.solid_color', '#0a0a0a', 0, (val) => this.applyStyle('background-color', val.rgba));
        bgSection.appendChild(this.controls.bgColor.element);

        this.controls.bgGradient = new EscmsGradientControl('inspector.linear_gradient', this.i18n, undefined, (val) => {
            if (val.type === 'mesh') {
                this.selectedNode.setAttribute('data-escms-mesh', 'true');
                this.applyStyle('background-image', ''); // Clear inline bg-image!
                this.applyStyle('--escms-mesh-bg', val.cssString);
                
                if (val.bgSize !== undefined) this.applyStyle('--escms-mesh-size', val.bgSize);
                if (val.bgRepeat !== undefined) this.applyStyle('--escms-mesh-repeat', val.bgRepeat);
                if (val.animation !== undefined) this.applyStyle('--escms-mesh-anim', val.animation);
                if (val.blur !== undefined) this.applyStyle('--escms-mesh-blur', val.blur + 'px');
                
                // Clear the normal ones so they don't conflict
                this.applyStyle('background-size', '');
                this.applyStyle('background-repeat', '');
                this.applyStyle('animation', '');
            } else {
                if (this.selectedNode) this.selectedNode.removeAttribute('data-escms-mesh');
                this.applyStyle('--escms-mesh-bg', '');
                this.applyStyle('--escms-mesh-size', '');
                this.applyStyle('--escms-mesh-repeat', '');
                this.applyStyle('--escms-mesh-anim', '');
                this.applyStyle('--escms-mesh-blur', '');
                
                this.applyStyle('background-image', val.cssString);
                if (val.bgSize !== undefined) this.applyStyle('background-size', val.bgSize);
                if (val.bgRepeat !== undefined) this.applyStyle('background-repeat', val.bgRepeat);
                if (val.animation !== undefined) this.applyStyle('animation', val.animation);
                
                if (!val.animate) {
                    this.applyStyle('background-size', '');
                    this.applyStyle('background-repeat', '');
                    this.applyStyle('animation', '');
                }
            }
        });
        bgSection.appendChild(this.controls.bgGradient.element);

        this.controls.bgImage = new EscmsBgImageControl('inspector.bg_image', this.i18n, { image: '' }, (val) => {
            this.applyStyle('background-image', val.image);
            if (val.image) {
                this.applyStyle('background-size', val.size);
                this.applyStyle('background-repeat', val.repeat);
                this.applyStyle('background-position', val.position);
            } else {
                this.applyStyle('background-size', '');
                this.applyStyle('background-repeat', '');
                this.applyStyle('background-position', '');
            }
        });
        bgSection.appendChild(this.controls.bgImage.element);

        this.sectionsContainer.appendChild(bgSection);

        // --- LAYOUT ---
        const layoutSection = this.createSection('inspector.layout');

        this.controls.layoutModel = new EscmsLayoutControl(this.i18n, 
            (prop, val) => {
                if (!this.selectedNode || this.isSyncing) return;
                if (val === '') this.selectedNode.style.removeProperty(prop);
                else this.selectedNode.style.setProperty(prop, val);
                window.dispatchEvent(new Event('escms-dom-mutated'));
            },
            (prop, val) => {
                if (!this.selectedNode || this.isSyncing) return;
                if (val === '') this.selectedNode.style.removeProperty(prop);
                else this.selectedNode.style.setProperty(prop, val);
                window.dispatchEvent(new Event('escms-dom-mutated'));
            }
        );
        layoutSection.appendChild(this.controls.layoutModel.element);

        this.controls.sticky = new EscmsToggle('inspector.sticky', false, (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            if (val) {
                this.selectedNode.style.position = 'sticky';
                this.selectedNode.style.top = '0px';
                this.selectedNode.style.zIndex = '50';
            } else {
                this.selectedNode.style.removeProperty('position');
                this.selectedNode.style.removeProperty('top');
                this.selectedNode.style.removeProperty('z-index');
            }
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        layoutSection.appendChild(this.controls.sticky.element);


        this.controls.navAlign = new EscmsButtonGroup('inspector.nav_align', [
            { value: 'flex-start', icon: icons.layoutAlignLeft || 'L' },
            { value: 'center', icon: icons.layoutAlignCenter || 'C' },
            { value: 'flex-end', icon: icons.layoutAlignRight || 'R' }
        ], 'flex-start', (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            const computedDisplay = window.getComputedStyle(this.selectedNode).display;
            if (computedDisplay !== 'grid' && computedDisplay !== 'flex') {
                this.selectedNode.style.display = 'flex';
            }
            this.selectedNode.style.justifyContent = val;
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        layoutSection.appendChild(this.controls.navAlign.element);

        this.controls.contentValign = new EscmsButtonGroup('inspector.content_valign', [
            { value: 'flex-start', icon: icons.layoutAlignTop || 'T' },
            { value: 'center', icon: icons.layoutAlignMiddle || 'M' },
            { value: 'flex-end', icon: icons.layoutAlignBottom || 'B' }
        ], 'stretch', (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            const computedDisplay = window.getComputedStyle(this.selectedNode).display;
            if (computedDisplay !== 'grid' && computedDisplay !== 'flex') {
                this.selectedNode.style.display = 'flex';
            }
            this.selectedNode.style.alignItems = val;
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        layoutSection.appendChild(this.controls.contentValign.element);

        this.controls.imageAlign = new EscmsButtonGroup('inspector.image_align', [
            { value: 'left', icon: icons.layoutAlignLeft },
            { value: 'center', icon: icons.layoutAlignCenter },
            { value: 'right', icon: icons.layoutAlignRight }
        ], 'left', (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            this.selectedNode.style.display = 'block';
            if (val === 'left') {
                this.selectedNode.style.marginLeft = '0';
                this.selectedNode.style.marginRight = 'auto';
            } else if (val === 'center') {
                this.selectedNode.style.marginLeft = 'auto';
                this.selectedNode.style.marginRight = 'auto';
            } else if (val === 'right') {
                this.selectedNode.style.marginLeft = 'auto';
                this.selectedNode.style.marginRight = '0';
            }
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        layoutSection.appendChild(this.controls.imageAlign.element);

        this.controls.itemAlign = new EscmsButtonGroup('inspector.item_align', [
            { value: 'left', icon: icons.layoutAlignLeft || 'L' },
            { value: 'center', icon: icons.layoutAlignCenter || 'C' },
            { value: 'right', icon: icons.layoutAlignRight || 'R' }
        ], 'left', (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            this.selectedNode.style.display = 'block';
            this.selectedNode.style.width = 'max-content';
            if (val === 'left') {
                this.selectedNode.style.marginLeft = '0';
                this.selectedNode.style.marginRight = 'auto';
            } else if (val === 'center') {
                this.selectedNode.style.marginLeft = 'auto';
                this.selectedNode.style.marginRight = 'auto';
            } else if (val === 'right') {
                this.selectedNode.style.marginLeft = 'auto';
                this.selectedNode.style.marginRight = '0';
            }
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        layoutSection.appendChild(this.controls.itemAlign.element);

        this.controls.spacerHeight = new EscmsSlider('inspector.spacer_height', 0, 200, 1, 50, (val) => this.applyStyle('height', val + 'px'), 'px');
        layoutSection.appendChild(this.controls.spacerHeight.element);

        this.controls.margin = new EscmsSpacing('inspector.margin', { t: 0, r: 0, b: 0, l: 0 }, (val) => {
            this.applyStyle('margin', `${val.t}px ${val.r}px ${val.b}px ${val.l}px`);
        });
        layoutSection.appendChild(this.controls.margin.element);

        this.controls.padding = new EscmsSpacing('inspector.padding', { t: 0, r: 0, b: 0, l: 0 }, (val) => {
            this.applyStyle('padding', `${val.t}px ${val.r}px ${val.b}px ${val.l}px`);
        });
        layoutSection.appendChild(this.controls.padding.element);

        this.controls.border = new EscmsBorderControl('inspector.border', this.i18n, undefined, (val) => {
            this.applyStyle('border', val.cssString);
            this.applyStyle('border-radius', val.radius + 'px');
        });
        layoutSection.appendChild(this.controls.border.element);

        this.sectionsContainer.appendChild(layoutSection);

        // --- VISIBILITY ---
        const visSection = this.createSection('inspector.visibility');
        this.controls.opacity = new EscmsSlider('inspector.opacity', 0, 100, 1, 100, (val) => this.applyStyle('opacity', val / 100), '%');
        visSection.appendChild(this.controls.opacity.element);

        this.sectionsContainer.appendChild(visSection);

        // --- EFFECTS ---
        this.effectsSection = this.createSection('inspector.effects_section');
        this.controls.effects = new EscmsEffectsControl('inspector.filters', this.i18n, '', (val) => this.applyStyle('filter', val));
        this.effectsSection.appendChild(this.controls.effects.element);

        this.sectionsContainer.appendChild(this.effectsSection);

        this.controls.animation = new EscmsSelect('inspector.animation', [
            { value: '', label: 'None' },
            { value: 'fade-in', label: 'Fade In' },
            { value: 'fade-up', label: 'Fade Up' },
            { value: 'fade-down', label: 'Fade Down' },
            { value: 'fade-left', label: 'Fade Left' },
            { value: 'fade-right', label: 'Fade Right' },
            { value: 'zoom-in', label: 'Zoom In' },
            { value: 'zoom-out', label: 'Zoom Out' }
        ], '', (val) => {
            if (!this.selectedNode || this.isSyncing) return;
            if (val) {
                this.selectedNode.setAttribute('data-escms-anim', val);
            } else {
                this.selectedNode.removeAttribute('data-escms-anim');
            }
            window.dispatchEvent(new Event('escms-dom-mutated'));
        });
        this.effectsSection.appendChild(this.controls.animation.element);

        // --- NAV STYLES ---
        this.navStylesSection = this.createSection('inspector.nav_styles');
        this.navStylesSection.style.display = 'none';

        this.controls.navHoverBg = new EscmsColorPicker('inspector.nav_hover_bg', 'rgba(59, 130, 246, 0.3)', 100, (val) => this.applyStyle('--nav-hover-bg', val.rgba));
        this.navStylesSection.appendChild(this.controls.navHoverBg.element);

        this.controls.navSubBg = new EscmsColorPicker('inspector.nav_sub_bg', '#0a0a0a', 100, (val) => this.applyStyle('--nav-sub-bg', val.rgba));
        this.navStylesSection.appendChild(this.controls.navSubBg.element);

        this.controls.navSubGlow = new EscmsColorPicker('inspector.nav_sub_glow', 'transparent', 0, (val) => this.applyStyle('--nav-sub-glow', val.rgba));
        this.navStylesSection.appendChild(this.controls.navSubGlow.element);

        this.controls.navSubBorder = new EscmsBorderControl('inspector.nav_sub_border', this.i18n, undefined, (val) => {
            this.applyStyle('--nav-sub-border-width', val.width + 'px');
            this.applyStyle('--nav-sub-border-style', val.style);
            this.applyStyle('--nav-sub-border-color', val.color);
            this.applyStyle('--nav-sub-radius', val.radius + 'px');
        });
        this.navStylesSection.appendChild(this.controls.navSubBorder.element);

        this.sectionsContainer.appendChild(this.navStylesSection);
    }

    createTextInput(i18nKey, onChange) {
        const container = document.createElement('div');
        container.className = 'escms-control-row';
        container.style.display = 'none';

        const label = document.createElement('div');
        label.setAttribute('data-i18n', i18nKey);
        label.className = 'escms-ui-label';

        const input = document.createElement('input');
        input.type = 'text';
        input.style.width = '100%';
        input.style.background = 'rgba(255, 255, 255, 0.04)';
        input.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        input.style.color = 'var(--text-solid)';
        input.style.padding = '0.35rem 0.5rem';
        input.style.borderRadius = '4px';
        input.style.boxSizing = 'border-box';
        input.style.fontFamily = 'monospace';
        input.style.fontSize = '11px';
        input.className = 'escms-inspector-text-input';
        input.style.transition = 'border-color 0.2s, background 0.2s';

        input.addEventListener('input', (e) => onChange(e.target.value));

        container.appendChild(label);
        container.appendChild(input);

        return {
            element: container,
            input: input,
            show: () => container.style.display = 'grid',
            hide: () => container.style.display = 'none',
            setValue: (val) => input.value = val || ''
        };
    }



    _rgbaToHexA(rgba) {
        if (!rgba || rgba === 'transparent' || rgba === 'none' || rgba.trim() === '') return { hex: '#000000', alpha: 0 };
        let parts = rgba.match(/^rgba?\(\s*([0-9.%]+)(?:\s*,?\s*)([0-9.%]+)(?:\s*,?\s*)([0-9.%]+)(?:(?:\s*,?\s*|\s*\/\s*)([0-9.]+))?\s*\)$/i);
        if (!parts) return { hex: '#000000', alpha: 100 };

        const parseVal = (v) => {
            if (v.endsWith('%')) {
                return Math.round((parseFloat(v) / 100) * 255);
            }
            return Math.round(parseFloat(v));
        };

        let r = parseVal(parts[1]).toString(16).padStart(2, '0');
        let g = parseVal(parts[2]).toString(16).padStart(2, '0');
        let b = parseVal(parts[3]).toString(16).padStart(2, '0');
        let a = parts[4] !== undefined ? Math.round(parseFloat(parts[4]) * 100) : 100;

        return { hex: `#${r}${g}${b}`, alpha: a };
    }

    _parseSpacing(cssVal) {
        if (!cssVal) return { t: 0, r: 0, b: 0, l: 0 };
        let parts = cssVal.replace(/px/g, '').split(' ').map(n => parseInt(n) || 0);
        if (parts.length === 1) return { t: parts[0], r: parts[0], b: parts[0], l: parts[0] };
        if (parts.length === 2) return { t: parts[0], r: parts[1], b: parts[0], l: parts[1] };
        if (parts.length === 3) return { t: parts[0], r: parts[1], b: parts[2], l: parts[1] };
        if (parts.length === 4) return { t: parts[0], r: parts[1], b: parts[2], l: parts[3] };
        return { t: 0, r: 0, b: 0, l: 0 };
    }

    _parseBorder(cssVal, radiusVal) {
        let res = { width: 0, style: 'solid', color: '#000000', alpha: 100 };
        if (!cssVal || cssVal === 'none' || cssVal === '') return res;

        let widthMatch = cssVal.match(/(\d+)px/);
        if (widthMatch) res.width = parseInt(widthMatch[1]);

        let styleMatch = cssVal.match(/(solid|dashed|dotted)/);
        if (styleMatch) res.style = styleMatch[1];

        let colorMatch = cssVal.match(/rgba?\([^)]+\)|#[0-9a-fA-F]+/);
        if (colorMatch) {
            if (colorMatch[0].startsWith('#')) {
                res.color = colorMatch[0].substring(0, 7);
                res.alpha = colorMatch[0].length === 9 ? Math.round(parseInt(colorMatch[0].substring(7, 9), 16) / 255 * 100) : 100;
            } else {
                let rgba = this._rgbaToHexA(colorMatch[0]);
                res.color = rgba.hex;
                res.alpha = rgba.alpha;
            }
        }

        if (radiusVal) {
            let radiusMatch = radiusVal.match(/(\d+)px/);
            if (radiusMatch) res.radius = parseInt(radiusMatch[1]);
        }
        return res;
    }

    _parseGradient(cssVal, isMesh = false) {
        let res = { type: 'none', position: 'center', c1: '#ec4899', a1: 100, c2: '#8b5cf6', a2: 100, c3: '#3b82f6', a3: 100, stop: 60, blur: 60, animate: false };
        if (!cssVal || cssVal === 'none' || cssVal === '') return res;

        // Basic parsing just to set the type correctly if it's not empty
        if (isMesh || cssVal.includes('--escms-mesh-bg')) {
            res.type = 'mesh';
            res.animate = cssVal.includes('escms-mesh-drift') || (this.selectedNode && this.selectedNode.style.getPropertyValue('--escms-mesh-anim') !== 'none');
            const blurVal = this.selectedNode ? this.selectedNode.style.getPropertyValue('--escms-mesh-blur') : '';
            if (blurVal) res.blur = parseInt(blurVal) || 60;
        } else if (cssVal.includes('radial-gradient')) {
            res.type = 'radial';
            res.animate = this.selectedNode && this.selectedNode.style.animation.includes('escms-bg-pan');
            let match = cssVal.match(/radial-gradient\(([^,]+),\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^,]*),\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^,]*)(?:,\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^)]*))?\)/);
            if (match) {
                res.position = match[1].trim();
                let c1 = this._rgbaToHexA(match[2]); res.c1 = c1.hex; res.a1 = c1.alpha;
                let c2 = this._rgbaToHexA(match[4]); res.c2 = c2.hex; res.a2 = c2.alpha;
                if (match[5]) res.stop = parseInt(match[5]) || 60;
                if (match[6]) {
                    let c3 = this._rgbaToHexA(match[6]); res.c3 = c3.hex; res.a3 = c3.alpha;
                } else {
                    res.c3 = res.c2; res.a3 = res.a2;
                }
            }
        } else if (cssVal.includes('linear-gradient')) {
            res.type = 'linear';
            res.animate = this.selectedNode && this.selectedNode.style.animation.includes('escms-bg-pan');
            let match = cssVal.match(/linear-gradient\(([^,]+),\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^,]*),\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^,]*)(?:,\s*(rgba?\([^)]+\)|#[^\s,]+)\s*([^)]*))?\)/);
            if (match) {
                res.position = match[1].trim();
                let c1 = this._rgbaToHexA(match[2]); res.c1 = c1.hex; res.a1 = c1.alpha;
                let c2 = this._rgbaToHexA(match[4]); res.c2 = c2.hex; res.a2 = c2.alpha;
                if (match[5]) res.stop = parseInt(match[5]) || 60;
                if (match[6]) {
                    let c3 = this._rgbaToHexA(match[6]); res.c3 = c3.hex; res.a3 = c3.alpha;
                } else {
                    res.c3 = res.c2; res.a3 = res.a2;
                }
            }
        }

        return res;
    }

    applyTextStyles(vals) {
        if (!this.selectedNode || this.isSyncing) return;

        // Font Weight
        this.selectedNode.style.fontWeight = vals.includes('bold') ? 'bold' : '';

        // Font Style
        this.selectedNode.style.fontStyle = vals.includes('italic') ? 'italic' : '';

        // Text Decoration
        let decorations = [];
        if (vals.includes('underline')) decorations.push('underline');
        if (vals.includes('strikethrough')) decorations.push('line-through');

        this.selectedNode.style.textDecoration = decorations.length > 0 ? decorations.join(' ') : '';

        window.dispatchEvent(new Event('escms-dom-mutated'));
    }

    syncDOMToUI() {
        if (!this.selectedNode) return;
        this.isSyncing = true;

        const comp = window.getComputedStyle(this.selectedNode);
        const tag = this.selectedNode.tagName.toLowerCase();

        // 1. Determine allowed controls for this node based on Atom Schema or tag fallback
        let allowedControls = [];
        const defaultControls = {
            'img': ['src', 'alt', 'margin', 'padding', 'border', 'opacity', 'effects'],
            'a': ['href', 'fontFamily', 'fontWeight', 'color', 'fontSize', 'letterSpacing', 'textAlign', 'textStyle', 'margin', 'padding', 'border', 'opacity'],
            'iframe': ['src', 'margin', 'padding', 'border', 'opacity'],
            'column': ['bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'animation', 'layoutModel'],
            'escms-component': ['sticky', 'bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'animation', 'layoutModel'],
            'default': ['sticky', 'tagSwap', 'fontFamily', 'fontWeight', 'color', 'fontSize', 'letterSpacing', 'textAlign', 'textStyle', 'bgColor', 'bgGradient', 'margin', 'padding', 'border', 'opacity', 'animation', 'layoutModel']
        };

        let isAtom = false;
        if (this.selectedNode.classList.contains('escms-column') || this.selectedNode.classList.contains('escms-grid-item')) {
            allowedControls = defaultControls['column'];
            isAtom = true;
        }

        if (!isAtom) {
            const categories = window.escmsAtomCategories || [];
            for (let cat of categories) {
                for (let atom of cat.atoms) {
                    let match = false;
                    if (atom.className) {
                        if (this.selectedNode.classList.contains(atom.className)) {
                            match = true;
                        }
                    } else if (this.selectedNode.tagName.toLowerCase() === atom.tag.toLowerCase()) {
                        match = true;
                    }
                    if (match) {
                        allowedControls = atom.allowedControls || defaultControls['default'];
                        isAtom = true;
                        break;
                    }
                }
                if (isAtom) break;
            }
        }

        if (!isAtom) {
            allowedControls = defaultControls[tag] || defaultControls['default'];
        }

        // Hide/Show Controls based on allowedControls
        Object.keys(this.controls).forEach(key => {
            if (this.controls[key].element) {
                this.controls[key].element.style.display = allowedControls.includes(key) ? 'grid' : 'none';
            }
        });
        Object.keys(this.attrInputs).forEach(key => {
            if (this.attrInputs[key].element) {
                this.attrInputs[key].element.style.display = allowedControls.includes(key) ? 'grid' : 'none';
            }
        });

        // Hide Sections if all their controls are hidden
        [this.structureSection, this.attrSection, this.controls.tagSwap.element.parentElement, this.controls.bgColor.element.parentElement, this.controls.margin.element.parentElement, this.controls.opacity.element.parentElement, this.effectsSection, this.navStylesSection].forEach(section => {
            if (!section) return;
            // Typo section is the parent of tagSwap, background is parent of bgColor, layout is parent of margin, visibility is parent of opacity
            let hasVisibleControls = Array.from(section.children).some(child => {
                // Ignore the label/header of the section which is a span or div with data-i18n
                if (child.hasAttribute('data-i18n') && child.tagName === 'DIV' && child.style.fontWeight === '600') return false;
                return child.style.display !== 'none';
            });
            section.style.display = hasVisibleControls ? 'flex' : 'none';
        });

        // Sync Heading Tag Swap manually since its value depends on the tag
        if (tag.match(/^h[1-6]$/) && allowedControls.includes('tagSwap')) {
            this.controls.tagSwap.setValue(tag, false);
        } else if (this.controls.tagSwap.element) {
            this.controls.tagSwap.element.style.display = 'none';
        }

        // Sync Structure manually since its value is custom
        if (allowedControls.includes('columnsCount') && (this.selectedNode.classList.contains('escms-columns') || this.selectedNode.hasAttribute('data-columns'))) {
            let cols = parseInt(this.selectedNode.getAttribute('data-columns')) || this.selectedNode.children.length || 2;
            this.controls.columnsCount.setValue(cols, false);
        }

        if (allowedControls.includes('gridItemWidth') && this.selectedNode.hasAttribute('data-item-width')) {
            let width = parseInt(this.selectedNode.getAttribute('data-item-width')) || 250;
            this.controls.gridItemWidth.setValue(width, false);
        }

        if (allowedControls.includes('imageCollection')) {
            let colStr = this.selectedNode.getAttribute('data-collection');
            let urls = [];
            try { if (colStr) urls = JSON.parse(colStr); } catch(e) {}
            this.controls.imageCollection.setValue(urls, false);
        }

        // Sync Attributes
        if (allowedControls.includes('src')) {
            this.attrInputs.src.setValue(this.selectedNode.getAttribute('src'), false);
            this.attrInputs.src.element.style.display = 'grid';
        }
        if (allowedControls.includes('alt')) {
            this.attrInputs.alt.setValue(this.selectedNode.getAttribute('alt'), false);
            this.attrInputs.alt.show();
        }
        if (allowedControls.includes('href')) {
            this.attrInputs.href.setValue(this.selectedNode.getAttribute('href'), false);
            this.attrInputs.href.element.style.display = 'grid';
        }
        if (allowedControls.includes('ariaLabel')) {
            this.attrInputs.ariaLabel.setValue(this.selectedNode.getAttribute('aria-label'), false);
            this.attrInputs.ariaLabel.element.style.display = 'grid';
        }

        // Typography
        if (allowedControls.includes('fontFamily')) {
            this.controls.fontFamily.updateOptions(this.getInstalledFonts());
            let fFamily = comp.fontFamily;
            if (fFamily) {
                let firstFont = fFamily.split(',')[0].trim().replace(/['"]/g, '');
                let fontOpt = this.controls.fontFamily.options.find(o => o.label === firstFont);
                if (fontOpt) this.controls.fontFamily.setValue(fontOpt.value, false);
                else this.controls.fontFamily.setValue('', false);
            } else {
                this.controls.fontFamily.setValue('', false);
            }
        }

        if (allowedControls.includes('fontWeight')) {
            let fWeight = comp.fontWeight;
            if (fWeight === 'normal') fWeight = '400';
            if (fWeight === 'bold') fWeight = '700';
            let weightOpt = this.controls.fontWeight.options.find(o => o.value === fWeight);
            if (weightOpt) this.controls.fontWeight.setValue(weightOpt.value, false);
            else this.controls.fontWeight.setValue('', false);
        }

        if (allowedControls.includes('color')) {
            let cColor = this._rgbaToHexA(comp.color);
            this.controls.color.setValue(cColor.hex, cColor.alpha, false);
        }

        if (allowedControls.includes('fontSize')) {
            let fSize = parseInt(comp.fontSize) || 16;
            this.controls.fontSize.setValue(fSize, false);
        }

        if (allowedControls.includes('letterSpacing')) {
            let lSpacingStr = comp.letterSpacing;
            let lSpacing = lSpacingStr === 'normal' ? 0 : parseFloat(lSpacingStr) || 0;
            this.controls.letterSpacing.setValue(lSpacing, false);
        }

        if (allowedControls.includes('textAlign')) {
            let tAlign = comp.textAlign === 'start' ? 'left' : comp.textAlign;
            this.controls.textAlign.setValue(['left', 'center', 'right', 'justify'].includes(tAlign) ? tAlign : 'left', false);
        }

        if (allowedControls.includes('textStyle')) {
            let activeStyles = [];
            if (comp.fontWeight === 'bold' || parseInt(comp.fontWeight) >= 700) activeStyles.push('bold');
            if (comp.fontStyle === 'italic') activeStyles.push('italic');
            if (comp.textDecorationLine.includes('underline')) activeStyles.push('underline');
            if (comp.textDecorationLine.includes('line-through')) activeStyles.push('strikethrough');
            this.controls.textStyle.setValue(activeStyles, false);
        }

        // Background
        if (allowedControls.includes('bgColor')) {
            let bColor = comp.backgroundColor;
            if (this.selectedNode.classList.contains('escms-portfolio')) bColor = this.selectedNode.style.getPropertyValue('--item-background-color') || bColor;
            let bgColor = this._rgbaToHexA(bColor);
            this.controls.bgColor.setValue(bgColor.hex, bgColor.alpha, false);
        }

        if (allowedControls.includes('bgGradient')) {
            let bGradient = comp.backgroundImage;
            if (this.selectedNode.classList.contains('escms-portfolio')) bGradient = this.selectedNode.style.getPropertyValue('--item-background-image') || bGradient;
            
            let isMesh = this.selectedNode.getAttribute('data-escms-mesh') === 'true';
            if (isMesh) bGradient = this.selectedNode.style.getPropertyValue('--escms-mesh-bg') || bGradient;

            let gradient = this._parseGradient(bGradient, isMesh);
            this.controls.bgGradient.setValue(gradient, false);
        }

        if (allowedControls.includes('bgImage')) {
            let bImg = comp.backgroundImage;
            if (this.selectedNode.classList.contains('escms-portfolio')) bImg = this.selectedNode.style.getPropertyValue('--item-background-image') || bImg;
            let bgImg = bImg !== 'none' && !bImg.includes('gradient') ? bImg : '';
            this.controls.bgImage.setValue({
                image: bgImg,
                size: comp.backgroundSize,
                repeat: comp.backgroundRepeat,
                position: comp.backgroundPosition
            }, false);
        }

        // Layout
        if (allowedControls.includes('sticky')) {
            let isSticky = comp.position === 'sticky';
            this.controls.sticky.setValue(isSticky, false);
        }



        if (allowedControls.includes('navAlign')) {
            let align = comp.justifyContent;
            this.controls.navAlign.setValue(['flex-start', 'center', 'flex-end'].includes(align) ? align : 'flex-start', false);
        }

        if (allowedControls.includes('itemAlign')) {
            let align = 'left';
            if (comp.marginRight === 'auto' && comp.marginLeft === 'auto') align = 'center';
            else if (comp.marginLeft === 'auto' && comp.marginRight === '0px') align = 'right';
            this.controls.itemAlign.setValue(align, false);
        }

        if (allowedControls.includes('contentValign')) {
            let align = comp.alignItems;
            this.controls.contentValign.setValue(['flex-start', 'center', 'flex-end'].includes(align) ? align : 'stretch', false);
        }

        if (allowedControls.includes('navHoverBg')) {
            let color = this.selectedNode.style.getPropertyValue('--nav-hover-bg') || 'rgba(59, 130, 246, 0.3)';
            let parsed = this._rgbaToHexA(color);
            this.controls.navHoverBg.setValue(parsed.hex, parsed.alpha, false);
        }

        if (allowedControls.includes('navSubBg')) {
            let color = this.selectedNode.style.getPropertyValue('--nav-sub-bg') || '#0a0a0a';
            let parsed = this._rgbaToHexA(color);
            this.controls.navSubBg.setValue(parsed.hex, parsed.alpha, false);
        }

        if (allowedControls.includes('navSubGlow')) {
            let color = this.selectedNode.style.getPropertyValue('--nav-sub-glow') || 'transparent';
            let parsed = this._rgbaToHexA(color);
            this.controls.navSubGlow.setValue(parsed.hex, parsed.alpha, false);
        }

        if (allowedControls.includes('navSubBorder')) {
            let width = parseInt(this.selectedNode.style.getPropertyValue('--nav-sub-border-width')) || 1;
            let style = this.selectedNode.style.getPropertyValue('--nav-sub-border-style') || 'solid';
            let colorStr = this.selectedNode.style.getPropertyValue('--nav-sub-border-color') || 'rgba(255, 255, 255, 0.05)';
            let parsedColor = this._rgbaToHexA(colorStr);
            let radius = parseInt(this.selectedNode.style.getPropertyValue('--nav-sub-radius')) || 6;
            this.controls.navSubBorder.setValue({ width, style, color: parsedColor.hex, alpha: parsedColor.alpha, radius, cssString: `${width}px ${style} ${colorStr}` }, false);
        }



        if (allowedControls.includes('spacerHeight')) {
            let sHeight = parseInt(comp.height) || 50;
            this.controls.spacerHeight.setValue(sHeight, false);
        }

        if (allowedControls.includes('margin')) this.controls.margin.setValue(this._parseSpacing(comp.margin), false);
        if (allowedControls.includes('padding')) this.controls.padding.setValue(this._parseSpacing(comp.padding), false);
        if (allowedControls.includes('border')) {
            let b = comp.border;
            let br = comp.borderRadius;
            if (this.selectedNode.classList.contains('escms-portfolio')) {
                b = this.selectedNode.style.getPropertyValue('--item-border') || 'none';
                br = this.selectedNode.style.getPropertyValue('--item-border-radius') || '0px';
            }
            this.controls.border.setValue(this._parseBorder(b, br), false);
        }

        // Visibility
        if (allowedControls.includes('opacity')) this.controls.opacity.setValue(this.selectedNode.style.opacity !== '' ? Math.round(parseFloat(this.selectedNode.style.opacity) * 100) : 100, false);
        if (allowedControls.includes('effects')) this.controls.effects.setValue(this.selectedNode.style.filter || 'none', false);
        if (allowedControls.includes('animation')) {
            let anim = this.selectedNode.getAttribute('data-escms-anim') || '';
            this.controls.animation.setValue(anim, false);
        }
        if (allowedControls.includes('layoutModel')) {
            this.controls.layoutModel.setValue(this.selectedNode);
        }

        this.isSyncing = false;
    }
}