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
    case 'api/pages/save':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) {
                $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            }
            try {
                $id = $input['id'] ?? null;
                $editor_data = $input['editor_data'] ?? '{}';
                $status = $input['status'] ?? 'draft';
                
                // Compilador PHP
                $jsonToHtml = function($node) use (&$jsonToHtml, $pdo) {
                    if (is_string($node)) return htmlspecialchars($node);
                    if (!is_array($node)) return '';
                    $tag = $node['tag'] ?? 'div';
                    
                    if ($tag === 'escms-component' && !empty($node['ref'])) {
                        return '<!-- ESCMS_COMPONENT:' . htmlspecialchars($node['ref']) . ' -->';
                    }

                    $html = "<$tag";
                    if (!empty($node['id'])) {
                        $html .= ' id="' . htmlspecialchars($node['id']) . '"';
                    }
                    if (!empty($node['classes'])) {
                        $html .= ' class="' . htmlspecialchars(implode(' ', $node['classes'])) . '"';
                    }
                    if (!empty($node['attributes'])) {
                        foreach ($node['attributes'] as $attrKey => $attrVal) {
                            $html .= ' ' . htmlspecialchars($attrKey) . '="' . htmlspecialchars($attrVal) . '"';
                        }
                    }
                    if (!empty($node['styles'])) {
                        $html .= ' style="' . htmlspecialchars($node['styles']) . '"';
                    }
                    $html .= '>';
                    if (!empty($node['children'])) {
                        foreach ($node['children'] as $child) {
                            $html .= $jsonToHtml($child);
                        }
                    }
                    $html .= "</$tag>";
                    return $html;
                };

                $nodeTree = json_decode($editor_data, true) ?: [];
                $public_html = $jsonToHtml($nodeTree);

                if ($id) {
                    $stmt = $pdo->prepare("UPDATE pages SET editor_data = ?, public_html = ?, status = ? WHERE id = ?");
                    $stmt->execute([$editor_data, $public_html, $status, $id]);
                } else {
                    $title = 'Draft ' . date('Y-m-d H:i:s');
                    $slug = 'draft-' . bin2hex(random_bytes(4));
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html, status) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$title, $slug, $editor_data, $public_html, $status]);
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
                $pages = $pdo->query("SELECT id, title, slug, views, status, updated_at, parent_id, menu_order, is_hidden_menu, is_custom_link, custom_link_url FROM pages ORDER BY menu_order ASC, updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($pages) === 0) {
                    $defaultData = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h2","children":["Welcome to ESCMS"]},{"tag":"p","children":["This is your brand new lightweight CMS."]}]}';
                    $defaultHtml = '<div class="escms-container" style="max-width: var(--max-width); margin: 0px auto; padding: 20px;"><h2>New Heading</h2><p>Type something here...</p></div>';
                    
                    $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                    if (file_exists($tpl_path)) {
                        $tpl = json_decode(file_get_contents($tpl_path), true);
                        if (isset($tpl['views']['home'])) {
                            // Envolvemos los nodos de la vista home en un container principal si es un array
                            $nodes = $tpl['views']['home'];
                            $defaultData = json_encode(['tag' => 'div', 'classes' => ['escms-template-home'], 'children' => $nodes]);
                        }
                    }

                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, ?)");
                    $stmt->execute(['Home', 'home', $defaultData, $defaultHtml]);
                    $homeId = $pdo->lastInsertId();
                    
                    $stmtOpt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('home_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                    $stmtOpt->execute([$homeId]);
                    
                    $config['home_page_id'] = $homeId; // Update in memory so the loop below sees it
                    
                    $pages = $pdo->query("SELECT id, title, slug, views, status, updated_at, parent_id, menu_order, is_hidden_menu, is_custom_link, custom_link_url FROM pages ORDER BY menu_order ASC, updated_at DESC")->fetchAll(PDO::FETCH_ASSOC);
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
                $stmt = $pdo->prepare("SELECT id, title, slug, editor_data, status, seo_title, seo_desc, seo_keywords, seo_language FROM pages WHERE id = ?");
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

    case 'api/pages/create_link':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $title = 'New Link';
                $slug = 'link-' . bin2hex(random_bytes(4));
                $stmt = $pdo->prepare("INSERT INTO pages (title, slug, is_custom_link, custom_link_url, editor_data, public_html) VALUES (?, ?, 1, '', '{}', '')");
                $stmt->execute([$title, $slug]);
                
                $send_json(['status' => 'success', 'id' => $pdo->lastInsertId()]);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/pages/update_order':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $updates = $input['updates'] ?? [];
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("UPDATE pages SET parent_id = ?, menu_order = ? WHERE id = ?");
                foreach ($updates as $u) {
                    $parentId = !empty($u['parent_id']) ? $u['parent_id'] : null;
                    $stmt->execute([$parentId, $u['menu_order'], $u['id']]);
                }
                $pdo->commit();
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                if($pdo->inTransaction()) $pdo->rollBack();
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/pages/update_url':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                $url = trim($input['url'] ?? '');
                if (!$id) throw new RuntimeException('ID required');
                $stmt = $pdo->prepare("UPDATE pages SET custom_link_url = ? WHERE id = ? AND is_custom_link = 1");
                $stmt->execute([$url, $id]);
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    case 'api/pages/toggle_hidden':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                // SQLite bools are 0/1, so NOT operator flips them correctly in modern SQLite, but we can be explicit
                $stmt = $pdo->prepare("UPDATE pages SET is_hidden_menu = CASE WHEN is_hidden_menu = 1 THEN 0 ELSE 1 END WHERE id = ?");
                $stmt->execute([$id]);
                $send_json(['status' => 'success']);
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

    case 'api/pages/save_seo':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $id = $input['id'] ?? null;
                if (!$id) throw new RuntimeException('ID required');
                
                $slug = trim($input['slug'] ?? '');
                // Basic sanitation for the slug: replace spaces with hyphens, lowercase, remove invalid chars
                $slug = strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '-', preg_replace('/\s+/', '-', $slug)));
                
                $seo_title = $input['seo_title'] ?? null;
                $seo_desc = $input['seo_desc'] ?? null;
                $seo_keywords = $input['seo_keywords'] ?? null;
                $seo_language = $input['seo_language'] ?? null;
                
                // Check if slug exists on another page
                $stmtSlug = $pdo->prepare("SELECT id FROM pages WHERE slug = ? AND id != ?");
                $stmtSlug->execute([$slug, $id]);
                if ($stmtSlug->fetch()) {
                    throw new RuntimeException('Slug already in use by another page');
                }
                
                $stmt = $pdo->prepare("UPDATE pages SET slug = ?, seo_title = ?, seo_desc = ?, seo_keywords = ?, seo_language = ? WHERE id = ?");
                $stmt->execute([$slug, $seo_title, $seo_desc, $seo_keywords, $seo_language, $id]);
                
                $send_json(['status' => 'success']);
            } catch (Throwable $e) {
                $send_json(['status' => 'error', 'msg' => $e->getMessage()], 400);
            }
            break;

    default:
        $send_json(['error' => 'Endpoint no encontrado en ' . basename(__FILE__)], 404);
}
