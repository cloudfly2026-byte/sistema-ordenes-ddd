# Diagramas de Secuencia — Flujos del Sistema

Este documento contiene los diagramas de secuencia principales del sistema de gestión de órdenes Shopify e inventario de material de empaque, alineados con las 5 historias de usuario del reto técnico.

---

## 1. Flujo Principal Exitoso (HU1 + HU2 + HU3 + HU4)

Desde la recepción del webhook hasta que la orden queda `COMPLETED`, mostrando la separación entre la fase síncrona (HU1) y la fase asíncrona (HU2).

```mermaid
sequenceDiagram
    autonumber
    participant Shopify
    participant WC as WebhookController
    participant Guard as ShopifyHmacGuard
    participant Sync as SyncShopifyOrderUseCase
    participant WER as WebhookEventRepository
    participant OR as OrderRepository
    participant Prod as OrderQueueProducer
    participant Q as BullMQ
    participant Cons as OrderQueueConsumer
    participant Proc as ProcessOrderUseCase
    participant Dom as Order (agregado)
    participant Calc as PackagingCalculatorDomainService
    participant IR as InventoryRepository
    participant DB as PostgreSQL

    rect rgb(235, 245, 255)
    Note over Shopify,Prod: FASE SÍNCRONA — responder rápido, sin lógica de negocio (HU1)
    Shopify->>WC: POST /webhooks/shopify<br/>(topic: orders/create)
    WC->>Guard: validar X-Shopify-Hmac-SHA256
    Guard-->>WC: firma válida
    WC->>Sync: execute(payload)
    Sync->>WER: insert(shopify_event_id)<br/>ON CONFLICT DO NOTHING
    WER->>DB: INSERT INTO webhook_events
    DB-->>WER: 1 fila (evento nuevo)
    WER-->>Sync: no es duplicado
    Sync->>OR: save(order)
    OR->>DB: INSERT INTO orders
    Sync->>Prod: enqueue(orderId)
    Prod->>Q: add('process-order', { orderId })
    Q-->>Prod: job encolado
    Sync-->>WC: ok
    WC-->>Shopify: 200 OK
    end

    rect rgb(235, 255, 235)
    Note over Q,DB: FASE ASÍNCRONA — desacoplada, worker BullMQ (HU2)
    Q->>Cons: job disponible
    Cons->>Proc: execute(orderId)
    Proc->>OR: findById(orderId)
    OR->>DB: SELECT orders + order_items
    OR-->>Proc: order (agregado)
    Proc->>Dom: order.startProcessing()
    Dom-->>Proc: status=PROCESSING
    Proc->>Calc: calculate(totalProducts, hasFragileItems)
    Calc-->>Proc: { boxType, label:1, tape:1, filler }
    Note right of HU3: Reglas de negocio HU3<br/>calculadas en el dominio
    Proc->>IR: reserve(orderId, materiales)
    IR->>DB: SELECT ... FOR UPDATE
    DB-->>IR: stock suficiente
    IR->>DB: UPDATE inventory (available -=, reserved +=)
    IR-->>Proc: reserva exitosa
    Proc->>Dom: order.complete(boxType)
    Dom-->>Proc: status=COMPLETED
    Proc->>OR: update(order)
    OR->>DB: UPDATE orders SET status='COMPLETED'
    Cons-->>Q: job completado (ACK)
    end
```

---

## 2. Flujo de Fallo por Stock Insuficiente (HU4)

Sin descuentos parciales: si **un solo** material no alcanza, no se modifica ningún stock.

```mermaid
sequenceDiagram
    autonumber
    participant Q as BullMQ
    participant Cons as OrderQueueConsumer
    participant Proc as ProcessOrderUseCase
    participant Calc as PackagingCalculatorDomainService
    participant IR as InventoryRepository
    participant DB as PostgreSQL
    participant Dom as Order (agregado)

    Q->>Cons: job disponible
    Cons->>Proc: execute(orderId)
    Proc->>Dom: order.startProcessing()
    Proc->>Calc: calculate(2 productos, tiene frágiles)
    Calc-->>Proc: { boxType:BOX_SMALL, label:1, tape:1, filler:1 }

    Proc->>IR: reserve(orderId, materiales)
    IR->>DB: BEGIN
    IR->>DB: SELECT ... FOR UPDATE (BOX_SMALL)
    DB-->>IR: disponible=1 ✓
    IR->>DB: SELECT ... FOR UPDATE (LABEL)
    DB-->>IR: disponible=1 ✓
    IR->>DB: SELECT ... FOR UPDATE (TAPE)
    DB-->>IR: disponible=1 ✓
    IR->>DB: SELECT ... FOR UPDATE (FILLER)
    DB-->>IR: disponible=0 ✗ insuficiente
    IR->>DB: ROLLBACK
    Note right of DB: Ningún material modificado.<br/>Sin descuento parcial. (HU4)
    IR-->>Proc: InsufficientStockException

    Proc->>Dom: order.fail("Stock insuficiente: FILLER")
    Dom-->>Proc: status=FAILED
    Proc->>DB: UPDATE orders SET status='FAILED'
    Cons-->>Q: job completado (sin reintento)
```

