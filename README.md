<div align="center">
  <img src="img/LOGO+TEXT.svg" width="240" alt="SecureLife Logo" />
  
  # SecureLife • Backend REST API & Database Engine

  <p align="center">
    <strong>Plataforma actuarial de alta disponibilidad, persistencia relacional con PostgreSQL 16, autenticación JWT/RBAC, stored procedures transaccionales y servicios REST para la gestión integral de pólizas y cotizaciones.</strong>
  </p>

  <p align="center">
    <a href="#inicio-rápido">Inicio Rápido</a> •
    <a href="#arquitectura-del-sistema">Arquitectura</a> •
    <a href="#capacidades-principales">Capacidades</a> •
    <a href="#stored-procedures-y-vistas-sql">Procedimientos Almacenados</a> •
    <a href="#especificación-de-endpoints">Endpoints REST</a> •
    <a href="#variables-de-entorno">Variables de Entorno</a> •
    <a href="#scripts-disponibles">Comandos</a> •
    <a href="#licencia">Licencia</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 20+" />
    <img src="https://img.shields.io/badge/Express_4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 4.21" />
    <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
    <img src="https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
    <img src="https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
    <img src="https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT Auth" />
    <img src="https://img.shields.io/badge/Validation-Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod Validation" />
    <img src="https://img.shields.io/badge/Security-Helmet-FF6B6B?style=for-the-badge&logo=shield&logoColor=white" alt="Helmet Security" />
    <img src="https://img.shields.io/badge/Sprint-2-006E2F?style=for-the-badge" alt="Sprint 2" />
  </p>
</div>

---

## Resumen del Proyecto

**SecureLife Backend** es el núcleo de servicios REST y motor de reglas actuariales de la plataforma SecureLife. Diseñado bajo los estándares de **Clean Architecture de 3 capas** (Controllers, Services, Repositories) combinada con **PostgreSQL 16**, Prisma ORM y **Stored Procedures transaccionales (PL/pgSQL)** para garantizar la integridad referencial y cálculos actuariales deterministas a nivel de base de datos.

El sistema gestiona el ciclo completo de autenticación de asegurados (con soporte dual DNI / Email), cotizaciones en tiempo real para múltiples ramos (Automotor e Inmuebles), emisión de pólizas, métricas agregadas del panel de control y sincronización periódica en segundo plano.

> [!IMPORTANT]
> **Base de Datos Embebida Zero-Setup:** El proyecto cuenta con un entorno PostgreSQL 16 integrado que inicializa el clúster localmente de forma automática sin requerir la instalación manual de software adicional ni configuraciones complejas de Docker.

---

## Capacidades Principales

* **Autenticación Dual & Control de Acceso por Roles (RBAC):** Login y registro seguro mediante Email o DNI, contraseñas hasheadas con `bcrypt`, generación de tokens JWT efímeros y middleware de autorización preventiva (`requireAuth`).
* **Cálculo Actuarial por Stored Procedures:** La matemática actuarial de primas, depreciación de suma asegurada, scoring de riesgo y recargos técnicos se ejecuta directamente en el motor de base de datos con alta performance y atomicidad.
* **Módulo Multirramo de Cotizaciones:**
  * **Automotor:** Planes de Responsabilidad Civil, Terceros Completo y Todo Riesgo con franquicia; ponderación por antigüedad, GNC y kilometraje anual.
  * **Inmuebles (Hogar):** Planes Esencial, Integral y Premium; coeficientes de riesgo por zona sísmica/inundación, tipo de propiedad, superficie cubierta y medidas de seguridad (alarmas, cámaras, rejas).
* **Dashboard de Asegurados:** Endpoints analíticos optimizados con vistas SQL (`v_dashboard_active_policies`, `v_client_audit_log`) para consultar métricas, distribución de coberturas, pólizas activas y auditoría de eventos.
* **Validación Preventiva con Zod:** Sanitización estricta de payloads entrantes mediante esquemas tipados antes de alcanzar los controladores.
* **Seguridad & Resiliencia Enterprise:** Cabeceras HTTP endurecidas con Helmet, CORS estricto, rate limiting y manejo centralizado de excepciones mediante la clase de dominio `AppError`.
* **Sync Scheduler:** Proceso periódico en segundo plano para tareas de mantenimiento, actualización de pólizas y sincronización de índices.

---

## Arquitectura del Sistema

