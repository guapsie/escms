class EscmsParser {
    static domToJson(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? text : null;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            
            if (tag === 'escms-component') {
                return {
                    tag: 'escms-component',
                    ref: node.getAttribute('ref')
                };
            }

            const jsonNode = {
                tag: tag
            };

            const classes = Array.from(node.classList).filter(c => c !== 'escms-selected');
            if (classes.length > 0) {
                jsonNode.classes = classes;
            }

            if (node.style.cssText) {
                jsonNode.styles = node.style.cssText;
            }

            const attrs = {};
            const relevantAttrs = ['src', 'href', 'alt', 'title', 'target', 'id', 'ref'];
            relevantAttrs.forEach(attr => {
                if (node.hasAttribute(attr)) {
                    attrs[attr] = node.getAttribute(attr);
                }
            });
            
            if (Object.keys(attrs).length > 0) {
                jsonNode.attributes = attrs;
            }

            const children = [];
            node.childNodes.forEach(child => {
                const childJson = this.domToJson(child);
                if (childJson) {
                    children.push(childJson);
                }
            });

            if (children.length > 0) {
                jsonNode.children = children;
            }

            return jsonNode;
        }

        return null;
    }

    static jsonToDom(jsonNode) {
        if (typeof jsonNode === 'string') {
            return document.createTextNode(jsonNode);
        }

        if (!jsonNode || !jsonNode.tag) return null;

        const el = document.createElement(jsonNode.tag);

        if (jsonNode.tag === 'escms-component' && jsonNode.ref) {
            el.setAttribute('ref', jsonNode.ref);
            el.style.outline = '2px dashed #9333ea'; // Borde lila para indicar que es un componente
            el.style.display = 'block'; // Asegurar que sea visible
            
            // Inflate from memory
            if (window.escmsComponents && window.escmsComponents[jsonNode.ref]) {
                const compDataStr = window.escmsComponents[jsonNode.ref].editor_data;
                try {
                    const compJson = JSON.parse(compDataStr);
                    const compDom = this.jsonToDom(compJson);
                    if (compDom) {
                        el.appendChild(compDom);
                    }
                } catch (e) {
                    console.error('[ESCMS] Error inflating component', e);
                }
            } else {
                el.style.all = 'unset';
                el.style.display = 'block';
                el.innerHTML = `
                    <div style="padding: 20px; border: 2px dashed #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px; text-align: center; font-family: monospace; margin: 10px 0;">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" style="margin-bottom: 10px;">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <br>
                        <strong>Missing Component</strong><br>
                        <small>Reference: ${jsonNode.ref}</small>
                    </div>
                `;
            }
            return el;
        }

        if (jsonNode.classes && Array.isArray(jsonNode.classes)) {
            el.classList.add(...jsonNode.classes);
        }

        if (jsonNode.styles) {
            el.style.cssText = jsonNode.styles;
        }

        if (jsonNode.attributes) {
            Object.entries(jsonNode.attributes).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
        }

        if (jsonNode.children && Array.isArray(jsonNode.children)) {
            jsonNode.children.forEach(childJson => {
                const childDom = this.jsonToDom(childJson);
                if (childDom) {
                    el.appendChild(childDom);
                }
            });
        }

        return el;
    }
}