/**
 * ESCMS DOM Helper
 * Una utilidad minimalista para crear elementos DOM sin framework.
 * 
 * Uso:
 * const el = EscmsDOM.el;
 * el('div', { class: 'mi-clase', 'data-i18n': 'key' }, [
 *    el('span', {}, 'Texto hijo'),
 *    el('button', { onclick: () => alert('Hola') }, 'Click')
 * ]);
 */
const EscmsDOM = {
    el: (tag, attrs = {}, children = []) => {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attrs)) {
            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'class' || key === 'className') {
                if (value) element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'html') {
                element.innerHTML = value;
            } else if (value !== null && value !== undefined) {
                element.setAttribute(key, value);
            }
        }
        
        if (!Array.isArray(children)) {
            children = [children];
        }
        
        for (const child of children) {
            if (child instanceof Node) {
                element.appendChild(child);
            } else if (child !== null && child !== undefined) {
                element.appendChild(document.createTextNode(String(child)));
            }
        }
        
        return element;
    }
};

window.el = EscmsDOM.el;
