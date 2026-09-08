-- ==============================================================================
-- SECURELIFE - PROCEDIMIENTOS ALMACENADOS PARA COTIZACIÓN AUTOMOTOR Y PERITAJE
-- ==============================================================================

-- 1. PROCEDIMIENTO ALMACENADO: sp_crear_cotizacion_automotor
DROP FUNCTION IF EXISTS sp_crear_cotizacion_automotor(UUID, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, BOOLEAN, INT, NUMERIC, JSONB, JSONB);
CREATE OR REPLACE FUNCTION sp_crear_cotizacion_automotor(
    p_user_id UUID,
    p_es_manual BOOLEAN,
    p_tipo_revision TEXT, -- 'REVISION_ESTANDAR' o 'REVISION_EXTENSA'
    p_marca_codigo TEXT,
    p_marca_nombre TEXT,
    p_modelo_codigo TEXT,
    p_modelo_nombre TEXT,
    p_anio INT,
    p_patente TEXT,
    p_codigo_postal TEXT DEFAULT '1001',
    p_plan_cobertura TEXT DEFAULT 'TODO_RIESGO',
    p_tiene_gnc BOOLEAN DEFAULT false,
    p_kilometraje_anual INT DEFAULT 15000,
    p_valor_declarado NUMERIC(14,2) DEFAULT NULL,
    p_datos_riesgo JSONB DEFAULT '{}'::jsonb,
    p_documentos_adjuntos JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
    cotizacion_id UUID,
    numero_cotizacion TEXT,
    user_id UUID,
    ramo TEXT,
    estado TEXT,
    tipo_revision TEXT,
    es_manual BOOLEAN,
    suma_asegurada NUMERIC(14,2),
    prima_estimada NUMERIC(14,2),
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id UUID := gen_random_uuid();
    v_numero TEXT;
    v_suma NUMERIC(14,2);
    v_prima NUMERIC(14,2);
    v_count INT;
    v_estado TEXT;
BEGIN
    -- Generar número correlativo legible: COT-AUTO-2026-XXXXX
    SELECT COUNT(*) + 1 INTO v_count FROM cotizaciones;
    v_numero := 'COT-AUTO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 5, '0');

    -- Determinar suma asegurada y prima estimada según si es catálogo o manual
    IF p_es_manual THEN
        v_estado := 'EN_REVISION_EXTENSA';
        v_suma := COALESCE(p_valor_declarado, 0.00);
        v_prima := 0.00; -- Pendiente de peritaje y tasación oficial
    ELSE
        v_estado := 'PENDIENTE';
        -- Calcular prima preliminar invocando el Stored Procedure actuarial
        SELECT c.suma_asegurada, c.prima_mensual_estimada
        INTO v_suma, v_prima
        FROM sp_calcular_cotizacion_auto(
            p_marca_codigo,
            p_modelo_codigo,
            p_anio,
            p_codigo_postal,
            p_plan_cobertura,
            p_tiene_gnc,
            p_kilometraje_anual
        ) c;

        IF v_suma IS NULL THEN
            v_suma := COALESCE(p_valor_declarado, 20000000.00);
            v_prima := 150000.00;
        END IF;
    END IF;

    -- Insertar la cotización atómicamente
    INSERT INTO cotizaciones (
        id,
        numero_cotizacion,
        user_id,
        ramo,
        estado,
        datos_riesgo,
        prima_estimada,
        suma_asegurada,
        tipo_revision,
        es_manual,
        documentos_adjuntos,
        created_at,
        updated_at
    ) VALUES (
        v_new_id,
        v_numero,
        p_user_id,
        'AUTOMOTOR',
        v_estado,
        p_datos_riesgo,
        v_prima,
        v_suma,
        p_tipo_revision,
        p_es_manual,
        p_documentos_adjuntos,
        NOW(),
        NOW()
    );

    RETURN QUERY
    SELECT 
        v_new_id,
        v_numero,
        p_user_id,
        'AUTOMOTOR'::TEXT,
        v_estado,
        p_tipo_revision,
        p_es_manual,
        v_suma,
        v_prima,
        NOW();
END;
$$;

-- 2. PROCEDIMIENTO ALMACENADO: sp_responder_cotizacion_peritaje
-- Utilizado por el panel de empleados/analistas para responder cotizaciones
DROP FUNCTION IF EXISTS sp_responder_cotizacion_peritaje(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION sp_responder_cotizacion_peritaje(
    p_cotizacion_id UUID,
    p_perito_id UUID,
    p_nuevo_estado TEXT, -- 'COTIZADA', 'APROBADA', 'RECHAZADA'
    p_prima_tasada NUMERIC(14,2),
    p_suma_tasada NUMERIC(14,2),
    p_observaciones TEXT
)
RETURNS TABLE (
    cotizacion_id UUID,
    numero_cotizacion TEXT,
    estado TEXT,
    prima_estimada NUMERIC(14,2),
    suma_asegurada NUMERIC(14,2),
    fecha_respuesta TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE cotizaciones
    SET estado = p_nuevo_estado,
        prima_estimada = p_prima_tasada,
        suma_asegurada = p_suma_tasada,
        observaciones_perito = p_observaciones,
        perito_asignado_id = p_perito_id,
        fecha_respuesta = NOW(),
        updated_at = NOW()
    WHERE id = p_cotizacion_id;

    RETURN QUERY
    SELECT 
        c.id,
        c.numero_cotizacion,
        c.estado,
        c.prima_estimada,
        c.suma_asegurada,
        c.fecha_respuesta
    FROM cotizaciones c
    WHERE c.id = p_cotizacion_id;
END;
$$;
