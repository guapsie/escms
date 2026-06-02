class EscmsParser {
    static domToJson(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            return text ? text : null;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const jsonNode = {
                tag: node.tagName.toLowerCase()
            };

            const classes = Array.from(node.classList).filter(c => c !== 'escms-selected');
            if (classes.length > 0) {
                jsonNode.classes = classes;
            }

            if (node.style.cssText) {
                jsonNode.styles = node.style.cssText;
            }

            const attrs = {};
            const relevantAttrs = ['src', 'href', 'alt', 'title', 'target', 'id'];
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