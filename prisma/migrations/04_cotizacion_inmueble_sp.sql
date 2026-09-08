-- ==============================================================================
-- SECURELIFE - PROCEDIMIENTOS ALMACENADOS PARA COTIZACIÓN DE HOGAR E INMUEBLES
-- ==============================================================================

-- 1. PROCEDIMIENTO ALMACENADO: sp_calcular_cotizacion_inmueble
-- Realiza el cálculo matemático actuarial para propiedades, desglosando coberturas
DROP FUNCTION IF EXISTS sp_calcular_cotizacion_inmueble(
    TEXT, NUMERIC, TEXT, TEXT, BOOLEAN, BOOLEAN, NUMERIC, NUMERIC, NUMERIC, NUMERIC
);

CREATE OR REPLACE FUNCTION sp_calcular_cotizacion_inmueble(
    p_tipo_inmueble TEXT,
    p_superficie_m2 NUMERIC,
    p_codigo_postal TEXT DEFAULT '1001',
    p_tipo_techo TEXT DEFAULT 'LOSA', -- 'LOSA', 'CHAPA', 'TEJA'
    p_tiene_alarma BOOLEAN DEFAULT false,
    p_tiene_rejas BOOLEAN DEFAULT false,
    p_suma_edificio NUMERIC DEFAULT NULL,
    p_suma_contenido NUMERIC DEFAULT NULL,
    p_suma_electrodomesticos NUMERIC DEFAULT 0.00,
    p_rc_linderos NUMERIC DEFAULT 0.00
)
RETURNS TABLE (
    suma_edificio NUMERIC(14,2),
    suma_contenido NUMERIC(14,2),
    suma_electrodomesticos NUMERIC(14,2),
    rc_linderos NUMERIC(14,2),
    suma_asegurada_total NUMERIC(14,2),
    prima_edificio_mensual NUMERIC(14,2),
    prima_contenido_mensual NUMERIC(14,2),
    prima_electro_mensual NUMERIC(14,2),
    prima_rc_mensual NUMERIC(14,2),
    descuento_seguridad_mensual NUMERIC(14,2),
    recargo_techo_mensual NUMERIC(14,2),
    premio_base_mensual NUMERIC(14,2),
    impuestos_mensuales NUMERIC(14,2),
    prima_mensual_estimada NUMERIC(14,2)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_superficie NUMERIC;
    v_suma_edificio NUMERIC(14,2);
    v_suma_contenido NUMERIC(14,2);
    v_suma_electro NUMERIC(14,2);
    v_rc_linderos NUMERIC(14,2);
    v_suma_total NUMERIC(14,2);

    -- Factores postales
    v_factor_clima NUMERIC(4,2) := 1.00;
    v_factor_robo NUMERIC(4,2) := 1.00;

    -- Tasas puras anuales
    c_tasa_edificio CONSTANT NUMERIC(6,4) := 0.0018;
    c_tasa_contenido CONSTANT NUMERIC(6,4) := 0.0035;
    c_tasa_electro CONSTANT NUMERIC(6,4) := 0.0120;
    c_tasa_rc CONSTANT NUMERIC(6,4) := 0.0012;

    -- Primas anuales intermedias
    v_prima_edificio_base_anual NUMERIC(14,2);
    v_recargo_techo_pct NUMERIC(4,2) := 0.00;
    v_recargo_techo_anual NUMERIC(14,2) := 0.00;
    v_prima_edificio_anual NUMERIC(14,2);

    v_prima_contenido_base_anual NUMERIC(14,2);
    v_prima_electro_base_anual NUMERIC(14,2);
    v_desc_seguridad_pct NUMERIC(4,2) := 0.00;
    v_descuento_seguridad_anual NUMERIC(14,2) := 0.00;
    v_prima_contenido_anual NUMERIC(14,2);
    v_prima_electro_anual NUMERIC(14,2);

    v_prima_rc_anual NUMERIC(14,2);

    -- Primas mensuales
    v_prima_edificio_mensual NUMERIC(14,2);
    v_prima_contenido_mensual NUMERIC(14,2);
    v_prima_electro_mensual NUMERIC(14,2);
    v_prima_rc_mensual NUMERIC(14,2);
    v_descuento_seguridad_mensual NUMERIC(14,2);
    v_recargo_techo_mensual NUMERIC(14,2);

    v_premio_base_mensual NUMERIC(14,2);
    v_impuestos_mensuales NUMERIC(14,2);
    v_prima_mensual_total NUMERIC(14,2);
BEGIN
    v_superficie := GREATEST(10.00, COALESCE(p_superficie_m2, 50.00));

    -- 1. Determinación de suma edificio (costo de reposición base $950.000 ARS/m2 si no se provee o es 0)
    IF p_suma_edificio IS NULL OR p_suma_edificio <= 0 THEN
        v_suma_edificio := ROUND(v_superficie * 950000.00, 2);
    ELSE
        v_suma_edificio := ROUND(p_suma_edificio, 2);
    END IF;

    -- 2. Determinación de contenido (20% edificio por defecto si no se indica)
    IF p_suma_contenido IS NULL OR p_suma_contenido <= 0 THEN
        v_suma_contenido := ROUND(v_suma_edificio * 0.20, 2);
    ELSE
        v_suma_contenido := ROUND(p_suma_contenido, 2);
    END IF;

    v_suma_electro := ROUND(COALESCE(p_suma_electrodomesticos, 0.00), 2);
    v_rc_linderos := ROUND(COALESCE(p_rc_linderos, 0.00), 2);
    v_suma_total := v_suma_edificio + v_suma_contenido + v_suma_electro + v_rc_linderos;

    -- 3. Factor de riesgo postal (si existe en el catálogo)
    SELECT trp.factor_robo, trp.factor_clima
    INTO v_factor_robo, v_factor_clima
    FROM tasas_riesgo_postal trp
    WHERE trp.codigo_postal = p_codigo_postal
    LIMIT 1;

    IF v_factor_robo IS NULL THEN v_factor_robo := 1.00; END IF;
    IF v_factor_clima IS NULL THEN v_factor_clima := 1.00; END IF;

    -- 4. Cálculo de prima de Edificio con recargo por tipo de techo
    v_prima_edificio_base_anual := v_suma_edificio * c_tasa_edificio;

    IF UPPER(COALESCE(p_tipo_techo, 'LOSA')) IN ('CHAPA', 'TEJA') THEN
        v_recargo_techo_pct := 0.08; -- +8% por granizo/temporal
    ELSE
        v_recargo_techo_pct := 0.00;
    END IF;

    v_recargo_techo_anual := v_prima_edificio_base_anual * v_recargo_techo_pct;
    v_prima_edificio_anual := (v_prima_edificio_base_anual + v_recargo_techo_anual) * v_factor_clima;

    -- 5. Cálculo de prima de Contenido y Electrodomésticos con descuento por seguridad
    IF p_tiene_alarma THEN
        v_desc_seguridad_pct := v_desc_seguridad_pct + 0.10; -- -10% alarma monitoreada
    END IF;

    IF p_tiene_rejas THEN
        v_desc_seguridad_pct := v_desc_seguridad_pct + 0.05; -- -5% rejas
    END IF;

    v_desc_seguridad_pct := LEAST(0.15, v_desc_seguridad_pct); -- Máximo 15% acumulable

    v_prima_contenido_base_anual := v_suma_contenido * c_tasa_contenido;
    v_prima_electro_base_anual := v_suma_electro * c_tasa_electro;

    v_descuento_seguridad_anual := (v_prima_contenido_base_anual + v_prima_electro_base_anual) * v_desc_seguridad_pct;

    v_prima_contenido_anual := (v_prima_contenido_base_anual - (v_prima_contenido_base_anual * v_desc_seguridad_pct)) * v_factor_robo;
    v_prima_electro_anual := (v_prima_electro_base_anual - (v_prima_electro_base_anual * v_desc_seguridad_pct)) * v_factor_robo;

    -- 6. Responsabilidad Civil Linderos
    v_prima_rc_anual := v_rc_linderos * c_tasa_rc;

    -- 7. Desglose Mensual
    v_prima_edificio_mensual := ROUND(v_prima_edificio_anual / 12.0, 2);
    v_prima_contenido_mensual := ROUND(v_prima_contenido_anual / 12.0, 2);
    v_prima_electro_mensual := ROUND(v_prima_electro_anual / 12.0, 2);
    v_prima_rc_mensual := ROUND(v_prima_rc_anual / 12.0, 2);
    v_descuento_seguridad_mensual := ROUND(v_descuento_seguridad_anual / 12.0, 2);
    v_recargo_techo_mensual := ROUND(v_recargo_techo_anual / 12.0, 2);

    v_premio_base_mensual := v_prima_edificio_mensual + v_prima_contenido_mensual + v_prima_electro_mensual + v_prima_rc_mensual;

    -- 8. Impuestos Oficiales (21% IVA + 2.5% Tasas SSN = 23.5%)
    v_impuestos_mensuales := ROUND(v_premio_base_mensual * 0.235, 2);
    v_prima_mensual_total := v_premio_base_mensual + v_impuestos_mensuales;

    RETURN QUERY
    SELECT 
        v_suma_edificio,
        v_suma_contenido,
        v_suma_electro,
        v_rc_linderos,
        v_suma_total,
        v_prima_edificio_mensual,
        v_prima_contenido_mensual,
        v_prima_electro_mensual,
        v_prima_rc_mensual,
        v_descuento_seguridad_mensual,
        v_recargo_techo_mensual,
        v_premio_base_mensual,
        v_impuestos_mensuales,
        v_prima_mensual_total;
END;
$$;


-- 2. PROCEDIMIENTO ALMACENADO: sp_crear_cotizacion_inmueble
-- Registra atómicamente la cotización de hogar con su desglose y correlativo COT-HOGAR-YYYY-XXXXX
DROP FUNCTION IF EXISTS sp_crear_cotizacion_inmueble(
    UUID, TEXT, NUMERIC, TEXT, TEXT, BOOLEAN, BOOLEAN, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB, TEXT, BOOLEAN
);

CREATE OR REPLACE FUNCTION sp_crear_cotizacion_inmueble(
    p_user_id UUID,
    p_tipo_inmueble TEXT,
    p_superficie_m2 NUMERIC,
    p_codigo_postal TEXT DEFAULT '1001',
    p_tipo_techo TEXT DEFAULT 'LOSA',
    p_tiene_alarma BOOLEAN DEFAULT false,
    p_tiene_rejas BOOLEAN DEFAULT false,
    p_suma_edificio NUMERIC DEFAULT NULL,
    p_suma_contenido NUMERIC DEFAULT NULL,
    p_suma_electrodomesticos NUMERIC DEFAULT 0.00,
    p_rc_linderos NUMERIC DEFAULT 0.00,
    p_datos_riesgo JSONB DEFAULT '{}'::jsonb,
    p_documentos_adjuntos JSONB DEFAULT '[]'::jsonb,
    p_tipo_revision TEXT DEFAULT 'REVISION_ESTANDAR',
    p_es_manual BOOLEAN DEFAULT false
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
    datos_riesgo JSONB,
    documentos_adjuntos JSONB,
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
    v_datos_riesgo_completo JSONB;
BEGIN
    -- 1. Generar número correlativo: COT-HOGAR-YYYY-XXXXX
    SELECT COUNT(*) + 1 INTO v_count FROM cotizaciones;
    v_numero := 'COT-HOGAR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 5, '0');

    -- 2. Determinar estado y cálculo actuarial
    IF p_es_manual THEN
        v_estado := 'EN_REVISION_EXTENSA';
        v_suma := COALESCE(p_suma_edificio, 0.00) + COALESCE(p_suma_contenido, 0.00) + COALESCE(p_suma_electrodomesticos, 0.00);
        v_prima := 0.00; -- Pendiente de peritaje
    ELSE
        v_estado := 'PENDIENTE';
        SELECT c.suma_asegurada_total, c.prima_mensual_estimada
        INTO v_suma, v_prima
        FROM sp_calcular_cotizacion_inmueble(
            p_tipo_inmueble,
            p_superficie_m2,
            p_codigo_postal,
            p_tipo_techo,
            p_tiene_alarma,
            p_tiene_rejas,
            p_suma_edificio,
            p_suma_contenido,
            p_suma_electrodomesticos,
            p_rc_linderos
        ) c;

        IF v_suma IS NULL THEN
            v_suma := COALESCE(p_superficie_m2, 50.00) * 950000.00;
            v_prima := 50000.00;
        END IF;
    END IF;

    -- 3. Consolidar datos de riesgo estructurados
    v_datos_riesgo_completo := jsonb_build_object(
        'tipoInmueble', p_tipo_inmueble,
        'superficieM2', p_superficie_m2,
        'codigoPostal', p_codigo_postal,
        'tipoTecho', p_tipo_techo,
        'tieneAlarma', p_tiene_alarma,
        'tieneRejas', p_tiene_rejas,
        'sumaEdificio', COALESCE(p_suma_edificio, ROUND(COALESCE(p_superficie_m2, 50.00) * 950000.00, 2)),
        'sumaContenido', p_suma_contenido,
        'sumaElectrodomesticos', p_suma_electrodomesticos,
        'rcLinderos', p_rc_linderos
    ) || COALESCE(p_datos_riesgo, '{}'::jsonb);

    -- 4. Inserción atómica en cotizaciones
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
        'HOGAR_INMUEBLE'::"RamoSeguro",
        v_estado,
        v_datos_riesgo_completo,
        v_prima,
        v_suma,
        p_tipo_revision,
        p_es_manual,
        COALESCE(p_documentos_adjuntos, '[]'::jsonb),
        NOW(),
        NOW()
    );

    RETURN QUERY
    SELECT 
        v_new_id,
        v_numero,
        p_user_id,
        'HOGAR_INMUEBLE'::TEXT,
        v_estado,
        p_tipo_revision,
        p_es_manual,
        v_suma,
        v_prima,
        v_datos_riesgo_completo,
        COALESCE(p_documentos_adjuntos, '[]'::jsonb),
        NOW();
END;
$$;
