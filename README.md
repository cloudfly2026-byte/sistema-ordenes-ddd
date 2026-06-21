# 🛒 Sistema de Gestión de Empaque e Inventario para Shopify

> Sistema automatizado de procesamiento de órdenes Shopify que calcula materiales de empaque, gestiona inventario de forma transaccional y expone un dashboard de monitoreo en tiempo real.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Inicio Rápido](#-inicio-rápido)
- [Desarrollo](#-desarrollo)
- [API](#-api)
- [Documentación](#-documentación)
- [Contribución](#-contribución)

---

## 📝 Descripción

El sistema se integra con la plataforma Shopify mediante webhooks para automatizar el proceso de preparación de pedidos (picking y packing). Cada orden recibida es procesada para:

1. **Calcular los materiales de empaque** necesarios según reglas de negocio (tipo de caja, etiquetas, cinta, relleno)
2. **Reservar inventario** de forma transaccional, evitando sobreventa
3. **Consumir inventario** una vez completado el empaque
4. **Monitorear** el estado de órdenes e inventario en tiempo real
5. **Alertar** cuando el stock cae por debajo de umbrales críticos

### Valor de Negocio

- **Reducción de Errores:** Automatización del cálculo de materiales
- **Optimización de Costos:** Uso eficiente de materiales de empaque
- **Mejora en la Experiencia del Cliente:** Envíos mejor protegidos
- **Visibilidad Operativa:** Dashboard en tiempo real
- **Escalabilidad:** Manejo de volumen creciente de órdenes

---

## 🏗️ Arquitectura

El sistema sigue una **arquitectura hexagonal (Ports & Adapters)** con patrones **Domain-Driven Design (DDD)** y **Event-Driven Architecture (EDA)**.

### Bounded Contexts

| Contexto | Responsabilidad |
|---|---|
| **Shopify Integration** | Recepción y validación de webhooks |
| **Orders** | Ciclo de vida de órdenes y estados |
| **Inventory** | Gestión de stock, reservas y consumo |
| **Packaging** | Cálculo de materiales según reglas de negocio |
| **Legacy Integration** | Endpoint PHP para consultas de bajo stock |
| **Monitoring** | Dashboard, métricas y alertas |

### Principios Arquitectónicos

- **Separación de responsabilidades:** Cada bounded context tiene su propia lógica
- **Inversión de dependencias:** Los puertos definen interfaces que los adaptadores implementan
- **Event-Driven:** Los eventos de dominio desacoplan la lógica entre contextos
- **CQRS ligero:** Separación de comandos (escrita) y consultas (lectura)
- **Resiliencia por diseño:** Reintentos con backoff exponencial, circuit breakers y dead letter queues

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
| **Validación** | class-validator / class-transformer |
| **Documentación API** | Swagger/OpenAPI |

---

## 📁 Estructura del Proyecto

```
project-root/
├── docs/                           # Documentación del proyecto
│   ├── architecture.md             # Diagramas C4, ADRs, flujos
│   └── product-analysis.md         # Análisis de producto y requerimientos
├── backend/                        # API NestJS
│   ├── src/
│   │   ├── domain/                 # Lógica de dominio (DDD)
│   │   │   ├── order/              # Agregado Order
│   │   │   │   ├── entities/       # Entidades (Order, OrderItem)
│   │   │   │   ├── value-objects/  # VOs (OrderStatus, BoxType, Money)
│   │   │   │   ├── events/         # Eventos de dominio
│   │   │   │   ├── services/       # Servicios de dominio
│   │   │   │   ├── repositories/   # Interfaces de repositorios
│   │   │   │   ├── policies/       # Políticas de negocio
│   │   │   │   ├── aggregates/     # Agregados
│   │   │   │   └── exceptions/     # Excepciones de dominio
│   │   │   └── inventory/          # Agregado Inventory
│   │   ├── application/            # Casos de uso y puertos
│   │   │   ├── use-cases/          # Casos de uso
│   │   │   └── ports/              # Interfaces de puertos
│   │   ├── infrastructure/         # Adaptadores de infraestructura
│   │   │   ├── database/           # TypeORM entities y repositorios
│   │   │   ├── queue/              # BullMQ productores y consumidores
│   │   │   ├── cache/              # Redis cache service
│   │   │   └── circuit-breaker/    # Circuit breaker service
│   │   ├── presentation/           # Capa de presentación
│   │   │   ├── controllers/        # Controladores REST
│   │   │   ├── guards/             # Guards (HMAC)
│   │   │   ├── interceptors/       # Interceptores (logging, idempotencia)
│   │   │   └── dto/                # DTOs de request/response
│   │   └── shared/                 # Utilidades compartidas
│   ├── test/                       # Tests unitarios y de integración
│   ├── Dockerfile                  # Imagen Docker del backend
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
│   ├── health.php                  # Health check
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
git clone https://github.com/cloudfly2026-byte/sistema-ordenes-ddd.git
cd sistema-ordenes-ddd

# Configurar variables de entorno
cp .env.example .env

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

## 💻 Desarrollo

### Comandos del Backend

```bash
cd backend

# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run start:dev

# Compilar TypeScript
npm run build

# Verificar tipos sin compilar
npm run typecheck

# Ejecutar tests
npm run test

# Tests con cobertura
npm run test:cov

# Linter
npm run lint
```

### Comandos de Docker

```bash
# Levantar todos los servicios
docker-compose -f docker/docker-compose.yml up -d

# Ver logs de un servicio
docker-compose -f docker/docker-compose.yml logs -f api

# Detener todos los servicios
docker-compose -f docker/docker-compose.yml down

# Reconstruir y levantar
docker-compose -f docker/docker-compose.yml up -d --build

# Estado de los contenedores
docker-compose -f docker/docker-compose.yml ps
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

#### Inventario
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/inventory` | Estado del inventario |
| `GET` | `/api/v1/inventory/low-stock` | Alertas de bajo stock |
| `GET` | `/api/v1/inventory/:materialId` | Stock de un material |

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

- **[Análisis de Producto](docs/product-analysis.md)** - Requerimientos funcionales y no funcionales, reglas de negocio, casos límite
- **[Arquitectura](docs/architecture.md)** - Diagramas C4, ADRs, bounded contexts, ERD, flujos de eventos
- **[Swagger API](http://localhost:3000/api/docs)** - Documentación interactiva de la API (requiere Docker)

### Reglas de Negocio Principales

| Regla | Descripción |
|---|---|
| **RF-004** | Cálculo de caja: 1-2 productos → SMALL, 3-5 → MEDIUM, 6+ → LARGE |
| **RF-005** | Materiales obligatorios: 1 LABEL + 1 TAPE por orden |
| **RF-006** | Si hay productos frágiles → +1 FILLER |
| **RF-010** | Si no hay stock suficiente → orden FAILED, sin descuentos parciales |
| **RF-011** | Estados: PROCESSING → COMPLETED / FAILED |

---

## 🤝 Contribución

1. Crear una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits con mensajes descriptivos
3. Crear un Pull Request con la descripción de los cambios

---

## 📄 Licencia

Este proyecto fue generado automáticamente con CrewAI.

---

**Documento generado por:** OWL - Senior Software Architect & Tech Lead
**Versión:** 1.0
**Fecha:** 2026-06-20