```mermaid
graph TD
    Client["Cliente Frontend / Backoffice"] -->|"HTTP GET / POST / PUT"| MW["Pipeline de Middlewares"]

    subgraph Pipeline ["Capa de Seguridad & Middlewares"]
        MW --> M1["Helmet (Cabeceras HTTP)"]
        M1 --> M2["CORS (Restricción de Origen)"]
        M2 --> M3["express.json() (Parsing)"]
        M3 --> M4["validateBody(ZodSchema)"]
        M4 --> M5["requireAuth (JWT Validator)"]
    end

    M5 -->|"DTO Sanitizado & Usuario Autenticado"| Controllers["Capa de Controladores (HTTP)"]

    subgraph ControllersLayer ["Controladores"]
        C1["AuthController"]
        C2["CotizacionesController"]
        C3["DashboardController"]
    end

    Controllers --> ControllersLayer

    subgraph ServicesLayer ["Capa de Servicios (Reglas de Negocio)"]
        S1["AuthService (bcrypt + JWT)"]
        S2["CotizacionesService (Actuarial Logic)"]
        S3["DashboardService (Agregaciones)"]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3

    subgraph PersistenceLayer ["Capa de Persistencia & Base de Datos"]
        Repo["Repositories / Prisma Client"]
        SP["Stored Procedures (PL/pgSQL)"]
        DB[(PostgreSQL 16 Database)]
        
        Repo --> DB
        SP --> DB
    end

    S1 --> Repo
    S2 --> SP
    S3 --> Repo

    subgraph ErrorHandling ["Manejo Global de Excepciones"]
        Controllers -.->|"next(err)"| ErrorMW["error.middleware.ts (AppError)"]
        ErrorMW -.->|"JSON Normalizado (status, message, code)"| Client
    end
```

### Estructura de Directorios

```text
SecureLife_BackEnd/
├── prisma/
│   ├── schema.prisma                  # Esquema declarativo de modelos de dominio
│   └── migrations/                    # Scripts DDL y Stored Procedures versionados
│       ├── 01_views_and_procedures.sql     # Vistas analíticas y procedimientos base
│       ├── 02_cotizador_procedures.sql     # Stored Procedures del cotizador
│       ├── 03_cotizacion_automotor_sp.sql  # Cálculo y persistencia automotor
│       └── 04_cotizacion_inmueble_sp.sql   # Cálculo y persistencia inmuebles
├── scripts/                           # Scripts de verificación y testing de endpoints
├── src/
│   ├── app.ts                         # Configuración central de Express y rutas
│   ├── server.ts                      # Entrada HTTP, inicializador de BD y graceful shutdown
│   ├── config/                        # Conexión a base de datos y variables de entorno
│   ├── middlewares/
│   │   ├── auth.middleware.ts         # Validación de JWT y extracción de sesión
│   │   ├── error.middleware.ts        # Manejador central de errores y clase AppError
│   │   └── validate.middleware.ts     # Middleware genérico de validación Zod
│   ├── modules/
│   │   ├── auth/                      # Módulo de autenticación (Login, Registro, Perfil)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.service.ts
│   │   ├── cotizaciones/              # Módulos de cotización por ramo
│   │   │   ├── auto/                  # Cotizador Automotor (Schema, Controller, Service)
│   │   │   ├── inmueble/              # Cotizador Inmuebles (Schema, Controller, Service)
│   │   │   └── cotizaciones.routes.ts # Enrutador unificado de cotizaciones
│   │   ├── cotizador/                 # Scheduler y orquestador de cotizaciones
│   │   │   └── cotizador.sync.ts
│   │   └── dashboard/                 # Panel de asegurados y métricas de usuario
│   │       ├── dashboard.controller.ts
│   │       ├── dashboard.routes.ts
│   │       └── dashboard.service.ts
│   └── types/                         # Definiciones de tipos globales
├── .env.example                       # Plantilla de variables de entorno
├── docker-compose.yml                 # Configuración de PostgreSQL para despliegue
├── package.json                       # Dependencias y scripts de ejecución
└── tsconfig.json                      # Configuración de compilación TypeScript
```

---

## Stored Procedures y Vistas SQL

Para garantizar la máxima velocidad de cálculo y cumplir con las normas de integridad actuarial, la lógica transaccional de cálculo y emisión reside en procedimientos almacenados en PostgreSQL:

| Nombre | Tipo | Descripción |
| :--- | :---: | :--- |
| `sp_calcular_cotizacion_auto` | `FUNCTION` | Calcula la prima mensual, suma asegurada depreciada, recargo GNC y bonificación por kilometraje para un rodado. |
| `sp_crear_cotizacion_automotor` | `PROCEDURE` | Ejecuta el cálculo actuarial, genera el registro de cotización con su desglose impositivo y emite el ID de transacción. |
| `sp_calcular_cotizacion_inmueble` | `FUNCTION` | Evalúa el riesgo del hogar según zona de siniestralidad, medidas de seguridad y superficie para tarifar planes Esencial, Integral o Premium. |
| `sp_request_roadside_assistance` | `PROCEDURE` | Registra y despacha una solicitud de auxilio mecánico o grúa vinculada a una póliza automotor activa. |
| `v_dashboard_active_policies` | `VIEW` | Vista optimizada que reúne pólizas vigentes, vehículos/inmuebles asociados y estado de cobranza. |
| `v_client_audit_log` | `VIEW` | Historial cronológico de interacciones, pagos, modificaciones de cobertura y cotizaciones por usuario. |

