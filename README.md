<div align="center">
  <img src="img/LOGO+TEXT.svg" width="240" alt="SecureLife Logo" />

  # SecureLife - Backend REST API & Database Engine

  <p align="center">
    <strong>Plataforma actuarial de alta disponibilidad, persistencia relacional con PostgreSQL 16, autenticación JWT/RBAC, stored procedures transaccionales y servicios REST para la gestión integral de pólizas y cotizaciones.</strong>
  </p>

  <p align="center">
    <a href="#resumen-del-proyecto">Resumen</a> •
    <a href="#capacidades-principales">Capacidades</a> •
    <a href="#arquitectura-del-sistema">Arquitectura</a> •
    <a href="#procedimientos-almacenados-y-vistas-sql">Procedimientos y Vistas</a> •
    <a href="#especificacion-de-endpoints">Endpoints REST</a> •
    <a href="#variables-de-entorno">Variables de Entorno</a> •
    <a href="#inicio-rapido">Inicio Rápido</a> •
    <a href="#scripts-disponibles">Comandos</a> •
    <a href="#licencia">Licencia</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 20+" />
    <img src="https://img.shields.io/badge/Express_4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 4.21" />
    <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
    <img src="https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
    <img src="https://img.shields.io/badge/TypeScript_5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Auth" />
    <img src="https://img.shields.io/badge/Validation_Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod Validation" />
    <img src="https://img.shields.io/badge/Security_Helmet-FF6B6B?style=for-the-badge&logo=shield&logoColor=white" alt="Helmet Security" />
  </p>
</div>

---

## Resumen del Proyecto

**SecureLife Backend** es el núcleo transaccional y motor de reglas actuariales de la plataforma SecureLife. Diseñado bajo los estándares de **Clean Architecture de 3 capas** (Controllers, Services, Repositories) combinada con **PostgreSQL 16**, Prisma ORM y **Stored Procedures transaccionales (PL/pgSQL)** para garantizar cálculos matemáticos deterministas e integridad referencial a nivel de base de datos.

El sistema administra el ciclo de vida completo de seguros: registro y autenticación dual (DNI / Email), cotizaciones en tiempo real para múltiples ramos (Automotor, Inmuebles, Vida y Objetos Personales), emisión de pólizas, despacho de asistencia satelital 24/7, analítica para el panel de asegurados y sincronización periódica de valuaciones de mercado.

> [!IMPORTANT]
> **Base de Datos Embebida Zero-Setup:** El proyecto integra un motor PostgreSQL 16 embebido que inicializa y administra el clúster localmente de forma automática al iniciar el servidor, sin requerir la instalación manual de software adicional ni configuraciones externas de Docker.

---

## Capacidades Principales

* **Autenticación Dual y Control de Acceso por Roles (RBAC):** Inicio de sesión y registro mediante Email corporativo o DNI argentino, cifrado de contraseñas con `bcrypt`, emisión de tokens JWT efímeros y middleware de autorización preventiva (`requireAuth`, `requireRole`).
* **Cálculo Actuarial por Stored Procedures:** Tarifación, amortización de sumas aseguradas, scoring de riesgo, bonificaciones por medidas de seguridad y recargos técnicos resueltos directamente en el motor de base de datos para garantizar consistencia atómica.
* **Módulo Multirramo de Cotizaciones:**
  * **Automotor:** Planes de Responsabilidad Civil, Terceros Completo y Todo Riesgo; ponderación actuarial por antigüedad, GNC y kilometraje anual.
  * **Inmuebles (Hogar):** Planes Esencial, Integral y Premium; coeficientes de riesgo por zona sísmica o inundable, metros cuadrados cubiertos y bonificaciones por medidas preventivas (alarmas monitoreadas, cámaras, rejas).
  * **Vida & Objetos Personales:** Coberturas patrimoniales y personales con validación de asegurabilidad.
