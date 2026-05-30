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

        case 'api/pages/list':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $pages = $pdo->query("SELECT id, title, slug, views, updated_at FROM pages ORDER BY updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($pages) === 0) {
                    $defaultData = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h2","children":[{"tag":"span","children":["Welcome to ESCMS"]}]},{"tag":"p","children":[{"tag":"span","children":["This is your brand new lightweight CMS."]}]}]}';
                    $defaultHtml = '<div class="escms-container" style="max-width: var(--max-width); margin: 0px auto; padding: 20px;"><h2>New Heading</h2><p>Type something here...</p></div>';
                    
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
                    $stmt->execute(['Home', 'home', $defaultData, $defaultHtml]);
                    $homeId = $pdo->lastInsertId();
                    
                    $stmtOpt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                    $stmtOpt->execute([$homeId]);
                    
                    $config['home_page_id'] = $homeId; // Update in memory so the loop below sees it
                    
                    $pages = $pdo->query("SELECT id, title, slug, views, updated_at FROM pages ORDER BY updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
                }

                $home_id = (int)($config['home_page_id'] ?? 0);
                $blog_id = (int)($config['blog_page_id'] ?? 0);

                foreach ($pages as &$p) {
                    $p['is_home'] = ((int)$p['id'] === $home_id);
                    $p['is_blog'] = ((int)$p['id'] === $blog_id);
                }

                $send_json(['status' => 'success', 'pages' => $pages]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/get':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $_GET['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                $stmt = $pdo->prepare("SELECT id, title, slug, editor_data FROM pages WHERE id = ?");
                $stmt->execute([$id]);
                $page = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$page) throw new RuntimeException('Page not found');
                $send_json(['status' => 'success', 'page' => $page]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/create':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $title = 'Draft ' . date('Y-m-d H:i:s');
                $slug = 'draft-' . bin2hex(random_bytes(4));
                $emptyContainer = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[]}';
                $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                $stmt->execute([$title, $slug, $emptyContainer]);
                
                $send_json(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/rename':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                $title = trim($input['title'] ?? '');
                if (!$id || !$title) throw new RuntimeException('ID and Title required');
                
                $stmt = $pdo->prepare("UPDATE pages SET title = ? WHERE id = ?");
                $stmt->execute([$title, $id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/delete':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ?");
                $stmt->execute([$id]);

                // Limpiar opciones si la borrada era home o blog
                if ((int)($config['home_page_id'] ?? 0) === (int)$id) {
                    $pdo->exec("DELETE FROM options WHERE k = 'home_page_id'");
                }
                if ((int)($config['blog_page_id'] ?? 0) === (int)$id) {
                    $pdo->exec("DELETE FROM options WHERE k = 'blog_page_id'");
                }
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/duplicate':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("SELECT title, editor_data FROM pages WHERE id = ?");
                $stmt->execute([$id]);
                $page = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$page) throw new RuntimeException('Page not found');

                $newTitle = $page['title'] . ' (Copy)';
                $newSlug = 'draft-' . bin2hex(random_bytes(4));
                
                $stmtInsert = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                $stmtInsert->execute([$newTitle, $newSlug, $page['editor_data']]);
                
                $send_json(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/set_home':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        case 'api/pages/set_blog':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('blog_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;
        case 'api/settings':
            if ($method === 'GET') {
                if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
                $send_json(['status' => 'success', 'data' => $config]);
            } elseif ($method === 'POST') {
                if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
                try {
                    $pdo->beginTransaction();
                    foreach ($input as $k => $v) {
                        $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
                        $stmt->execute([$k, is_bool($v) ? ($v ? '1' : '0') : (string)$v]);
                    }
                    $pdo->commit();
                    $send_json(['status' => 'success']);
                } catch (Throwable $e) {
                    $pdo->rollBack();
                    $send_json(['status' => 'error', 'msg' => $e->getMessage()], 500);
                }
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;

        case 'api/upload':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            
            try {
                if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                    throw new RuntimeException('Upload failed.');
                }
                
                $file = $_FILES['file'];
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $is_image = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
                
                $filename = bin2hex(random_bytes(8));
                $upload_dir = dirname(__DIR__) . '/data/uploads/';
                
                $generate_webp = ($config['webp_enabled'] ?? '1') === '1' && function_exists('imagewebp') && $is_image;
                
                if ($generate_webp) {
                    $src = null;
                    if ($ext === 'jpg' || $ext === 'jpeg') $src = imagecreatefromjpeg($file['tmp_name']);
                    elseif ($ext === 'png') $src = imagecreatefrompng($file['tmp_name']);
                    elseif ($ext === 'webp') $src = imagecreatefromwebp($file['tmp_name']);
                    elseif ($ext === 'gif') $src = imagecreatefromgif($file['tmp_name']);
                    
                    if ($src) {
                        $w = imagesx($src);
                        $h = imagesy($src);
                        
                        $new_w = min($w, 1920);
                        $new_h = (int)($h * ($new_w / $w));
                        $dst = imagecreatetruecolor($new_w, $new_h);
                        
                        if ($ext === 'png' || $ext === 'webp') {
                            imagealphablending($dst, false);
                            imagesavealpha($dst, true);
                            $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
                            imagefilledrectangle($dst, 0, 0, $new_w, $new_h, $transparent);
                        }
                        
                        imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_w, $new_h, $w, $h);
                        imagewebp($dst, $upload_dir . $filename . '.webp', 85);
                        imagedestroy($dst);
                        
                        $thumb_w = min($w, 400);
                        $thumb_h = (int)($h * ($thumb_w / $w));
                        $thumb = imagecreatetruecolor($thumb_w, $thumb_h);
                        if ($ext === 'png' || $ext === 'webp') {
                            imagealphablending($thumb, false);
                            imagesavealpha($thumb, true);
                            $transparent = imagecolorallocatealpha($thumb, 255, 255, 255, 127);
                            imagefilledrectangle($thumb, 0, 0, $thumb_w, $thumb_h, $transparent);
                        }
                        imagecopyresampled($thumb, $src, 0, 0, 0, 0, $thumb_w, $thumb_h, $w, $h);
                        imagewebp($thumb, $upload_dir . $filename . '_thumb.webp', 80);
                        imagedestroy($thumb);
                        
                        imagedestroy($src);
                        $final_url = '/data/uploads/' . $filename . '.webp';
                    } else {
                        $final_name = $filename . '.' . $ext;
                        move_uploaded_file($file['tmp_name'], $upload_dir . $final_name);
                        $final_url = '/data/uploads/' . $final_name;
                    }
                } else {
                    $final_name = $filename . '.' . $ext;
                    move_uploaded_file($file['tmp_name'], $upload_dir . $final_name);
                    $final_url = '/data/uploads/' . $final_name;
                }
                
                $send_json(['status' => 'success', 'url' => $final_url]);
                
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

        default:
            $send_json(['error' => 'Endpoint no encontrado'], 404);
    }
}