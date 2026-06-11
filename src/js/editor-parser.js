import { el } from './escms-dom.js';

export class EscmsParser {
    // Definimos los atributos relevantes como propiedad estática para no recrear el array en cada iteración
    static RELEVANT_ATTRS = ['src', 'href', 'alt', 'title', 'target', 'id', 'ref', 'aria-label', 'placeholder', 'type', 'name', 'value', 'data-escms-mesh', 'data-escms-anim'];

    // ==========================================
    // 1. SERIALIZACIÓN (DOM -> JSON)
    // ==========================================
    static domToJson(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            // Usamos /^\s*$/ para descartar cualquier nodo que sea solo espacios, saltos o tabs
            if (!text || /^\s*$/.test(text)) return null;
            return text;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            const isAtom = node.hasAttribute('data-escms-atom');
            const isComponent = tag === 'escms-component';

            // Base del nodo JSON
            const jsonNode = isAtom ? {
                atom: node.getAttribute('data-escms-atom'),
                tag: tag
            } : isComponent ? {
                tag: 'escms-component',
                ref: node.getAttribute('ref')
            } : {
                tag: tag
            };

            // --- Extracción unificada de Clases, Estilos y Atributos ---
            
            // Estilos inline (IMPORTANTE: Esto debe extraerse incluso para componentes si queremos que guarden posición, etc)
            if (node.style && node.style.length > 0) {
                jsonNode.styles = node.style.cssText;
            }

            // Si es un componente puro, devolvemos ya (no necesitamos sus hijos internos ni clases/attrs, solo los estilos base)
            if (isComponent) return jsonNode;

            // Props de Atoms
            if (isAtom) {
                const propsStr = node.getAttribute('data-escms-props');
                if (propsStr) {
                    try {
                        jsonNode.props = JSON.parse(propsStr);
                    } catch (e) {
                        console.warn('[ESCMS Parser] Invalid JSON in atom props:', propsStr);
                    }
                }
            }

            // Clases (Filtrando las del editor en runtime)
            const classes = Array.from(node.classList).filter(c => !c.match(/^escms-(selected|drag|hover)/));
            if (classes.length > 0) jsonNode.classes = classes;

            // Estilos
            if (node.style.cssText) jsonNode.styles = node.style.cssText;

            // Atributos
            const attrs = {};
            this.RELEVANT_ATTRS.forEach(attr => {
                if (node.hasAttribute(attr)) attrs[attr] = node.getAttribute(attr);
            });
            if (Object.keys(attrs).length > 0) jsonNode.attributes = attrs;

            // --- Recursividad para los Hijos ---

            // Excepciones: Nav y SiteLogo no guardan hijos en el JSON
            if (!isAtom || (jsonNode.atom !== 'Nav' && jsonNode.atom !== 'SiteLogo')) {
                const children = [];
                node.childNodes.forEach(child => {
                    const childJson = this.domToJson(child);
                    if (childJson) children.push(childJson);
                });
                if (children.length > 0) jsonNode.children = children;
            }

            return jsonNode;
        }

