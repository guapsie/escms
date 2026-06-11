<?php

declare(strict_types=1);

if (EscmsAuth::isLoggedIn() && !str_starts_with($route, 'api/')) {
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="editor_title"></title>
    <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJjdXJyZW50Q29sb3IiIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb25zLXRhYmxlci1maWxsZWQgaWNvbi10YWJsZXItYXBwcyI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik05IDNoLTRhMiAyIDAgMCAwIC0yIDJ2NGEyIDIgMCAwIDAgMiAyaDRhMiAyIDAgMCAwIDIgLTJ2LTRhMiAyIDAgMCAwIC0yIC0yeiIgLz48cGF0aCBkPSJNOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xNyAzYTEgMSAwIDAgMSAuOTkzIC44ODNsLjAwNyAuMTE3djJoMmExIDEgMCAwIDEgLjExNyAxLjk5M2wtLjExNyAuMDA3aC0ydjJhMSAxIDAgMCAxIC0xLjk5MyAuMTE3bC0uMDA3IC0uMTE3di0yaC0yYTEgMSAwIDAgMSAtLjExNyAtMS45OTNsLjExNyAtLjAwN2gydi0yYTEgMSAwIDAgMSAxIC0xeiIgLz48L3N2Zz4=">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-canvas: #000000;
            --bg-panel: #0a0a0a;
            --bg-surface: #111111;
            --bg-hover: #1f1f1f;
            --text-solid: #ededed;
            --text-muted: #a1a1aa;
            --text-faint: #52525b;
            --accent-solid: #3b82f6; /* Beautiful Blue */
            --accent-fade: rgba(59, 130, 246, 0.2);
            --border-color: rgba(255, 255, 255, 0.08);
            --border-glow: rgba(255, 255, 255, 0.15);
        }
        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-canvas);
            color: var(--text-solid);
            font-family: Inter, -apple-system, sans-serif;
            height: 100vh;
            overflow: hidden;
            display: grid;
            grid-template-rows: 50px 1fr;
            -webkit-font-smoothing: antialiased;
        }
        
        /* Micro-Interactions */
        button { transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s; }
        button:active { transform: scale(0.95); }
        .escms-sidebar-tab:active { transform: scale(0.95); }
        
        
        /* UI Animations */
        @keyframes escmsFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes escmsSlideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes escmsScaleUp {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .escms-anim-fade { animation: escmsFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .escms-anim-slide-up { animation: escmsSlideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .escms-anim-scale-up { animation: escmsScaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes escms-bg-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes escms-mesh-drift {
            0% { background-position: 0% 0%, 100% 100%, 50% 0%; }
            33% { background-position: 100% 0%, 0% 50%, 100% 100%; }
            66% { background-position: 50% 100%, 0% 0%, 0% 100%; }
            100% { background-position: 0% 0%, 100% 100%, 50% 0%; }
        }

        /* Layout Engine (Editor Canvas) */
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
        body[data-viewport="tablet"] [data-escms-layout="flexbox"] {
            flex-direction: var(--l-dir-t, var(--l-dir-d, row));
            flex-wrap: var(--l-wrap-t, var(--l-wrap-d, nowrap));
            justify-content: var(--l-jc-t, var(--l-jc-d, flex-start));
            align-items: var(--l-ai-t, var(--l-ai-d, stretch));
            gap: var(--l-gap-t, var(--l-gap-d, 0px));
        }
        body[data-viewport="tablet"] [data-escms-layout="grid"] {
            grid-template-columns: var(--l-cols-t, var(--l-cols-d, 1fr));
            grid-template-rows: var(--l-rows-t, var(--l-rows-d, auto));
            gap: var(--l-gap-t, var(--l-gap-d, 0px));
        }
        body[data-viewport="phone"] [data-escms-layout="flexbox"] {
            flex-direction: var(--l-dir-p, var(--l-dir-t, var(--l-dir-d, row)));
            flex-wrap: var(--l-wrap-p, var(--l-wrap-t, var(--l-wrap-d, nowrap)));
            justify-content: var(--l-jc-p, var(--l-jc-t, var(--l-jc-d, flex-start)));
            align-items: var(--l-ai-p, var(--l-ai-t, var(--l-ai-d, stretch)));
            gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
        }
        body[data-viewport="phone"] [data-escms-layout="grid"] {
            grid-template-columns: var(--l-cols-p, var(--l-cols-t, var(--l-cols-d, 1fr)));
            grid-template-rows: var(--l-rows-p, var(--l-rows-t, var(--l-rows-d, auto)));
            gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
        }
        
        /* Fallbacks if responsive via media query for preview mode */
        @media (max-width: 768px) {
            body.escms-preview-mode [data-escms-layout="flexbox"] {
                flex-direction: var(--l-dir-t, var(--l-dir-d, row));
                flex-wrap: var(--l-wrap-t, var(--l-wrap-d, nowrap));
                justify-content: var(--l-jc-t, var(--l-jc-d, flex-start));
                align-items: var(--l-ai-t, var(--l-ai-d, stretch));
                gap: var(--l-gap-t, var(--l-gap-d, 0px));
            }
            body.escms-preview-mode [data-escms-layout="grid"] {
                grid-template-columns: var(--l-cols-t, var(--l-cols-d, 1fr));
                grid-template-rows: var(--l-rows-t, var(--l-rows-d, auto));
                gap: var(--l-gap-t, var(--l-gap-d, 0px));
            }
        }
        @media (max-width: 390px) {
            body.escms-preview-mode [data-escms-layout="flexbox"] {
                flex-direction: var(--l-dir-p, var(--l-dir-t, var(--l-dir-d, row)));
                flex-wrap: var(--l-wrap-p, var(--l-wrap-t, var(--l-wrap-d, nowrap)));
                justify-content: var(--l-jc-p, var(--l-jc-t, var(--l-jc-d, flex-start)));
                align-items: var(--l-ai-p, var(--l-ai-t, var(--l-ai-d, stretch)));
                gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
            }
            body.escms-preview-mode [data-escms-layout="grid"] {
                grid-template-columns: var(--l-cols-p, var(--l-cols-t, var(--l-cols-d, 1fr)));
                grid-template-rows: var(--l-rows-p, var(--l-rows-t, var(--l-rows-d, auto)));
                gap: var(--l-gap-p, var(--l-gap-t, var(--l-gap-d, 0px)));
            }
        }
        
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        #escms-topbar {
            background: rgba(10, 10, 10, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
            position: relative;
        }
        #escms-main {
            display: grid;
            grid-template-columns: 260px 1fr 300px;
            height: 100%;
            overflow: hidden;
        }
        #escms-left-panel, #escms-inspector {
            background-color: var(--bg-panel);
            display: flex;
            flex-direction: column;
            z-index: 10;
        }
        #escms-left-panel {
            border-right: 1px solid var(--border-color);
        }
        #escms-inspector {
            border-left: 1px solid var(--border-color);
        }
        #escms-canvas-wrapper {
            display: flex;
            overflow: auto;
            background-color: var(--bg-canvas);
            background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 24px 24px;
        }
            /* Preview Mode */
            body.escms-preview-mode #escms-topbar,
            body.escms-preview-mode #escms-left-panel,
            body.escms-preview-mode #escms-inspector,
            body.escms-preview-mode #escms-view-tabs {
                display: none !important;
            }
            body.escms-preview-mode #escms-main {
                grid-template-columns: 1fr !important;
                height: 100vh !important;
            }
            body.escms-preview-mode {
                grid-template-rows: 1fr !important;
            }
            body.escms-preview-mode #escms-canvas-scaler {
                width: 100vw !important;
                height: auto !important;
                min-height: 100vh !important;
                margin: 0 !important;
                box-shadow: none !important;
                transform: none !important;
            }
            body.escms-preview-mode #escms-canvas-host {
                width: 100vw !important;
                height: auto !important;
                min-height: 100vh !important;
                transform: scale(1) !important;
                position: relative !important;
            }
            body.escms-preview-mode #escms-viewport {
                background-color: transparent !important;
                overflow: auto !important;
            }
            
            #btn-exit-preview {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
                background: var(--accent-solid);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            #btn-exit-preview:hover {
                background: #2563eb;
                transform: scale(1.05);
            }
            body:not(.escms-preview-mode) #btn-exit-preview {
                display: none !important;
            }
    </style>
    <link rel="stylesheet" href="/assets/css/editor-ui.css?v=<?= time() ?>">
</head>
<body>
    <div id="escms-topbar">
        <span style="padding: 0 1rem; line-height: 50px; font-weight: 600; letter-spacing: 1px;">ESCMS</span>
    </div>
    <div id="escms-main">
        <div id="escms-left-panel"><div style="padding: 1rem; opacity: 0.5; font-size: 0.85rem;">Layers / Copilot</div></div>
        <div id="escms-canvas-wrapper"><div id="escms-canvas-host"></div></div>
        <div id="escms-inspector"><div style="padding: 1rem; opacity: 0.5; font-size: 0.85rem;">Inspector</div></div>
    </div>

    <script type="module" src="/assets/js/index.js?v=<?= time() ?>"></script>
</body>
</html>';
    exit;
}