import { icons } from '../../../core/editor-icons.js';

export function renderComponents(panel) {
    if (!window.escmsComponents || Object.keys(window.escmsComponents).length === 0) {
        const empty = document.createElement('div');
        empty.setAttribute('data-i18n', 'leftpanel.empty_components');
        empty.textContent = panel.i18n.t('leftpanel.empty_components');
        empty.style.color = 'rgba(245, 245, 245, 0.3)';
        empty.style.fontSize = '0.8rem';
        empty.style.padding = '0 15px 15px 15px';
        empty.style.fontStyle = 'italic';
        panel.contentArea.appendChild(empty);
        return;
    }

    const grouped = {};
    Object.values(window.escmsComponents).forEach(comp => {
        const tpl = comp.template_id || 'custom';
        if (!grouped[tpl]) grouped[tpl] = [];
        grouped[tpl].push(comp);
    });

    Object.keys(grouped).forEach(tpl => {
        const header = document.createElement('div');
        const i18nKey = tpl === 'custom' ? 'leftpanel.custom_components' : `template.${tpl}`;
        header.setAttribute('data-i18n', i18nKey);
        header.textContent = panel.i18n.dictionary[i18nKey] || (tpl === 'custom' ? 'CUSTOM' : tpl.toUpperCase());
        header.style.fontSize = '0.75rem';
        header.style.textTransform = 'uppercase';
        header.style.letterSpacing = '1px';
        header.style.color = 'rgba(245, 245, 245, 0.4)';
        header.style.padding = '15px 15px 10px 15px';
        header.style.fontWeight = '600';
        panel.contentArea.appendChild(header);

        const listContainer = document.createElement('div');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.padding = '0 15px 15px 15px';
        listContainer.style.gap = '8px';

        grouped[tpl].forEach(comp => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.style.background = '#1f1f1f';
            item.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            item.style.borderRadius = '6px';
            item.style.padding = '10px';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.2s';
            
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'component', data: comp }));
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'center';
            leftDiv.style.gap = '10px';
            
            const iconWrap = document.createElement('div');
            iconWrap.innerHTML = icons.boxModel || icons.square;
            iconWrap.style.color = 'var(--accent-solid)';
            iconWrap.style.width = '16px';
            iconWrap.style.height = '16px';
            
            const svg = iconWrap.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = comp.name;
            titleSpan.style.fontSize = '0.85rem';
            titleSpan.style.color = 'var(--text-solid)';
            
            leftDiv.appendChild(iconWrap);
            leftDiv.appendChild(titleSpan);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '5px';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = icons.edit || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
            editBtn.setAttribute('data-i18n-title', 'leftpanel.edit_component');
            editBtn.title = panel.i18n.t('leftpanel.edit_component');
            editBtn.style.background = 'transparent';
            editBtn.style.border = 'none';
            editBtn.style.color = 'rgba(255, 255, 255, 0.4)';
            editBtn.style.cursor = 'pointer';
            editBtn.style.transition = 'color 0.2s';
            
            const editSvg = editBtn.querySelector('svg');
            if (editSvg) { editSvg.style.width = '14px'; editSvg.style.height = '14px'; }
            
            editBtn.addEventListener('mouseenter', () => editBtn.style.color = 'var(--text-solid)');
            editBtn.addEventListener('mouseleave', () => editBtn.style.color = 'rgba(255, 255, 255, 0.4)');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('escms-component-edit', { detail: { component: comp } }));
            });

            const addBtn = document.createElement('button');
            addBtn.innerHTML = icons.plus;
            addBtn.setAttribute('data-i18n-title', 'leftpanel.add_to_canvas');
            addBtn.title = panel.i18n.t('leftpanel.add_to_canvas');
            addBtn.style.background = 'transparent';
            addBtn.style.border = 'none';
            addBtn.style.color = 'rgba(255, 255, 255, 0.4)';
            addBtn.style.cursor = 'pointer';
            addBtn.style.transition = 'color 0.2s';
            
            const plusSvg = addBtn.querySelector('svg');
            if (plusSvg) { plusSvg.style.width = '16px'; plusSvg.style.height = '16px'; }
            
            addBtn.addEventListener('mouseenter', () => addBtn.style.color = 'var(--text-solid)');
            addBtn.addEventListener('mouseleave', () => addBtn.style.color = 'rgba(255, 255, 255, 0.4)');
            
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                panel.injectComponent(comp);
            });
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(addBtn);
            
            item.appendChild(leftDiv);
            item.appendChild(actionsDiv);
            listContainer.appendChild(item);
        });

        panel.contentArea.appendChild(listContainer);
    });
}
