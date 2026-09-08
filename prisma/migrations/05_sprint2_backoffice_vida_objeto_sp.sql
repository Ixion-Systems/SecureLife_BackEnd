-- ==============================================================================
-- SECURELIFE - PROCEDIMIENTOS ALMACENADOS: SPRINT 2 (VIDA, OBJETOS, EMPLEADOS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SP: sp_calcular_cotizacion_vida
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_calcular_cotizacion_vida(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, NUMERIC);

CREATE OR REPLACE FUNCTION sp_calcular_cotizacion_vida(
    p_edad INT,
    p_genero TEXT DEFAULT 'OTRO',
    p_ocupacion TEXT DEFAULT 'EMPLEADO',
    p_riesgo_ocupacional TEXT DEFAULT 'BAJO',
    p_fumador BOOLEAN DEFAULT false,
    p_deportes_riesgo BOOLEAN DEFAULT false,
    p_enfermedades_preexistentes BOOLEAN DEFAULT false,
    p_capital_asegurado NUMERIC DEFAULT 10000000.00
)
RETURNS TABLE (
    capital_asegurado NUMERIC(14,2),
    tasa_base NUMERIC(6,4),
    factor_edad NUMERIC(4,2),
    recargo_fumador NUMERIC(14,2),
    recargo_deportes NUMERIC(14,2),
    recargo_enfermedades NUMERIC(14,2),
    recargo_ocupacional NUMERIC(14,2),
    prima_anual_pura NUMERIC(14,2),
    prima_mensual_estimada NUMERIC(14,2)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_capital NUMERIC(14,2) := GREATEST(COALESCE(p_capital_asegurado, 10000000.00), 1000000.00);
    v_tasa_base NUMERIC(6,4) := 0.0015;
    v_factor_edad NUMERIC(4,2) := 1.00;
    v_recargo_fumador_pct NUMERIC(4,2) := 0.00;
    v_recargo_deportes_pct NUMERIC(4,2) := 0.00;
    v_recargo_enfermedades_pct NUMERIC(4,2) := 0.00;
    v_recargo_ocupacional_pct NUMERIC(4,2) := 0.00;
    
    v_prima_anual_base NUMERIC(14,2);
    v_recargo_fumador_val NUMERIC(14,2);
    v_recargo_deportes_val NUMERIC(14,2);
    v_recargo_enfermedades_val NUMERIC(14,2);
    v_recargo_ocupacional_val NUMERIC(14,2);
    v_prima_anual NUMERIC(14,2);
    v_prima_mensual NUMERIC(14,2);
BEGIN
    -- Factor actuarial por rango etario
    IF p_edad < 30 THEN
        v_factor_edad := 0.85;
    ELSIF p_edad BETWEEN 30 AND 40 THEN
        v_factor_edad := 1.00;
    ELSIF p_edad BETWEEN 41 AND 50 THEN
        v_factor_edad := 1.35;
    ELSIF p_edad BETWEEN 51 AND 60 THEN
        v_factor_edad := 1.80;
    ELSE
        v_factor_edad := 2.50;
    END IF;

    -- Recargo tabaquismo (+30%)
    IF p_fumador THEN
        v_recargo_fumador_pct := 0.30;
    END IF;

    -- Recargo deportes de alto riesgo (+25%)
    IF p_deportes_riesgo THEN
        v_recargo_deportes_pct := 0.25;
    END IF;

    -- Recargo antecedentes patológicos (+40%)
    IF p_enfermedades_preexistentes THEN
        v_recargo_enfermedades_pct := 0.40;
    END IF;

    -- Factor de riesgo ocupacional
    IF UPPER(p_riesgo_ocupacional) = 'ALTO' THEN
        v_recargo_ocupacional_pct := 0.50;
    ELSIF UPPER(p_riesgo_ocupacional) = 'MEDIO' THEN
        v_recargo_ocupacional_pct := 0.20;
    ELSE
        v_recargo_ocupacional_pct := 0.00;
    END IF;

    -- Cálculos
    v_prima_anual_base := ROUND(v_capital * v_tasa_base * v_factor_edad, 2);
    v_recargo_fumador_val := ROUND(v_prima_anual_base * v_recargo_fumador_pct, 2);
    v_recargo_deportes_val := ROUND(v_prima_anual_base * v_recargo_deportes_pct, 2);
    v_recargo_enfermedades_val := ROUND(v_prima_anual_base * v_recargo_enfermedades_pct, 2);
    v_recargo_ocupacional_val := ROUND(v_prima_anual_base * v_recargo_ocupacional_pct, 2);

    v_prima_anual := v_prima_anual_base + v_recargo_fumador_val + v_recargo_deportes_val + v_recargo_enfermedades_val + v_recargo_ocupacional_val;
    v_prima_mensual := ROUND(v_prima_anual / 12.0, 2);

    RETURN QUERY SELECT
        v_capital,
        v_tasa_base,
        v_factor_edad,
        v_recargo_fumador_val,
        v_recargo_deportes_val,
        v_recargo_enfermedades_val,
        v_recargo_ocupacional_val,
        v_prima_anual,
        v_prima_mensual;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. SP: sp_crear_cotizacion_vida
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_crear_cotizacion_vida(UUID, INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, NUMERIC, JSONB, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION sp_crear_cotizacion_vida(
    p_user_id UUID,
    p_edad INT,
    p_genero TEXT,
    p_ocupacion TEXT,
    p_riesgo_ocupacional TEXT,
    p_fumador BOOLEAN,
    p_deportes_riesgo BOOLEAN,
    p_enfermedades_preexistentes BOOLEAN,
    p_capital_asegurado NUMERIC,
    p_beneficiarios JSONB DEFAULT '[]'::jsonb,
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
    capital_asegurado NUMERIC(14,2),
    prima_estimada NUMERIC(14,2),
    beneficiarios JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_cotizacion_id UUID := gen_random_uuid();
    v_new_vida_id UUID := gen_random_uuid();
    v_numero TEXT;
    v_count INT;
    v_prima NUMERIC(14,2);
    v_estado TEXT;
    v_datos_riesgo JSONB;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count FROM cotizaciones c WHERE c.ramo = 'VIDA';
    v_numero := 'COT-VIDA-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 5, '0');

    IF p_es_manual OR p_enfermedades_preexistentes OR (p_edad >= 65) THEN
        v_estado := 'EN_REVISION_EXTENSA';
    ELSE
        v_estado := 'PENDIENTE';
    END IF;

    -- Calcular prima actuarial
    SELECT c.prima_mensual_estimada INTO v_prima
    FROM sp_calcular_cotizacion_vida(
        p_edad,
        p_genero,
        p_ocupacion,
        p_riesgo_ocupacional,
        p_fumador,
        p_deportes_riesgo,
        p_enfermedades_preexistentes,
        p_capital_asegurado
    ) c;

    IF v_prima IS NULL THEN
        v_prima := 15000.00;
    END IF;

    -- Consolidar datos de riesgo en JSONB para auditoría y consulta global
    v_datos_riesgo := jsonb_build_object(
        'edad', p_edad,
        'genero', p_genero,
        'ocupacion', p_ocupacion,
        'riesgo_ocupacional', p_riesgo_ocupacional,
        'fumador', p_fumador,
        'deportes_riesgo', p_deportes_riesgo,
        'enfermedades_preexistentes', p_enfermedades_preexistentes,
        'capital_asegurado', p_capital_asegurado,
        'beneficiarios', p_beneficiarios
    );

    -- Insertar en tabla maestra cotizaciones
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
        created_at,
        updated_at
    ) VALUES (
        v_new_cotizacion_id,
        v_numero,
        p_user_id,
        'VIDA',
        v_estado,
        v_datos_riesgo,
        v_prima,
        p_capital_asegurado,
        p_tipo_revision,
        p_es_manual,
        NOW(),
        NOW()
    );

    -- Insertar en tabla detalle cotizaciones_vida
    INSERT INTO cotizaciones_vida (
        id,
        cotizacion_id,
        edad,
        genero,
        ocupacion,
        riesgo_ocupacional,
        fumador,
        deportes_riesgo,
        enfermedades_preexistentes,
        capital_asegurado,
        beneficiarios,
        created_at,
        updated_at
    ) VALUES (
        v_new_vida_id,
        v_new_cotizacion_id,
        p_edad,
        p_genero,
        p_ocupacion,
        p_riesgo_ocupacional,
        p_fumador,
        p_deportes_riesgo,
        p_enfermedades_preexistentes,
        p_capital_asegurado,
        p_beneficiarios,
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT
        v_new_cotizacion_id,
        v_numero,
        p_user_id,
        'VIDA'::TEXT,
        v_estado,
        p_tipo_revision,
        p_es_manual,
        p_capital_asegurado,
        v_prima,
        p_beneficiarios,
        NOW();
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. SP: sp_calcular_cotizacion_objeto
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_calcular_cotizacion_objeto(TEXT, NUMERIC, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION sp_calcular_cotizacion_objeto(
    p_tipo_objeto TEXT,
    p_valor_reposicion NUMERIC,
    p_cobertura_tipo TEXT DEFAULT 'TODO_RIESGO',
    p_franquicia NUMERIC DEFAULT 0.00
)
RETURNS TABLE (
    tipo_objeto TEXT,
    valor_reposicion NUMERIC(14,2),
    tasa_anual NUMERIC(6,4),
    cobertura_tipo TEXT,
    franquicia NUMERIC(14,2),
    descuento_franquicia NUMERIC(14,2),
    prima_anual NUMERIC(14,2),
    prima_mensual_estimada NUMERIC(14,2)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_valor NUMERIC(14,2) := GREATEST(COALESCE(p_valor_reposicion, 500000.00), 50000.00);
    v_tasa NUMERIC(6,4) := 0.0450;
    v_desc_franquicia_pct NUMERIC(4,2) := 0.00;
    v_desc_franquicia_val NUMERIC(14,2) := 0.00;
    v_prima_anual NUMERIC(14,2);
    v_prima_mensual NUMERIC(14,2);
BEGIN
    -- Asignación de tasa actuarial según tipo de equipo / bien
    IF UPPER(p_tipo_objeto) IN ('SMARTPHONE') THEN
        v_tasa := 0.0550;
    ELSIF UPPER(p_tipo_objeto) IN ('NOTEBOOK_LAPTOP', 'NOTEBOOK') THEN
        v_tasa := 0.0450;
    ELSIF UPPER(p_tipo_objeto) IN ('CAMARA_FOTOGRAFICA', 'CAMARA') THEN
        v_tasa := 0.0400;
    ELSIF UPPER(p_tipo_objeto) IN ('BICICLETA_MOVILIDAD', 'BICICLETA') THEN
        v_tasa := 0.0480;
    ELSE
        v_tasa := 0.0500;
    END IF;

    -- Descuento por asunción de franquicia
    IF p_franquicia > 0 THEN
        IF (p_franquicia / v_valor) >= 0.15 THEN
            v_desc_franquicia_pct := 0.20;
        ELSIF (p_franquicia / v_valor) >= 0.10 THEN
            v_desc_franquicia_pct := 0.12;
        ELSE
            v_desc_franquicia_pct := 0.05;
        END IF;
    END IF;

    v_desc_franquicia_val := ROUND((v_valor * v_tasa) * v_desc_franquicia_pct, 2);
    v_prima_anual := ROUND(v_valor * v_tasa - v_desc_franquicia_val, 2);
    v_prima_mensual := ROUND(v_prima_anual / 12.0, 2);

    RETURN QUERY SELECT
        p_tipo_objeto,
        v_valor,
        v_tasa,
        p_cobertura_tipo,
        COALESCE(p_franquicia, 0.00),
        v_desc_franquicia_val,
        v_prima_anual,
        v_prima_mensual;
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. SP: sp_crear_cotizacion_objeto
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_crear_cotizacion_objeto(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, JSONB, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION sp_crear_cotizacion_objeto(
    p_user_id UUID,
    p_tipo_objeto TEXT,
    p_marca TEXT,
    p_modelo TEXT,
    p_imei_serie TEXT,
    p_valor_reposicion NUMERIC,
    p_cobertura_tipo TEXT,
    p_franquicia NUMERIC DEFAULT 0.00,
    p_imagenes_urls JSONB DEFAULT '[]'::jsonb,
    p_factura_url TEXT DEFAULT NULL,
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
    valor_reposicion NUMERIC(14,2),
    prima_estimada NUMERIC(14,2),
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_cotizacion_id UUID := gen_random_uuid();
    v_new_objeto_id UUID := gen_random_uuid();
    v_numero TEXT;
    v_count INT;
    v_prima NUMERIC(14,2);
    v_estado TEXT;
    v_datos_riesgo JSONB;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count FROM cotizaciones c WHERE c.ramo = 'OBJETO_PERSONAL';
    v_numero := 'COT-OBJ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 5, '0');

    IF p_es_manual OR (p_valor_reposicion > 5000000.00) THEN
        v_estado := 'EN_REVISION_EXTENSA';
    ELSE
        v_estado := 'PENDIENTE';
    END IF;

    -- Invocar cálculo
    SELECT c.prima_mensual_estimada INTO v_prima
    FROM sp_calcular_cotizacion_objeto(
        p_tipo_objeto,
        p_valor_reposicion,
        p_cobertura_tipo,
        p_franquicia
    ) c;

    IF v_prima IS NULL THEN
        v_prima := 8000.00;
    END IF;

    v_datos_riesgo := jsonb_build_object(
        'tipo_objeto', p_tipo_objeto,
        'marca', p_marca,
        'modelo', p_modelo,
        'imei_serie', p_imei_serie,
        'valor_reposicion', p_valor_reposicion,
        'cobertura_tipo', p_cobertura_tipo,
        'franquicia', p_franquicia,
        'imagenes_urls', p_imagenes_urls,
        'factura_url', p_factura_url
    );

    -- Insertar en cotizaciones principal
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
        v_new_cotizacion_id,
        v_numero,
        p_user_id,
        'OBJETO_PERSONAL',
        v_estado,
        v_datos_riesgo,
        v_prima,
        p_valor_reposicion,
        p_tipo_revision,
        p_es_manual,
        p_imagenes_urls,
        NOW(),
        NOW()
    );

    -- Insertar en cotizaciones_objeto_personal
    INSERT INTO cotizaciones_objeto_personal (
        id,
        cotizacion_id,
        tipo_objeto,
        marca,
        modelo,
        imei_serie,
        valor_reposicion,
        cobertura_tipo,
        franquicia,
        imagenes_urls,
        factura_url,
        created_at,
        updated_at
    ) VALUES (
        v_new_objeto_id,
        v_new_cotizacion_id,
        p_tipo_objeto,
        p_marca,
        p_modelo,
        p_imei_serie,
        p_valor_reposicion,
        p_cobertura_tipo,
        p_franquicia,
        p_imagenes_urls,
        p_factura_url,
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT
        v_new_cotizacion_id,
        v_numero,
        p_user_id,
        'OBJETO_PERSONAL'::TEXT,
        v_estado,
        p_tipo_revision,
        p_es_manual,
        p_valor_reposicion,
        v_prima,
        NOW();
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. SP: sp_crear_empleado
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_crear_empleado(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION sp_crear_empleado(
    p_email TEXT,
    p_password_hash TEXT,
    p_nombre TEXT,
    p_rol TEXT DEFAULT 'COTIZACIONES'
)
RETURNS TABLE (
    empleado_id UUID,
    email TEXT,
    nombre TEXT,
    rol TEXT,
    activo BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID := gen_random_uuid();
    v_rol "RolEmpleado";
BEGIN
    IF EXISTS (SELECT 1 FROM empleados e WHERE LOWER(e.email) = LOWER(p_email)) THEN
        RAISE EXCEPTION 'El email % ya se encuentra registrado para otro empleado', p_email
            USING ERRCODE = '23505';
    END IF;

    v_rol := p_rol::"RolEmpleado";

    INSERT INTO empleados (
        id,
        email,
        password_hash,
        nombre,
        rol,
        activo,
        created_at,
        updated_at
    ) VALUES (
        v_id,
        LOWER(TRIM(p_email)),
        p_password_hash,
        TRIM(p_nombre),
        v_rol,
        true,
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT
        v_id,
        LOWER(TRIM(p_email)),
        TRIM(p_nombre),
        p_rol,
        true,
        NOW();
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. SP: sp_autenticar_empleado
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS sp_autenticar_empleado(TEXT);

CREATE OR REPLACE FUNCTION sp_autenticar_empleado(
    p_email TEXT
)
RETURNS TABLE (
    empleado_id UUID,
    email TEXT,
    password_hash TEXT,
    nombre TEXT,
    rol TEXT,
    activo BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.email::TEXT,
        e.password_hash::TEXT,
        e.nombre::TEXT,
        e.rol::TEXT,
        e.activo
    FROM empleados e
    WHERE LOWER(e.email) = LOWER(TRIM(p_email));
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. SEED: Administrador Inicial de Empleados BackOffice
-- ------------------------------------------------------------------------------
INSERT INTO empleados (
    id,
    email,
    password_hash,
    nombre,
    rol,
    activo,
    created_at,
    updated_at
)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'admin@securelife.com',
    '$2b$10$YmB5F0GxKbBBFT33bwPxIeKn4LczIwv13fLSjH1ppymRvIGGZvQD6', -- Hash de AdminSecure2026!
    'Administrador General SecureLife',
    'ADMIN'::"RolEmpleado",
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    activo = true,
    updated_at = NOW();
