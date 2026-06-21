-- ============================================================
-- MIGRACIÓN 001: Esquema Inicial
-- Fecha: 2024-01-20
-- Autor: OWL - Senior Database Architect
-- Descripción: Creación de tablas, tipos ENUM, constraints
--               y triggers básicos.
-- ============================================================

-- ── TIPOS ENUMERADOS ──────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE box_type AS ENUM (
        'BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE material_code AS ENUM (
        'BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE', 'LABEL', 'TAPE', 'FILLER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM (
        'RESERVE', 'CONSUME', 'RELEASE', 'ADJUSTMENT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE webhook_status AS ENUM (
        'PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_material_status AS ENUM (
        'PENDING', 'RESERVED', 'CONSUMED', 'RELEASED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ── TABLA: orders ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
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


-- ── TABLA: order_items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
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


-- ── TABLA: materials ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code          material_code NOT NULL UNIQUE,
    name          VARCHAR(256)  NOT NULL,
    description   TEXT,
    unit          VARCHAR(32)   NOT NULL DEFAULT 'unit',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE materials IS 'Catálogo de materiales de empaque (cajas, etiquetas, cinta, relleno)';


-- ── TABLA: inventory ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
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


-- ── TABLA: inventory_movements ────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_movements (
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


-- ── TABLA: webhook_events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
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


-- ── TABLA: order_materials ────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_materials (
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


-- ── TABLA: job_executions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_executions (
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


-- ── TABLA: audit_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
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
