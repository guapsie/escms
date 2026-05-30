<?php

declare(strict_types=1);

if (!EscmsAuth::isLoggedIn() && in_array($route, ['admin', 'login', ''])) {
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESCMS Login</title>
    <style>
        :root {
            --bg-base: #0a0a0a;
            --text-solid: #f5f5f5;
            --accent-solid: #3b82f6;
            --accent-fade: rgba(59, 130, 246, 0.6);
            --accent-faint: rgba(59, 130, 246, 0.3);
        }
        body {
            background-color: var(--bg-base);
            color: var(--text-solid);
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .login-card {
            background: transparent;
            border: 1px solid var(--accent-faint);
            border-radius: 8px;
            padding: 3rem 2.5rem;
            max-width: 400px;
            width: 100%;
            text-align: center;
            backdrop-filter: blur(10px);
            box-sizing: border-box;
        }
        h1 { font-size: 1.5rem; font-weight: 500; margin: 0 0 2rem 0; }
        button { background: var(--accent-solid); color: var(--text-solid); border: none; padding: 1rem 1.5rem; font-size: 1rem; border-radius: 6px; cursor: pointer; width: 100%; transition: all 0.2s ease; }
        button:hover { background: var(--accent-fade); }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Welcome Back</h1>
        <button id="btn-login-passkey">Login with Passkey</button>
    </div>
    <script src="/assets/js/login.js"></script>
</body>
</html>';
    exit;
}