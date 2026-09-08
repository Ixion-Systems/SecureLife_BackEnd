-- ==============================================================================
-- SECURELIFE - PROCEDIMIENTOS ALMACENADOS Y VISTAS PARA COTIZADOR ACTUARIAL
-- ==============================================================================

-- 1. VISTA: vw_catalogo_cotizador
CREATE OR REPLACE VIEW vw_catalogo_cotizador AS
SELECT 
    m.id AS marca_id,
    m.codigo AS marca_codigo,
    m.nombre AS marca_nombre,
    mo.id AS modelo_id,
    mo.codigo AS modelo_codigo,
    mo.nombre AS modelo_nombre,
    mo.segmento,
    v.anio,
    v.suma_asegurada,
    v.codigo_acara,
    v.updated_at AS precio_updated_at
FROM catalogo_marcas m
JOIN catalogo_modelos mo ON mo.marca_id = m.id AND mo.activo = true
JOIN catalogo_valuaciones v ON v.modelo_id = mo.id
WHERE m.activo = true;

-- 2. PROCEDIMIENTO ALMACENADO: sp_upsert_valuacion_vehiculo
-- Permite la sincronización masiva y atómica semanal (Zero-Downtime Expand-and-Contract)
DROP FUNCTION IF EXISTS sp_upsert_valuacion_vehiculo(text,text,text,text,integer,numeric,text,text);
CREATE OR REPLACE FUNCTION sp_upsert_valuacion_vehiculo(
    p_marca_codigo TEXT,
    p_marca_nombre TEXT,
    p_modelo_codigo TEXT,
    p_modelo_nombre TEXT,
    p_anio INT,
    p_suma_asegurada NUMERIC(14,2),
    p_segmento TEXT DEFAULT 'SEDAN',
    p_codigo_acara TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_marca_id UUID;
    v_modelo_id UUID;
BEGIN
    -- Upsert Marca
    INSERT INTO catalogo_marcas (id, codigo, nombre, activo)
    VALUES (gen_random_uuid(), LOWER(p_marca_codigo), p_marca_nombre, true)
    ON CONFLICT (codigo) DO UPDATE
    SET nombre = EXCLUDED.nombre, activo = true
    RETURNING id INTO v_marca_id;

    -- Upsert Modelo
    INSERT INTO catalogo_modelos (id, marca_id, codigo, nombre, segmento, activo)
    VALUES (gen_random_uuid(), v_marca_id, LOWER(p_modelo_codigo), p_modelo_nombre, p_segmento, true)
    ON CONFLICT (marca_id, codigo) DO UPDATE
    SET nombre = EXCLUDED.nombre, segmento = EXCLUDED.segmento, activo = true
    RETURNING id INTO v_modelo_id;

    -- Upsert Valuación
    INSERT INTO catalogo_valuaciones (id, modelo_id, anio, suma_asegurada, codigo_acara, updated_at)
    VALUES (gen_random_uuid(), v_modelo_id, p_anio, p_suma_asegurada, p_codigo_acara, NOW())
    ON CONFLICT (modelo_id, anio) DO UPDATE
    SET suma_asegurada = EXCLUDED.suma_asegurada,
        codigo_acara = COALESCE(EXCLUDED.codigo_acara, catalogo_valuaciones.codigo_acara),
        updated_at = NOW();

    RETURN true;
END;
$$;

-- 3. PROCEDIMIENTO ALMACENADO: sp_calcular_cotizacion_auto
-- Ejecuta la lógica matemática actuarial en el motor de base de datos
CREATE OR REPLACE FUNCTION sp_calcular_cotizacion_auto(
    p_marca_codigo TEXT,
    p_modelo_codigo TEXT,
    p_anio INT,
    p_codigo_postal TEXT DEFAULT '1001',
    p_plan_cobertura TEXT DEFAULT 'TODO_RIESGO',
    p_tiene_gnc BOOLEAN DEFAULT false,
    p_ajuste_km INT DEFAULT 15000
)
RETURNS TABLE (
    suma_asegurada NUMERIC(14,2),
    tasa_pura NUMERIC(6,4),
    factor_postal NUMERIC(4,2),
    premio_base_mensual NUMERIC(14,2),
    recargo_gnc_mensual NUMERIC(14,2),
    ajuste_km_mensual NUMERIC(14,2),
    impuestos_mensuales NUMERIC(14,2),
    prima_mensual_estimada NUMERIC(14,2),
    franquicia NUMERIC(14,2)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_suma NUMERIC(14,2);
    v_tasa NUMERIC(6,4);
    v_factor_postal NUMERIC(4,2) := 1.00;
    v_premio_anual_neto NUMERIC(14,2);
    v_premio_base_mensual NUMERIC(14,2);
    v_recargo_gnc_mensual NUMERIC(14,2) := 0.00;
    v_ajuste_km_mensual NUMERIC(14,2) := 0.00;
    v_impuestos_mensuales NUMERIC(14,2);
    v_prima_total_mensual NUMERIC(14,2);
    v_franquicia NUMERIC(14,2) := 0.00;
BEGIN
    -- 1. Buscar la suma asegurada oficial del vehículo en el catálogo
    SELECT v.suma_asegurada
    INTO v_suma
    FROM catalogo_valuaciones v
    JOIN catalogo_modelos mo ON v.modelo_id = mo.id
    JOIN catalogo_marcas m ON mo.marca_id = m.id
    WHERE m.codigo = LOWER(p_marca_codigo)
      AND mo.codigo = LOWER(p_modelo_codigo)
      AND v.anio = p_anio
    LIMIT 1;

    -- Si no está tasado exactamente, cálculo estimado base según antigüedad
    IF v_suma IS NULL THEN
        v_suma := GREATEST(5000000.00, 28000000.00 - ((EXTRACT(YEAR FROM NOW()) - p_anio) * 1200000.00));
    END IF;

    -- 2. Asignar tasa pura anual según plan
    CASE UPPER(p_plan_cobertura)
        WHEN 'RESPONSABILIDAD_CIVIL' THEN v_tasa := 0.0210;
        WHEN 'TERCEROS_BASICO'       THEN v_tasa := 0.0380;
        WHEN 'TERCEROS_COMPLETO'     THEN v_tasa := 0.0520;
        ELSE                              v_tasa := 0.0760; -- TODO_RIESGO
    END CASE;

    -- 3. Factor de riesgo postal
    SELECT trp.factor_robo INTO v_factor_postal
    FROM tasas_riesgo_postal trp
    WHERE trp.codigo_postal = p_codigo_postal
    LIMIT 1;

    IF v_factor_postal IS NULL THEN
        v_factor_postal := 1.00;
    END IF;

    -- 4. Cálculo de primas netas
    v_premio_anual_neto := v_suma * v_tasa * v_factor_postal;
    v_premio_base_mensual := ROUND(v_premio_anual_neto / 12.0, 2);

    IF p_tiene_gnc THEN
        v_recargo_gnc_mensual := ROUND((v_premio_anual_neto * 0.12) / 12.0, 2);
    END IF;

    IF p_ajuste_km > 20000 THEN
        v_ajuste_km_mensual := ROUND((v_premio_anual_neto * 0.06) / 12.0, 2);
    ELSIF p_ajuste_km < 10000 THEN
        v_ajuste_km_mensual := ROUND(-((v_premio_anual_neto * 0.04) / 12.0), 2);
    END IF;

    -- 5. Impuestos oficiales (21% IVA + 2.5% Tasas SSN)
    v_impuestos_mensuales := ROUND((v_premio_base_mensual + v_recargo_gnc_mensual + v_ajuste_km_mensual) * 0.235, 2);
    v_prima_total_mensual := v_premio_base_mensual + v_recargo_gnc_mensual + v_ajuste_km_mensual + v_impuestos_mensuales;

    -- Franquicia en Todo Riesgo
    IF UPPER(p_plan_cobertura) = 'TODO_RIESGO' THEN
        v_franquicia := ROUND(LEAST(180000.00, v_suma * 0.015), 2);
    END IF;

    RETURN QUERY
    SELECT 
        v_suma,
        v_tasa,
        v_factor_postal,
        v_premio_base_mensual,
        v_recargo_gnc_mensual,
        v_ajuste_km_mensual,
        v_impuestos_mensuales,
        v_prima_total_mensual,
        v_franquicia;
END;
$$;
