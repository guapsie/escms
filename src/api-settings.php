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
                $action = $_GET['action'] ?? '';
                if ($action === 'check_locale_update') {
                    $lang = $_GET['lang'] ?? '';
                    if (!$lang || !preg_match('/^[a-z]{2}$/', $lang)) $send_json(['error' => 'Invalid lang'], 400);
                    $path = __DIR__ . '/../data/locales/' . $lang . '.json';
                    if (!file_exists($path)) $send_json(['has_update' => true]);
                    
                    $url = "https://raw.githubusercontent.com/guapsie/escms/main/locales/{$lang}.json";
                    $ctx = stream_context_create(['http' => ['method' => 'HEAD', 'timeout' => 3]]);
                    @file_get_contents($url, false, $ctx);
                    if (!empty($http_response_header)) {
                        foreach ($http_response_header as $hdr) {
                            if (preg_match('/^ETag:\s*"([^"]+)"/i', $hdr, $m)) {
                                $remote_etag = $m[1];
                                $local_etag_path = $path . '.etag';
                                $local_etag = file_exists($local_etag_path) ? file_get_contents($local_etag_path) : '';
                                $send_json(['has_update' => $remote_etag !== $local_etag, 'etag' => $remote_etag]);
                            }
                        }
                    }
                    $send_json(['has_update' => false]);
                }

                if ($action === 'download_locale') {
                    $lang = $_GET['lang'] ?? '';
                    $force = isset($_GET['force']) && $_GET['force'] == '1';
                    if (!$lang || !preg_match('/^[a-z]{2}$/', $lang)) $send_json(['error' => 'Invalid lang'], 400);
                    $path = __DIR__ . '/../data/locales/' . $lang . '.json';
                    if (!file_exists($path) || $force) {
                        $url = "https://raw.githubusercontent.com/guapsie/escms/main/locales/{$lang}.json";
                        $ctx = stream_context_create(['http' => ['timeout' => 3]]);
                        $content = @file_get_contents($url, false, $ctx);
                        if ($content) {
                            if (!is_dir(dirname($path))) mkdir(dirname($path), 0755, true);
                            file_put_contents($path, $content);
                            if (!empty($http_response_header)) {
                                foreach ($http_response_header as $hdr) {
                                    if (preg_match('/^ETag:\s*"([^"]+)"/i', $hdr, $m)) {
                                        file_put_contents($path . '.etag', $m[1]);
                                    }
                                }
                            }
                            $send_json(['status' => 'success', 'data' => json_decode($content, true)]);
                        } else {
                            $send_json(['error' => 'Not found on github'], 404);
                        }
                    } else {
                        $send_json(['status' => 'success', 'data' => json_decode(file_get_contents($path), true)]);
                    }
                }

                if ($action === 'zip_check') {
                    $send_json(['status' => 'success', 'has_zip' => class_exists('ZipArchive')]);
                }
                if ($action === 'export') {
                    if (!class_exists('ZipArchive')) $send_json(['error' => 'ZipArchive not available'], 500);
                    $dataDir = realpath(__DIR__ . '/../data');
                    $zipFile = sys_get_temp_dir() . '/escms-backup-' . time() . '.zip';
                    $zip = new ZipArchive();
                    if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                        $files = new RecursiveIteratorIterator(
                            new RecursiveDirectoryIterator($dataDir),
                            RecursiveIteratorIterator::LEAVES_ONLY
                        );
                        foreach ($files as $name => $file) {
                            if (!$file->isDir()) {
                                $filePath = $file->getRealPath();
                                $relativePath = substr($filePath, strlen($dataDir) + 1);
                                $zip->addFile($filePath, $relativePath);
                            }
                        }
                        $zip->close();
                        header('Content-Type: application/zip');
                        header('Content-Disposition: attachment; filename="escms-backup.zip"');
                        header('Content-Length: ' . filesize($zipFile));
                        readfile($zipFile);
                        unlink($zipFile);
                        exit;
                    }
                    $send_json(['error' => 'Failed to create zip'], 500);
                }

                $options = $pdo->query("SELECT k, v FROM options WHERE k NOT LIKE '%apikey%' AND k NOT LIKE '%secret%'")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
                $send_json(['status' => 'success', 'data' => $options]);
            } elseif ($method === 'POST') {
                $action = $_GET['action'] ?? '';
                if ($action === 'import') {
                    if (!class_exists('ZipArchive')) $send_json(['error' => 'ZipArchive not available'], 500);
                    if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
                        $send_json(['error' => 'Upload failed. File might be too large.'], 400);
                    }
                    $zipFile = $_FILES['backup']['tmp_name'];
                    $zip = new ZipArchive();
                    if ($zip->open($zipFile) === true) {
                        if ($zip->locateName('escms.sqlite') === false) {
                            $zip->close();
                            $send_json(['error' => 'Invalid backup file. escms.sqlite missing.'], 400);
                        }
                        // Close DB to release lock on Windows
                        $pdo = null;
                        $dataDir = realpath(__DIR__ . '/../data');
                        $zip->extractTo($dataDir);
                        $zip->close();
                        $send_json(['status' => 'success']);
                    }
                    $send_json(['error' => 'Failed to open zip'], 500);
                }

                if ($action === 'check_update') {
                    $force = isset($_GET['force']) && $_GET['force'] == '1';
                    $last_check = $pdo->query("SELECT v FROM options WHERE k='update_last_checked'")->fetchColumn();
                    $update_data = $pdo->query("SELECT v FROM options WHERE k='update_available_data'")->fetchColumn();
                    
                    if ($force || !$last_check || (time() - (int)$last_check) > 86400) { // 1 dia
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, "https://api.github.com/repos/guapsie/escms/releases");
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                        curl_setopt($ch, CURLOPT_USERAGENT, 'ESCMS-Updater');
                        $response = curl_exec($ch);
                        curl_close($ch);
                        
                        $releases = json_decode($response, true);
                        if (is_array($releases) && count($releases) > 0) {
                            $latest = $releases[0];
                            $latest_version = $latest['tag_name'] ?? '';
                            $current_version = defined('ESCMS_VERSION') ? ESCMS_VERSION : '0.0.0';
                            
                            $has_update = version_compare(ltrim($latest_version, 'v'), ltrim($current_version, 'v'), '>');
                            
                            $data_to_save = ['has_update' => $has_update, 'version' => $latest_version];
                            if ($has_update && !empty($latest['assets'])) {
                                foreach ($latest['assets'] as $asset) {
                                    if ($asset['name'] === 'update.php') {
                                        $data_to_save['download_url'] = $asset['browser_download_url'];
                                        break;
                                    }
                                }
                            }
                            $update_data = json_encode($data_to_save);
                        } else {
                            $update_data = json_encode(['has_update' => false]);
                        }
                        
                        $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                        $stmt->execute(['update_last_checked', (string)time()]);
                        $stmt->execute(['update_available_data', $update_data]);
                    }
                    
                    $data = json_decode((string)$update_data, true) ?: ['has_update' => false];
                    $send_json(['status' => 'success', 'has_update' => $data['has_update']]);
                }

                if ($action === 'update_core') {
                    $update_data_raw = $pdo->query("SELECT v FROM options WHERE k='update_available_data'")->fetchColumn();
                    $update_data = json_decode((string)$update_data_raw, true);
                    
                    if (!$update_data || empty($update_data['download_url'])) {
                        $send_json(['error' => 'No hay URL de actualización disponible'], 400);
                    }
                    
                    $download_url = $update_data['download_url'];
                    $latest_version = $update_data['version'];
                    
                    // 1. PING TELEMETRÍA a tu servidor
                    $domain = $_SERVER['HTTP_HOST'] ?? 'unknown';
                    $ping_data = json_encode(['domain' => $domain, 'version' => $latest_version]);
                    $ctx = stream_context_create([
                        'http' => [
                            'method' => 'POST',
                            'header' => "Content-Type: application/json\r\n",
                            'content' => $ping_data,
                            'timeout' => 3
                        ]
                    ]);
                    @file_get_contents('https://escms.dev/tracker.php?action=ping_update', false, $ctx);
                    
                    // 2. Descargar el update.php desde GitHub
                    $ch = curl_init($download_url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'ESCMS-Updater');
                    $installer_code = curl_exec($ch);
                    if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 200 || !$installer_code) {
                        $send_json(['error' => 'Fallo al descargar la actualización desde GitHub'], 500);
                    }
                    curl_close($ch);
                    
                    // 3. Escribir y sobrescribir el núcleo
                    $update_file = __DIR__ . '/../update.php';
                    file_put_contents($update_file, $installer_code);
                    
                    if (!copy($update_file, __DIR__ . '/../index.php')) {
                        $send_json(['error' => 'Fallo al sobrescribir index.php. Verifica permisos.'], 500);
                    }
                    unlink($update_file);
                    if (function_exists('opcache_invalidate')) opcache_invalidate(__DIR__ . '/../index.php', true);
                    
                    // Purgar caché de idiomas para forzar su recarga
                    $locales = glob(__DIR__ . '/../data/locales/*.json');
                    if ($locales) {
                        foreach ($locales as $l) @unlink($l);
                    }

                    $pdo->exec("UPDATE options SET v = '{\"has_update\":false}' WHERE k = 'update_available_data'");
                    
                    $send_json(['status' => 'success']);
                }

                $key = $input['key'] ?? null;
                $value = $input['value'] ?? null;
                if (!$key || str_contains(strtolower($key), 'apikey')) $send_json(['status' => 'error', 'msg' => 'Invalid key'], 400);
                
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }

                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute([$key, (string)$value]);

                // Regenerate vars.css
                $allOptions = $pdo->query("SELECT k, v FROM options WHERE k NOT LIKE '%apikey%' AND k NOT LIKE '%secret%'")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
                $custom_css_vars = ":root {\n";
                $css_keys = [
                    '--max-width', 
                    '--color-background', 
                    '--color-text', 
                    '--color-accent', 
                    '--color-link', 
                    '--color-link-hover', 
                    '--font-body'
                ];
                foreach ($css_keys as $ck) {
                    if (!empty($allOptions[$ck])) {
                        $custom_css_vars .= "    {$ck}: " . $allOptions[$ck] . ";\n";
                    }
                }
                $custom_css_vars .= "}\n";
                
                $userDir = __DIR__ . '/../data/user-settings';
                if (!is_dir($userDir)) {
                    @mkdir($userDir, 0755, true);
                }
                @file_put_contents($userDir . '/vars.css', $custom_css_vars);

                $send_json(['status' => 'success']);
            } else {
                $send_json(['error' => 'Method not allowed'], 405);
            }
            break;

    case 'api/addons':
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $action = $_GET['action'] ?? '';
            
            if ($action === 'list') {
                $last_check = $pdo->query("SELECT v FROM options WHERE k='addons_last_checked'")->fetchColumn();
                $catalog_data = $pdo->query("SELECT v FROM options WHERE k='addons_catalog'")->fetchColumn();
                $force = isset($_GET['force']) && $_GET['force'] == '1';
                
                if ($force || !$last_check || (time() - (int)$last_check) > 86400) {
                    $local_catalog = __DIR__ . '/../../catalog/catalog.json';
                    if (file_exists($local_catalog)) {
                        $response = file_get_contents($local_catalog);
                    } else {
                        $ch = curl_init("https://raw.githubusercontent.com/guapsie/escms/main/catalog/catalog.json");
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                        $response = curl_exec($ch);
                        curl_close($ch);
                    }
                    
                    if ($response) {
                        $catalog_data = $response;
                        $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                        $stmt->execute(['addons_last_checked', (string)time()]);
                        $stmt->execute(['addons_catalog', $catalog_data]);
                    }
                }
                
                $catalog = json_decode((string)$catalog_data, true) ?: ['addons' => []];
                $installed_raw = $pdo->query("SELECT v FROM options WHERE k='installed_addons'")->fetchColumn();
                $installed = json_decode((string)$installed_raw, true) ?: [];
                
                $list = [];
                if (isset($catalog['addons']) && is_array($catalog['addons'])) {
                    foreach ($catalog['addons'] as $addon) {
                        $id = $addon['id'];
                        if (isset($installed[$id])) {
                            $addon['installed'] = true;
                            $addon['installed_version'] = $installed[$id]['version'] ?? '0.0.0';
                            $addon['has_update'] = version_compare($addon['version'], $addon['installed_version'], '>');
                        } else {
                            $addon['installed'] = false;
                            $addon['has_update'] = false;
                        }
                        $list[] = $addon;
                    }
                }
                $send_json(['status' => 'success', 'data' => $list]);
            }
            
            if ($action === 'install') {
                if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
                $id = $input['id'] ?? '';
                if (!$id) $send_json(['error' => 'Missing ID'], 400);
                
                $catalog_data = $pdo->query("SELECT v FROM options WHERE k='addons_catalog'")->fetchColumn();
                $catalog = json_decode((string)$catalog_data, true) ?: ['addons' => []];
                $addon = null;
                if (isset($catalog['addons'])) {
                    foreach ($catalog['addons'] as $a) {
                        if ($a['id'] === $id) { $addon = $a; break; }
                    }
                }
                if (!$addon) $send_json(['error' => 'Addon not found in catalog'], 404);
                
                $url = $addon['download_url'] ?? '';
                if (!$url) $send_json(['error' => 'No download URL'], 400);
                
                $addons_dir = __DIR__ . '/../data/addons';
                if (!is_dir($addons_dir)) mkdir($addons_dir, 0755, true);
                
                $target_dir = $addons_dir . '/' . $id;
                if (!is_dir($target_dir)) mkdir($target_dir, 0755, true);
                
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_USERAGENT, 'ESCMS-AddonManager');
                $content = curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if (str_starts_with($url, 'https://raw.githubusercontent.com/guapsie/escms/main/catalog/')) {
                    $local_file = __DIR__ . '/../../' . str_replace('https://raw.githubusercontent.com/guapsie/escms/main/', '', $url);
                    if (file_exists($local_file)) {
                        $content = file_get_contents($local_file);
                        $code = 200;
                    }
                }
                
                if ($code !== 200 || !$content) {
                    $send_json(['error' => 'Failed to download addon'], 500);
                }
                
                $main_file = '';
                if (str_ends_with(strtolower($url), '.zip')) {
                    if (!class_exists('ZipArchive')) $send_json(['error' => 'ZipArchive missing'], 500);
                    $tmp = sys_get_temp_dir() . '/addon_' . uniqid() . '.zip';
                    file_put_contents($tmp, $content);
                    $zip = new ZipArchive();
                    if ($zip->open($tmp) === true) {
                        $zip->extractTo($target_dir);
                        $zip->close();
                        @unlink($tmp);
                    } else {
                        @unlink($tmp);
                        $send_json(['error' => 'Failed to extract zip'], 500);
                    }
                } else {
                    $filename = basename(parse_url($url, PHP_URL_PATH));
                    file_put_contents($target_dir . '/' . $filename, $content);
                    $main_file = $filename;
                }
                
                $installed_raw = $pdo->query("SELECT v FROM options WHERE k='installed_addons'")->fetchColumn();
                $installed = json_decode((string)$installed_raw, true) ?: [];
                $installed[$id] = [
                    'version' => $addon['version'],
                    'inject' => $addon['inject'] ?? [],
                    'main_file' => $main_file
                ];
                
                $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                $stmt->execute(['installed_addons', json_encode($installed)]);
                
                $send_json(['status' => 'success']);
            }
            
            if ($action === 'uninstall') {
                if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
                $id = $input['id'] ?? '';
                if (!$id) $send_json(['error' => 'Missing ID'], 400);
                
                $installed_raw = $pdo->query("SELECT v FROM options WHERE k='installed_addons'")->fetchColumn();
                $installed = json_decode((string)$installed_raw, true) ?: [];
                
                if (isset($installed[$id])) {
                    unset($installed[$id]);
                    $stmt = $pdo->prepare("INSERT INTO options (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v");
                    $stmt->execute(['installed_addons', json_encode($installed)]);
                }
                
                $target_dir = __DIR__ . '/../data/addons/' . $id;
                if (is_dir($target_dir)) {
                    $files = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($target_dir, RecursiveDirectoryIterator::SKIP_DOTS),
                        RecursiveIteratorIterator::CHILD_FIRST
                    );
                    foreach ($files as $fileinfo) {
                        $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
                        @$todo($fileinfo->getRealPath());
                    }
                    @rmdir($target_dir);
                }
                
                $send_json(['status' => 'success']);
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



        default:
            $send_json(['error' => 'Endpoint no encontrado'], 404);
}
