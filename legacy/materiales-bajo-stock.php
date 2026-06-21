<?php
/**
 * Endpoint Legacy - Consulta de materiales con bajo stock
 *
 * GET /low-stock
 * Retorna JSON con materiales por debajo del umbral configurado
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

try {
    $pdo = getConnection();

    $stmt = $pdo->query("
        SELECT
            m.id,
            m.sku,
            m.name,
            m.type,
            m.current_stock AS stock,
            m.low_stock_threshold AS threshold,
            (m.current_stock - m.reserved_stock) AS available_stock
        FROM materials m
        WHERE m.is_active = true
          AND m.current_stock < m.low_stock_threshold
        ORDER BY (m.current_stock::float / NULLIF(m.low_stock_threshold, 0)) ASC
    ");

    $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'count' => count($materials),
        'data' => $materials,
        'generated_at' => date('c')
    ], JSON_PRETTY_PRINT);

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

