# Archivos involucrados por historia de usuario

Este documento mapea las historias de usuario del reto tecnico con los archivos principales del proyecto que implementan o validan cada funcionalidad.

## HU1 - Recepcion de ordenes desde Shopify

**Objetivo:** recibir webhooks de Shopify, registrar el evento, evitar duplicados y desacoplar la logica de negocio del webhook.

### Backend

| Archivo | Responsabilidad |
|---|---|
| `backend/src/presentation/controllers/webhook.controller.ts` | Endpoint `POST /api/v1/webhooks/shopify`; recibe el webhook, registra el evento, detecta duplicados y delega el flujo. |
| `backend/src/presentation/guards/shopify-hmac.guard.ts` | Valida la firma HMAC enviada por Shopify. |
| `backend/src/presentation/dto/shopify-webhook.dto.ts` | DTO asociado al payload/header del webhook. |
| `backend/src/application/use-cases/sync-shopify-order/sync-shopify-order.use-case.ts` | Sincroniza la orden, evita recrear ordenes existentes y encola el procesamiento. |
| `backend/src/application/ports/shopify-webhook.port.ts` | Puerto de aplicacion relacionado con webhooks Shopify. |
| `backend/src/infrastructure/database/entities/webhook-event.entity.ts` | Entidad TypeORM para la tabla `webhook_events`; incluye `shopify_event_id` unico. |
| `backend/src/infrastructure/database/entities/order.entity.ts` | Persistencia de ordenes recibidas desde Shopify. |
| `backend/src/infrastructure/database/entities/order-item.entity.ts` | Persistencia de items de la orden. |
| `backend/src/infrastructure/database/repositories/order.repository.ts` | Implementacion de repositorio para crear y consultar ordenes. |
| `backend/src/domain/order/repositories/order.repository.interface.ts` | Contrato del repositorio de ordenes usado por la capa de aplicacion. |
| `backend/src/main.ts` | Configuracion global de la API, prefijo `/api/v1`, Swagger y captura de raw body para HMAC. |
| `backend/src/app.module.ts` | Registro de controladores, casos de uso, repositorios y modulos de infraestructura. |

### Base de datos

| Archivo | Responsabilidad |
|---|---|
| `database/schema.sql` | Esquema completo; define `webhook_events`, `orders` y `order_items`. |
| `database/migrations/001_initial_schema.sql` | Migracion inicial con tablas de webhooks y ordenes. |
| `database/migrations/002_indexes.sql` | Indices para consultas e idempotencia. |

### Pruebas

| Archivo | Responsabilidad |
|---|---|
| `backend/test/unit/presentation/webhook.controller.spec.ts` | Verifica que el webhook registre evento antes de procesar, rechace eventos sin ID y no procese duplicados. |
| `backend/test/unit/guards/shopify-hmac.guard.spec.ts` | Pruebas unitarias de validacion HMAC. |
| `backend/test/integration/shopify-webhook.integration.spec.ts` | Pruebas de integracion del endpoint de webhook. |
| `e2e-tests/tests/api/shopify-webhook.spec.ts` | Pruebas E2E de recepcion, duplicados y errores del webhook. |
| `e2e-tests/tests/business-process/order-lifecycle.spec.ts` | Flujo E2E de ciclo de vida de orden desde webhook. |

## HU2 - Procesamiento masivo de ordenes

**Objetivo:** desacoplar la recepcion del procesamiento, procesar ordenes en segundo plano, registrar estados, permitir reintentos y mantener trazabilidad por orden.

### Backend

| Archivo | Responsabilidad |
|---|---|
| `backend/src/infrastructure/queue/queue.module.ts` | Configura BullMQ y la cola `order-processing` sobre Redis. |
| `backend/src/infrastructure/queue/producers/order-queue.producer.ts` | Encola trabajos `process-order` con reintentos y backoff. |
| `backend/src/infrastructure/queue/consumers/order-queue.consumer.ts` | Worker que consume la cola y ejecuta el procesamiento real. |
| `backend/src/application/use-cases/process-order/process-order.use-case.ts` | Caso de uso principal de procesamiento de ordenes. |
| `backend/src/application/use-cases/process-order/process-order.dto.ts` | DTO asociado al procesamiento de ordenes. |
| `backend/src/application/use-cases/sync-shopify-order/sync-shopify-order.use-case.ts` | Persiste la orden y la encola para procesamiento asincrono. |
| `backend/src/presentation/controllers/orders.controller.ts` | Expone consulta de ordenes y procesamiento manual `POST /orders/:id/process`. |
| `backend/src/domain/order/entities/order.entity.ts` | Entidad de dominio con transiciones de estado. |
| `backend/src/domain/order/value-objects/order-status.vo.ts` | Estados de orden: pendiente, procesando, completada o fallida. |
| `backend/src/domain/order/events/order-received.event.ts` | Evento de dominio para orden recibida. |
| `backend/src/domain/order/events/order-completed.event.ts` | Evento de dominio para orden completada. |
| `backend/src/domain/order/events/order-failed.event.ts` | Evento de dominio para orden fallida. |
| `backend/src/infrastructure/database/entities/job-execution.entity.ts` | Entidad para trazabilidad de ejecucion de jobs. |
| `backend/src/shared/logger/structured-logger.service.ts` | Logging estructurado para trazabilidad operacional. |

