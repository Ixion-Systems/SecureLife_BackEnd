-- ==============================================================================
-- SecureLife Insurtech - High Performance Views & Stored Procedures
-- Designed for High Concurrency (Thousands of concurrent users)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. VIEW: vw_client_dashboard_summary
-- Pre-aggregates metrics per user avoiding heavy multiple table scans on the app.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_client_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    COALESCE(p.active_policies_count, 0) AS active_policies_count,
    COALESCE(p.total_monthly_premium, 0.00) AS next_due_amount,
    p.earliest_expiration AS next_due_date,
    COALESCE(s.active_claims_count, 0) AS active_claims_count,
    CASE 
        WHEN COALESCE(p.active_policies_count, 0) = 0 THEN 0
        WHEN p.active_policies_count = 1 THEN 65
        WHEN p.active_policies_count = 2 THEN 85
        ELSE 100
    END AS protection_score
FROM users u
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(id) AS active_policies_count,
        SUM(premio_mensual) AS total_monthly_premium,
        MIN(vigencia_hasta) AS earliest_expiration
    FROM polizas
    WHERE estado = 'ACTIVA' 
      AND deleted_at IS NULL 
      AND vigencia_hasta >= NOW()
    GROUP BY cliente_id
) p ON u.id = p.cliente_id
LEFT JOIN (
    SELECT 
        pol.cliente_id,
        COUNT(sin.id) AS active_claims_count
    FROM siniestros sin
    JOIN polizas pol ON sin.poliza_id = pol.id
    WHERE sin.estado NOT IN ('FINALIZADO', 'RECHAZADO')
    GROUP BY pol.cliente_id
) s ON u.id = s.cliente_id
WHERE u.deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 2. VIEW: vw_active_policies_detailed
-- Joins policy data with vehicle, property, life and tech objects in 1 optimized read.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_active_policies_detailed AS
SELECT 
    pol.id AS policy_id,
    pol.numero_poliza,
    pol.cliente_id,
    pol.ramo,
    pol.plan_nombre,
    pol.prima_anual,
    pol.premio_mensual,
    pol.vigencia_desde,
    pol.vigencia_hasta,
    pol.estado,
    pol.created_at,
    -- Datos de automotor
    va.patente AS vehiculo_patente,
    va.marca AS vehiculo_marca,
    va.modelo AS vehiculo_modelo,
    va.anio AS vehiculo_anio,
    va.tiene_gnc AS vehiculo_tiene_gnc,
    -- Datos de inmueble
    ia.calle AS inmueble_calle,
    ia.numero AS inmueble_numero,
    ia.ciudad AS inmueble_ciudad,
    ia.provincia AS inmueble_provincia,
    ia.tipo_inmueble AS inmueble_tipo
FROM polizas pol
LEFT JOIN vehiculos_asegurados va ON pol.id = va.poliza_id
LEFT JOIN inmuebles_asegurados ia ON pol.id = ia.poliza_id
WHERE pol.deleted_at IS NULL;

-- ------------------------------------------------------------------------------
-- 3. VIEW: vw_client_activity_feed
-- Unified chronologically ordered events for user timeline.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_client_activity_feed AS
SELECT 
    pol.cliente_id AS user_id,
    pol.id AS activity_id,
    'Nueva Póliza Emitida: ' || pol.plan_nombre AS title,
    'Póliza N° ' || pol.numero_poliza || ' contratada exitosamente. Cobertura ' || pol.ramo::text AS description,
    'policy' AS activity_type,
    pol.estado AS status,
    pol.created_at AS created_at
FROM polizas pol
WHERE pol.deleted_at IS NULL

UNION ALL

SELECT 
    pol.cliente_id AS user_id,
    sin.id AS activity_id,
    'Siniestro Denunciado: ' || sin.tipo_siniestro AS title,
    'Expediente N° ' || sin.numero_siniestro || ' en revisión técnica. Estado: ' || sin.estado AS description,
    'claim' AS activity_type,
    sin.estado AS status,
    sin.fecha_denuncia AS created_at
FROM siniestros sin
JOIN polizas pol ON sin.poliza_id = pol.id

UNION ALL

SELECT 
    pol.cliente_id AS user_id,
    ast.id AS activity_id,
    'Auxilio y Asistencia 24/7: ' || ast.tipo_asistencia AS title,
    'Móvil solicitado. Estado actual: ' || ast.estado || COALESCE('. ETA: ' || ast.eta_minutos || ' min', '') AS description,
    'assistance' AS activity_type,
    ast.estado AS status,
    ast.created_at AS created_at
FROM asistencias_auxilio ast
JOIN polizas pol ON ast.poliza_id = pol.id

UNION ALL

SELECT 
    cot.user_id AS user_id,
    cot.id AS activity_id,
    'Cotización Guardada: ' || cot.ramo::text AS title,
    'Cotización N° ' || cot.numero_cotizacion || ' estimada en $' || cot.prima_estimada AS description,
    'quote' AS activity_type,
    cot.estado AS status,
    cot.created_at AS created_at
