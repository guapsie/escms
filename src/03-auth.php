<?php

declare(strict_types=1);

class EscmsAuth {

    private static function base64url_decode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function generateChallenge(): string {
        return bin2hex(random_bytes(32));
    }

    /**
     * @throws InvalidArgumentException|RuntimeException
     */
    public static function verifyRegistration(array $payload, string $expectedOrigin, string $storedChallenge): string {
        if (empty($payload['clientDataJSON']) || empty($payload['publicKey'])) {
            throw new InvalidArgumentException("Missing required registration payload data.");
        }

        $clientDataJSON = self::base64url_decode($payload['clientDataJSON']);
        $clientData = json_decode($clientDataJSON, true);

        if (!isset($clientData['origin']) || $clientData['origin'] !== $expectedOrigin) {
            throw new RuntimeException("Origin mismatch. Expected: {$expectedOrigin}");
        }

        $returnedChallenge = bin2hex(self::base64url_decode($clientData['challenge'] ?? ''));
        if ($returnedChallenge !== $storedChallenge) {
            throw new RuntimeException("Challenge mismatch.");
        }

        $der = self::base64url_decode($payload['publicKey']);
        return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----\n";
    }

    /**
     * @throws InvalidArgumentException|RuntimeException
     */
    public static function verifyLogin(
        array $payload, 
        string $expectedOrigin, 
        string $storedPemKey, 
        string $storedChallenge,
        int $storedSignCount,
        int &$newSignCount
    ): bool {
        if (empty($payload['clientDataJSON']) || empty($payload['authenticatorData']) || empty($payload['signature'])) {
            throw new InvalidArgumentException("Missing required login payload data.");
        }

        $clientDataJSON = self::base64url_decode($payload['clientDataJSON']);
        $clientData = json_decode($clientDataJSON, true);

        $returnedChallenge = bin2hex(self::base64url_decode($clientData['challenge'] ?? ''));
        if ($returnedChallenge !== $storedChallenge) {
            throw new RuntimeException("Challenge mismatch.");
        }

        if (!isset($clientData['origin']) || $clientData['origin'] !== $expectedOrigin) {
            throw new RuntimeException("Origin mismatch.");
        }

        $authData = self::base64url_decode($payload['authenticatorData']);
        
        // Extraemos el host limpio sin el puerto para que coincida con window.location.hostname en JS
        $host = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0];
        $expectedRpIdHash = hash('sha256', $host, true);
        $rpIdHash = substr($authData, 0, 32);
        if (!hash_equals($expectedRpIdHash, $rpIdHash)) {
            throw new RuntimeException("RP ID hash mismatch.");
        }

        $flags = ord($authData[32]);
        if (($flags & 1) !== 1) {
            throw new RuntimeException("User presence flag not set.");
        }

        $signCountArray = unpack('N', substr($authData, 33, 4));
        $signCount = $signCountArray ? $signCountArray[1] : 0;
        
        if ($signCount > 0 && $storedSignCount > 0 && $signCount <= $storedSignCount) {
            throw new RuntimeException("Cloned authenticator detected: signature count invalid.");
        }
        $newSignCount = $signCount;

        $signature = self::base64url_decode($payload['signature']);
        $clientDataHash = hash('sha256', $clientDataJSON, true);
        $signatureBase = $authData . $clientDataHash;

        return openssl_verify($signatureBase, $signature, $storedPemKey, OPENSSL_ALGO_SHA256) === 1;
    }

    public static function isLoggedIn(): bool {
        global $pdo;
        if (!isset($_SESSION['escms_admin']) || $_SESSION['escms_admin'] !== true) {
            return false;
        }
        
        // Ghost session protection: if the DB has no passkeys (e.g. was wiped), no one can be logged in.
        if (isset($pdo)) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM passkeys");
                if ($stmt && $stmt->fetchColumn() == 0) {
                    self::logout();
                    return false;
                }
            } catch (\Throwable $e) {
                return false;
            }
        }
        
        return true;
    }

    public static function login(): void {
        $_SESSION['escms_admin'] = true;
    }

    public static function logout(): void {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(), 
                '', 
                time() - 42000,
                $params["path"], 
                $params["domain"],
                $params["secure"], 
                $params["httponly"]
            );
        }
        session_destroy();
    }
}