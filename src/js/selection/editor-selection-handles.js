import { el } from '../core/escms-dom.js';

export const escmsSetupUIHandles = function (editor, shadowRoot) {
    const handle = document.createElement('div');
    handle.className = 'escms-global-drag-handle';
    handle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    handle.style.cssText = `
        position: absolute; width: 20px; height: 20px; background: var(--accent-solid, #3b82f6);
        color: white; display: none; align-items: center; justify-content: center;
        cursor: grab; z-index: 10000; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transition: opacity 0.2s, background 0.2s;
    `;
    const svg = handle.querySelector('svg');
    svg.style.width = '14px'; svg.style.height = '14px'; svg.style.pointerEvents = 'none';
    handle.draggable = true;

    handle.addEventListener('mouseenter', () => handle.style.background = 'var(--accent-hover, #2563eb)');
    handle.addEventListener('mouseleave', (e) => {
        handle.style.background = 'var(--accent-solid, #3b82f6)';
        if (e.relatedTarget !== editor.currentHoverNode && (!editor.currentHoverNode || !editor.currentHoverNode.contains(e.relatedTarget))) {
            if (editor.currentHoverNode) {
                editor.currentHoverNode.classList.remove('escms-hover');
                editor.currentHoverNode = null;
                escmsUpdateHandlePosition(editor, editor.selectedNode);
            }
        }
    });

    shadowRoot.appendChild(handle);
    editor.dragHandle = handle;

    // Resize Handles
    const resizeHandles = {};
    const corners = ['nw', 'ne', 'sw', 'se'];
    let activeResizeCorner = null;
    let initialResizeWidth = 0;
    let initialMouseX = 0;
    let isResizing = false;

    corners.forEach(corner => {
        const el = document.createElement('div');
        el.style.cssText = `
            position: absolute; width: 8px; height: 8px; background: #ffffff;
            border: 2px solid var(--accent-solid, #3b82f6); z-index: 10001; display: none;
            cursor: ${corner}-resize; box-sizing: border-box;
        `;

        el.addEventListener('mousedown', (e) => {
            if (!editor.selectedNode || editor.selectedNode.tagName !== 'IMG') return;
            e.preventDefault(); e.stopPropagation();

            isResizing = true; activeResizeCorner = corner; initialMouseX = e.clientX;
            initialResizeWidth = editor.selectedNode.getBoundingClientRect().width;
            const zoom = (window.escmsEditor && window.escmsEditor.canvas) ? window.escmsEditor.canvas.currentZoom : 1;

            const onMouseMove = (moveEvent) => {
                if (!isResizing) return;
                const deltaX = (moveEvent.clientX - initialMouseX) / zoom;
                let newWidth = initialResizeWidth;

                if (activeResizeCorner === 'se' || activeResizeCorner === 'ne') newWidth = initialResizeWidth + deltaX;
                else if (activeResizeCorner === 'sw' || activeResizeCorner === 'nw') newWidth = initialResizeWidth - deltaX;

                if (newWidth > 10) {
                    editor.selectedNode.style.width = newWidth + 'px';
                    editor.selectedNode.style.height = 'auto';
                    escmsUpdateHandlePosition(editor, editor.selectedNode);
                }
            };

            const onMouseUp = () => {
                isResizing = false; activeResizeCorner = null;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                window.dispatchEvent(new Event('escms-dom-mutated'));
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        shadowRoot.appendChild(el);
        resizeHandles[corner] = el;
    });

    editor.resizeHandles = resizeHandles;
};

export const escmsUpdateHandlePosition = function (editor, targetNode) {
    if (!editor.dragHandle || !editor.resizeHandles) return;
    const { dragHandle, resizeHandles } = editor;
    const corners = ['nw', 'ne', 'sw', 'se'];

    if (!targetNode || targetNode.id === 'document-root') {
        dragHandle.style.display = 'none';
        corners.forEach(c => resizeHandles[c].style.display = 'none');
        return;
    }
    const host = document.getElementById('escms-canvas-host');
    if (!host) return;

    const hostRect = host.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const zoom = (window.escmsEditor && window.escmsEditor.canvas) ? window.escmsEditor.canvas.currentZoom : 1;

    let handleTop = ((targetRect.top - hostRect.top) / zoom - 10);
    let handleLeft = ((targetRect.left - hostRect.left) / zoom - 10);

    if (handleTop < 0) handleTop = 4;
    if (handleLeft < 0) handleLeft = 4;

    dragHandle.style.top = handleTop + 'px';
    dragHandle.style.left = handleLeft + 'px';
    dragHandle.style.display = 'flex';

    if (targetNode.tagName === 'IMG') {
        const top = (targetRect.top - hostRect.top) / zoom;
        const bottom = (targetRect.bottom - hostRect.top) / zoom;
        const left = (targetRect.left - hostRect.left) / zoom;
        const right = (targetRect.right - hostRect.left) / zoom;

        resizeHandles['nw'].style.top = (top - 4) + 'px'; resizeHandles['nw'].style.left = (left - 4) + 'px';
        resizeHandles['ne'].style.top = (top - 4) + 'px'; resizeHandles['ne'].style.left = (right - 4) + 'px';
        resizeHandles['sw'].style.top = (bottom - 4) + 'px'; resizeHandles['sw'].style.left = (left - 4) + 'px';
        resizeHandles['se'].style.top = (bottom - 4) + 'px'; resizeHandles['se'].style.left = (right - 4) + 'px';

        corners.forEach(c => resizeHandles[c].style.display = 'block');
    } else {
        corners.forEach(c => resizeHandles[c].style.display = 'none');
    }
};