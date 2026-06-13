import { icons } from '../../../core/editor-icons.js';

export function renderAtoms(panel) {
    const categories = window.escmsAtomCategories || [];
    categories.forEach(cat => {
        const header = document.createElement('div');
        header.setAttribute('data-i18n', cat.name);
        header.textContent = panel.i18n.dictionary[cat.name] || cat.name;
        header.style.fontSize = '0.75rem';
        header.style.textTransform = 'uppercase';
        header.style.letterSpacing = '1px';
        header.style.color = 'rgba(245, 245, 245, 0.4)';
        header.style.padding = '15px 15px 10px 15px';
        header.style.fontWeight = '600';
        panel.contentArea.appendChild(header);

        if (cat.atoms.length === 0) {
            const empty = document.createElement('div');
            empty.setAttribute('data-i18n', 'leftpanel.empty_atoms');
            empty.textContent = panel.i18n.t('leftpanel.empty_atoms');
            empty.style.color = 'rgba(245, 245, 245, 0.3)';
            empty.style.fontSize = '0.8rem';
            empty.style.padding = '0 15px 15px 15px';
            empty.style.fontStyle = 'italic';
            panel.contentArea.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '8px';
        grid.style.padding = '0 15px 15px 15px';

        cat.atoms.forEach(atom => {
            const btn = document.createElement('button');
            btn.title = atom.name;
            btn.innerHTML = icons[atom.icon] || icons.boxModel2 || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.background = '#1f1f1f';
            btn.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            btn.style.borderRadius = '6px';
            btn.style.padding = '0.5rem';
            btn.style.color = 'var(--text-solid)';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s ease';

            const svg = btn.querySelector('svg');
            if (svg) {
                svg.style.width = '20px';
                svg.style.height = '20px';
                svg.style.pointerEvents = 'none';
            }

            btn.addEventListener('mouseenter', () => btn.style.borderColor = 'var(--accent-solid)');
            btn.addEventListener('mouseleave', () => btn.style.borderColor = 'rgba(255, 255, 255, 0.05)');

            btn.addEventListener('click', () => panel.injectAtom(atom));

            btn.draggable = true;
            btn.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'atom', data: atom }));
                e.dataTransfer.effectAllowed = 'copy';
            });

            grid.appendChild(btn);
        });

        panel.contentArea.appendChild(grid);
    });
}
