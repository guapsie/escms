<?php
declare(strict_types=1);
if (!str_starts_with($route, 'api/')) return;
header('Content-Type: application/json');
$send_json = function(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
};
$input = json_decode(file_get_contents('php://input'), true) ?: [];

switch ($route) {
    case 'api/components/save':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) {
                $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            }
            try {
                $id = $input['id'] ?? null;
                $name = $input['name'] ?? '';
                $ref_id = $input['ref_id'] ?? '';
                $template_id = $input['template_id'] ?? 'custom';
                $editor_data = $input['editor_data'] ?? '{}';
                $public_html = $input['public_html'] ?? '';

                if (!$name || !$ref_id) throw new RuntimeException('Name and Ref ID required');

                if ($id) {
                    $stmt = $pdo->prepare("UPDATE components SET name = ?, ref_id = ?, template_id = ?, editor_data = ?, public_html = ? WHERE id = ?");
                    $stmt->execute([$name, $ref_id, $template_id, $editor_data, $public_html, $id]);
                } else {
                    $stmt = $pdo->prepare("INSERT INTO components (name, ref_id, template_id, editor_data, public_html) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$name, $ref_id, $template_id, $editor_data, $public_html]);
                    $id = $pdo->lastInsertId();
                }

                $send_json(['status' => 'success', 'id' => $id]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/components/list':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $components = $pdo->query("SELECT id, name, ref_id, template_id, editor_data, updated_at FROM components ORDER BY template_id ASC, name ASC")->fetchAll(PDO::FETCH_ASSOC);
                $send_json(['status' => 'success', 'components' => $components]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/components/get':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $ref_id = $_GET['ref_id'] ?? null;
                if (!$ref_id) throw new RuntimeException('ref_id required');
                $stmt = $pdo->prepare("SELECT id, name, ref_id, template_id, editor_data, public_html FROM components WHERE ref_id = ?");
                $stmt->execute([$ref_id]);
                $component = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$component) throw new RuntimeException('Component not found');
                $send_json(['status' => 'success', 'component' => $component]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/components/delete':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("DELETE FROM components WHERE id = ?");
                $stmt->execute([$id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    default:
        $send_json(['error' => 'Endpoint no encontrado en ' . basename(__FILE__)], 404);
}
