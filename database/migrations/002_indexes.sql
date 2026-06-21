-- ============================================================
-- MIGRACIÓN 002: Índices Estratégicos
-- Fecha: 2024-01-20
-- Autor: OWL - Senior Database Architect
-- Descripción: Índices para todos los patrones de query
--               identificados en la arquitectura.
-- ============================================================

-- ── ÍNDICES: orders ──────────────────────────────────────────
-- Dashboard: filtrar por estado (pendientes, fallidas, etc.)
CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders (status);

-- Dashboard: listado de órdenes recientes
CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders (created_at DESC);

-- Reportes: órdenes por estado en rango de fechas
CREATE INDEX IF NOT EXISTS idx_orders_status_created
    ON orders (status, created_at DESC);

-- Búsqueda por email de cliente
CREATE INDEX IF NOT EXISTS idx_orders_customer_email
    ON orders (customer_email);

-- ── ÍNDICES PARCIALES: orders ────────────────────────────────
-- Órdenes fallidas (monitoreo operativo frecuente)
CREATE INDEX IF NOT EXISTS idx_orders_failed
    ON orders (created_at DESC)
    WHERE status = 'FAILED';

-- Órdenes en procesamiento (detección de stuck orders)
CREATE INDEX IF NOT EXISTS idx_orders_processing
    ON orders (created_at)
    WHERE status = 'PROCESSING';

-- Órdenes pendientes (vista de cola)
CREATE INDEX IF NOT EXISTS idx_orders_pending
    ON orders (created_at)
    WHERE status = 'PENDING';


-- ── ÍNDICES: order_items ─────────────────────────────────────
-- JOIN items de orden (consulta frecuente)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items (order_id);

-- Búsqueda por SKU (reportes de productos)
CREATE INDEX IF NOT EXISTS idx_order_items_sku
    ON order_items (sku);

-- Items frágiles (cálculo de FILLER)
CREATE INDEX IF NOT EXISTS idx_order_items_fragile
    ON order_items (order_id)
    WHERE is_fragile = TRUE;


-- ── ÍNDICES: inventory ──────────────────────────────────────
-- La UNIQUE en material_id ya crea índice.

-- Alertas de bajo stock (dashboard, alertas automáticas)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
    ON inventory (material_id)
    WHERE quantity_available <= minimum_stock;

-- Stock crítico (menos de la mitad del mínimo)
CREATE INDEX IF NOT EXISTS idx_inventory_critical
    ON inventory (material_id)
    WHERE quantity_available <= (minimum_stock / 2);


-- ── ÍNDICES: inventory_movements ─────────────────────────────
-- Historial por material
CREATE INDEX IF NOT EXISTS idx_movements_inventory
    ON inventory_movements (inventory_id, created_at DESC);

-- Movimientos por orden (trazabilidad)
CREATE INDEX IF NOT EXISTS idx_movements_order
    ON inventory_movements (order_id, created_at DESC)
    WHERE order_id IS NOT NULL;

-- Movimientos por tipo (reportes de consumo)
CREATE INDEX IF NOT EXISTS idx_movements_type
    ON inventory_movements (movement_type, created_at DESC);

-- Movimientos recientes (últimas 24h, debugging)
CREATE INDEX IF NOT EXISTS idx_movements_recent
    ON inventory_movements (created_at DESC);


-- ── ÍNDICES: webhook_events ─────────────────────────────────
-- La UNIQUE en shopify_event_id ya crea índice.

-- Eventos pendientes de procesamiento
CREATE INDEX IF NOT EXISTS idx_webhook_pending
    ON webhook_events (received_at)
    WHERE status = 'PENDING';

-- Eventos fallidos (monitoreo)
CREATE INDEX IF NOT EXISTS idx_webhook_failed
    ON webhook_events (received_at DESC)
    WHERE status = 'FAILED';

-- Eventos por tienda
CREATE INDEX IF NOT EXISTS idx_webhook_shop_domain
    ON webhook_events (shop_domain, received_at DESC);


-- ── ÍNDICES: order_materials ────────────────────────────────
-- Materiales de una orden
CREATE INDEX IF NOT EXISTS idx_order_materials_order
    ON order_materials (order_id);

-- Materiales por material (reportes de uso)
CREATE INDEX IF NOT EXISTS idx_order_materials_material
    ON order_materials (material_id);

-- Materiales pendientes de reserva (flujo de procesamiento)
CREATE INDEX IF NOT EXISTS idx_order_materials_pending
    ON order_materials (order_id)
    WHERE status = 'PENDING';

-- Materiales reservados (para consumo)
CREATE INDEX IF NOT EXISTS idx_order_materials_reserved
    ON order_materials (order_id)
    WHERE status = 'RESERVED';


-- ── ÍNDICES: job_executions ─────────────────────────────────
-- Trabajo por BullMQ job_id
CREATE INDEX IF NOT EXISTS idx_job_exec_job_id
    ON job_executions (job_id);

-- Trabajos de una orden
CREATE INDEX IF NOT EXISTS idx_job_exec_order
    ON job_executions (order_id)
    WHERE order_id IS NOT NULL;

-- Trabajos fallidos o reintentando (monitoreo)
CREATE INDEX IF NOT EXISTS idx_job_exec_failed
    ON job_executions (created_at DESC)
    WHERE status IN ('FAILED', 'RETRYING');

-- Trabajos en ejecución (detección de stuck jobs)
CREATE INDEX IF NOT EXISTS idx_job_exec_running
    ON job_executions (started_at)
    WHERE status = 'RUNNING';


-- ── ÍNDICES: audit_logs ─────────────────────────────────────
-- Auditoría por entidad
CREATE INDEX IF NOT EXISTS idx_audit_entity
    ON audit_logs (entity_type, entity_id, performed_at DESC);

-- Auditoría por fecha (reportes)
CREATE INDEX IF NOT EXISTS idx_audit_performed_at
    ON audit_logs (performed_at DESC);

-- Auditoría por usuario
CREATE INDEX IF NOT EXISTS idx_audit_performed_by
    ON audit_logs (performed_by, performed_at DESC);

-- Auditoría de órdenes (la más frecuente)
CREATE INDEX IF NOT EXISTS idx_audit_orders
    ON audit_logs (performed_at DESC)
    WHERE entity_type = 'order';