        return null;
    }

    // ==========================================
    // 2. DESERIALIZACIÓN (JSON -> DOM)
    // ==========================================
    static jsonToDom(jsonNode) {
        if (typeof jsonNode === 'string') {
            return document.createTextNode(jsonNode);
        }

        if (!jsonNode || (!jsonNode.tag && !jsonNode.atom)) return null;

        let el;

        // --- A. Inflar un ATOM ---
        if (jsonNode.atom) {
            const atomName = jsonNode.atom;
            const atomDef = window.escmsAtoms?.[atomName];

            if (atomDef) {
                el = document.createElement(jsonNode.tag || atomDef.tag || 'div');
                if (atomDef.className) el.classList.add(...atomDef.className.split(' '));

                if (atomDef.styles) {
                    el.style.cssText = typeof atomDef.styles === 'object'
                        ? Object.entries(atomDef.styles).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')
                        : atomDef.styles;
                }

                if (atomDef.attributes) {
                    Object.entries(atomDef.attributes).forEach(([k, v]) => el.setAttribute(k, v));
                }

                // TextKey por defecto (Traducciones)
                if (atomDef.textKey && (!jsonNode.children || jsonNode.children.length === 0)) {
                    const i18n = window.escmsEditor?.i18n?.dictionary || {};
                    el.textContent = i18n[atomDef.textKey] || atomDef.textKey;
                }
            } else {
                el = this._buildMissingUI(`Missing Atom: ${atomName}`);
            }

            el.setAttribute('data-escms-atom', atomName);

            // Aplicar Props guardadas
            if (jsonNode.props) {
                el.setAttribute('data-escms-props', JSON.stringify(jsonNode.props));
                if (jsonNode.props['class-name']) el.classList.add(...jsonNode.props['class-name'].split(' '));
                if (jsonNode.props.align) el.style.textAlign = jsonNode.props.align;
            }

            // Aplicar propiedades base
            this._applyBaseProperties(el, jsonNode);

            // Casos especiales de Atoms (Lógica compleja separada)
            if (atomName === 'Nav') {
                this._buildNavAtom(el);
            } else if (atomName === 'SiteLogo') {
                const logoSrc = window.escmsEditor?.settings?.config?.site_logo || '/data/user-settings/default-logo.png';
                el.setAttribute('src', logoSrc);
            } else {
                this._inflateChildren(el, jsonNode, atomDef);
            }

            return el;
        }

        // --- B. Inflar un COMPONENTE ---
        if (jsonNode.tag === 'escms-component') {
            el = document.createElement('escms-component');
            el.setAttribute('ref', jsonNode.ref);
            if (jsonNode.styles) {
                el.style.cssText += ';' + jsonNode.styles;
            }

            const compDataStr = window.escmsComponents?.[jsonNode.ref]?.editor_data;
            if (compDataStr) {
                try {
                    const compDom = this.jsonToDom(JSON.parse(compDataStr));
                    if (compDom) {
                        while (compDom.firstChild) el.appendChild(compDom.firstChild);
                    }
                } catch (e) {
                    console.error('[ESCMS] Error inflating component:', jsonNode.ref, e);
                }
            } else {
                el = this._buildMissingUI(`Missing Component: ${jsonNode.ref}`, true);
            }
            return el;
        }

        // --- C. Inflar un ELEMENTO ESTÁNDAR ---
        el = document.createElement(jsonNode.tag);
        this._applyBaseProperties(el, jsonNode);
        this._inflateChildren(el, jsonNode);

        return el;
    }

    // ==========================================
    // 3. MÉTODOS AUXILIARES (Limpieza de código)
    // ==========================================

    static _applyBaseProperties(el, jsonNode) {
        if (jsonNode.classes && Array.isArray(jsonNode.classes)) {
            el.classList.add(...jsonNode.classes);
        }
        if (jsonNode.styles) {
            el.style.cssText += ';' + jsonNode.styles;
        }
        if (jsonNode.attributes) {
            Object.entries(jsonNode.attributes).forEach(([k, v]) => el.setAttribute(k, v));
        }
    }

    static _inflateChildren(el, jsonNode, atomDef = null) {
        if (jsonNode.children && Array.isArray(jsonNode.children) && jsonNode.children.length > 0) {
            jsonNode.children.forEach(childJson => {
                const childDom = this.jsonToDom(childJson);
                if (childDom) el.appendChild(childDom);
            });
        } else if (atomDef && atomDef.children) {
            atomDef.children.forEach(childDef => {
                let childJson = childDef.name
                    ? { atom: childDef.name, props: childDef.className ? { 'class-name': childDef.className } : {} }
                    : { tag: childDef.tag, classes: childDef.className ? childDef.className.split(' ') : undefined };

                const childDom = this.jsonToDom(childJson);
                if (childDom) el.appendChild(childDom);
            });
        }
    }

    static _buildNavAtom(el) {
        el.style.cssText += '; display:flex; width:100%;';

        const ul = document.createElement('ul');
        ul.className = 'escms-nav-list';
        ul.style.cssText = 'list-style:none; display:flex; gap:20px; margin:0; padding:0;';

        const pm = window.escmsEditor?.leftpanel?.pageManager;

        const buildHtml = (nodes) => {
            const filteredNodes = nodes.filter(p => parseInt(p.is_hidden_menu) !== 1 && p.status === 'published' && p.slug !== '404');

            filteredNodes.forEach(node => {
                const li = document.createElement('li');
                li.className = 'escms-nav-item';

                const a = document.createElement('a');
                a.className = 'escms-nav-link';
                a.style.cssText = 'text-decoration:none; color:inherit;';
                a.href = parseInt(node.is_custom_link) === 1 ? node.custom_link_url : '/' + node.slug;
                a.textContent = node.title;

                const filteredChildren = node.children ? node.children.filter(p => parseInt(p.is_hidden_menu) !== 1 && p.status === 'published' && p.slug !== '404') : [];

                if (filteredChildren.length > 0) {
                    a.innerHTML += window.escmsIcons?.caretDown || '';
                }
                li.appendChild(a);

                if (filteredChildren.length > 0) {
                    const subul = document.createElement('ul');
                    subul.className = 'escms-nav-sublist';
                    buildHtml(filteredChildren).childNodes.forEach(c => subul.appendChild(c.cloneNode(true)));
                    li.appendChild(subul);
                }
                ul.appendChild(li);
            });
            return ul;
        };

        if (pm?.pages) {
            const roots = pm.buildTree().filter(p => parseInt(p.is_hidden_menu) !== 1 && p.status === 'published' && p.slug !== '404');
            if (roots.length > 0) buildHtml(roots);
            else ul.innerHTML = '<li class="escms-nav-item"><a class="escms-nav-link" href="#" style="text-decoration:none; color:inherit;">Menu Empty</a></li>';
        } else {
            // Default Fallback
            ['Home', 'About', 'Contact'].forEach(text => {
                const li = document.createElement('li');
                li.className = 'escms-nav-item';
                li.innerHTML = `<a class="escms-nav-link" href="/${text.toLowerCase()}" style="text-decoration:none; color:inherit;">${text}</a>`;
                ul.appendChild(li);
            });
        }

        const hamburger = document.createElement('div');
        hamburger.className = 'escms-hamburger';
        hamburger.setAttribute('onclick', "this.parentElement.classList.toggle('is-open')");
        hamburger.innerHTML = (window.escmsIcons?.hamburger || '') + (window.escmsIcons?.close || '');

        el.appendChild(hamburger);
        el.appendChild(ul);
    }

    static _buildMissingUI(message, isComponent = false) {
        const el = document.createElement(isComponent ? 'escms-component' : 'div');
        if (isComponent) {
            el.style.cssText = 'all: unset; display: block;';
            el.innerHTML = `
                <div style="padding: 20px; border: 2px dashed #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px; text-align: center; font-family: monospace; margin: 10px 0;">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" style="margin-bottom: 10px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg><br>
                    <strong>${message}</strong>
                </div>`;
        } else {
            el.classList.add('escms-missing-atom');
            el.textContent = `[${message}]`;
            el.style.cssText = 'border: 1px dashed red; padding: 10px; color: red;';
        }
        return el;
    }
}