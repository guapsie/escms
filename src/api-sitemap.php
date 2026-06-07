<?php
declare(strict_types=1);

if ($route !== 'sitemap.xml') return;

header('Content-Type: application/xml; charset=utf-8');

try {
    // Fetch all pages for path resolution
    $stmtAll = $pdo->prepare("SELECT id, slug, parent_id FROM pages");
    $stmtAll->execute();
    $allPages = $stmtAll->fetchAll(PDO::FETCH_ASSOC);
    $map = [];
    foreach ($allPages as $p) {
        $map[(int)$p['id']] = $p;
    }

    $getPath = function($id) use (&$map, &$getPath) {
        if (!isset($map[$id])) return '';
        $node = $map[$id];
        $slug = htmlspecialchars($node['slug']);
        if (!empty($node['parent_id']) && isset($map[(int)$node['parent_id']])) {
            return $getPath((int)$node['parent_id']) . '/' . $slug;
        }
        return $slug;
    };

    $stmt = $pdo->prepare("SELECT id, updated_at FROM pages WHERE status = 'published' AND is_custom_link = 0 ORDER BY updated_at DESC");
    $stmt->execute();
    $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $home_id = (int)($config['home_page_id'] ?? 0);
    
    $protocol = $is_https ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base_url = $protocol . $host;
    
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    foreach ($pages as $p) {
        $loc = $base_url . '/';
        // Only append path if it's not the home page
        if ((int)$p['id'] !== $home_id) {
            $path = $getPath((int)$p['id']);
            if ($path !== 'home') {
                $loc .= $path;
            }
        }
        
        // Format lastmod to YYYY-MM-DD
        $lastmod = date('Y-m-d', strtotime($p['updated_at']));
        
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "  </url>\n";
    }
    
    echo '</urlset>';
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<error>' . htmlspecialchars($e->getMessage()) . '</error>';
    exit;
}