* **Catálogo Oficial y Valuaciones:** Integración con listas de referencia (ACARA / DNRPA) y scheduler en segundo plano para actualización periódica de precios testigo.
* **Mesa de Asegurados y Auditoría:** Vistas SQL materializadas y optimizadas (`v_dashboard_active_policies`, `v_client_audit_log`) para consultar coberturas vigentes, métricas y trazabilidad de eventos.
* **Validación Preventiva con Zod:** Sanitización y tipado estricto de cada carga útil entrante antes de ingresar a los controladores de dominio.
* **Seguridad y Resiliencia Enterprise:** Cabeceras HTTP securizadas con Helmet, control de acceso de orígenes cruzados (CORS) con soporte para FrontEnd y BackOffice, y gestión de excepciones centralizada mediante `AppError`.

---

## Arquitectura del Sistema

El sistema implementa una arquitectura modular desacoplada con flujo unidireccional de responsabilidades:

```mermaid
graph TD
    Client["Clientes Web (FrontEnd / BackOffice)"] -->|"HTTP GET / POST / PUT"| MW["Pipeline de Middlewares"]

    subgraph Pipeline ["Capa de Seguridad & Middlewares"]
        MW --> M1["Helmet (Cabeceras de Seguridad)"]
        M1 --> M2["CORS (Orígenes Autorizados)"]
        M2 --> M3["express.json() (Parseo de Carga Útil)"]
        M3 --> M4["validateBody (Esquemas Zod)"]
        M4 --> M5["requireAuth (Verificación JWT)"]
    end

    M5 -->|"DTO Validado & Contexto de Sesión"| Controllers["Capa de Controladores (HTTP)"]

    subgraph ControllersLayer ["Controladores de Dominio"]
        C1["AuthController"]
        C2["CotizacionesController"]
        C3["DashboardController"]
        C4["BackofficeController"]
    end

    Controllers --> ControllersLayer

    subgraph ServicesLayer ["Capa de Servicios (Reglas de Negocio)"]
        S1["AuthService (bcrypt + JWT)"]
        S2["CotizacionesService (Lógica Actuarial)"]
        S3["DashboardService (Métricas & Agregaciones)"]
        S4["BackofficeService (Gestión Operativa)"]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4

    subgraph PersistenceLayer ["Capa de Persistencia & Base de Datos"]
        Repo["Prisma Client & Modelos ORM"]
        SP["Stored Procedures (PL/pgSQL)"]
        Views["Vistas SQL Analíticas"]
        DB[(PostgreSQL 16 Database)]

        Repo --> DB
        SP --> DB
        Views --> DB
    end

    S1 --> Repo
    S2 --> SP
    S3 --> Views
    S4 --> Repo

    subgraph ErrorHandling ["Manejo Global de Excepciones"]
        Controllers -.->|"next(error)"| ErrorMW["error.middleware.ts (AppError)"]
        ErrorMW -.->|"JSON Normalizado (status, message, code)"| Client
    end
```

### Estructura de Directorios

```text
SecureLife_BackEnd/
├── prisma/
│   ├── schema.prisma                  # Esquema declarativo de modelos relacionales
│   └── migrations/                    # Scripts DDL y Stored Procedures versionados
│       ├── 01_views_and_procedures.sql     # Vistas analíticas y procedimientos base
│       ├── 02_cotizador_procedures.sql     # Procedimientos del cotizador
│       ├── 03_cotizacion_automotor_sp.sql  # Cálculo y persistencia automotor
│       └── 04_cotizacion_inmueble_sp.sql   # Cálculo y persistencia inmuebles
├── scripts/                           # Scripts de verificación y pruebas de endpoints
├── src/
│   ├── app.ts                         # Configuración central de Express, CORS y rutas
│   ├── server.ts                      # Entrada HTTP, inicializador de BD y graceful shutdown
│   ├── config/                        # Configuración de BD embebida, Prisma y seeds
│   │   ├── database.ts                # Cliente Prisma singleton
│   │   ├── embeddedDb.ts              # Driver de inicialización PostgreSQL embebido
│   │   └── seed-admin.ts              # Semilla inicial para acceso operativo
│   ├── middlewares/
│   │   ├── auth.middleware.ts         # Verificación JWT y extracción de identidad
│   │   ├── backoffice.middleware.ts   # Control de acceso por roles administrativos
│   │   ├── error.middleware.ts        # Manejo centralizado de excepciones y AppError
│   │   └── validate.middleware.ts     # Middleware genérico de validación Zod
│   ├── modules/
│   │   ├── auth/                      # Autenticación de usuarios (Login, Registro, Perfil)
│   │   ├── backoffice/                # Mesa operativa (Siniestros, Grúas, Empleados, KPIs)
│   │   ├── cotizaciones/              # Módulos de cotización por ramo (Auto, Inmueble, Vida, Objeto)
│   │   ├── cotizador/                 # Catálogo vehicular y servicio de sincronización
│   │   └── dashboard/                 # Panel de asegurados y métricas consolidadas
│   └── types/                         # Definiciones de tipos TypeScript compartidos
├── .env.example                       # Plantilla de variables de entorno
├── docker-compose.yml                 # Despliegue opcional de PostgreSQL para producción
├── package.json                       # Dependencias y scripts del proyecto
└── tsconfig.json                      # Configuración de compilación TypeScript
```

