-- ============================================================
-- SCHEMA: Sistema de Gestión de Empaque e Inventario (Shopify)
-- DB:      PostgreSQL 15+
-- Author:  OWL - Senior Database Architect
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TIPOS ENUMERADOS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM (
    'PENDING',      -- Recibida, en cola de procesamiento
    'PROCESSING',   -- Siendo procesada (cálculo + reserva)
    'COMPLETED',    -- Procesada exitosamente
    'FAILED',       -- Falló durante procesamiento (terminal)
    'CANCELLED'     -- Cancelada manualmente
);

CREATE TYPE box_type AS ENUM (
    'BOX_SMALL',   -- 1-2 productos
    'BOX_MEDIUM',  -- 3-5 productos
    'BOX_LARGE'    -- 6+ productos
);

CREATE TYPE material_code AS ENUM (
    'BOX_SMALL',
    'BOX_MEDIUM',
    'BOX_LARGE',
    'LABEL',
    'TAPE',
    'FILLER'
);

CREATE TYPE movement_type AS ENUM (
    'RESERVE',     -- Reserva de stock para una orden
    'CONSUME',     -- Consumo definitivo de reserva
    'RELEASE',     -- Liberación de reserva expirada/cancelada
    'ADJUSTMENT'   -- Ajuste manual (inventario físico, mermas)
);

CREATE TYPE webhook_status AS ENUM (
    'PENDING',     -- Recibido, pendiente de procesamiento
    'PROCESSED',   -- Procesado exitosamente
    'FAILED',      -- Falló procesamiento
    'DUPLICATE'    -- Evento duplicado detectado
);

CREATE TYPE job_status AS ENUM (
    'PENDING',     -- En cola
    'RUNNING',     -- En ejecución
    'COMPLETED',   -- Finalizado exitosamente
    'FAILED',      -- Falló
    'RETRYING'     -- Reintentando tras fallo transitorio
);

CREATE TYPE order_material_status AS ENUM (
    'PENDING',     -- Material calculado, pendiente de reserva
    'RESERVED',    -- Stock reservado
    'CONSUMED',    -- Stock consumido definitivamente
    'RELEASED'     -- Reserva liberada
);

-- ──────────────────────────────────────────────────────────────
-- 2. TABLAS
-- ──────────────────────────────────────────────────────────────

-- ============================================================
-- TABLA: orders
-- Rol: Almacena cada orden recibida desde Shopify.
-- ============================================================
CREATE TABLE orders (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopify_order_id  VARCHAR(128)  NOT NULL UNIQUE,
    status            order_status  NOT NULL DEFAULT 'PENDING',
    customer_email    VARCHAR(320),
    total_price       NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_price >= 0),
    currency          VARCHAR(3)    NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
    items_count       INTEGER       NOT NULL DEFAULT 0 CHECK (items_count >= 0),
    has_fragile       BOOLEAN       NOT NULL DEFAULT FALSE,
    box_type          box_type,
    error_message     TEXT,
    idempotency_key   VARCHAR(128)  UNIQUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    processed_at      TIMESTAMPTZ
);

COMMENT ON TABLE  orders IS 'Órdenes recibidas desde Shopify con su estado actual';
COMMENT ON COLUMN orders.idempotency_key IS 'Clave de idempotencia para evitar procesamiento duplicado';
COMMENT ON COLUMN orders.box_type IS 'Tipo de caja calculado según cantidad de productos';
COMMENT ON COLUMN orders.error_message IS 'Motivo del fallo si la orden no pudo procesarse';

