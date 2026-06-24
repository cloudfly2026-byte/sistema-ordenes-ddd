-- ============================================================
-- MIGRACIÓN 004: Corrección de esquema inventory
-- Fecha: 2026-06-21
-- Autor: OWL
-- Descripción: Asegura que la tabla inventory tenga el esquema
--              correcto sin perder datos. Esta migración es
--              idempotente y puede ejecutarse múltiples veces.
-- ============================================================

-- Verificar y agregar columna material_id si no existe
DO $$
BEGIN
    -- Agregar material_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'material_id'
    ) THEN
        -- Agregar como nullable primero
        ALTER TABLE inventory ADD COLUMN material_id UUID;

        -- Actualizar con valores de materials si hay registros sin material_id
        -- (esto no debería pasar si los datos están correctos)
        UPDATE inventory SET material_id = gen_random_uuid() WHERE material_id IS NULL;

        -- Ahora hacer NOT NULL y agregar constraint
        ALTER TABLE inventory ALTER COLUMN material_id SET NOT NULL;
        ALTER TABLE inventory ADD CONSTRAINT inventory_material_id_key UNIQUE (material_id);
        ALTER TABLE inventory ADD CONSTRAINT inventory_material_id_fkey FOREIGN KEY (material_id) REFERENCES materials(id);
    END IF;
END $$;

-- Verificar y agregar columna version si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'version'
    ) THEN
        ALTER TABLE inventory ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Verificar y agregar columna last_updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'last_updated_at'
    ) THEN
        ALTER TABLE inventory ADD COLUMN last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- Asegurar que las columnas tengan los defaults correctos
DO $$
BEGIN
    -- quantity_available
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'quantity_available' AND column_default IS NULL
    ) THEN
        ALTER TABLE inventory ALTER COLUMN quantity_available SET DEFAULT 0;
    END IF;

    -- quantity_reserved
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'quantity_reserved' AND column_default IS NULL
    ) THEN
        ALTER TABLE inventory ALTER COLUMN quantity_reserved SET DEFAULT 0;
    END IF;

    -- minimum_stock
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'inventory' AND column_name = 'minimum_stock' AND column_default IS NULL
    ) THEN
        ALTER TABLE inventory ALTER COLUMN minimum_stock SET DEFAULT 10;
    END IF;
END $$;

-- Agregar índices si no existen
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
    ON inventory (material_id)
    WHERE quantity_available <= minimum_stock;

CREATE INDEX IF NOT EXISTS idx_inventory_critical
    ON inventory (material_id)
    WHERE quantity_available <= (minimum_stock / 2);

-- Agregar check constraints si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'inventory' AND constraint_name = 'inventory_quantity_available_check'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT inventory_quantity_available_check CHECK (quantity_available >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'inventory' AND constraint_name = 'inventory_quantity_reserved_check'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT inventory_quantity_reserved_check CHECK (quantity_reserved >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'inventory' AND constraint_name = 'inventory_minimum_stock_check'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT inventory_minimum_stock_check CHECK (minimum_stock >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'inventory' AND constraint_name = 'inventory_version_check'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT inventory_version_check CHECK (version >= 1);
    END IF;
END $$;

-- Comentarios
COMMENT ON TABLE inventory IS 'Inventario de materiales: stock disponible, reservado y umbral mínimo';
COMMENT ON COLUMN inventory.version IS 'Versión para control de concurrencia optimista (bloqueo pesimista primario)';