---

## Especificación de Endpoints

### 1. Autenticación (`/api/v1/auth`)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `validateBody(RegisterSchema)` | Registro de nuevo cliente con DNI, Email, Teléfono y Password. |
| `POST` | `/api/v1/auth/login` | `validateBody(LoginSchema)` | Autenticación con identificador dual (`email` o `dni`) y `password`. Retorna JWT. |
| `GET` | `/api/v1/auth/profile` | `requireAuth` | Obtiene los datos de perfil del usuario actualmente autenticado. |

<details>
<summary><b>Ver Ejemplo: POST /api/v1/auth/login</b></summary>

**Payload:**
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

### 2. Cotizaciones (`/api/v1/cotizaciones`)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/cotizaciones/auto` | `validateBody(CotizacionAutoSchema)` | Cotiza seguro automotor con evaluación actuarial mediante SP. |
| `POST` | `/api/v1/cotizaciones/inmueble` | `validateBody(CotizacionInmuebleSchema)` | Cotiza seguro de hogar / inmuebles con ponderación de riesgo sísmico y seguridad. |

---

### 3. Dashboard de Clientes (`/api/v1/dashboard`)

> Todos los endpoints del dashboard requieren el encabezado `Authorization: Bearer <token>`.

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary` | `requireAuth` | Resumen ejecutivo: total de pólizas activas, inversión mensual, siniestros abiertos y avisos pendientes. |
| `GET` | `/api/v1/dashboard/policies` | `requireAuth` | Listado detallado de coberturas contratadas con número de póliza, vigencia y montos. |
| `GET` | `/api/v1/dashboard/activity` | `requireAuth` | Historial cronológico de eventos, pagos y solicitudes de asistencia. |

---

### 4. Health Check

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Verifica la disponibilidad de la API, el estado de la conexión a la base de datos y el uptime. |

---

## Variables de Entorno

Configura estas variables en tu archivo `.env` en la raíz de `SecureLife_BackEnd`:

| Variable | Descripción | Valor Típico / Ejemplo | Requerido |
| :--- | :--- | :--- | :---: |
| `PORT` | Puerto de escucha del servidor HTTP | `3000` | No (default: `3000`) |
| `NODE_ENV` | Entorno de ejecución (`development`, `production`, `test`) | `development` | Sí |
| `CORS_ORIGIN` | Origen frontend permitido para solicitudes web | `http://localhost:5173` | Sí |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://postgres:postgres@localhost:5432/securelife_db` | Sí |
| `JWT_SECRET` | Clave criptográfica para firma de tokens de sesión | `tu_clave_secreta_super_segura_2026` | Sí |
| `JWT_EXPIRES_IN` | Tiempo de validez del JWT | `24h` | No (default: `24h`) |

---

## Inicio Rápido

### Prerrequisitos
* **Node.js:** `>= 20.0.0`
* **npm:** `>= 10.0.0`

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Ixion-Systems/SecureLife_BackEnd.git
cd SecureLife_BackEnd
```

### 2. Instalar Dependencias
```bash
npm install
```

> [!NOTE]
> En entornos **Windows PowerShell**, ejecuta los comandos de Node anteponiendo `cmd /c` (ej: `cmd /c npm install` o `cmd /c npm run dev`) para evitar restricciones de ejecución de scripts (`PSSecurityException`).

### 3. Configurar Variables de Entorno
```bash
# Windows
copy .env.example .env

# Linux / macOS / Bash
cp .env.example .env
```

### 4. Inicializar Base de Datos y Migraciones
Aplica el esquema declarativo de Prisma y carga los procedimientos almacenados actuariales:

```bash
cmd /c npx prisma db push
```

### 5. Iniciar en Modo Desarrollo
```bash
npm run dev
```
El servidor quedará disponible en `http://localhost:3000` con recarga en caliente automática vía `tsx watch`.

---

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor con recarga en caliente vía `tsx watch src/server.ts`. |
| `npm run build` | Compila el código TypeScript a JavaScript en `dist/` usando `tsc`. |
| `npm start` | Ejecuta el servidor compilado de producción (`node dist/server.js`). |

---

## Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