### Base de datos

| Archivo | Responsabilidad |
|---|---|
| `database/schema.sql` | Define `orders`, `job_executions`, auditoria y estados persistidos. |
| `database/migrations/001_initial_schema.sql` | Crea tablas necesarias para ordenes y jobs. |
| `database/migrations/002_indexes.sql` | Indices por estado, fecha y ejecucion de trabajos. |

### Pruebas

| Archivo | Responsabilidad |
|---|---|
| `backend/test/unit/application/process-order.use-case.spec.ts` | Pruebas unitarias del procesamiento de orden. |
| `backend/test/integration/process-order.integration.spec.ts` | Pruebas de integracion del caso de uso con repositorios reales. |
| `e2e-tests/tests/business-process/order-lifecycle.spec.ts` | Verifica flujo completo de orden y estados finales. |
| `e2e-tests/tests/api/orders-api.spec.ts` | Prueba endpoints de ordenes. |

## HU3 - Calculo de material de empaque

**Objetivo:** calcular materiales desde el dominio, consumir etiqueta y cinta en toda orden, agregar proteccion para fragiles y registrar materiales usados.

### Backend

| Archivo | Responsabilidad |
|---|---|
| `backend/src/domain/order/services/packaging-calculator.domain-service.ts` | Calcula caja, etiqueta, cinta y filler segun reglas de negocio. |
| `backend/src/domain/order/policies/box-selection.policy.ts` | Selecciona caja segun cantidad de productos. |
| `backend/src/domain/order/value-objects/box-type.vo.ts` | Value object para `BOX_SMALL`, `BOX_MEDIUM` y `BOX_LARGE`. |
| `backend/src/domain/order/entities/order.entity.ts` | Expone datos de la orden usados para calcular materiales: cantidad total y fragilidad. |
| `backend/src/domain/order/entities/order-item.entity.ts` | Modela items de orden, cantidades, SKU y bandera de fragilidad. |
| `backend/src/application/use-cases/process-order/process-order.use-case.ts` | Usa el calculador de empaque y registra reservas/consumos en `order_materials`. |
| `backend/src/infrastructure/database/entities/material.entity.ts` | Entidad de materiales disponibles. |
| `backend/src/infrastructure/database/entities/order-material.entity.ts` | Registra materiales requeridos, reservados y consumidos por orden. |
| `backend/src/infrastructure/database/entities/inventory-movement.entity.ts` | Registra movimientos asociados a reserva y consumo de materiales. |

### Base de datos

