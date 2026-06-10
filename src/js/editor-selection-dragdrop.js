window.escmsSetupDragDrop = function (editor, documentRoot) {
    editor.dragHandle.addEventListener('dragstart', (e) => {
        window.escmsDraggedNode = editor.currentHoverNode || editor.selectedNode;
        if (!window.escmsDraggedNode) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move', action: 'canvas-move' }));
        setTimeout(() => { if (window.escmsDraggedNode) window.escmsDraggedNode.style.opacity = '0.5'; }, 0);
    });

    editor.dragHandle.addEventListener('dragend', (e) => {
        if (window.escmsDraggedNode) {
            window.escmsDraggedNode.style.opacity = '';
            window.escmsDraggedNode = null;
        }
        documentRoot.querySelectorAll('.escms-drag-target').forEach(el => el.classList.remove('escms-drag-target'));
        window.escmsUpdateHandlePosition(editor, editor.currentHoverNode || editor.selectedNode);
    });

    documentRoot.addEventListener('dragover', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!e.dataTransfer.types.includes('application/json')) return;

        if (window.escmsDraggedNode) {
            e.dataTransfer.dropEffect = 'move';
            if (e.target === window.escmsDraggedNode || window.escmsDraggedNode.contains(e.target)) {
                e.dataTransfer.dropEffect = 'none'; return;
            }
        } else { e.dataTransfer.dropEffect = 'copy'; }

        documentRoot.querySelectorAll('.escms-drag-target, .escms-drag-top, .escms-drag-bottom, .escms-drag-inside')
            .forEach(el => el.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside'));

        let target = window.escmsResolveTarget(e.target);
        if (target) {
            const rect = target.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);

            if (target.id === 'document-root') {
                target.classList.add((relY < rect.height * 0.5 && target.firstChild) ? 'escms-drag-top' : 'escms-drag-bottom');
            } else {
                if (relY < rect.height * 0.25) target.classList.add('escms-drag-top');
                else if (relY > rect.height * 0.75) target.classList.add('escms-drag-bottom');
                else if (isContainer) target.classList.add('escms-drag-inside');
                else target.classList.add('escms-drag-bottom');
            }
        }
    });

    documentRoot.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        if (e.target && e.target.classList) {
            e.target.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside');
        }
    });

    documentRoot.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        documentRoot.querySelectorAll('.escms-drag-target, .escms-drag-top, .escms-drag-bottom, .escms-drag-inside')
            .forEach(el => el.classList.remove('escms-drag-target', 'escms-drag-top', 'escms-drag-bottom', 'escms-drag-inside'));

        const dataString = e.dataTransfer.getData('application/json');
        if (!dataString) return;

        try {
            const payload = JSON.parse(dataString);
            let target = window.escmsResolveTarget(e.target);

            if (payload.action === 'canvas-move' && window.escmsDraggedNode) {
                if (target && target !== window.escmsDraggedNode && !window.escmsDraggedNode.contains(target)) {
                    const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);
                    const rect = target.getBoundingClientRect();
                    const relY = e.clientY - rect.top;

                    window.escmsDraggedNode.remove();

                    if (target.id === 'document-root') {
                        if (relY < rect.height * 0.5 && target.firstChild) target.insertBefore(window.escmsDraggedNode, target.firstChild);
                        else target.appendChild(window.escmsDraggedNode);
                    } else {
                        if (relY < rect.height * 0.25) target.parentNode.insertBefore(window.escmsDraggedNode, target);
                        else if (relY > rect.height * 0.75) target.parentNode.insertBefore(window.escmsDraggedNode, target.nextSibling);
                        else if (isContainer) target.appendChild(window.escmsDraggedNode);
                        else target.parentNode.insertBefore(window.escmsDraggedNode, target.nextSibling);
                    }

                    const droppedNode = window.escmsDraggedNode;
                    droppedNode.classList.add('escms-dropped');
                    setTimeout(() => droppedNode.classList.remove('escms-dropped'), 300);
                    setTimeout(() => { droppedNode.click(); window.dispatchEvent(new Event('escms-dom-mutated')); }, 10);
                }
            } else {
                let dropAction = 'inside';
                if (target && target.id !== 'document-root') {
                    const rect = target.getBoundingClientRect();
                    const relY = e.clientY - rect.top;
                    const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER'].includes(target.tagName);

                    if (relY < rect.height * 0.25) dropAction = 'before';
                    else if (relY > rect.height * 0.75) dropAction = 'after';
                    else if (!isContainer) dropAction = 'after';
                } else if (target && target.id === 'document-root') {
                    const rect = target.getBoundingClientRect();
                    const relY = e.clientY - rect.top;
                    if (relY < rect.height * 0.5 && target.firstChild) dropAction = 'first';
                }

                window.dispatchEvent(new CustomEvent('escms-canvas-drop', {
                    detail: { payload, targetNode: target, dropAction }
                }));
            }
        } catch (err) { }
    });
};