FROM cotizaciones cot
WHERE cot.user_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. FUNCTION: sp_get_client_dashboard(UUID)
-- High performance function to fetch dashboard summary
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_client_dashboard(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    active_policies_count BIGINT,
    next_due_amount NUMERIC(14, 2),
    next_due_date TIMESTAMPTZ,
    active_claims_count BIGINT,
    protection_score INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        v.user_id,
        v.email::TEXT,
        v.active_policies_count,
        v.next_due_amount,
        v.next_due_date,
        v.active_claims_count,
        v.protection_score
    FROM vw_client_dashboard_summary v
    WHERE v.user_id = p_user_id;
$$;

-- ------------------------------------------------------------------------------
-- 5. FUNCTION: sp_get_client_policies(UUID)
-- Returns all active and recent policies for a specific client
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_client_policies(p_user_id UUID)
RETURNS TABLE (
    policy_id UUID,
    numero_poliza TEXT,
    cliente_id UUID,
    ramo TEXT,
    plan_nombre TEXT,
    prima_anual NUMERIC(14, 2),
    premio_mensual NUMERIC(14, 2),
    vigencia_desde TIMESTAMPTZ,
    vigencia_hasta TIMESTAMPTZ,
    estado TEXT,
    created_at TIMESTAMPTZ,
    vehiculo_patente TEXT,
    vehiculo_marca TEXT,
    vehiculo_modelo TEXT,
    vehiculo_anio INT,
    vehiculo_tiene_gnc BOOLEAN,
    inmueble_calle TEXT,
    inmueble_numero TEXT,
    inmueble_ciudad TEXT,
    inmueble_provincia TEXT,
    inmueble_tipo TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        v.policy_id,
        v.numero_poliza,
        v.cliente_id,
        v.ramo::TEXT,
        v.plan_nombre,
        v.prima_anual,
        v.premio_mensual,
        v.vigencia_desde,
        v.vigencia_hasta,
        v.estado,
        v.created_at,
        v.vehiculo_patente,
        v.vehiculo_marca,
        v.vehiculo_modelo,
        v.vehiculo_anio,
        v.vehiculo_tiene_gnc,
        v.inmueble_calle,
        v.inmueble_numero,
        v.inmueble_ciudad,
        v.inmueble_provincia,
        v.inmueble_tipo::TEXT
    FROM vw_active_policies_detailed v
    WHERE v.cliente_id = p_user_id
    ORDER BY v.vigencia_hasta DESC;
$$;

-- ------------------------------------------------------------------------------
-- 6. FUNCTION: sp_get_client_activity(UUID, INT)
-- Fetches recent timeline events for a user
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_client_activity(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    activity_id UUID,
    title TEXT,
    description TEXT,
    activity_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        v.user_id,
        v.activity_id,
        v.title,
        v.description,
        v.activity_type,
        v.status,
        v.created_at
    FROM vw_client_activity_feed v
    WHERE v.user_id = p_user_id
    ORDER BY v.created_at DESC
    LIMIT p_limit;
$$;

-- ------------------------------------------------------------------------------
-- 7. FUNCTION: sp_request_roadside_assistance(...)
-- Strict validation: Requires an active automotor policy to dispatch tow truck.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_request_roadside_assistance(
    p_user_id UUID,
    p_policy_id UUID,
    p_tipo_asistencia TEXT,
    p_lat NUMERIC(10, 7) DEFAULT NULL,
    p_lng NUMERIC(10, 7) DEFAULT NULL,
    p_direccion TEXT DEFAULT NULL
)
RETURNS TABLE (
    assistance_id UUID,
    poliza_id UUID,
    tipo_asistencia TEXT,
    estado TEXT,
    eta_minutos INT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_policy_exists BOOLEAN;
    v_new_id UUID := gen_random_uuid();
    v_eta INT := FLOOR(RANDOM() * (20 - 10 + 1) + 10); -- ETA estimado entre 10 y 20 min
BEGIN
    -- Validar que la póliza pertenezca al usuario, esté activa y sea del ramo AUTOMOTOR
    SELECT EXISTS (
        SELECT 1 
        FROM polizas p
        WHERE p.id = p_policy_id 
          AND p.cliente_id = p_user_id 
          AND p.estado = 'ACTIVA' 
          AND p.ramo = 'AUTOMOTOR'
          AND p.deleted_at IS NULL
    ) INTO v_policy_exists;

    IF NOT v_policy_exists THEN
        RAISE EXCEPTION 'No puede llamar una grúa sin poseer una póliza automotor activa.';
    END IF;

    -- Registrar la solicitud de asistencia
    INSERT INTO asistencias_auxilio (
        id,
        poliza_id,
        tipo_asistencia,
        latitud,
        longitud,
        direccion,
        estado,
        eta_minutos,
        created_at,
        updated_at
    ) VALUES (
        v_new_id,
        p_policy_id,
        p_tipo_asistencia,
        p_lat,
        p_lng,
        p_direccion,
        'SOLICITADO',
        v_eta,
        NOW(),
        NOW()
    );

    RETURN QUERY
    SELECT 
        v_new_id,
        p_policy_id,
        p_tipo_asistencia,
        'SOLICITADO'::TEXT,
        v_eta,
        NOW();
END;
$$;