| Archivo | Responsabilidad |
|---|---|
| `database/migrations/003_seed_inventory.sql` | Inserta materiales iniciales: `BOX_SMALL`, `BOX_MEDIUM`, `BOX_LARGE`, `LABEL`, `TAPE`, `FILLER`. |
| `database/migrations/001_initial_schema.sql` | Crea tablas `materials`, `order_materials` e `inventory_movements`. |
| `database/schema.sql` | Esquema completo con enums de cajas y materiales. |

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/components/orders/OrderMaterialsList.vue` | Muestra materiales asociados a una orden. |
| `frontend/src/views/OrderDetailView.vue` | Vista de detalle de orden y materiales usados. |
| `frontend/src/components/orders/OrderCard.vue` | Presenta resumen de orden, estado y datos relevantes. |

### Pruebas

| Archivo | Responsabilidad |
|---|---|
| `backend/test/unit/domain/packaging-calculator.spec.ts` | Prueba reglas de caja, etiqueta, cinta y filler. |
| `backend/test/unit/domain/order.entity.spec.ts` | Prueba comportamiento de entidad de orden. |
| `backend/test/integration/process-order.integration.spec.ts` | Verifica consumo de materiales en procesamiento real. |

## HU4 - Sincronizacion y control de inventario

**Objetivo:** descontar inventario consistentemente, marcar orden como fallida si no hay stock, evitar descuentos parciales y controlar concurrencia.

### Backend

| Archivo | Responsabilidad |
|---|---|
| `backend/src/application/use-cases/process-order/process-order.use-case.ts` | Reserva, consume inventario, maneja stock insuficiente y marca ordenes fallidas. |
| `backend/src/domain/inventory/entities/inventory.entity.ts` | Entidad de dominio para stock actual, reservado y disponible. |
| `backend/src/domain/inventory/aggregates/inventory.aggregate.ts` | Agregado de inventario. |
| `backend/src/domain/inventory/services/inventory.domain-service.ts` | Servicios de dominio asociados a inventario. |
| `backend/src/domain/inventory/exceptions/inventory.exceptions.ts` | Excepciones de stock insuficiente y conflictos de concurrencia. |
| `backend/src/domain/inventory/repositories/inventory.repository.interface.ts` | Contrato de repositorio de inventario. |
| `backend/src/infrastructure/database/repositories/inventory.repository.ts` | Implementa persistencia, consulta de stock y actualizaciones. |
| `backend/src/infrastructure/database/entities/inventory.entity.ts` | Entidad TypeORM para inventario. |
| `backend/src/infrastructure/database/entities/inventory-movement.entity.ts` | Persistencia de movimientos de inventario. |
| `backend/src/infrastructure/database/mappers/inventory.mapper.ts` | Mapeo entre entidad de base de datos y dominio. |
| `backend/src/presentation/controllers/inventory.controller.ts` | API para consultar inventario y bajo stock. |
| `backend/src/application/use-cases/get-inventory-status/get-inventory-status.use-case.ts` | Caso de uso para estado de inventario. |
| `backend/src/application/use-cases/get-inventory-status/get-inventory-status.dto.ts` | DTO de inventario. |
| `backend/src/domain/inventory/events/inventory-reserved.event.ts` | Evento de reserva de inventario. |
| `backend/src/domain/inventory/events/inventory-consumed.event.ts` | Evento de consumo de inventario. |

### Base de datos

| Archivo | Responsabilidad |
|---|---|
| `database/migrations/001_initial_schema.sql` | Crea `inventory` e `inventory_movements`. |
| `database/migrations/002_indexes.sql` | Indices para bajo stock y consultas frecuentes. |
| `database/migrations/003_seed_inventory.sql` | Stock inicial y umbrales. |
| `database/migrations/004_fix_inventory_schema.sql` | Ajustes del esquema de inventario. |
| `database/schema.sql` | Esquema completo y funciones relacionadas con inventario. |

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/views/InventoryView.vue` | Vista de inventario actual. |
| `frontend/src/views/LowStockView.vue` | Vista de alertas de bajo stock. |
| `frontend/src/components/inventory/InventoryTable.vue` | Tabla de inventario. |
| `frontend/src/components/inventory/LowStockAlert.vue` | Componente visual para alertas. |
| `frontend/src/stores/inventory.store.ts` | Estado Pinia para inventario y bajo stock. |
| `frontend/src/composables/useInventory.ts` | Composable de consulta de inventario. |

### Pruebas

| Archivo | Responsabilidad |
|---|---|
| `backend/test/unit/domain/inventory.entity.spec.ts` | Prueba reglas de entidad de inventario. |
| `backend/test/unit/domain/inventory-domain-service.spec.ts` | Prueba servicios de dominio de inventario. |
| `backend/test/unit/application/process-order.use-case.spec.ts` | Prueba fallo por inventario insuficiente. |
| `backend/test/integration/process-order.integration.spec.ts` | Verifica consumo y fallo por stock insuficiente. |
| `e2e-tests/tests/api/inventory-api.spec.ts` | Prueba API de inventario. |
| `e2e-tests/tests/dashboard/inventory-view.spec.ts` | Prueba vista de inventario. |

## HU5 - Panel operativo y compatibilidad legacy

