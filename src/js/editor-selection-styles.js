export const ESCMS_SELECTION_STYLES = `
    * { outline: none !important; box-sizing: border-box; }
    ::before, ::after { box-sizing: border-box; }
    :where(#document-root) {
        color: var(--color-text, #0a0a0a);
        background-color: var(--color-background, #ffffff);
        font-family: var(--font-body, inherit);
        flex: 1;
        width: 100%;
        box-sizing: border-box;
    }
    :where(#document-root) a { color: var(--color-link, var(--color-accent, #3b82f6)); text-decoration: none; }
    :where(#document-root) a:hover { color: var(--color-link-hover, var(--color-accent, #2563eb)); text-decoration: underline; }
    :where(#document-root) div, :where(#document-root) section, :where(#document-root) article,
    :where(#document-root) main, :where(#document-root) aside, :where(#document-root) header, :where(#document-root) footer {
        outline: 1px dotted #cccccc; outline-offset: -1px;
    }
    .escms-main { min-height: 100px; width: 100%; box-sizing: border-box; }
    .escms-section { min-height: 50px; padding: 2rem; width: 100%; box-sizing: border-box; }
    .escms-container { min-height: 20px; width: 100%; max-width: var(--max-width, 1200px); margin: 0 auto; box-sizing: border-box; }
    .escms-column, .escms-grid-item {
        outline: 1px dotted rgba(59, 130, 246, 0.5) !important; outline-offset: -1px;
        min-height: 50px; min-width: 10px; background-color: rgba(59, 130, 246, 0.05); position: relative;
    }
    blockquote { border-left: 4px solid var(--accent-solid, #3b82f6); padding-left: 1rem; margin-left: 0; color: rgba(245, 245, 245, 0.8); font-style: italic; }
    .escms-selected { outline: 2px solid var(--accent-faint) !important; outline-offset: -2px; background-color: rgba(59, 130, 246, 0.05) !important; }
    .escms-drag-target { outline: 2px dashed var(--accent-faint) !important; outline-offset: -2px; background-color: rgba(59, 130, 246, 0.05) !important; }
    .escms-hover { outline: 1px solid rgba(59, 130, 246, 0.4) !important; outline-offset: -1px; background-color: rgba(59, 130, 246, 0.05) !important; }
    
    escms-component { outline: 2px dashed #9333ea !important; outline-offset: -2px; display: block; }
    escms-component.escms-hover { outline: 2px solid rgba(147, 51, 234, 0.6) !important; background-color: rgba(147, 51, 234, 0.05) !important; }
    escms-component.escms-selected { outline: 3px solid #9333ea !important; background-color: rgba(147, 51, 234, 0.1) !important; }

    .escms-drag-top { box-shadow: inset 0 4px 0 0 var(--accent-solid, #3b82f6) !important; }
    .escms-drag-bottom { box-shadow: inset 0 -4px 0 0 var(--accent-solid, #3b82f6) !important; }
    .escms-drag-inside { background-color: rgba(59, 130, 246, 0.15) !important; outline: 2px solid var(--accent-solid, #3b82f6) !important; outline-offset: -2px; }
    
    @keyframes escmsDropIn { 0% { transform: scale(0.98); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
    .escms-dropped { animation: escmsDropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    @keyframes escms-bg-pan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes escms-mesh-drift {
        0% { background-position: 0% 0%, 100% 100%, 50% 0%; }
        33% { background-position: 100% 0%, 0% 50%, 100% 100%; }
        66% { background-position: 50% 100%, 0% 0%, 0% 100%; }
        100% { background-position: 0% 0%, 100% 100%, 50% 0%; }
    }
    [data-escms-mesh="true"] { position: relative; isolation: isolate; }
    [data-escms-mesh="true"]::before {
        content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border-radius: inherit;
        background-image: var(--escms-mesh-bg); background-size: var(--escms-mesh-size, 100% 100%);
        background-repeat: var(--escms-mesh-repeat, no-repeat); animation: var(--escms-mesh-anim, none);
        filter: blur(var(--escms-mesh-blur, 60px)); clip-path: inset(0);
    }
`;