<?php

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ENDPOINT: Health Check
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Verifica que el servicio esté operativo y que la conexión
 * a PostgreSQL funcione correctamente.
 *
 * Respuesta exitosa (HTTP 200):
 *   {"status": "ok", "db": "connected", "timestamp": "2025-01-15T10:30:00+00:00"}
 *
 * Respuesta con error (HTTP 503):
 *   {"status": "error", "db": "disconnected", "message": "..."}
 *
 * @package LegacyInventory
 * @author  OWL — Senior PHP Legacy Engineer
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// ── Headers ──
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$health = performHealthCheck();

if ($health['status'] === 'ok') {
    http_response_code(200);
} else {
    http_response_code(503);
}

echo json_encode($health, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

// ─────────────────────────────────────────────────────────────────────────
// FUNCIONES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta las verificaciones de salud del servicio.
 *
 * 1. Verifica que las variables de entorno críticas estén presentes.
 * 2. Intenta conectar a PostgreSQL y ejecutar una consulta simple (SELECT 1).
 *
 * @return array{
 *     status: string,
 *     db: string,
 *     timestamp?: string,
 *     message?: string
 * } Resultado del health check.
 */
function performHealthCheck(): array
{
    $timestamp = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DateTimeInterface::ATOM);

    // Verificar variables de entorno mínimas
    $requiredEnv = ['DB_HOST', 'DB_NAME', 'DB_USER'];
    foreach ($requiredEnv as $key) {
        $value = getenv($key);
        if ($value === false || $value === '') {
            error_log(sprintf(
                '[%s] [health.php] Variable de entorno faltante: %s',
                date('Y-m-d H:i:s'),
                $key
            ));
            return [
                'status'    => 'error',
                'db'        => 'unknown',
                'message'   => "Missing environment variable: {$key}",
                'timestamp' => $timestamp,
            ];
        }
    }

    // Verificar conexión a PostgreSQL
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->query('SELECT 1');
        $stmt->fetch();

        return [
            'status'    => 'ok',
            'db'        => 'connected',
            'timestamp' => $timestamp,
        ];
    } catch (PDOException $e) {
        error_log(sprintf(
            '[%s] [health.php] Health check fallido: %s',
            date('Y-m-d H:i:s'),
            $e->getMessage()
        ));

        return [
            'status'    => 'error',
            'db'        => 'disconnected',
            'message'   => 'Database connection failed',
            'timestamp' => $timestamp,
        ];
    }
}