---

## Procedimientos Almacenados y Vistas SQL

Para garantizar velocidad de procesamiento y atomicidad transaccional, la matemática actuarial y las consultas analíticas residen en procedimientos almacenados y vistas optimizadas:

| Identificador | Tipo | Descripción |
| :--- | :---: | :--- |
| `sp_calcular_cotizacion_auto` | `FUNCTION` | Evalúa la prima mensual, suma asegurada depreciada, recargo por GNC y descuento por kilometraje para automotores. |
| `sp_crear_cotizacion_automotor` | `PROCEDURE` | Ejecuta el cálculo actuarial, genera el registro de cotización con desglose impositivo y retorna el ID de póliza. |
| `sp_calcular_cotizacion_inmueble` | `FUNCTION` | Calcula tarifas para planes de hogar según riesgo de zona, superficie cubierta y medidas preventivas de seguridad. |
| `sp_request_roadside_assistance` | `PROCEDURE` | Registra y despacha una solicitud de auxilio vial o remolque verificando póliza activa y ubicación del incidente. |
| `v_dashboard_active_policies` | `VIEW` | Reúne pólizas vigentes con detalle del bien asegurado, estado de cobertura y vencimientos para el cliente. |
| `v_client_audit_log` | `VIEW` | Trazabilidad histórica de eventos, pagos, cotizaciones y asistencias asociadas a cada asegurado. |

---

## Especificación de Endpoints

### 1. Autenticación (`/api/v1/auth`)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `validateBody(RegisterSchema)` | Registro de nuevo cliente con DNI, Email, Teléfono y Password. |
| `POST` | `/api/v1/auth/login` | `validateBody(LoginSchema)` | Autenticación con identificador dual (`email` o `dni`) y contraseña. Retorna JWT. |
| `GET` | `/api/v1/auth/profile` | `requireAuth` | Retorna los datos de perfil del usuario autenticado. |

<details>
<summary><b>Ver Ejemplo: POST /api/v1/auth/login</b></summary>

**Carga Útil Solicitada:**
```json
{
  "identificador": "35123456",
  "password": "PasswordSegura123!"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c8b417e8-8a89-4fa2-8b9a-14d101e9d1a1",
      "nombre": "Juan Pérez",
      "email": "juan.perez@example.com",
      "dni": "35123456",
      "rol": "CLIENTE"
    }
  }
}
```
</details>

---

### 2. Cotizaciones Multirramo (`/api/v1/cotizaciones`)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/cotizaciones/auto` | `validateBody(CotizacionAutoSchema)` | Genera cotización automotor con cálculo actuarial mediante Stored Procedure. |
| `POST` | `/api/v1/cotizaciones/inmueble` | `validateBody(CotizacionInmuebleSchema)` | Genera cotización de hogar con ponderación de riesgo geográfico y medidas de seguridad. |
| `POST` | `/api/v1/cotizaciones/vida` | `validateBody(CotizacionVidaSchema)` | Cotiza seguro de vida con cálculo de suma asegurada y beneficiarios. |
| `POST` | `/api/v1/cotizaciones/objeto` | `validateBody(CotizacionObjetoSchema)` | Cotiza seguro para tecnología y objetos personales con valor de reposición. |

---

### 3. Portal de Clientes / Dashboard (`/api/v1/dashboard`)