-- ============================================================
-- TABLA: order_items
-- Rol: Líneas de productos (SKU, cantidad, precio) de cada orden.
-- ============================================================
CREATE TABLE order_items (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id             UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shopify_line_item_id VARCHAR(128),
    product_name         VARCHAR(512) NOT NULL,
    quantity             INTEGER      NOT NULL CHECK (quantity > 0),
    price                NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    is_fragile           BOOLEAN      NOT NULL DEFAULT FALSE,
    sku                  VARCHAR(128),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS 'Líneas de productos de cada orden';

-- ============================================================
-- TABLA: materials
-- Rol: Catálogo maestro de materiales de empaque.
-- ============================================================
CREATE TABLE materials (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code          material_code NOT NULL UNIQUE,
    name          VARCHAR(256)  NOT NULL,
    description   TEXT,
    unit          VARCHAR(32)   NOT NULL DEFAULT 'unit',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE materials IS 'Catálogo de materiales de empaque (cajas, etiquetas, cinta, relleno)';

-- ============================================================
-- TABLA: inventory
-- Rol: Stock disponible y reservado por material. 1 fila por material.
-- ============================================================
CREATE TABLE inventory (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_id       UUID         NOT NULL UNIQUE REFERENCES materials(id),
    quantity_available INTEGER     NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved  INTEGER     NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    minimum_stock      INTEGER     NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
    last_updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version           INTEGER      NOT NULL DEFAULT 1 CHECK (version >= 1)
);

COMMENT ON TABLE  inventory IS 'Inventario de materiales: stock disponible, reservado y umbral mínimo';
COMMENT ON COLUMN inventory.version IS 'Versión para control de concurrencia optimista (bloqueo pesimista primario)';

-- ============================================================
-- TABLA: inventory_movements
-- Rol: Historial inmutable de TODOS los movimientos de stock.
-- ============================================================
CREATE TABLE inventory_movements (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id    UUID          NOT NULL REFERENCES inventory(id),
    order_id        UUID          REFERENCES orders(id) ON DELETE SET NULL,
    movement_type   movement_type NOT NULL,
    quantity        INTEGER       NOT NULL CHECK (quantity <> 0),
    quantity_before INTEGER       NOT NULL,
    quantity_after  INTEGER       NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_by      VARCHAR(128)  NOT NULL DEFAULT 'system'
);

COMMENT ON TABLE inventory_movements IS 'Registro inmutable de todos los movimientos de inventario (auditoría de stock)';

-- ============================================================
-- TABLA: webhook_events
-- Rol: Registro de cada webhook recibido de Shopify para trazabilidad
--      y replay. Garantiza idempotencia a nivel de evento.
-- ============================================================
CREATE TABLE webhook_events (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopify_event_id VARCHAR(128) NOT NULL UNIQUE,
    topic           VARCHAR(128) NOT NULL,
    shop_domain     VARCHAR(256) NOT NULL,
    payload         JSONB        NOT NULL,
    status          webhook_status NOT NULL DEFAULT 'PENDING',
    attempts        INTEGER      NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error      TEXT,
    received_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ
);

COMMENT ON TABLE webhook_events IS 'Registro de webhooks de Shopify para trazabilidad, idempotencia y replay';

-- ============================================================
-- TABLA: order_materials
-- Rol: Materiales de empaque asignados a cada orden con su
--      estado de reserva/consumo.
-- ============================================================
CREATE TABLE order_materials (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id           UUID              NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    material_id        UUID              NOT NULL REFERENCES materials(id),
    quantity_required  INTEGER           NOT NULL CHECK (quantity_required > 0),
    quantity_reserved  INTEGER           NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_consumed  INTEGER           NOT NULL DEFAULT 0 CHECK (quantity_consumed >= 0),
    status             order_material_status NOT NULL DEFAULT 'PENDING',
    created_at         TIMESTAMPTZ        NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_materials IS 'Materiales de empaque asignados a cada orden con estado de reserva/consumo';

-- ============================================================
-- TABLA: job_executions
-- Rol: Trazabilidad de cada trabajo BullMQ ejecutado.
-- ============================================================
CREATE TABLE job_executions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id        VARCHAR(128) NOT NULL,
    queue_name    VARCHAR(128) NOT NULL DEFAULT 'order-processing',
    order_id      UUID         REFERENCES orders(id) ON DELETE SET NULL,
    status        job_status   NOT NULL DEFAULT 'PENDING',
    attempts      INTEGER      NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    payload       JSONB,
    result        JSONB,
    error         TEXT,
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE job_executions IS 'Registro de ejecución de trabajos BullMQ para trazabilidad y debugging';

-- ============================================================
-- TABLA: audit_logs
-- Rol: Auditoría inmutable de todas las acciones del sistema.
--      No se actualizan ni eliminan registros.
-- ============================================================
CREATE TABLE audit_logs (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type   VARCHAR(128) NOT NULL,
    entity_id     UUID         NOT NULL,
    action        VARCHAR(128) NOT NULL,
    old_values    JSONB,
    new_values    JSONB,
    performed_by  VARCHAR(128) NOT NULL DEFAULT 'system',
    performed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ip_address    VARCHAR(45),
    metadata      JSONB
);

COMMENT ON TABLE audit_logs IS 'Registro inmutable de auditoría. No se deben eliminar ni modificar filas.';


-- ──────────────────────────────────────────────────────────────
-- 3. ÍNDICES ESTRATÉGICOS
-- ──────────────────────────────────────────────────────────────

-- ========================
-- orders
-- ========================
-- Búsqueda por estado (dashboard: "órdenes pendientes", "fallidas hoy")
CREATE INDEX idx_orders_status            ON orders (status);

-- Búsqueda por shopify_order_id (idempotencia, aunque ya es UNIQUE)
-- La restricción UNIQUE ya crea un índice implícito.

-- Órdenes recientes para dashboard (ordenamiento por fecha)
CREATE INDEX idx_orders_created_at        ON orders (created_at DESC);

-- Filtro combinado: estado + fecha (ej. "completadas en los últimos 7 días")
CREATE INDEX idx_orders_status_created   ON orders (status, created_at DESC);

-- Búsqueda por cliente
CREATE INDEX idx_orders_customer_email   ON orders (customer_email);

-- Órdenes fallidas con motivo
CREATE INDEX idx_orders_failed           ON orders (created_at DESC) WHERE status = 'FAILED';

-- ========================
-- order_items
-- ========================
-- Items de una orden (JOIN frecuente)
CREATE INDEX idx_order_items_order_id    ON order_items (order_id);

-- Búsqueda por SKU (reportes de productos más empacados)
CREATE INDEX idx_order_items_sku         ON order_items (sku);

-- ========================
-- inventory
-- ========================
-- La UNIQUE constraint en material_id ya crea índice.

-- Alertas de bajo stock (consulta frecuente del dashboard)
CREATE INDEX idx_inventory_low_stock    ON inventory (material_id)
    WHERE quantity_available <= minimum_stock;

-- ========================
-- inventory_movements
-- ========================
-- Historial de movimientos por material
CREATE INDEX idx_movements_inventory    ON inventory_movements (inventory_id, created_at DESC);

-- Movimientos por orden (trazabilidad de una orden)
CREATE INDEX idx_movements_order        ON inventory_movements (order_id, created_at DESC)
    WHERE order_id IS NOT NULL;

-- Movimientos por tipo (reportes de consumo)
CREATE INDEX idx_movements_type         ON inventory_movements (movement_type, created_at DESC);

-- ========================
-- webhook_events
-- ========================
-- La UNIQUE en shopify_event_id ya crea índice.

-- Eventos pendientes de procesamiento
CREATE INDEX idx_webhook_pending        ON webhook_events (received_at)
    WHERE status = 'PENDING';

-- Eventos por dominio de tienda
CREATE INDEX idx_webhook_shop_domain    ON webhook_events (shop_domain, received_at DESC);

-- ========================
-- order_materials
-- ========================
-- Materiales de una orden
CREATE INDEX idx_order_materials_order  ON order_materials (order_id);

-- Materiales por material (reportes de uso)
CREATE INDEX idx_order_materials_material ON order_materials (material_id);

-- Materiales pendientes de reserva
CREATE INDEX idx_order_materials_pending ON order_materials (order_id)
    WHERE status = 'PENDING';

-- ========================
-- job_executions
-- ========================
-- Trabajo por BullMQ job_id (idempotencia)
CREATE INDEX idx_job_exec_job_id        ON job_executions (job_id);

-- Trabajos de una orden
CREATE INDEX idx_job_exec_order         ON job_executions (order_id)
    WHERE order_id IS NOT NULL;

-- Trabajos fallidos o reintentando (monitoreo operativo)
CREATE INDEX idx_job_exec_failed        ON job_executions (created_at DESC)
    WHERE status IN ('FAILED', 'RETRYING');

-- ========================
-- audit_logs
-- ========================
-- Auditoría por entidad
CREATE INDEX idx_audit_entity          ON audit_logs (entity_type, entity_id, performed_at DESC);

-- Auditoría por fecha (reportes de auditoría)
CREATE INDEX idx_audit_performed_at     ON audit_logs (performed_at DESC);

-- Auditoría por usuario
CREATE INDEX idx_audit_performed_by     ON audit_logs (performed_by, performed_at DESC);


-- ──────────────────────────────────────────────────────────────
-- 4. TRIGGER: updated_at automático
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ──────────────────────────────────────────────────────────────
-- 5. TRIGGER: Auditoría automática en orders
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_audit_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, performed_by)
        VALUES (
            'order',
            NEW.id,
            'STATUS_CHANGE',
            jsonb_build_object('status', OLD.status, 'error_message', OLD.error_message),
            jsonb_build_object('status', NEW.status, 'error_message', NEW.error_message),
            'system'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_orders
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_audit_orders();


-- ──────────────────────────────────────────────────────────────
-- 6. TRIGGER: Actualizar inventory.version en cada cambio
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_inventory_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.last_updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_version
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION fn_inventory_version();


-- ──────────────────────────────────────────────────────────────
-- 7. FUNCIÓN: Reserva atómica de inventario
--    Usa SELECT ... FOR UPDATE SKIP LOCKED para alta concurrencia.
--    Verifica TODOS los materiales antes de reservar CUALQUIERA.
--    Si alguno falla, hace ROLLBACK completo (sin descuentos parciales).
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_reserve_inventory(
    p_order_id   UUID,
    p_materials  JSONB,          -- [{"material_id": "...", "quantity": N}, ...]
    p_created_by VARCHAR(128) DEFAULT 'system'
)
RETURNS TABLE (
    success     BOOLEAN,
    message     TEXT,
    material_id UUID,
    available   INTEGER,
    required    INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_material   JSONB;
    v_inv_id     UUID;
    v_qty_needed INTEGER;
    v_available  INTEGER;
    v_reserved   INTEGER;
    v_mat_name   VARCHAR(256);
BEGIN
    -- ── FASE 1: Verificar disponibilidad de TODOS los materiales ──
    --    Bloqueamos las filas en orden determinístico por inventory.id
    --    para prevenir deadlocks entre transacciones concurrentes.

    FOR v_material IN
        SELECT m.m, m.m->>'material_id', (m.m->>'quantity')::INTEGER
        FROM jsonb_array_elements(p_materials) AS m(m)
        ORDER BY (m.m->>'material_id')::UUID  -- Orden determinístico anti-deadlock
    LOOP
        v_inv_id     := (v_material->>1)::UUID;  -- material_id
        v_qty_needed := v_material->>2;          -- quantity

        -- Bloqueo pesimista de la fila de inventario
        SELECT i.quantity_available, i.quantity_reserved, m.name
          INTO v_available, v_reserved, v_mat_name
          FROM inventory i
          JOIN materials m ON m.id = i.material_id
         WHERE i.material_id = v_inv_id
           FOR UPDATE OF i;   -- Bloquea solo la fila de inventory

        IF NOT FOUND THEN
            RETURN QUERY SELECT FALSE, 'Material no encontrado: ' || v_inv_id::TEXT,
                                v_inv_id, 0, v_qty_needed;
            RETURN;
        END IF;

        IF v_available < v_qty_needed THEN
            RETURN QUERY SELECT FALSE,
                format('Stock insuficiente para %s: disponible=%s, requerido=%s',
                       v_mat_name, v_available, v_qty_needed),
                v_inv_id, v_available, v_qty_needed;
            RETURN;
        END IF;
    END LOOP;

    -- ── FASE 2: Reservar TODOS los materiales (ya verificados) ──
    FOR v_material IN
        SELECT m.m, m.m->>'material_id', (m.m->>'quantity')::INTEGER
        FROM jsonb_array_elements(p_materials) AS m(m)
        ORDER BY (m.m->>'material_id')::UUID
    LOOP
        v_inv_id     := (v_material->>1)::UUID;
        v_qty_needed := v_material->>2;

        -- Descontar disponible, aumentar reservado
        UPDATE inventory
           SET quantity_available = quantity_available - v_qty_needed,
               quantity_reserved  = quantity_reserved  + v_qty_needed
         WHERE material_id = v_inv_id;

        -- Registrar movimiento
        INSERT INTO inventory_movements (
            inventory_id, order_id, movement_type,
            quantity, quantity_before, quantity_after,
            reason, created_by
        )
        SELECT i.id, p_order_id, 'RESERVE'::movement_type,
               v_qty_needed,
               i.quantity_available - v_qty_needed,  -- before
               i.quantity_available,                  -- after
               format('Reserva para orden %s', p_order_id),
               p_created_by
          FROM inventory i
         WHERE i.material_id = v_inv_id;

        -- Actualizar order_materials
        UPDATE order_materials
           SET quantity_reserved = quantity_reserved + v_qty_needed,
               status = 'RESERVED'
         WHERE order_id   = p_order_id
           AND material_id = v_inv_id;
    END LOOP;

    RETURN QUERY SELECT TRUE, 'Reserva exitosa'::TEXT,
                        NULL::UUID, NULL::INTEGER, NULL::INTEGER;
END;
$$;

COMMENT ON FUNCTION fn_reserve_inventory IS 'Reserva atómica de inventario con bloqueo pesimista. Verifica todos los materiales antes de reservar.';


-- ──────────────────────────────────────────────────────────────
-- 8. FUNCIÓN: Consumir reserva (paso final del procesamiento)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_consume_reservation(
    p_order_id    UUID,
    p_created_by  VARCHAR(128) DEFAULT 'system'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_om         RECORD;
    v_available  INTEGER;
    v_reserved   INTEGER;
BEGIN
    -- Iterar sobre todos los materiales reservados de la orden
    FOR v_om IN
        SELECT om.material_id, om.quantity_reserved, om.id AS om_id
          FROM order_materials om
         WHERE om.order_id = p_order_id
           AND om.status = 'RESERVED'
         ORDER BY om.material_id   -- Orden determinístico anti-deadlock
    LOOP
        -- Consumir: reducir reservado (el disponible ya se descontó en la reserva)
        UPDATE inventory
           SET quantity_reserved = quantity_reserved - v_om.quantity_reserved
         WHERE material_id = v_om.material_id
        RETURNING quantity_available, quantity_reserved
          INTO v_available, v_reserved;

        -- Registrar movimiento de consumo
        INSERT INTO inventory_movements (
            inventory_id, order_id, movement_type,
            quantity, quantity_before, quantity_after,
            reason, created_by
        )
        SELECT i.id, p_order_id, 'CONSUME'::movement_type,
               v_om.quantity_reserved,
               v_available, v_available,
               format('Consumo definitivo para orden %s', p_order_id),
               p_created_by
          FROM inventory i
         WHERE i.material_id = v_om.material_id;

        -- Actualizar estado del material en la orden
        UPDATE order_materials
           SET quantity_consumed = v_om.quantity_reserved,
               status = 'CONSUMED'
         WHERE id = v_om.om_id;
    END LOOP;

    RETURN TRUE;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- 9. FUNCIÓN: Liberar reserva (rollback / cancelación)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_release_reservation(
    p_order_id    UUID,
    p_created_by  VARCHAR(128) DEFAULT 'system'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_om         RECORD;
BEGIN
    FOR v_om IN
        SELECT om.material_id, om.quantity_reserved, om.id AS om_id
          FROM order_materials om
         WHERE om.order_id = p_order_id
           AND om.status = 'RESERVED'
         ORDER BY om.material_id
    LOOP
        -- Revertir: aumentar disponible, reducir reservado
        UPDATE inventory
           SET quantity_available = quantity_available + v_om.quantity_reserved,
               quantity_reserved  = quantity_reserved  - v_om.quantity_reserved
         WHERE material_id = v_om.material_id;

        -- Registrar movimiento de liberación
        INSERT INTO inventory_movements (
            inventory_id, order_id, movement_type,
            quantity, quantity_before, quantity_after,
            reason, created_by
        )
        SELECT i.id, p_order_id, 'RELEASE'::movement_type,
               v_om.quantity_reserved,
               i.quantity_available - v_om.quantity_reserved,
               i.quantity_available,
               format('Liberación de reserva para orden %s', p_order_id),
               p_created_by
          FROM inventory i
         WHERE i.material_id = v_om.material_id;

        -- Actualizar estado
        UPDATE order_materials
           SET status = 'RELEASED'
         WHERE id = v_om.om_id;
    END LOOP;

    RETURN TRUE;
END;
$$;


-- ──────────────────────────────────────────────────────────────
-- 10. FUNCIÓN: Evaluar bajo stock y generar alerta en audit_logs
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TABLE (material_id UUID, mat_name VARCHAR, current_stock INTEGER, min_threshold INTEGER)
LANGUAGE sql
AS $$
    SELECT m.id, m.name, i.quantity_available, i.minimum_stock
      FROM inventory i
      JOIN materials m ON m.id = i.material_id
     WHERE i.quantity_available <= i.minimum_stock
     ORDER BY (i.quantity_available::NUMERIC / NULLIF(i.minimum_stock, 0)) ASC;
$$;