---

## 3. Flujo de Webhook Duplicado (HU1 — Idempotencia)

Shopify reenvía el mismo evento (`orders/create`) dos veces casi simultáneamente.

```mermaid
sequenceDiagram
    autonumber
    participant Shopify
    participant WC as WebhookController
    participant Sync as SyncShopifyOrderUseCase
    participant WER as WebhookEventRepository
    participant DB as PostgreSQL

    par Webhook #1
        Shopify->>WC: POST /webhooks/shopify (event_id: evt_123)
        WC->>Sync: execute(payload)
        Sync->>WER: insert(evt_123) ON CONFLICT DO NOTHING
        WER->>DB: INSERT INTO webhook_events
        DB-->>WER: 1 fila insertada
        WER-->>Sync: evento nuevo
        Sync->>Sync: crear orden + encolar job
        Sync-->>WC: ok
        WC-->>Shopify: 200 OK
    and Webhook #2 (duplicado)
        Shopify->>WC: POST /webhooks/shopify (event_id: evt_123)
        WC->>Sync: execute(payload)
        Sync->>WER: insert(evt_123) ON CONFLICT DO NOTHING
        WER->>DB: INSERT INTO webhook_events
        DB-->>WER: 0 filas (ya existía)
        WER-->>Sync: duplicado detectado
        Sync-->>WC: ok (sin crear orden)
        WC-->>Shopify: 200 OK
    end
```

---

## 4. Flujo de Procesamiento Masivo (HU2)

Procesamiento de 100+ órdenes simuladas de forma desacoplada.

```mermaid
sequenceDiagram
    autonumber
    participant Script as Script de Simulación
    participant WC as WebhookController
    participant Q as BullMQ
    participant W1 as Worker 1
    participant W2 as Worker 2
    participant W3 as Worker 3
    participant DB as PostgreSQL

    Script->>WC: POST /webhooks/shopify (orden 1)
    WC->>Q: enqueue(orden-1)
    Script->>WC: POST /webhooks/shopify (orden 2)
    WC->>Q: enqueue(orden-2)
    Script->>WC: POST /webhooks/shopify (orden N)
    WC->>Q: enqueue(orden-N)
    Note over Script: ... hasta 100+ órdenes

    par Workers en paralelo
        Q->>W1: job orden-1
        W1->>DB: procesar orden-1
        DB-->>W1: COMPLETED
        Q->>W2: job orden-2
        W2->>DB: procesar orden-2
        DB-->>W2: FAILED (stock insuficiente)
        Q->>W3: job orden-3
        W3->>DB: procesar orden-3
        DB-->>W3: COMPLETED
    end

    Note over Q,TODAS: Cada orden tiene estado final<br/>(COMPLETED o FAILED) + trazabilidad
```

---

## 5. Flujo del Panel Operativo (HU5)

Consulta del dashboard y compatibilidad legacy.

```mermaid
sequenceDiagram
    autonumber
    participant User as Usuario Operativo
    participant SPA as Vue 3 Dashboard
    participant API as API Backend
    participant PHP as Legacy PHP
    participant DB as PostgreSQL

    User->>SPA: Abrir panel operativo
    SPA->>API: GET /orders
    API->>DB: SELECT orders
    DB-->>API: lista de órdenes
    API-->>SPA: 200 OK (órdenes)
    SPA->>User: Mostrar listado de órdenes

    SPA->>API: GET /inventory
    API->>DB: SELECT inventory
    DB-->>API: niveles de stock
    API-->>SPA: 200 OK (inventario)
    SPA->>User: Mostrar inventario actual

    User->>SPA: Filtrar por estado FAILED
    SPA->>API: GET /orders?status=FAILED
    API->>DB: SELECT orders WHERE status='FAILED'
    API-->>SPA: órdenes fallidas
    SPA->>User: Mostrar órdenes fallidas

    User->>SPA: Ver detalle de orden
    SPA->>API: GET /orders/:id
    API->>DB: SELECT order + order_materials
    API-->>SPA: detalle con materiales
    SPA->>User: Mostrar materiales utilizados

    Note over PHP,DB: Compatibilidad Legacy (HU5)
    User->>PHP: GET /materiales-bajo-stock.php
    PHP->>DB: SELECT materials con stock < umbral
    DB--PHP: materiales bajo stock
    PHP-->>User: [{"material": "BOX_SMALL", "stock": 5}]
```

---

## Trazabilidad con Historias de Usuario

| Diagrama | HU Relacionada |
|---|---|
| 1. Flujo principal | HU1, HU2, HU3, HU4 |
| 2. Fallo por stock | HU4 |
| 3. Webhook duplicado | HU1 |
| 4. Procesamiento masivo | HU2 |
| 5. Panel operativo | HU5 |

---

**Documento generado por:** OWL — Senior Software Architect
**Versión:** 3.0
**Fecha:** 2025-07-15
