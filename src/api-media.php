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
    case 'api/media/list':
            if ($method !== 'GET') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $media_dir = dirname(__DIR__) . '/data/media';
            if (!is_dir($media_dir)) mkdir($media_dir, 0755, true);
            $files = [];
            foreach (glob($media_dir . '/*.*') as $file) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                    $files[] = [
                        'id' => basename($file),
                        'url' => '/data/media/' . basename($file),
                        'name' => basename($file),
                        'date' => filemtime($file),
                        'size' => filesize($file)
                    ];
                }
            }
            // Sort by date descending
            usort($files, function($a, $b) { return $b['date'] - $a['date']; });
            $send_json(['status' => 'success', 'media' => $files]);
            break;

    case 'api/media/upload':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                $send_json(['status' => 'error', 'msg' => 'No file uploaded or upload error'], 400);
            }
            $media_dir = dirname(__DIR__) . '/data/media/';
            if (!is_dir($media_dir)) mkdir($media_dir, 0755, true);
            
            $file = $_FILES['file'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'])) {
                $send_json(['status' => 'error', 'msg' => 'Invalid file type'], 400);
            }

            // Get webp setting
            $stmt = $pdo->prepare("SELECT v FROM options WHERE k = 'webp_enabled'");
            $stmt->execute();
            $webp_enabled_row = $stmt->fetchColumn();
            $webp_enabled = $webp_enabled_row === false ? '1' : $webp_enabled_row;

            $filename_base = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
            $is_image = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
            $generate_webp = ($webp_enabled === '1') && function_exists('imagewebp') && $is_image && $ext !== 'svg';

            $final_name = '';

            if ($generate_webp) {
                $src = null;
                if ($ext === 'jpg' || $ext === 'jpeg') $src = @imagecreatefromjpeg($file['tmp_name']);
                elseif ($ext === 'png') $src = @imagecreatefrompng($file['tmp_name']);
                elseif ($ext === 'webp') $src = @imagecreatefromwebp($file['tmp_name']);
                elseif ($ext === 'gif') $src = @imagecreatefromgif($file['tmp_name']);

                if ($src) {
                    $counter = 1;
                    $final_name = $filename_base . '.webp';
                    while (file_exists($media_dir . $final_name)) {
                        $final_name = $filename_base . '-' . $counter . '.webp';
                        $counter++;
                    }

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
                    imagewebp($dst, $media_dir . $final_name, 85);
                    imagedestroy($dst);

                    // Thumbnail generation
                    $thumb_dir = $media_dir . 'thumbs/';
                    if (!is_dir($thumb_dir)) @mkdir($thumb_dir, 0755, true);
                    
                    $thumb_w = min($w, 400);
                    $thumb_h = (int)($h * ($thumb_w / $w));
                    $thumb_dst = imagecreatetruecolor($thumb_w, $thumb_h);
                    
                    if ($ext === 'png' || $ext === 'webp') {
                        imagealphablending($thumb_dst, false);
                        imagesavealpha($thumb_dst, true);
                        $transparent = imagecolorallocatealpha($thumb_dst, 255, 255, 255, 127);
                        imagefilledrectangle($thumb_dst, 0, 0, $thumb_w, $thumb_h, $transparent);
                    }
                    
                    imagecopyresampled($thumb_dst, $src, 0, 0, 0, 0, $thumb_w, $thumb_h, $w, $h);
                    imagewebp($thumb_dst, $thumb_dir . $final_name, 80);
                    imagedestroy($thumb_dst);

                    imagedestroy($src);
                } else {
                    $generate_webp = false; // fallback if imagecreate fails
                }
            }
            
            if (!$generate_webp) {
                $counter = 1;
                $final_name = $filename_base . '.' . $ext;
                while (file_exists($media_dir . $final_name)) {
                    $final_name = $filename_base . '-' . $counter . '.' . $ext;
                    $counter++;
                }
                move_uploaded_file($file['tmp_name'], $media_dir . $final_name);
            }

            $send_json([
                'status' => 'success', 
                'media' => [
                    'id' => $final_name,
                    'url' => '/data/media/' . $final_name,
                    'name' => $final_name,
                    'date' => time(),
                    'size' => file_exists($media_dir . $final_name) ? filesize($media_dir . $final_name) : 0
                ]
            ]);
            break;

    case 'api/media/delete':
            if ($method !== 'POST') $send_json(['error' => 'Method not allowed'], 405);
            if (!EscmsAuth::isLoggedIn()) $send_json(['status' => 'error', 'msg' => 'Unauthorized'], 401);
            $media_dir = dirname(__DIR__) . '/data/media';
            $input = json_decode(file_get_contents('php://input'), true);
            if (!isset($input['files']) || !is_array($input['files'])) {
                $send_json(['status' => 'error', 'msg' => 'Invalid payload'], 400);
            }
            $deleted = 0;
            foreach ($input['files'] as $filename) {
                // Prevent directory traversal
                $safe_filename = basename($filename);
                $path = $media_dir . '/' . $safe_filename;
                $thumb_path = $media_dir . '/thumbs/' . $safe_filename;
                
                if (file_exists($path) && is_file($path)) {
                    unlink($path);
                    if (file_exists($thumb_path) && is_file($thumb_path)) {
                        unlink($thumb_path);
                    }
                    $deleted++;
                }
            }
            $send_json(['status' => 'success', 'deleted' => $deleted]);
            break;

    default:
        $send_json(['error' => 'Endpoint no encontrado en ' . basename(__FILE__)], 404);
}
