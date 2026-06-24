<?php
/**
 * Endpoint Legacy - Consulta de materiales con bajo stock
 *
 * GET /low-stock
 * Retorna JSON con materiales por debajo del umbral configurado
 *
 * Formato de respuesta:
 * [{"material": "BOX_SMALL", "stock": 5}, ...]
 */

header('Content-Type: application/json');

// Restrict CORS to a configured origin instead of '*'; this endpoint exposes
// internal stock levels and should not be callable from arbitrary origins.
$allowedOrigin = getenv('CORS_ALLOWED_ORIGIN') ?: 'http://localhost:8080';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');

require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("
        SELECT
            m.code AS material,
            i.quantity_available AS stock
        FROM materials m
        JOIN inventory i ON i.material_id = m.id
        WHERE i.quantity_available <= i.minimum_stock
        ORDER BY i.quantity_available ASC
    ");

    $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formato exacto: array plano de objetos { material, stock }
    echo json_encode($materials, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
