# 🛒 Reto Técnico: Gestión de Órdenes Shopify e Inventario de Material de Empaque

> Sistema completo (Frontend y Backend) para gestionar el procesamiento de órdenes, el control de inventario de material de empaque y la trazabilidad operativa de los pedidos.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Requerimientos Técnicos](#-requerimientos-técnicos)
- [Historias de Usuario](#-historias-de-usuario)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Inicio Rápido](#-inicio-rápido)
- [API](#-api)
- [Documentación](#-documentación)

---

## 📝 Descripción

Una empresa de comercio electrónico opera múltiples tiendas en Shopify y requiere desarrollar una solución completa (Frontend y Backend) para gestionar el procesamiento de órdenes, el control de inventario de material de empaque y la trazabilidad operativa de los pedidos.

La solución debe garantizar **escalabilidad, mantenibilidad, rendimiento, consistencia de inventario** y capacidad de soportar altos volúmenes transaccionales.

### Funcionalidades Principales

1. **Recepción de Órdenes:** Captura automática de órdenes vía webhooks de Shopify (`orders/create`).
2. **Procesamiento Masivo:** Procesamiento desacoplado de órdenes para soportar picos de alta demanda.
3. **Cálculo de Materiales:** Determinación automática de materiales de empaque según reglas de negocio.
4. **Control de Inventario:** Descuento atómico de inventario con prevención de inconsistencias.
5. **Panel Operativo:** Dashboard para consultar órdenes, inventario y materiales consumidos.
6. **Compatibilidad Legacy:** Componente PHP para consulta de materiales con bajo inventario.

---

## ⚙️ Requerimientos Técnicos

### Backend

| Requerimiento | Tecnología |
|---|---|
| **Framework** | NestJS |
| **Lenguaje** | TypeScript |
| **Base de Datos** | PostgreSQL |
| **Caché** | Redis |
| **Arquitectura** | Domain Driven Design (DDD), principios SOLID, arquitectura modular |
| **Procesamiento Asíncrono** | Mecanismo desacoplado para el procesamiento de órdenes |
| **Integración** | Recepción de Webhooks Shopify |
| **Compatibilidad Legacy** | Componente en PHP |
| **Pruebas** | Unitarias y de integración |
| **Documentación** | Swagger / OpenAPI |

### Frontend

| Requerimiento | Tecnología |
|---|---|
| **Framework** | Vue.js (2 o 3) o Svelte |
| **Interfaz gráfica** | Polaris Web Components o diseño inspirado en Shopify Admin |
| **Manejo de estado** | Pinia, Vuex o equivalente |
| **Pruebas** | Jest, Vitest o Testing Library |
| **UX** | Estados de carga, error, filtros y actualización automática |

---

## 📖 Historias de Usuario

### HU1 — Recepción de Órdenes desde Shopify

> Como sistema, quiero recibir órdenes provenientes de Shopify para iniciar su procesamiento sin afectar el tiempo de respuesta del webhook.

**Criterios de Aceptación:**
- Implementar un endpoint para recibir órdenes desde Shopify.
- Registrar el evento recibido.
- Evitar el procesamiento duplicado de una misma orden.
- Garantizar que la lógica de negocio no se ejecute directamente desde el webhook.

### HU2 — Procesamiento Masivo de Órdenes

> Como sistema, quiero procesar órdenes de forma desacoplada para soportar picos de alta demanda sin afectar la estabilidad de la plataforma.

**Criterios de Aceptación:**
- Implementar un mecanismo que desacople la recepción de órdenes de su procesamiento.
- Implementar un componente encargado exclusivamente del procesamiento de órdenes.
- Procesar al menos 100 órdenes simuladas.
- Registrar el estado de cada orden.
- Permitir reintentos ante errores temporales.
- Mantener trazabilidad por identificador de orden.

### HU3 — Cálculo de Material de Empaque

> Como sistema, quiero calcular automáticamente los materiales de empaque requeridos para cada orden con el fin de descontarlos correctamente del inventario.

**Criterios de Aceptación:**
- Implementar las reglas de negocio dentro del dominio de la aplicación.
- Toda orden debe consumir una etiqueta y una unidad de cinta.
- Si la orden contiene productos frágiles debe consumir material de protección adicional.
- Registrar qué materiales fueron utilizados en cada orden.

**Reglas de Negocio:**

| Condición | Material |
|---|---|
| Hasta 2 productos | Caja pequeña |
| Entre 3 y 5 productos | Caja mediana |
| Más de 5 productos | Caja grande |
| Toda orden | Etiqueta |
| Toda orden | Cinta |
| Si contiene productos frágiles | Material de protección |

**Inventario Inicial:**

| Código | Material | Stock |
|---|---|---|
| `BOX_SMALL` | Caja pequeña | 100 |
| `BOX_MEDIUM` | Caja mediana | 80 |
| `BOX_LARGE` | Caja grande | 50 |
| `LABEL` | Etiqueta | 500 |
| `TAPE` | Cinta | 200 |
| `FILLER` | Material de protección | 120 |

### HU4 — Sincronización y Control de Inventario

> Como sistema, quiero mantener un inventario consistente para evitar descuadres y problemas de disponibilidad de materiales.

**Criterios de Aceptación:**
- Descontar inventario.
- Si no existe inventario suficiente, la orden debe marcarse como **FALLIDA**.
- No debe existir descuento parcial de inventario.
- Evitar inconsistencias cuando múltiples órdenes consumen los mismos materiales simultáneamente.

### HU5 — Panel Operativo y Compatibilidad Legacy

> Como usuario operativo, quiero consultar las órdenes procesadas, el estado del inventario y los materiales consumidos desde una única interfaz administrativa.

**Criterios de Aceptación:**
- Desarrollar una interfaz en Vue.js o Svelte.
- Mostrar indicadores generales de operación.
- Mostrar listado de órdenes procesadas.
- Mostrar inventario actual de materiales.
- Permitir filtrar órdenes por estado.
- Mostrar detalle de materiales utilizados por cada orden.
- Manejar estados de carga y error.

**Compatibilidad Legacy:**

Implementar un componente PHP para consultar materiales con bajo inventario:

```
legacy/materiales-bajo-stock.php
```

Respuesta esperada:

```json
[
  {
    "material": "BOX_SMALL",
    "stock": 5
  }
]
```

---

## 🏗️ Arquitectura

El sistema sigue una **arquitectura hexagonal (Ports & Adapters)** con patrones **Domain-Driven Design (DDD)** y **Event-Driven Architecture (EDA)**.

### Flujo de Procesamiento

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Shopify   │────▶│  WebhookController│────▶│SyncShopifyOrder │────▶│  PostgreSQL  │
│   Webhook   │     │  (HMAC + Idemp.) │     │    UseCase      │     │  (orders)    │
└─────────────┘     └──────────────────┘     └────────┬────────┘     └──────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │OrderQueueProducer│
                                              │   (BullMQ)      │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐     ┌──────────────────┐
                                              │OrderQueueConsumer│────▶│ ProcessOrder     │
                                              │   (BullMQ)       │     │    UseCase       │
                                              └──────────────────┘     └────────┬─────────┘
                                                                              │
                                                                              ▼
                                                                    ┌─────────────────┐
                                                                    │  Domain: Order  │
                                                                    │  (aggregates,   │
                                                                    │   services,     │
                                                                    │   events)       │
                                                                    └─────────────────┘
```

### Bounded Contexts

| Contexto | Responsabilidad |
|---|---|
| **Shopify Integration** | Recepción y validación de webhooks, idempotencia |
| **Orders** | Ciclo de vida de órdenes y estados (PENDING → PROCESSING → COMPLETED/FAILED) |
| **Inventory** | Gestión de stock, reservas y consumo con control de concurrencia |
| **Packaging** | Cálculo de materiales según reglas de negocio (dominio rico) |
| **Legacy Integration** | Endpoint PHP para consultas de bajo stock |
| **Monitoring** | Dashboard, métricas y alertas |

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Backend** | NestJS + TypeScript |
| **Frontend** | Vue 3 + Pinia + Vite |
| **Base de Datos** | PostgreSQL 16 |
| **Caché** | Redis 7 |
| **Cola de Trabajo** | BullMQ |
| **Legacy** | PHP 8.2 + Apache |
| **Infraestructura** | Docker Compose |
| **ORM** | TypeORM |
| **Documentación API** | Swagger / OpenAPI |

---

## 📁 Estructura del Proyecto

```
project-root/
├── docs/                           # Documentación del proyecto
│   ├── architecture.md             # Diagramas C4, ADRs, flujos
│   ├── product-analysis.md         # Análisis de producto y requerimientos
│   ├── test-plan.md                # Plan de pruebas
│   └── sequence-diagrams-reconectado.md  # Diagramas de secuencia
├── backend/                        # API NestJS
│   ├── src/
│   │   ├── domain/                 # Lógica de dominio (DDD)
│   │   │   ├── order/              # Agregado Order
│   │   │   └── inventory/          # Agregado Inventory
│   │   ├── application/            # Casos de uso y puertos
│   │   │   └── use-cases/          # SyncShopifyOrder, ProcessOrder, etc.
│   │   ├── infrastructure/         # Adaptadores de infraestructura
│   │   │   ├── database/           # TypeORM entities, repositorios, mappers
│   │   │   ├── queue/              # BullMQ productores y consumidores
│   │   │   └── cache/              # Redis cache service
│   │   ├── presentation/           # Capa de presentación
│   │   │   ├── controllers/        # Controladores REST
│   │   │   ├── guards/             # Guards (HMAC)
│   │   │   ├── interceptors/       # Interceptores (idempotencia)
│   │   │   └── dto/                # DTOs de request/response
│   │   └── shared/                 # Utilidades compartidas
│   ├── test/                       # Tests unitarios, integración y e2e
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/                       # Dashboard Vue 3
│   ├── src/
│   │   ├── views/                  # Vistas del dashboard
│   │   ├── components/             # Componentes reutilizables
│   │   ├── stores/                 # Pinia stores
│   │   ├── services/               # Servicios API
│   │   └── types/                  # Tipos TypeScript
│   ├── Dockerfile
│   └── nginx.conf
├── database/                       # Esquema y migraciones
│   ├── schema.sql                  # Esquema completo
│   └── migrations/                 # Migraciones numeradas
├── legacy/                         # Endpoint PHP legacy
│   ├── materiales-bajo-stock.php   # Endpoint de bajo stock
│   ├── config.php                  # Configuración
│   └── Dockerfile
├── docker/                         # Configuración Docker
│   ├── docker-compose.yml          # Orquestación de servicios
│   └── nginx.conf                  # Configuración nginx para frontend
├── .env.example                    # Variables de entorno de ejemplo
└── README.md                       # Este archivo
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) 20+ (para desarrollo local)
- [Git](https://git-scm.com/)

### Instalación con Docker

```bash
# Clonar el repositorio
git clone <repo-url>
cd project-root

# Configurar variables de entorno
cp .env.example .env

### Variables de Entorno

El proyecto usa un archivo `.env` para las credenciales y configuracion sensible (no se versiona en git, ver `.gitignore`).

1. Copia la plantilla a partir de `backend/.env.example`:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Completa los valores en `backend/.env`:

   | Variable | Descripcion |
   |---|---|
   | `NODE_ENV` | Entorno de ejecucion (`development`, `production`, etc.) |
   | `PORT` | Puerto donde corre la API backend |
   | `DB_HOST` | Host de PostgreSQL |
   | `DB_PORT` | Puerto de PostgreSQL |
   | `DB_USERNAME` | Usuario de la base de datos |
   | `DB_PASSWORD` | Password de la base de datos |
   | `DB_NAME` | Nombre de la base de datos |
   | `REDIS_HOST` | Host de Redis |
   | `REDIS_PORT` | Puerto de Redis |
   | `REDIS_PASSWORD` | Password de Redis (vacio en local) |
   | `SHOPIFY_WEBHOOK_SECRET` | Secreto compartido para validar la firma HMAC de los webhooks de Shopify |
   | `SHOPIFY_API_KEY` | API Key de la app de Shopify (Partner Dashboard) |
   | `SHOPIFY_API_SECRET` | API Secret de la app de Shopify (Partner Dashboard) |

   > **Importante:** nunca hardcodees estos valores en el codigo ni los subas al repositorio. `.env` esta excluido via `.gitignore`; usa siempre `process.env.<VARIABLE>` en el codigo y `.env.example` como referencia de las claves esperadas (sin valores reales).


# Levantar todos los servicios
docker-compose -f docker/docker-compose.yml up -d --build
```

### Servicios Disponibles

| Servicio | Puerto | Descripción |
|---|---|---|
| **API Backend** | http://localhost:3000 | API REST NestJS |
| **Swagger Docs** | http://localhost:3000/api/docs | Documentación interactiva |
| **Frontend** | http://localhost:8080 | Dashboard Vue 3 |
| **PostgreSQL** | localhost:5432 | Base de datos |
| **Redis** | localhost:6379 | Caché y cola de mensajes |
| **Legacy PHP** | http://localhost:8081 | Endpoint legacy |

### Desarrollo Local (sin Docker)

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## 📡 API

### Endpoints Principales

#### Webhooks

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/webhooks/shopify` | Recepción de webhooks de Shopify |

#### Órdenes

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/orders` | Listar órdenes (paginado) |
| `GET` | `/api/v1/orders/:id` | Obtener orden por ID |
| `POST` | `/api/v1/orders/:id/process` | Procesar orden manualmente |

#### Inventario

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/inventory` | Estado del inventario |
| `GET` | `/api/v1/inventory/low-stock` | Alertas de bajo stock |

#### Legacy

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/low-stock` | Consulta de bajo stock (PHP) |

### Ejemplo de Uso

```bash
# Crear orden (vía webhook de Shopify)
curl -X POST http://localhost:3000/api/v1/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-SHA256: <signature>" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{"id": 123456, "line_items": [{"sku": "PROD-1", "quantity": 2}]}'

# Consultar órdenes
curl http://localhost:3000/api/v1/orders

# Consultar inventario
curl http://localhost:3000/api/v1/inventory

# Consultar bajo stock (legacy)
curl http://localhost:8081/low-stock
```

---

## 📚 Documentación

- **[Análisis de Producto](docs/product-analysis.md)** — Historias de usuario, reglas de negocio, casos límite
- **[Arquitectura](docs/architecture.md)** — Diagramas C4, ADRs, bounded contexts, ERD, flujos de eventos
- **[Plan de Pruebas](docs/test-plan.md)** — Estrategia de testing, escenarios críticos
- **[Diagramas de Secuencia](docs/sequence-diagrams-reconectado.md)** — Flujos principales y alternativos
- **[Swagger API](http://localhost:3000/api/docs)** — Documentación interactiva de la API (requiere Docker)

---

**Versión:** 3.0
**Fecha:** 2025-07-15