**Objetivo:** consultar ordenes, inventario, materiales consumidos, filtros, estados de carga/error y endpoint PHP legacy de bajo stock.

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/main.ts` | Bootstrap de Vue. |
| `frontend/src/App.vue` | Layout raiz de la aplicacion. |
| `frontend/src/router/index.ts` | Rutas del dashboard. |
| `frontend/src/views/DashboardView.vue` | Indicadores generales y graficas. |
| `frontend/src/views/OrdersView.vue` | Listado de ordenes y filtros. |
| `frontend/src/views/OrderDetailView.vue` | Detalle de una orden y materiales. |
| `frontend/src/views/InventoryView.vue` | Inventario actual. |
| `frontend/src/views/LowStockView.vue` | Alertas de bajo stock. |
| `frontend/src/stores/orders.store.ts` | Estado Pinia para ordenes. |
| `frontend/src/stores/inventory.store.ts` | Estado Pinia para inventario. |
| `frontend/src/stores/ui.store.ts` | Estado global de UI. |
| `frontend/src/services/api.service.ts` | Cliente API para backend. |
| `frontend/src/composables/useOrders.ts` | Logica reutilizable para ordenes. |
| `frontend/src/composables/useInventory.ts` | Logica reutilizable para inventario. |
| `frontend/src/composables/usePagination.ts` | Paginacion. |
| `frontend/src/composables/useAutoRefresh.ts` | Actualizacion automatica. |
| `frontend/src/components/common/AppHeader.vue` | Encabezado de la app. |
| `frontend/src/components/common/AppSidebar.vue` | Navegacion lateral. |
| `frontend/src/components/common/DataTable.vue` | Tabla reutilizable. |
| `frontend/src/components/common/StatusBadge.vue` | Badge de estados. |
| `frontend/src/components/common/LoadingSpinner.vue` | Estado de carga. |
| `frontend/src/components/common/ErrorBanner.vue` | Estado de error. |
| `frontend/src/components/common/EmptyState.vue` | Estado vacio. |
| `frontend/src/components/charts/OrdersChart.vue` | Grafica de ordenes. |
| `frontend/src/components/charts/InventoryChart.vue` | Grafica de inventario. |
| `frontend/src/components/orders/OrderFilters.vue` | Filtros de ordenes por estado. |
| `frontend/src/components/orders/OrderCard.vue` | Tarjeta/resumen de orden. |
| `frontend/src/components/orders/OrderMaterialsList.vue` | Materiales usados por orden. |
| `frontend/src/types/index.ts` | Tipos compartidos del frontend. |

### Backend

| Archivo | Responsabilidad |
|---|---|
| `backend/src/presentation/controllers/orders.controller.ts` | API de consulta de ordenes, detalle y procesamiento manual. |
| `backend/src/presentation/controllers/inventory.controller.ts` | API de inventario y bajo stock. |
| `backend/src/presentation/dto/order-response.dto.ts` | DTO de respuesta de orden. |
| `backend/src/presentation/dto/inventory-response.dto.ts` | DTO de respuesta de inventario. |
| `backend/src/infrastructure/cache/redis-cache.service.ts` | Servicio de cache Redis. |
| `backend/src/presentation/interceptors/logging.interceptor.ts` | Logging de peticiones. |
| `backend/src/shared/filters/global-exception.filter.ts` | Manejo global de errores. |

### Legacy PHP

| Archivo | Responsabilidad |
|---|---|
| `legacy/materiales-bajo-stock.php` | Endpoint legacy que retorna materiales con bajo stock en formato JSON. |
| `legacy/config.php` | Configuracion y conexion a base de datos para PHP. |
| `legacy/health.php` | Healthcheck del componente legacy. |
| `legacy/Dockerfile` | Imagen Docker del componente PHP. |

### Infraestructura

| Archivo | Responsabilidad |
|---|---|
| `docker/docker-compose.yml` | Orquesta backend, frontend, PostgreSQL, Redis y legacy. |
| `docker/nginx.conf` | Configuracion de Nginx. |
| `frontend/Dockerfile` | Imagen del frontend. |
| `frontend/nginx.conf` | Configuracion Nginx para servir la SPA. |
| `backend/Dockerfile` | Imagen del backend. |

### Pruebas

| Archivo | Responsabilidad |
|---|---|
| `e2e-tests/tests/dashboard/orders-view.spec.ts` | Prueba la vista de ordenes. |
| `e2e-tests/tests/dashboard/inventory-view.spec.ts` | Prueba la vista de inventario. |
| `e2e-tests/tests/api/orders-api.spec.ts` | Prueba API de ordenes. |
| `e2e-tests/tests/api/inventory-api.spec.ts` | Prueba API de inventario. |
| `e2e-tests/tests/api/legacy-php.spec.ts` | Prueba endpoint legacy PHP. |

## Archivos transversales

| Archivo | Responsabilidad |
|---|---|
| `README.md` | Instrucciones de instalacion, ejecucion, endpoints y arquitectura general. |
| `docs/product-analysis.md` | Analisis de producto, historias de usuario y reglas. |
| `docs/architecture.md` | Arquitectura, diagramas C4, ADRs y modelo de datos. |
| `docs/sequence-diagrams-reconectado.md` | Diagramas de secuencia de flujos principales. |
| `docs/test-plan.md` | Plan de pruebas. |
| `docs/validacion-historias-de-usuario.md` | Validacion de cumplimiento por historia de usuario. |
| `backend/package.json` | Scripts y dependencias del backend. |
| `frontend/package.json` | Scripts y dependencias del frontend. |
| `e2e-tests/package.json` | Scripts y dependencias de pruebas E2E. |
| `docker-compose.yml` | Compose raiz del proyecto. |
| `.env.example` | Variables de entorno de referencia. |
