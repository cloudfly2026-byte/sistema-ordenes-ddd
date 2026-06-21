<?php

/**
 * ─────────────────────────────────────────────────────────────────────────
 * CONFIGURACIÓN: Conexión PDO a PostgreSQL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Carga variables de entorno desde $_ENV / getenv() y expone
 * getDbConnection() como punto único de acceso a la base de datos.
 *
 * Variables de entorno requeridas:
 *   DB_HOST     — Host de PostgreSQL (default: localhost)
 *   DB_PORT     — Puerto                (default: 5432)
 *   DB_NAME     — Nombre de la BD       (default: shopify_packing)
 *   DB_USER     — Usuario               (default: postgres)
 *   DB_PASSWORD — Contraseña            (default: postgres)
 *   DB_SSLMODE  — Modo SSL              (default: prefer)
 *   APP_ENV     — Entorno: production|development (default: production)
 *
 * @package LegacyInventory
 * @author  OWL — Senior PHP Legacy Engineer
 */

declare(strict_types=1);

// ── Carga de variables de entorno ──
loadEnvironment();

// ── Configuración de errores según entorno ──
configureErrorHandling();

// ─────────────────────────────────────────────────────────────────────────
// FUNCIONES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Carga y valida las variables de entorno necesarias para la aplicación.
 *
 * Usa $_ENV como fuente primaria y getenv() como fallback.
 * Define constantes por defecto si la variable no está presente.
 *
 * @return void
 *
 * @throws RuntimeException Si faltan variables críticas en producción.
 */
function loadEnvironment(): void
{
    $defaults = [
        'DB_HOST'     => 'localhost',
        'DB_PORT'     => '5432',
        'DB_NAME'     => 'shopify_packing',
        'DB_USER'     => 'postgres',
        'DB_PASSWORD' => 'postgres',
        'DB_SSLMODE'  => 'prefer',
        'APP_ENV'     => 'production',
    ];

    foreach ($defaults as $key => $default) {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === '') {
            $value = $default;
        }
        // Asegurar que esté disponible para getenv() en todo el proceso
        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
    }

    // Validar que las variables críticas no estén vacías en producción
    if (getenv('APP_ENV') === 'production') {
        $required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
        foreach ($required as $key) {
            $val = getenv($key);
            if ($val === false || $val === '') {
                throw new RuntimeException(
                    "Variable de entorno requerida en producción: {$key}"
                );
            }
        }
    }
}

/**
 * Configura el manejo de errores según el entorno (producción vs desarrollo).
 *
 * Producción:
 *   - No muestra errores al cliente (display_errors = Off)
 *   - Registra todo en error_log (log_errors = On)
 *   - Nivel: E_ALL
 *
 * Desarrollo:
 *   - Muestra errores en pantalla (display_errors = On)
 *   - Registra en error_log (log_errors = On)
 *   - Nivel: E_ALL
 *
 * @return void
 */
function configureErrorHandling(): void
{
    $isDevelopment = (getenv('APP_ENV') === 'development');

    error_reporting(E_ALL);

    if ($isDevelopment) {
        ini_set('display_errors', '1');
        ini_set('display_startup_errors', '1');
    } else {
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
    }

    ini_set('log_errors', '1');
    // Usa el error_log del sistema (configurado en php.ini o Dockerfile)
}

/**
 * Crea y retorna una conexión PDO a PostgreSQL.
 *
 * La conexión se crea una vez por request (no es singleton persistente).
 * Usa prepared statements reales (EMULATE_PREPARES = false) para
 * garantizar protección contra SQL injection.
 *
 * Opciones de PDO configuradas:
 *   - ATTR_ERRMODE            → ERRMODE_EXCEPTION (lanza excepciones en errores)
 *   - ATTR_DEFAULT_FETCH_MODE → FETCH_ASSOC (arrays asociativos)
 *   - ATTR_EMULATE_PREPARES   → false (prepared statements nativos)
 *   - ATTR_TIMEOUT            → 5 segundos
 *
 * @return PDO Conexión activa a PostgreSQL.
 *
 * @throws PDOException Si la conexión falla (host, credenciales, red).
 */
function getDbConnection(): PDO
{
    $host    = getenv('DB_HOST');
    $port    = getenv('DB_PORT');
    $dbname  = getenv('DB_NAME');
    $user    = getenv('DB_USER');
    $pass    = getenv('DB_PASSWORD');
    $sslmode = getenv('DB_SSLMODE');

    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$sslmode}";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 5,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        error_log(sprintf(
            '[%s] [config.php] Error de conexión PDO: %s (DSN: %s)',
            date('Y-m-d H:i:s'),
            $e->getMessage(),
            "pgsql:host={$host};port={$port};dbname={$dbname}"
        ));
        throw $e;
    }
}
