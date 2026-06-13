export const ESCMS_CANVAS_STYLES = `
/* Layout Engine */
[data-escms-layout="flexbox"] {
    display: flex !important;
    flex-direction: var(--l-dir-d, row);
    flex-wrap: var(--l-wrap-d, nowrap);
    justify-content: var(--l-jc-d, flex-start);
    align-items: var(--l-ai-d, stretch);
    gap: var(--l-gap-d, 0px);
}
[data-escms-layout="grid"] {
    display: grid !important;
    grid-template-columns: var(--l-cols-d, 1fr);
    grid-template-rows: var(--l-rows-d, auto);
    gap: var(--l-gap-d, 0px);
}
#document-root[data-viewport="tablet"] [data-escms-layout="flexbox"] {
    flex-direction: var(--l-dir-t, var(--l-dir-d, row));
    flex-wrap: var(--l-wrap-t, var(--l-wrap-d, nowrap));
    justify-content: var(--l-jc-t, var(--l-jc-d, flex-start));
    align-items: var(--l-ai-t, var(--l-ai-d, stretch));
    gap: var(--l-gap-t, var(--l-gap-d, 0px));
}
#document-root[data-viewport="tablet"] [data-escms-layout="grid"] {
    grid-template-columns: var(--l-cols-t, var(--l-cols-d, 1fr));
    grid-template-rows: var(--l-rows-t, var(--l-rows-d, auto));
    gap: var(--l-gap-t, var(--l-gap-d, 0px));
}
#document-root[data-viewport="phone"] [data-escms-layout="flexbox"] {
    flex-direction: var(--l-dir-p, var(--l-dir-t, var(--l-dir-d, row)));
    flex-wrap: var(--l-wrap-p, var(--l-wrap-t, var(--l-wrap-d, nowrap)));
    justify-content: var(--l-jc-p, var(--l-jc-t, var(--l-jc-d, flex-start)));
    align-items: var(--l-ai-p, var(--l-ai-t, var(--l-ai-d, stretch)));
    gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
}
#document-root[data-viewport="phone"] [data-escms-layout="grid"] {
    grid-template-columns: var(--l-cols-p, var(--l-cols-t, var(--l-cols-d, 1fr)));
    grid-template-rows: var(--l-rows-p, var(--l-rows-t, var(--l-rows-d, auto)));
    gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
}

/* Entrance Animations */
.escms-anim-ready[data-escms-anim] {
    opacity: 1 !important;
    animation: none !important;
    transform: none !important;
}

/* Mesh Background Support */
[data-escms-mesh="true"] {
    position: relative;
    overflow: hidden;
}
[data-escms-mesh="true"]::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
    background-image: var(--escms-mesh-bg);
    background-size: var(--escms-mesh-size, 100% 100%);
    background-repeat: var(--escms-mesh-repeat, no-repeat);
    animation: var(--escms-mesh-anim, none);
    filter: blur(var(--escms-mesh-blur, 60px));
    clip-path: inset(0);
}

/* Base styles for the canvas document root */
#document-root {
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
    container-type: inline-size;
    container-name: viewport;
}

/* Fix CSS variables for atoms */
:host {
    --max-width: 1200px;
    --primary-color: #3b82f6;
    --text-color: #1a1a1a;
    --bg-color: #ffffff;
    --font-main: 'Inter', sans-serif;
}
`;
