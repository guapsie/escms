<?php

declare(strict_types=1);

// Soporte universal para Nginx, Caddy, PHP server y subcarpetas sin .htaccess
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$base = dirname($_SERVER['SCRIPT_NAME']);
if ($base !== '/' && str_starts_with($uri, $base)) {
    $uri = substr($uri, strlen($base));
}
$route = trim($_GET['route'] ?? $uri, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$send_json = function(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
};

// --- Endpoints API REST ---

if ($route === 'api/challenge' && $method === 'POST') {
    try {
        $challenge = EscmsAuth::generateChallenge();
        $_SESSION['auth_challenge'] = $challenge;
        $send_json(['challenge' => $challenge]);
    } catch (Throwable $e) {
        $send_json(['error' => 'Failed to generate challenge'], 500);
    }
}

if ($route === 'api/register' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) throw new RuntimeException('Invalid JSON payload');
        
        if (empty($_SESSION['auth_challenge'])) {
            throw new RuntimeException('No active challenge. Reload the page.');
        }

        $count = $pdo->query("SELECT COUNT(*) FROM passkeys")->fetchColumn();
        if ($count > 0) {
            throw new RuntimeException('Admin passkey already registered.');
        }

        $origin = ($is_https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $pem = EscmsAuth::verifyRegistration($input, $origin, $_SESSION['auth_challenge']);
        
        $stmt = $pdo->prepare("INSERT INTO passkeys (id, public_key) VALUES (?, ?)");
        $stmt->execute([$input['id'], $pem]);
        
        unset($_SESSION['auth_challenge']);
        EscmsAuth::login();
        
        $send_json(['status' => 'success']);
    } catch (Throwable $e) {
        $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
    }
}

if ($route === 'api/login-challenge' && $method === 'POST') {
    try {
        $challenge = EscmsAuth::generateChallenge();
        $_SESSION['auth_challenge'] = $challenge;
        $send_json(['challenge' => $challenge]);
    } catch (Throwable $e) {
        $send_json(['error' => 'Failed to generate challenge'], 500);
    }
}

if ($route === 'api/login-verify' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) throw new RuntimeException('Invalid JSON payload');
        if (empty($_SESSION['auth_challenge'])) throw new RuntimeException('No active challenge.');

        $stmt = $pdo->prepare("SELECT public_key, sign_count FROM passkeys WHERE id = ?");
        $stmt->execute([$input['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) throw new RuntimeException('Passkey not found.');

        $origin = ($is_https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $newSignCount = 0;
        
        $verified = EscmsAuth::verifyLogin($input, $origin, $user['public_key'], $_SESSION['auth_challenge'], (int)$user['sign_count'], $newSignCount);
        if (!$verified) throw new RuntimeException('Signature verification failed.');

        $stmt = $pdo->prepare("UPDATE passkeys SET sign_count = ? WHERE id = ?");
        $stmt->execute([$newSignCount, $input['id']]);

        unset($_SESSION['auth_challenge']);
        EscmsAuth::login();

        $send_json(['status' => 'success']);
    } catch (Throwable $e) {
        $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
    }
}