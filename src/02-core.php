<?php

declare(strict_types=1);

if (!defined('ESCMS_VERSION')) {
    define('ESCMS_VERSION', '1.0.0-alpha');
}

// 1. El Escudo HTTPS y Cabeceras
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true) || ($_SERVER['SERVER_NAME'] ?? '') === 'localhost';
$is_https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

if (!$is_localhost && !$is_https) {
    header('HTTP/1.1 301 Moved Permanently');
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit;
}

header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; frame-src *; media-src *; connect-src *;");

// 2. Sesión Blindada
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $is_https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    
    session_start();
}

// 3. El Check del ZIP
if (!defined('ESCMS_HAS_ZIP')) {
    define('ESCMS_HAS_ZIP', class_exists('ZipArchive'));
}

// 4. El Motor de Base de Datos (PDO)
try {
    $pdo = new PDO('sqlite:' . dirname(__DIR__) . '/data/escms.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    try {
        $pdo->exec("ALTER TABLE components ADD COLUMN template_id VARCHAR(50) DEFAULT 'custom'");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN seo_keywords TEXT");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN seo_language TEXT");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN status VARCHAR(20) DEFAULT 'draft'");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN parent_id INTEGER DEFAULT NULL");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN menu_order INTEGER DEFAULT 0");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN is_hidden_menu INTEGER DEFAULT 0");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN is_custom_link INTEGER DEFAULT 0");
    } catch (PDOException $e) {}
    try {
        $pdo->exec("ALTER TABLE pages ADD COLUMN custom_link_url TEXT DEFAULT ''");
    } catch (PDOException $e) {}
    $config = $pdo->query("SELECT k, v FROM options")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
} catch (PDOException $e) {
    http_response_code(500);
    die("Fatal Error: Database connection failed.");
}