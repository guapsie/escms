<?php

declare(strict_types=1);

// En el entorno compilado, este bloque asegura que la API solo procese lo suyo y muera aquí.
if (str_starts_with($route, 'api/')) {

    header('Content-Type: application/json');

    $send_json = function(array $data, int $status = 200): void {
        http_response_code($status);
        echo json_encode($data);
        exit;
    };

    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    switch ($route) {
        case 'api/challenge':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                $challenge = EscmsAuth::generateChallenge();
                $_SESSION['auth_challenge'] = $challenge;
                $send_json(['challenge' => $challenge]);
            } catch (Throwable $e) {
                $send_json(['error' => 'Failed to generate challenge'], 500);
            }
            break;

        case 'api/register':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                if (empty($input)) throw new RuntimeException('Invalid JSON payload');
                
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
            break;

        case 'api/login-challenge':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                $challenge = EscmsAuth::generateChallenge();
                $_SESSION['auth_challenge'] = $challenge;
                $send_json(['challenge' => $challenge]);
            } catch (Throwable $e) {
                $send_json(['error' => 'Failed to generate challenge'], 500);
            }
            break;

        case 'api/login-verify':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            try {
                if (empty($input)) throw new RuntimeException('Invalid JSON payload');
                if (empty($_SESSION['auth_challenge'])) throw new RuntimeException('No active challenge.');

                $stmt = $pdo->prepare("SELECT public_key, sign_count FROM passkeys WHERE id = ?");
                $stmt->execute([$input['id'] ?? '']);
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
            break;

        case 'api/pages/save':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) {
                $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            }
            try {
                $id = $input['id'] ?? null;
                $editor_data = $input['editor_data'] ?? '';
                $public_html = $input['public_html'] ?? '';

                if ($id) {
                    $stmt = $pdo->prepare("UPDATE pages SET editor_data = ?, public_html = ? WHERE id = ?");
                    $stmt->execute([$editor_data, $public_html, $id]);
                } else {
                    $title = 'Draft ' . date('Y-m-d H:i:s');
                    $slug = 'draft-' . bin2hex(random_bytes(4));
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$title, $slug, $editor_data, $public_html]);
                    $id = $pdo->lastInsertId();
                }

                $send_json(['status' => 'success', 'id' => $id]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        default:
            $send_json(['error' => 'Endpoint no encontrado'], 404);
    }
}