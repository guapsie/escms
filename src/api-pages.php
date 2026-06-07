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

                if ($status === 'published') {
                    $network_status = $pdo->query("SELECT v FROM options WHERE k='escms_p2p_enabled'")->fetchColumn();
                    if ($network_status === '1') {
                        $stmt = $pdo->prepare("SELECT title, slug FROM pages WHERE id = ?");
                        $stmt->execute([$id]);
                        $page_data = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        $thumbnail = '';
                        if (preg_match('/<img[^>]+src=[\'"]([^\'"]+)[\'"][^>]*>/i', $public_html, $matches)) {
                            $thumbnail = $matches[1];
                            if (str_starts_with($thumbnail, '/')) {
                                $thumbnail = 'https://' . ($_SERVER['HTTP_HOST'] ?? '') . $thumbnail;
                            }
                        }

                        $ping_payload = json_encode([
                            'domain' => $_SERVER['HTTP_HOST'] ?? 'unknown',
                            'title' => $page_data['title'],
                            'url' => 'https://' . ($_SERVER['HTTP_HOST'] ?? '') . '/' . $page_data['slug'],
                            'thumbnail' => $thumbnail
                        ]);

                        $ctx = stream_context_create([
                            'http' => [
                                'method' => 'POST',
                                'header' => "Content-Type: application/json\r\n",
                                'content' => $ping_payload,
                                'timeout' => 2
                            ]
                        ]);
                        @file_get_contents('https://escms.dev/api/network.php?action=publish', false, $ctx);
                        
                        $feed_json = @file_get_contents('https://escms.dev/api/network.php?action=get_feed&domain=' . urlencode($_SERVER['HTTP_HOST'] ?? ''), false, stream_context_create(['http' => ['timeout' => 3]]));
                        if ($feed_json) {
                            $feed_data = json_decode($feed_json, true);
                            if (isset($feed_data['status']) && $feed_data['status'] === 'success' && !empty($feed_data['posts'])) {
                                $html = '<div class="escms-network-wrapper" style="padding: 40px 20px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); margin-top: 40px;">';
                                $html .= '<div style="max-width: var(--max-width, 1200px); margin: 0 auto;">';
                                $html .= '<h3 style="margin-top:0; margin-bottom: 20px; font-size: 1.2rem; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 8px;">';
                                $html .= '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #3b82f6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M8.7 10.7l6.6 -3.4"/><path d="M8.7 13.3l6.6 3.4"/></svg>';
                                $html .= 'From the ESCMS Network</h3>';
                                $html .= '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
                                foreach ($feed_data['posts'] as $post) {
                                    $html .= '<a href="' . htmlspecialchars($post['url']) . '" target="_blank" style="display: flex; align-items: center; gap: 15px; text-decoration: none; color: inherit; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; transition: transform 0.2s, background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'; this.style.transform=\'translateY(-2px)\';" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\'; this.style.transform=\'none\';">';
                                    if (!empty($post['thumbnail'])) {
                                        $html .= '<div style="flex-shrink: 0; width: 60px; height: 60px; border-radius: 6px; background-image: url(\'' . htmlspecialchars($post['thumbnail']) . '\'); background-size: cover; background-position: center;"></div>';
                                    } else {
                                        $html .= '<div style="flex-shrink: 0; width: 60px; height: 60px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg></div>';
                                    }
                                    $html .= '<div style="flex-grow: 1; min-width: 0;">';
                                    $html .= '<h4 style="margin: 0 0 6px 0; font-size: 0.95rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal;">' . htmlspecialchars($post['title']) . '</h4>';
                                    $html .= '<div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">' . htmlspecialchars(parse_url($post['url'], PHP_URL_HOST)) . '</div>';
                                    $html .= '</div></a>';
                                }
                                $html .= '</div></div></div>';
                                
                                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES ('network_feed_html', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                                $stmt->execute([$html]);
                            }
                        }
                    }
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
                $title = trim($input['title'] ?? '');
                if (!$title) {
                    $title = 'Draft ' . date('Y-m-d H:i:s');
                }
                $slug = strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '-', preg_replace('/\s+/', '-', $title)));
                if (!$slug) $slug = 'page-' . time();
                
                $uniqueSlug = $slug;
                $counter = 1;
                while (true) {
                    $stmt = $pdo->prepare("SELECT id FROM pages WHERE slug = ?");
                    $stmt->execute([$uniqueSlug]);
                    if (!$stmt->fetch()) break;
                    $uniqueSlug = $slug . '-' . $counter++;
                }

                $editor_data = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[]}';
                $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                if (file_exists($tpl_path)) {
                    $tpl = json_decode(file_get_contents($tpl_path), true);
                    if (isset($tpl['views']['page'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-page'], 'children' => $tpl['views']['page']]);
                    }
                }

                $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                $stmt->execute([$title, $uniqueSlug, $editor_data]);
                
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

    case 'api/pages/create_post':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            try {
                $blog_id = (int)($config['blog_page_id'] ?? 0);
                if (!$blog_id) {
                    $stmt = $pdo->prepare("SELECT id FROM pages WHERE slug = 'blog'");
                    $stmt->execute();
                    $blog_id = (int)$stmt->fetchColumn();
                } else {
                    $stmt = $pdo->prepare("SELECT id FROM pages WHERE id = ?");
                    $stmt->execute([$blog_id]);
                    if (!$stmt->fetchColumn()) {
                        $blog_id = 0;
                    }
                }

                if (!$blog_id) {
                    $blog_editor_data = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h1","children":["Blog"]}]}';
                    $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                    if (file_exists($tpl_path)) {
                        $tpl = json_decode(file_get_contents($tpl_path), true);
                        if (isset($tpl['views']['blog'])) {
                            $blog_editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-blog'], 'children' => $tpl['views']['blog']]);
                        }
                    }
                    $stmt = $pdo->prepare("INSERT INTO pages (title, slug, editor_data, public_html) VALUES (?, ?, ?, '')");
                    $stmt->execute(['Blog', 'blog', $blog_editor_data]);
                    $blog_id = (int)$pdo->lastInsertId();
                    $pdo->prepare("INSERT INTO options (k, v) VALUES ('blog_page_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")->execute([$blog_id]);
                    $config['blog_page_id'] = $blog_id;
                }

                $title = 'New Post';
                $slug = 'post-' . time();
                
                $uniqueSlug = $slug;
                $counter = 1;
                while (true) {
                    $stmt = $pdo->prepare("SELECT id FROM pages WHERE slug = ?");
                    $stmt->execute([$uniqueSlug]);
                    if (!$stmt->fetch()) break;
                    $uniqueSlug = $slug . '-' . $counter++;
                }

                $editor_data = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[]}';
                $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                if (file_exists($tpl_path)) {
                    $tpl = json_decode(file_get_contents($tpl_path), true);
                    if (isset($tpl['views']['single'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-single'], 'children' => $tpl['views']['single']]);
                    }
                }

                $stmt = $pdo->prepare("INSERT INTO pages (title, slug, parent_id, is_hidden_menu, editor_data, public_html) VALUES (?, ?, ?, 1, ?, '')");
                $stmt->execute([$title, $uniqueSlug, $blog_id, $editor_data]);
                
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

                // Apply template blueprint
                $editor_data = null;
                $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                if (file_exists($tpl_path)) {
                    $tpl = json_decode(file_get_contents($tpl_path), true);
                    if (isset($tpl['views']['home'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-home'], 'children' => $tpl['views']['home']]);
                    } elseif (isset($tpl['views']['page'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-page'], 'children' => $tpl['views']['page']]);
                    }
                }
                if ($editor_data === null) {
                    $editor_data = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h1","children":["Home"]}]}';
                }
                
                $stmt = $pdo->prepare("UPDATE pages SET editor_data = ? WHERE id = ?");
                $stmt->execute([$editor_data, $id]);
                
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

                // Apply template blueprint
                $editor_data = null;
                $tpl_path = __DIR__ . '/../data/templates/pichi/pichi.json';
                if (file_exists($tpl_path)) {
                    $tpl = json_decode(file_get_contents($tpl_path), true);
                    if (isset($tpl['views']['blog'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-blog'], 'children' => $tpl['views']['blog']]);
                    } elseif (isset($tpl['views']['page'])) {
                        $editor_data = json_encode(['tag' => 'div', 'classes' => ['escms-template-page'], 'children' => $tpl['views']['page']]);
                    }
                }
                if ($editor_data === null) {
                    $editor_data = '{"tag":"div","classes":["escms-container"],"styles":"max-width: var(--max-width); margin: 0px auto; padding: 20px;","children":[{"tag":"h1","children":["Blog"]}]}';
                }
                
                $stmt = $pdo->prepare("UPDATE pages SET editor_data = ? WHERE id = ?");
                $stmt->execute([$editor_data, $id]);
                
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
