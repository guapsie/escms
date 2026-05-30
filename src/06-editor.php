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
    <script src="/assets/js/editor-icons.js"></script>
    <script src="/assets/js/editor-i18n.js"></script>
    <script src="/assets/js/editor-topbar.js"></script>
    <script src="/assets/js/editor-controls.js"></script>
    <script src="/assets/js/editor-settings.js"></script>
    <script src="/assets/js/editor-inspector.js"></script>
    <script src="/assets/js/editor-canvas.js"></script>
    <script src="/assets/js/editor-pagemanager.js"></script>
    <script src="/assets/js/editor-leftpanel.js"></script>
    <script src="/assets/js/editor-selection.js"></script>
    <script src="/assets/js/editor-parser.js"></script>
    <script src="/assets/js/editor-autosave.js"></script>
    <script src="/assets/js/editor-app.js"></script>
</body>
</html>';
    exit;
}