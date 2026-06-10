<?php
declare(strict_types=1);

if (!EscmsAuth::isLoggedIn() && in_array($route, ['admin', 'login', ''])) {
    // Verificar si existen passkeys registrados
    $stmt = $pdo->query("SELECT COUNT(*) FROM passkeys");
    $has_passkey = $stmt->fetchColumn() > 0;
    
    $title = $has_passkey ? "Welcome Back" : "Create Admin";
    $btn_id = $has_passkey ? "btn-login-passkey" : "btn-setup-passkey";
    $btn_text = $has_passkey ? "Login with Passkey" : "Create Admin Passkey";
    $script = $has_passkey ? "/assets/js/login.js" : "/assets/js/installer.js";

    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESCMS ' . ($has_passkey ? 'Login' : 'Setup') . '</title>
    <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJjdXJyZW50Q29sb3IiIGNsYXNzPSJpY29uIGljb24tdGFibGVyIGljb25zLXRhYmxlci1maWxsZWQgaWNvbi10YWJsZXItYXBwcyI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik05IDNoLTRhMiAyIDAgMCAwIC0yIDJ2NGEyIDIgMCAwIDAgMiAyaDRhMiAyIDAgMCAwIDIgLTJ2LTRhMiAyIDAgMCAwIC0yIC0yeiIgLz48cGF0aCBkPSJNOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xOSAxM2gtNGEyIDIgMCAwIDAgLTIgMnY0YTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMiAtMnYtNGEyIDIgMCAwIDAgLTIgLTJ6IiAvPjxwYXRoIGQ9Ik0xNyAzYTEgMSAwIDAgMSAuOTkzIC44ODNsLjAwNyAuMTE3djJoMmExIDEgMCAwIDEgLjExNyAxLjk5M2wtLjExNyAuMDA3aC0ydjJhMSAxIDAgMCAxIC0xLjk5MyAuMTE3bC0uMDA3IC0uMTE3di0yaC0yYTEgMSAwIDAgMSAtLjExNyAtMS45OTNsLjExNyAtLjAwN2gydi0yYTEgMSAwIDAgMSAxIC0xeiIgLz48L3N2Zz4=">
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
        <h1>' . $title . '</h1>
        <button id="' . $btn_id . '">' . $btn_text . '</button>
    </div>
    <script src="' . $script . '?v=' . time() . '"></script>
</body>
</html>';
    exit;
}