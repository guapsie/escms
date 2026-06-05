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
    case 'api/settings':
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if ($method === 'GET') {
                $options = $pdo->query("SELECT k, v FROM options WHERE k NOT LIKE 'ai_%'")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
                $send_json(['status' => 'success', 'data' => $options]);
            } elseif ($method === 'POST') {
                $key = $input['key'] ?? null;
                $value = $input['value'] ?? null;
                if (!$key || str_starts_with($key, 'ai_')) $send_json(['status' => 'error', 'msg' => 'Invalid key'], 400);
                
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }

                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$key, (string)$value]);
                $send_json(['status' => 'success']);
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;

    case 'api/ai/settings':
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if ($method === 'GET') {
                $ai_opts = $pdo->query("SELECT k, v FROM options WHERE k LIKE 'ai_%'")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
                $send_json([
                    'status' => 'success',
                    'provider' => $ai_opts['ai_provider'] ?? 'gemini',
                    'model' => $ai_opts['ai_model'] ?? '',
                    'endpoint' => $ai_opts['ai_endpoint'] ?? '',
                    'instructions' => $ai_opts['ai_instructions'] ?? '',
                    'has_key' => !empty($ai_opts['ai_apikey'])
                ]);
            } elseif ($method === 'POST') {
                $provider = $input['provider'] ?? 'gemini';
                $model = $input['model'] ?? '';
                $endpoint = $input['endpoint'] ?? '';
                $instructions = $input['instructions'] ?? '';
                $key = $input['key'] ?? '';
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute(['ai_provider', $provider]);
                $stmt->execute(['ai_model', $model]);
                $stmt->execute(['ai_endpoint', $endpoint]);
                $stmt->execute(['ai_instructions', $instructions]);
                if (!empty($key)) {
                    $stmt->execute(['ai_apikey', $key]);
                }
                $send_json(['status' => 'success']);
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;

    case 'api/css/read':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            $userCssPath = __DIR__ . '/../data/user-settings/style.css';
            $tplCssPath = __DIR__ . '/../data/templates/pichi/style.css';
            
            if (file_exists($userCssPath)) {
                $send_json(['status' => 'success', 'css' => file_get_contents($userCssPath), 'source' => 'user']);
            } elseif (file_exists($tplCssPath)) {
                $send_json(['status' => 'success', 'css' => file_get_contents($tplCssPath), 'source' => 'template']);
            } else {
                $send_json(['status' => 'success', 'css' => '', 'source' => 'none']);
            }
            break;

    case 'api/css/save':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            try {
                $css = $input['css'] ?? '';
                $userDir = __DIR__ . '/../data/user-settings';
                if (!is_dir($userDir)) {
                    mkdir($userDir, 0755, true);
                }
                file_put_contents($userDir . '/style.css', $css);
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
            }
            break;

    case 'api/css/restore':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            try {
                $userCssPath = __DIR__ . '/../data/user-settings/style.css';
                if (file_exists($userCssPath)) {
                    unlink($userCssPath);
                }
                $tplCssPath = __DIR__ . '/../data/templates/pichi/style.css';
                $css = file_exists($tplCssPath) ? file_get_contents($tplCssPath) : '';
                $send_json(['status' => 'success', 'css' => $css]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
            }
            break;

    case 'api/atoms':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $atoms_dir = dirname(__DIR__) . '/data/atoms';
                $atoms = [];
                if (is_dir($atoms_dir)) {
                    $dirs = array_filter(glob($atoms_dir . '/*'), 'is_dir');
                    foreach ($dirs as $dir) {
                        $json_path = $dir . '/atom.json';
                        if (file_exists($json_path)) {
                            $content = file_get_contents($json_path);
                            $parsed = json_decode($content, true);
                            if ($parsed) {
                                $atoms[] = $parsed;
                            }
                        }
                    }
                }
                $send_json(['status' => 'success', 'atoms' => $atoms]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
            }
            break;

    case 'api/ai/models':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $input = json_decode(file_get_contents('php://input'), true);
            $provider = $input['provider'] ?? '';
            $key = trim($input['key'] ?? '');
            if (!$key) {
                $key = $pdo->query("SELECT v FROM options WHERE k='ai_apikey'")->fetchColumn() ?: '';
            }
            $endpoint = trim($input['endpoint'] ?? '');
            if (!$endpoint) {
                $endpoint = $pdo->query("SELECT v FROM options WHERE k='ai_endpoint'")->fetchColumn() ?: '';
            }
            if (!$provider || !$key) $send_json(['status' => 'error', 'msg' => 'Provider and key required'], 400);

            if ($provider === 'claude') {
                $send_json([
                    'status' => 'success',
                    'models' => [
                        ['value' => 'claude-3-5-sonnet-latest', 'label' => 'Claude 3.5 Sonnet'],
                        ['value' => 'claude-3-haiku-20240307', 'label' => 'Claude 3 Haiku'],
                        ['value' => 'claude-3-opus-latest', 'label' => 'Claude 3 Opus']
                    ]
                ]);
            } else if ($provider === 'gemini') {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($key));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                $response = curl_exec($ch);
                $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpcode >= 400 || $response === false) {
                    $send_json(['status' => 'error', 'msg' => 'Error fetching models', 'details' => $response], 500);
                }

                $data = json_decode($response, true);
                $models = [];
                if (isset($data['models'])) {
                    foreach ($data['models'] as $m) {
                        if (isset($m['supportedGenerationMethods']) && in_array('generateContent', $m['supportedGenerationMethods'])) {
                            $val = str_replace('models/', '', $m['name']);
                            $models[] = ['value' => $val, 'label' => $m['displayName'] ?? $val];
                        }
                    }
                }
                $send_json(['status' => 'success', 'models' => $models]);
            } else if (in_array($provider, ['groq', 'deepseek', 'mistral', 'custom'])) {
                $url = '';
                if ($provider === 'groq') $url = 'https://api.groq.com/openai/v1/models';
                else if ($provider === 'deepseek') $url = 'https://api.deepseek.com/models';
                else if ($provider === 'mistral') $url = 'https://api.mistral.ai/v1/models';
                else if ($provider === 'custom') $url = rtrim($endpoint, '/') . '/models';

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $key,
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                $response = curl_exec($ch);
                $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpcode >= 400 || $response === false) {
                    $send_json(['status' => 'error', 'msg' => 'Error fetching models', 'details' => $response], 500);
                }

                $data = json_decode($response, true);
                $models = [];
                if (isset($data['data'])) {
                    foreach ($data['data'] as $m) {
                        $models[] = ['value' => $m['id'], 'label' => $m['id']];
                    }
                }
                $send_json(['status' => 'success', 'models' => $models]);
            } else {
                $send_json(['status' => 'error', 'msg' => 'Unsupported provider'], 400);
            }
            break;

    case 'api/ai/generate':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            $input = json_decode(file_get_contents('php://input'), true);
            $prompt = $input['prompt'] ?? '';
            if (!$prompt) $send_json(['status' => 'error', 'msg' => 'Prompt is required'], 400);

            $provider = $pdo->query("SELECT v FROM options WHERE k='ai_provider'")->fetchColumn() ?: 'gemini';
            $key = $pdo->query("SELECT v FROM options WHERE k='ai_apikey'")->fetchColumn();
            $model = $pdo->query("SELECT v FROM options WHERE k='ai_model'")->fetchColumn();
            $instructions = $pdo->query("SELECT v FROM options WHERE k='ai_instructions'")->fetchColumn() ?: '';

            $atoms_dir = dirname(__DIR__) . '/data/atoms';
            $available_atoms = [];
            if (is_dir($atoms_dir)) {
                $dirs = array_filter(glob($atoms_dir . '/*'), 'is_dir');
                foreach ($dirs as $dir) {
                    $json_path = $dir . '/atom.json';
                    if (file_exists($json_path)) {
                        $parsed = json_decode(file_get_contents($json_path), true);
                        if ($parsed) {
                            $available_atoms[] = [
                                'type' => $parsed['name'] ?? basename($dir),
                                'html_tag' => $parsed['tag'] ?? 'div',
                                'category' => $parsed['category'] ?? 'unknown'
                            ];
                        }
                    } else {
                        $available_atoms[] = ['type' => basename($dir)];
                    }
                }
            }
            $atoms_list = json_encode($available_atoms, JSON_UNESCAPED_UNICODE);

            $media_dir = dirname(__DIR__) . '/data/media';
            $available_media = [];
            if (is_dir($media_dir)) {
                $files = array_filter(glob($media_dir . '/*.*'), 'is_file');
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                $files = array_slice($files, 0, 50);
                foreach ($files as $file) {
                    $available_media[] = '/data/media/' . basename($file);
                }
            }
            $media_list = empty($available_media) ? "No hay imágenes subidas." : implode(', ', $available_media);
            if (count($available_media) === 50) {
                $media_list .= " (... y más ocultas para ahorrar contexto)";
            }

            $master_instructions = "Eres ESCMS Copilot, el asistente IA integrado directamente en el editor del CMS. Tu función es doble:\n" .
            "1) Eres consciente de la página que el usuario está editando. Puedes conversar libremente, dar tu opinión sobre el diseño o el SEO, y responder a preguntas generales de forma coloquial, cruda y directa (acorde a tu personalidad configurada).\n" .
            "2) Tienes la capacidad de mutar el DOM. Si el usuario te pide modificaciones estructurales o de diseño, DEBES emitir el bloque JSON de comandos.\n" .
            "Si el usuario solo está charlando o pidiendo opinión, responde SOLO con texto. Si te pide crear o modificar elementos, incluye SIEMPRE tu bloque JSON.\n\n" .
            "ÁTOMOS DISPONIBLES EN EL SISTEMA (Definiciones JSON. Usa EXACTAMENTE la propiedad 'type'):\n" .
            $atoms_list . "\n\n" .
            "BIBLIOTECA DE MEDIOS DEL USUARIO (Imágenes reales que puedes usar en atributos 'src'):\n" .
            $media_list . "\n\n" .
            "ESTRUCTURA DE LOS COMANDOS:\n" .
            "Cuando modifiques el Canvas, debes incluir en tu respuesta un bloque JSON con esta estructura exacta. PROHIBIDO usar comentarios (// o /*) dentro del JSON:\n" .
            "{\n" .
            "  \"commands\": [\n" .
            "    {\n" .
            "      \"action\": \"add_atom\",\n" .
            "      \"type\": \"Section\",\n" .
            "      \"target_id\": \"canvas_root\",\n" .
            "      \"styles\": {\n" .
            "        \"background-color\": \"red\"\n" .
            "      }\n" .
            "    }\n" .
            "  ]\n" .
            "}\n\n" .
            "ACCIONES DE COMANDO PERMITIDAS:\n" .
            "- \"add_atom\": Añade un bloque nuevo. Requiere \"type\" y \"target_id\". IMPORTANTE: Si el contexto indica un \"Elemento actualmente seleccionado\", DEBES usar su ID como \"target_id\" por defecto. OPCIONALMENTE puedes incluir \"content\" (texto puro), \"styles\", \"attributes\", \"className\", y lo más poderoso: \"children\" (un array anidado de otros átomos que colgarán de este). Usar el array \"children\" es LA MEJOR FORMA de crear estructuras complejas de golpe, en lugar de encadenar múltiples comandos con 'NEW_x'. TRUCO: Para crear un bloque general de columnas usa \"type\": \"Columns\". Pero si el bloque YA EXISTE y el usuario te pide \"añadir UNA columna más\", usa \"type\": \"Container\" con \"className\": \"escms-column\".\n" .
            "- \"update_atom\": Modifica un bloque existente. Requiere \"target_id\" y las mutaciones dentro de \"content\" (texto puro, NO HTML), \"styles\" (clases CSS/Tailwind) o \"attributes\".\n" .
            "- \"remove_atom\": Elimina un nodo existente. Requiere \"target_id\".\n" .
            "- \"move_atom\": Mueve un elemento existente a otra ubicación (re-parenting). Requiere \"target_id\" (ID del elemento a mover) y \"parent_id\" (ID del nuevo contenedor padre donde se inyectará).\n" .
            "- \"duplicate_atom\": Duplica un nodo existente (incluyendo todos sus hijos y estilos) y lo inserta a continuación del original. Requiere \"target_id\" (ID del elemento a clonar) y opcionalmente \"copies\" (número de clones, por defecto 1).\n" .
            "- \"undo\": Deshace el último cambio o estado del editor. Úsalo ÚNICAMENTE cuando el usuario te pida expresamente \"deshacer\", \"quitar lo último\", o te diga que lo que acabas de hacer \"está mal/es una mierda\". No requiere parámetros.\n\n" .
            "CONTEXTO Y JERARQUÍA:\n" .
            "El nodo raíz por defecto del Canvas es siempre \"canvas_root\". Utiliza los IDs proporcionados en el árbol actual para definir cualquier \"target_id\".";

            $final_instructions = $master_instructions;
            if ($instructions) {
                $final_instructions .= "\n\nINSTRUCCIONES ADICIONALES DEL PROYECTO ACTUAL (DADAS POR EL USUARIO):\n" . $instructions;
            }

            if (!$key) $send_json(['status' => 'error', 'msg' => 'No API Key configured'], 400);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

            if ($provider === 'gemini') {
                if (!$model) $model = 'gemini-1.5-flash-latest';
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($key);
                $req_body = [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ];
                if ($final_instructions) {
                    $req_body['systemInstruction'] = ['parts' => [['text' => $final_instructions]]];
                }
                $payload = json_encode($req_body);
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            } else if ($provider === 'claude') {
                if (!$model) $model = 'claude-3-haiku-20240307';
                $url = "https://api.anthropic.com/v1/messages";
                $req_body = [
                    'model' => $model,
                    'max_tokens' => 1024,
                    'messages' => [['role' => 'user', 'content' => $prompt]]
                ];
                if ($final_instructions) {
                    $req_body['system'] = $final_instructions;
                }
                $payload = json_encode($req_body);
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'x-api-key: ' . $key,
                    'anthropic-version: 2023-06-01',
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            } else if (in_array($provider, ['groq', 'deepseek', 'mistral', 'custom'])) {
                $endpoint = $pdo->query("SELECT v FROM options WHERE k='ai_endpoint'")->fetchColumn() ?: '';
                $url = '';
                if ($provider === 'groq') $url = 'https://api.groq.com/openai/v1/chat/completions';
                else if ($provider === 'deepseek') $url = 'https://api.deepseek.com/chat/completions';
                else if ($provider === 'mistral') $url = 'https://api.mistral.ai/v1/chat/completions';
                else if ($provider === 'custom') $url = rtrim($endpoint, '/') . '/chat/completions';

                $msgs = [];
                if ($final_instructions) {
                    $msgs[] = ['role' => 'system', 'content' => $final_instructions];
                }
                $msgs[] = ['role' => 'user', 'content' => $prompt];

                $payload = json_encode([
                    'model' => $model,
                    'messages' => $msgs
                ]);
                
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $key,
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            } else {
                $send_json(['status' => 'error', 'msg' => 'Unsupported provider'], 400);
            }

            $response = curl_exec($ch);
            $err = curl_error($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpcode >= 400 || $response === false) {
                $send_json(['status' => 'error', 'msg' => 'API Error', 'details' => $response ?: $err], 500);
            }

            $data = json_decode($response, true);
            $text = '';
            
            if ($provider === 'gemini') {
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            } else if ($provider === 'claude') {
                $text = $data['content'][0]['text'] ?? '';
            } else if (in_array($provider, ['groq', 'deepseek', 'mistral', 'custom'])) {
                $text = $data['choices'][0]['message']['content'] ?? '';
            }

            $send_json(['status' => 'success', 'text' => $text]);
            break;

        default:
            $send_json(['error' => 'Endpoint no encontrado'], 404);
}
