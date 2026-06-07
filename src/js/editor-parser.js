class EscmsParser {
    static domToJson(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            // Drop empty nodes or nodes that are purely HTML formatting artifacts (newlines/tabs without spaces)
            if (!text || /^[\n\t\r]+$/.test(text)) return null;
            return text;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const relevantAttrs = ['src', 'href', 'alt', 'title', 'target', 'id', 'ref', 'aria-label', 'placeholder', 'type', 'name', 'value'];

            if (node.hasAttribute('data-escms-atom')) {
                const atomName = node.getAttribute('data-escms-atom');
                const jsonNode = { 
                    atom: atomName,
                    tag: node.tagName.toLowerCase()
                };
                
                const propsStr = node.getAttribute('data-escms-props');
                if (propsStr) {
                    try { jsonNode.props = JSON.parse(propsStr); } catch (e) {}
                }
                
                const classes = Array.from(node.classList).filter(c => !c.startsWith('escms-selected') && !c.startsWith('escms-drag-') && !c.startsWith('escms-hover'));
                if (classes.length > 0) jsonNode.classes = classes;
                if (node.style.cssText) jsonNode.styles = node.style.cssText;
                
                const attrs = {};
                relevantAttrs.forEach(attr => {
                    if (node.hasAttribute(attr)) attrs[attr] = node.getAttribute(attr);
                });
                if (Object.keys(attrs).length > 0) jsonNode.attributes = attrs;
                
                // If the atom accepts children (like Container), serialize them.
                if (atomName !== 'Nav' && atomName !== 'SiteLogo') {
                    const children = [];
                    node.childNodes.forEach(child => {
                        const childJson = this.domToJson(child);
                        if (childJson) children.push(childJson);
                    });
                    if (children.length > 0) jsonNode.children = children;
                }
                
                return jsonNode;
            }

            const tag = node.tagName.toLowerCase();
            
            if (tag === 'escms-component') {
                return {
                    tag: 'escms-component',
                    ref: node.getAttribute('ref')
                };
            }

            const jsonNode = { tag: tag };

            const classes = Array.from(node.classList).filter(c => c !== 'escms-selected');
            if (classes.length > 0) {
                jsonNode.classes = classes;
            }

            if (node.style.cssText) {
                jsonNode.styles = node.style.cssText;
            }

            const attrs = {};
            relevantAttrs.forEach(attr => {
                if (node.hasAttribute(attr)) attrs[attr] = node.getAttribute(attr);
            });
            if (Object.keys(attrs).length > 0) jsonNode.attributes = attrs;

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

        if (!jsonNode || (!jsonNode.tag && !jsonNode.atom)) return null;

        if (jsonNode.atom) {
            const atomName = jsonNode.atom;
            const atomDef = window.escmsAtoms && window.escmsAtoms[atomName];
            
            let el;
            if (atomDef) {
                el = document.createElement(atomDef.tag || 'div');
                if (atomDef.className) el.classList.add(...atomDef.className.split(' '));
                if (atomDef.styles) {
                    if (typeof atomDef.styles === 'object') {
                        el.style.cssText = Object.entries(atomDef.styles)
                            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
                            .join(';');
                    } else {
                        el.style.cssText = atomDef.styles;
                    }
                }
                if (atomDef.attributes) {
                    Object.entries(atomDef.attributes).forEach(([k, v]) => el.setAttribute(k, v));
                }
                if (atomDef.textKey && (!jsonNode.children || jsonNode.children.length === 0)) {
                    const i18n = window.escmsEditor && window.escmsEditor.i18n ? window.escmsEditor.i18n.dictionary : {};
                    el.textContent = i18n[atomDef.textKey] || atomDef.textKey;
                }
            } else {
                el = document.createElement('div');
                el.classList.add('escms-missing-atom');
                el.textContent = `[Missing Atom: ${atomName}]`;
                el.style.border = '1px dashed red';
                el.style.padding = '10px';
                el.style.color = 'red';
            }

            el.setAttribute('data-escms-atom', atomName);
            
            if (jsonNode.props) {
                el.setAttribute('data-escms-props', JSON.stringify(jsonNode.props));
                if (jsonNode.props['class-name']) el.classList.add(...jsonNode.props['class-name'].split(' '));
                if (jsonNode.props.align) el.style.textAlign = jsonNode.props.align;
                // We can support more props here
            }

            if (jsonNode.classes) el.classList.add(...jsonNode.classes);
            if (jsonNode.styles) {
                const existingAlign = el.style.textAlign;
                el.style.cssText += ';' + jsonNode.styles; // Append to not overwrite defaults entirely if we do that later
            }
            if (jsonNode.attributes) {
                Object.entries(jsonNode.attributes).forEach(([k, v]) => el.setAttribute(k, v));
            }

            if (atomName === 'Nav') {
                el.style.display = 'flex';
                el.style.width = '100%';
                const ul = document.createElement('ul');
                ul.style.listStyle = 'none';
                ul.style.display = 'flex';
                ul.style.gap = '20px';
                ul.style.margin = '0';
                ul.style.padding = '0';
                ul.className = 'escms-nav-list';
                
                const pm = window.escmsEditor && window.escmsEditor.leftpanel && window.escmsEditor.leftpanel.pageManager;
                
                const buildHtml = (nodes) => {
                    const filteredNodes = nodes.filter(p => 
                        parseInt(p.is_hidden_menu) !== 1 && 
                        p.status === 'published' &&
                        p.slug !== '404'
                    );

                    filteredNodes.forEach(node => {
                        const li = document.createElement('li');
                        li.className = 'escms-nav-item';
                        const a = document.createElement('a');
                        a.className = 'escms-nav-link';
                        a.href = parseInt(node.is_custom_link) === 1 ? node.custom_link_url : '/' + node.slug;
                        a.textContent = node.title;
                        
                        const filteredChildren = node.children ? node.children.filter(p => 
                            parseInt(p.is_hidden_menu) !== 1 && 
                            p.status === 'published' &&
                            p.slug !== '404'
                        ) : [];

                        if (filteredChildren.length > 0) {
                            a.innerHTML += window.escmsIcons ? window.escmsIcons.caretDown : '';
                        }
                        a.style.textDecoration = 'none';
                        a.style.color = 'inherit';
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

                if (pm && pm.pages) {
                    const roots = pm.buildTree();
                    const filteredRoots = roots.filter(p => 
                        parseInt(p.is_hidden_menu) !== 1 && 
                        p.status === 'published' &&
                        p.slug !== '404'
                    );
                    if (filteredRoots.length > 0) {
                        buildHtml(filteredRoots);
                    } else {
                        ul.innerHTML = '<li class="escms-nav-item"><a class="escms-nav-link" href="#" style="text-decoration:none; color:inherit;">Menu Empty</a></li>';
                    }
                } else {
                    const links = [{ text: 'Home', href: '/' }, { text: 'About', href: '/about' }, { text: 'Contact', href: '/contact' }];
                    links.forEach(link => {
                        const li = document.createElement('li');
                        li.className = 'escms-nav-item';
                        const a = document.createElement('a');
                        a.className = 'escms-nav-link';
                        a.href = link.href;
                        a.textContent = link.text;
                        a.style.textDecoration = 'none';
                        a.style.color = 'inherit';
                        li.appendChild(a);
                        ul.appendChild(li);
                    });
                }
                const hamburger = document.createElement('div');
                hamburger.className = 'escms-hamburger';
                hamburger.setAttribute('onclick', "this.parentElement.classList.toggle('is-open')");
                if (window.escmsIcons) hamburger.innerHTML = (window.escmsIcons.hamburger || '') + (window.escmsIcons.close || '');
                el.appendChild(hamburger);
                el.appendChild(ul);
            } else if (atomName === 'SiteLogo') {
                if (window.escmsEditor && window.escmsEditor.settings && window.escmsEditor.settings.config.site_logo) {
                    el.setAttribute('src', window.escmsEditor.settings.config.site_logo);
                } else {
                    el.setAttribute('src', '/data/user-settings/default-logo.png'); // fallback
                }
            } else {
                if (jsonNode.children && Array.isArray(jsonNode.children) && jsonNode.children.length > 0) {
                    // Inject user-defined children from the template/save
                    jsonNode.children.forEach(childJson => {
                        const childDom = this.jsonToDom(childJson);
                        if (childDom) el.appendChild(childDom);
                    });
                } else if (atomDef && atomDef.children) {
                    // If atom schema provides default structural children, and no user children exist
                    atomDef.children.forEach(childDef => {
                        let childJson;
                        if (childDef.name) {
                            childJson = { atom: childDef.name, props: {} };
                            if (childDef.className) childJson.props['class-name'] = childDef.className;
                        } else if (childDef.tag) {
                            childJson = { tag: childDef.tag };
                            if (childDef.className) childJson.classes = childDef.className.split(' ');
                        }
                        
                        if (childJson) {
                            const childDom = this.jsonToDom(childJson);
                            if (childDom) el.appendChild(childDom);
                        }
                    });
                }
            }
            
            return el;
        }

        const el = document.createElement(jsonNode.tag);

        if (jsonNode.tag === 'escms-component' && jsonNode.ref) {
            el.setAttribute('ref', jsonNode.ref);
            
            // Inflate from memory
            if (window.escmsComponents && window.escmsComponents[jsonNode.ref]) {
                const compDataStr = window.escmsComponents[jsonNode.ref].editor_data;
                try {
                    const compJson = JSON.parse(compDataStr);
                    const compDom = this.jsonToDom(compJson);
                    if (compDom) {
                        // The component data is saved with a root wrapper (tag: div). We want its children.
                        while (compDom.firstChild) {
                            el.appendChild(compDom.firstChild);
                        }
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