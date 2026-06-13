export class EscmsResponsiveStyles {
    constructor(documentRoot) {
        this.documentRoot = documentRoot;
        this.styleId = 'escms-page-styles';
        this.styles = {}; 
        this.exportCssText = '';
        this.initStyleElement();
    }

    initStyleElement() {
        this.styleEl = this.documentRoot.querySelector('#' + this.styleId);
        if (!this.styleEl) {
            this.styleEl = document.createElement('style');
            this.styleEl.id = this.styleId;
            if (this.documentRoot.firstChild) {
                this.documentRoot.insertBefore(this.styleEl, this.documentRoot.firstChild);
            } else {
                this.documentRoot.appendChild(this.styleEl);
            }
        } else {
            // Delay loading to ensure CSSOM is ready after DOM injection
            setTimeout(() => this.loadFromDOM(), 50);
        }
    }

    _initId(id) {
        if (!this.styles[id]) {
            this.styles[id] = { desktop: {}, tablet: {}, phone: {} };
        }
    }

    loadFromDOM() {
        this.styles = {};
        const sheet = this.styleEl.sheet;
        if (!sheet) return;

        for (let rule of sheet.cssRules) {
            if (rule.type === CSSRule.STYLE_RULE) {
                const selector = rule.selectorText;
                if (selector.startsWith('#')) {
                    const id = selector.substring(1);
                    this._initId(id);
                    for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        this.styles[id].desktop[prop] = rule.style.getPropertyValue(prop);
                    }
                }
            } else if (rule.type === CSSRule.MEDIA_RULE) {
                const mediaText = rule.media.mediaText || rule.conditionText;
                let viewport = 'tablet';
                if (mediaText && mediaText.includes('768')) viewport = 'phone';

                for (let innerRule of rule.cssRules) {
                    if (innerRule.type === CSSRule.STYLE_RULE) {
                        const selector = innerRule.selectorText;
                        if (selector.startsWith('#')) {
                            const id = selector.substring(1);
                            this._initId(id);
                            for (let i = 0; i < innerRule.style.length; i++) {
                                const prop = innerRule.style[i];
                                let val = innerRule.style.getPropertyValue(prop);
                                // Remove !important flag from stored value since we auto-inject it
                                val = val.replace(/\s*!important/i, '').trim();
                                this.styles[id][viewport][prop] = val;
                            }
                        }
                    }
                }
            }
        }
        this.render();
    }

    setStyle(nodeId, viewport, prop, value) {
        this._initId(nodeId);
        
        if (value === '' || value === 'none' || value === null) {
            delete this.styles[nodeId][viewport][prop];
        } else {
            this.styles[nodeId][viewport][prop] = value;
        }
        this.render();
    }

    getStyle(nodeId, viewport, prop) {
        if (!this.styles[nodeId]) return '';
        return this.styles[nodeId][viewport][prop] || '';
    }

    cleanOrphanedRules(domRoot) {
        let changed = false;
        for (let id in this.styles) {
            if (!domRoot.querySelector('#' + id)) {
                delete this.styles[id];
                changed = true;
            }
        }
        if (changed) this.render();
    }

    render() {
        let cssEditor = ''; 
        let cssExport = ''; 

        for (let id in this.styles) {
            const rules = this.styles[id];
            let d = '', t = '', p = '';

            for (let k in rules.desktop) {
                d += `${k}: ${rules.desktop[k]}; `;
            }
            for (let k in rules.tablet) {
                t += `${k}: ${rules.tablet[k]} !important; `;
            }
            for (let k in rules.phone) {
                p += `${k}: ${rules.phone[k]} !important; `;
            }

            if (d) {
                cssEditor += `#${id} { ${d}}\n`;
                cssExport += `#${id} { ${d}}\n`;
            }
            if (t) {
                // For Editor (Container Queries to support responsive canvas without iframe)
                cssEditor += `@container viewport (max-width: 1024px) { #${id} { ${t}} }\n`;
                // For Frontend Export (Standard Media Queries)
                cssExport += `@media (max-width: 1024px) { #${id} { ${t}} }\n`;
            }
            if (p) {
                cssEditor += `@container viewport (max-width: 768px) { #${id} { ${p}} }\n`;
                cssExport += `@media (max-width: 768px) { #${id} { ${p}} }\n`;
            }
        }

        this.styleEl.textContent = cssEditor;
        this.exportCssText = cssExport;
    }
}
