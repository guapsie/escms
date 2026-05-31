<?php

declare(strict_types=1);

if (EscmsAuth::isLoggedIn() && !str_starts_with($route, 'api/')) {
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="editor_title"></title>
    <style>
        :root {
            --bg-base: #0a0a0a;
            --text-solid: #f5f5f5;
            --accent-solid: #3b82f6;
            --accent-fade: rgba(59, 130, 246, 0.6);
            --accent-faint: rgba(59, 130, 246, 0.3);
            --border-color: rgba(255, 255, 255, 0.05);
        }
        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-base);
            color: var(--text-solid);
            font-family: system-ui, -apple-system, sans-serif;
            height: 100vh;
            overflow: hidden;
            display: grid;
            grid-template-rows: 50px 1fr;
        }
        #escms-topbar {
            border-bottom: 1px solid var(--border-color);
        }
        #escms-main {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            height: 100%;
            overflow: hidden;
        }
        #escms-left-panel {
            border-right: 1px solid var(--border-color);
        }
        #escms-canvas-wrapper {
            display: flex;
            overflow: auto;
        }
            #escms-inspector {
                border-left: 1px solid var(--border-color);
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
    <script src="/assets/js/editor-icons.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-i18n.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-topbar.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-controls.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-control-border.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-control-gradient.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-control-upload.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-control-effects.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-settings.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-inspector.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-canvas.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-seoview.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-htmlview.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-pagemanager.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-menumanager.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-ai.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-leftpanel.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-selection.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-floating-toolbar.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-parser.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-autosave.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-medialibrary.js?v=<?= time() ?>"></script>
    <script src="/assets/js/editor-app.js?v=<?= time() ?>"></script>
</body>
</html>';
    exit;
}