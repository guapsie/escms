<?php
// https://escms.dev/api/network.php
// Central tracker for ESCMS Network

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow all domains to fetch the feed
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbFile = __DIR__ . '/network.sqlite';
$isNewDB = !file_exists($dbFile);

try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($isNewDB) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            thumbnail TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_domain ON posts(domain)");
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'msg' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'publish') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'msg' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'msg' => 'Invalid JSON']);
        exit;
    }

    $domain = trim($input['domain'] ?? '');
    $title = trim($input['title'] ?? '');
    $url = trim($input['url'] ?? '');
    $thumbnail = trim($input['thumbnail'] ?? '');

    if (!$domain || !$title || !$url) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'msg' => 'Missing required fields']);
        exit;
    }

    // Keep the latest 1000 posts in the network to avoid infinite db growth
    $total = $pdo->query("SELECT COUNT(*) FROM posts")->fetchColumn();
    if ($total > 1000) {
        $pdo->exec("DELETE FROM posts WHERE id NOT IN (SELECT id FROM posts ORDER BY published_at DESC LIMIT 1000)");
    }

    // Insert or update the post
    $stmt = $pdo->prepare("INSERT INTO posts (domain, title, url, thumbnail) VALUES (?, ?, ?, ?) ON CONFLICT(url) DO UPDATE SET title=excluded.title, thumbnail=excluded.thumbnail, published_at=CURRENT_TIMESTAMP");
    $stmt->execute([$domain, $title, $url, $thumbnail]);

    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'get_feed') {
    $requestDomain = $_GET['domain'] ?? '';
    
    // Fetch 3 random posts that DO NOT belong to the requester's domain
    $stmt = $pdo->prepare("SELECT title, url, thumbnail FROM posts WHERE domain != ? ORDER BY RANDOM() LIMIT 3");
    $stmt->execute([$requestDomain]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'posts' => $posts]);
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'msg' => 'Invalid action']);
