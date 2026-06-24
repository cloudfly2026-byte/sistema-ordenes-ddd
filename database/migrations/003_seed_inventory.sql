-- ============================================================
-- MIGRACIÓN 003: Seed de Inventario Inicial
-- ============================================================

-- Insertar materiales de empaque
INSERT INTO materials (code, name, description, unit) VALUES
    ('BOX_SMALL', 'Caja Pequeña', 'Caja de cartón pequeño para 1-2 productos', 'unit'),
    ('BOX_MEDIUM', 'Caja Mediana', 'Caja de cartón mediana para 3-5 productos', 'unit'),
    ('BOX_LARGE', 'Caja Grande', 'Caja de cartón grande para 6+ productos', 'unit'),
    ('LABEL', 'Etiqueta', 'Etiqueta de envío obligatoria', 'unit'),
    ('TAPE', 'Cinta', 'Cinta de embalaje obligatoria', 'unit'),
    ('FILLER', 'Material de Protección', 'Material de relleno para productos frágiles', 'unit')
ON CONFLICT (code) DO NOTHING;

-- Insertar inventario inicial
INSERT INTO inventory (material_id, quantity_available, quantity_reserved, minimum_stock)
SELECT id,
    CASE code
        WHEN 'BOX_SMALL' THEN 100
        WHEN 'BOX_MEDIUM' THEN 80
        WHEN 'BOX_LARGE' THEN 50
        WHEN 'LABEL' THEN 500
        WHEN 'TAPE' THEN 200
        WHEN 'FILLER' THEN 120
    END,
    0,
    CASE code
        WHEN 'BOX_SMALL' THEN 10
        WHEN 'BOX_MEDIUM' THEN 8
        WHEN 'BOX_LARGE' THEN 5
        WHEN 'LABEL' THEN 50
        WHEN 'TAPE' THEN 20
        WHEN 'FILLER' THEN 12
    END
FROM materials
WHERE code IN ('BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE', 'LABEL', 'TAPE', 'FILLER')
ON CONFLICT (material_id) DO NOTHING;
