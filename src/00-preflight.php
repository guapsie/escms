<?php

if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))) {
    return false;
}

$escms_fatal = function(string $msg): void {
    http_response_code(500);
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESCMS - Fatal Error</title>
    <style>
        :root {
            --bg: #0a0a0a;
            --text: #f5f5f5;
            --accent: #3b82f6;
        }
        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .alert-card {
            background: transparent;
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            padding: 2.5rem 2rem;
            max-width: 420px;
            text-align: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.05), inset 0 0 15px rgba(59, 130, 246, 0.02);
        }
        .alert-card svg {
            width: 42px;
            height: 42px;
            color: var(--accent);
            margin-bottom: 1.25rem;
        }
        h1 { font-size: 1.25rem; font-weight: 500; margin: 0 0 0.5rem 0; }
        p { font-size: 0.9rem; color: rgba(245, 245, 245, 0.6); margin: 0; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="alert-card">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h1>Fatal Error</h1>
        <p>' . $msg . '</p>
    </div>
</body>
</html>';
    exit;
};

if (version_compare(PHP_VERSION, '8.1.0', '<')) {
    $escms_fatal('ESCMS requires PHP 8.1.0 or higher. You are currently running PHP ' . PHP_VERSION . '.');
}

if (!is_writable(__DIR__)) {
    $escms_fatal('Directory is not writable. ESCMS needs write permissions to install.');
}

unset($escms_fatal);

define('ESCMS_HAS_ZIP', class_exists('ZipArchive'));