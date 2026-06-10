import { escmsTextBlockTags, escmsResolveTarget } from './editor-selection-utils.js';
import { ESCMS_SELECTION_STYLES } from './editor-selection-styles.js';
import { escmsSetupUIHandles, escmsUpdateHandlePosition } from './editor-selection-handles.js';
import { escmsSetupDragDrop } from './editor-selection-dragdrop.js';

export class EscmsSelection {
    constructor() {
        this.selectedNode = null;
        this.currentHoverNode = null;
        this.dragHandle = null;
        this.resizeHandles = null;
    }

    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.classList.remove('escms-selected');
            if (this.selectedNode.hasAttribute('contenteditable')) {
                this.selectedNode.removeAttribute('contenteditable');
            }
            this.selectedNode = null;
            window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: null } }));
            escmsUpdateHandlePosition(this, null);
        }
    }

    init(shadowRoot, documentRoot, emptyText = 'Drop atoms here') {
        // 1. Inyectar Estilos desde la variable global
        const style = document.createElement('style');
        style.textContent = ESCMS_SELECTION_STYLES;
        shadowRoot.appendChild(style);

        // 2. Ejecutar lógicas separadas (llamando a las funciones globales)
        escmsSetupUIHandles(this, shadowRoot);
        escmsSetupDragDrop(this, documentRoot);

        // 3. Eventos generales
        this.setupGeneralEvents(shadowRoot, documentRoot);
    }

    setupGeneralEvents(shadowRoot, documentRoot) {
        window.addEventListener('scroll', () => {
            const active = this.currentHoverNode || this.selectedNode;
            if (active) escmsUpdateHandlePosition(this, active);
        }, true);

        window.addEventListener('escms-dom-mutated', () => {
            const active = this.currentHoverNode || this.selectedNode;
            if (active) escmsUpdateHandlePosition(this, active);
        });

        window.addEventListener('escms-element-selected', (e) => {
            if (!this.currentHoverNode || e.detail.node === this.currentHoverNode) {
                escmsUpdateHandlePosition(this, e.detail.node);
            }
        });

        // Hover events
        documentRoot.addEventListener('mouseover', (e) => {
            if (window.escmsEditor?.leftpanel?.draggedDomNode || window.escmsDraggedNode) return;

            let target = escmsResolveTarget(e.target);
            if (target === documentRoot) {
                if (this.currentHoverNode) {
                    this.currentHoverNode.classList.remove('escms-hover');
                    this.currentHoverNode = null;
                    escmsUpdateHandlePosition(this, this.selectedNode);
                }
                return;
            }

            if (this.currentHoverNode !== target) {
                if (this.currentHoverNode) this.currentHoverNode.classList.remove('escms-hover');
                this.currentHoverNode = target;
                this.currentHoverNode.classList.add('escms-hover');
                escmsUpdateHandlePosition(this, this.currentHoverNode);
            }
        });

        documentRoot.addEventListener('mouseout', (e) => {
            if (e.relatedTarget === this.dragHandle || this.dragHandle.contains(e.relatedTarget)) return;
            if (!e.relatedTarget || (this.currentHoverNode && !this.currentHoverNode.contains(e.relatedTarget))) {
                if (this.currentHoverNode) {
                    this.currentHoverNode.classList.remove('escms-hover');
                    this.currentHoverNode = null;
                    escmsUpdateHandlePosition(this, this.selectedNode);
                }
            }
        });

        // Click events
        documentRoot.addEventListener('click', (e) => {
            e.stopPropagation();
            const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            let savedRange = (sel && sel.rangeCount > 0 && !sel.isCollapsed) ? sel.getRangeAt(0).cloneRange() : null;

            let target = escmsResolveTarget(e.target);
            if (this.selectedNode === target) return;

            this.clearSelection();

            this.selectedNode = target;
            if (this.selectedNode.id !== 'document-root') {
                this.selectedNode.classList.add('escms-selected');
            }

            const editableTags = [...escmsTextBlockTags, 'SPAN', 'A'];
            if (editableTags.includes(this.selectedNode.tagName)) {
                this.selectedNode.setAttribute('contenteditable', 'true');
                setTimeout(() => {
                    this.selectedNode.focus();
                    if (savedRange && this.selectedNode.contains(savedRange.commonAncestorContainer)) {
                        const newSel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
                        newSel.removeAllRanges();
                        newSel.addRange(savedRange);
                    }
                }, 10);
            }

            window.dispatchEvent(new CustomEvent('escms-element-selected', {
                detail: { node: this.selectedNode, clientX: e.clientX, clientY: e.clientY }
            }));
        });

        // Context menu
        documentRoot.addEventListener('contextmenu', (e) => {
            e.preventDefault(); e.stopPropagation();
            let target = escmsResolveTarget(e.target);

            if (this.selectedNode !== target) {
                this.clearSelection();
                this.selectedNode = target;
                if (this.selectedNode && this.selectedNode.id !== 'document-root') {
                    this.selectedNode.classList.add('escms-selected');
                }
                window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: this.selectedNode } }));
            }

            window.dispatchEvent(new CustomEvent('escms-context-menu', {
                detail: { node: this.selectedNode, clientX: e.clientX, clientY: e.clientY }
            }));
        });

        // Keydown
        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
                const isEditable = this.selectedNode.hasAttribute('contenteditable');
                const isEmpty = this.selectedNode.textContent.trim() === '';

                if (!isEditable || isEmpty) {
                    e.preventDefault();
                    if (this.selectedNode.id !== 'document-root') {
                        const parent = this.selectedNode.parentNode;
                        this.selectedNode.remove();
                        this.selectedNode = null;

                        if (parent && parent.id !== 'document-root') setTimeout(() => parent.click(), 10);
                        else window.dispatchEvent(new CustomEvent('escms-element-selected', { detail: { node: null } }));
                    }
                }
            }

            if (e.key === 'Enter' && this.selectedNode) {
                if (this.selectedNode.tagName === 'LI') {
                    e.preventDefault();
                    const parentList = this.selectedNode.closest('ul, ol');
                    if (parentList) {
                        const newLi = document.createElement('li');
                        newLi.textContent = 'New Item';
                        if (this.selectedNode.nextSibling) parentList.insertBefore(newLi, this.selectedNode.nextSibling);
                        else parentList.appendChild(newLi);
                        newLi.click();
                    }
                } else if (this.selectedNode.hasAttribute('contenteditable')) {
                    e.preventDefault();
                    document.execCommand('insertLineBreak');
                }
            }
        });
    }
}