> Todos los endpoints de dashboard requieren encabezado `Authorization: Bearer <token>`.

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary` | `requireAuth` | Resumen ejecutivo: pólizas vigentes, inversión mensual, siniestros y avisos activos. |
| `GET` | `/api/v1/dashboard/policies` | `requireAuth` | Listado detallado de coberturas contratadas con número de contrato y vigencia. |
| `GET` | `/api/v1/dashboard/activity` | `requireAuth` | Historial cronológico de eventos, pagos y solicitudes de asistencia vial. |

---

### 4. Mesa Operativa BackOffice (`/api/v1/backoffice`)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/backoffice/login` | `validateBody(LoginSchema)` | Autenticación para operadores y administradores de BackOffice. |
| `GET` | `/api/v1/backoffice/kpis` | `requireAuth, requireRole` | Métricas operativas de suscripción, siniestros abiertos y dotación de grúas. |
| `GET` | `/api/v1/backoffice/siniestros` | `requireAuth, requireRole` | Bandeja de siniestros bajo peritaje técnico y liquidación. |
| `GET` | `/api/v1/backoffice/gruas` | `requireAuth, requireRole` | Tablero de monitoreo y despacho satelital de auxilio mecánico. |
| `GET` | `/api/v1/backoffice/empleados` | `requireAuth, requireRole('ADMIN')` | Gestión exclusiva de personal, roles y estado de credenciales operativas. |

---

### 5. Verificación de Salud

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Estado del servidor, conectividad a PostgreSQL y tiempo de actividad (uptime). |

---

## Variables de Entorno

Crea el archivo `.env` en la raíz de `SecureLife_BackEnd` a partir de `.env.example`:

| Variable | Descripción | Tipo | Default | Requerido |
| :--- | :--- | :---: | :---: | :---: |
| `PORT` | Puerto TCP de escucha del servidor HTTP | Number | `3000` | No |
| `NODE_ENV` | Entorno de ejecución (`development`, `production`, `test`) | String | `development` | No |
| `CLIENT_ORIGIN` | Origen frontend autorizado adicional para políticas de CORS | String | `http://localhost:5173` | No |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (soporta motor embebido o clúster externo) | String | `postgresql://postgres:postgres@localhost:5432/securelife_db?schema=public` | Sí |
| `JWT_SECRET` | Clave criptográfica para firma de tokens JWT de sesión | String | N/A | Sí |
| `JWT_EXPIRES_IN` | Ventana temporal de validez del token de acceso | String | `15m` | No |
| `JWT_REFRESH_SECRET` | Clave criptográfica para emisión y rotación de tokens de refresco | String | N/A | Sí |
| `ADMIN_SEED_PASSWORD` | Contraseña inicial para el usuario Administrador del BackOffice | String | `DevSeedAdmin#2026` | No |
| `TEST_PASSWORD` | Contraseña utilizada en suites automatizadas de pruebas | String | `DevTestPass#2026` | No |

---

## Inicio Rápido

### Prerrequisitos
* **Node.js:** Versión `>= 20.0.0`
* **npm:** Versión `>= 10.0.0`

### Paso 1: Clonar y Acceder al Directorio
```bash
git clone https://github.com/Ixion-Systems/SecureLife_BackEnd.git
cd SecureLife_BackEnd
```

### Paso 2: Instalar Dependencias
```powershell
cmd /c npm install
```

> [!NOTE]
> En entornos Windows PowerShell, ejecuta los comandos de Node anteponiendo `cmd /c` para garantizar una ejecución fluida sin restricciones de políticas de scripts.

### Paso 3: Configurar Variables de Entorno e Iniciar
```powershell
copy .env.example .env
cmd /c npm run dev
```

El servidor inicializará automáticamente la base de datos PostgreSQL embebida y quedará disponible en `http://localhost:3000` con recarga en caliente mediante `tsx watch`.

---

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `cmd /c npm run dev` | Inicia el servidor de desarrollo con recarga en caliente vía `tsx watch src/server.ts`. |
| `cmd /c npm run build` | Compila el código fuente TypeScript a JavaScript optimizado en `dist/` usando `tsc`. |
| `cmd /c npm start` | Ejecuta el servidor compilado en modo producción (`node dist/server.js`). |

---

## Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.

<div align="center">
  <sub>Copyright 2026 SecureLife Seguros S.A. Todos los derechos reservados.</sub>
</div>
