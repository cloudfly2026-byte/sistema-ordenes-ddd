# Plan de Pruebas — Gestión de Órdenes Shopify e Inventario de Material de Empaque

## 1. Resumen

Este documento describe la estrategia de testing para el sistema de procesamiento de órdenes Shopify, cubriendo las 5 historias de usuario definidas en el reto técnico.

---

## 2. Tipos de Pruebas

### 2.1 Tests Unitarios

#### Dominio — Packaging (HU3)

| Archivo | Descripción | Casos |
|---|---|---|
| `packaging-calculator.spec.ts` | Cálculo de materiales | BOX_SMALL (1-2 productos), BOX_MEDIUM (3-5), BOX_LARGE (6+), FILLER con frágiles, sin frágiles, orden vacía |

#### Dominio — Inventory (HU4)

| Archivo | Descripción | Casos |
|---|---|---|
| `inventory.entity.spec.ts` | Entidad de inventario | `availableStock`, `canReserve`, `reserve`, `consume`, `release` |
| `inventory-domain-service.spec.ts` | Lógica de inventario | `canReserve` (suficiente/insuficiente), `calculateAvailable`, `isBelowThreshold` |

#### Dominio — Orders (HU2)

| Archivo | Descripción | Casos |
|---|---|---|
| `order.entity.spec.ts` | Ciclo de vida de la orden | Creación, transiciones: PENDING→PROCESSING→COMPLETED, PENDING→PROCESSING→FAILED, eventos de dominio |

#### Aplicación

| Archivo | Descripción | Casos |
|---|---|---|
| `process-order.use-case.spec.ts` | Procesamiento de órdenes | Orden no encontrada → FAILED, stock suficiente → COMPLETED, stock insuficiente → FAILED |

#### Guards

| Archivo | Descripción | Casos |
|---|---|---|
| `shopify-hmac.guard.spec.ts` | Validación HMAC (HU1) | HMAC válido → `true`, HMAC inválido → `UnauthorizedException`, header ausente → `UnauthorizedException`, fallback a `JSON.stringify(body)`, secret vacío |

### 2.2 Tests de Integración

| Archivo | Descripción | HU |
|---|---|---|
| `shopify-webhook.integration.spec.ts` | Flujo completo de webhook: recepción → validación HMAC → encolamiento → procesamiento | HU1, HU2, HU3, HU4 |
| `process-order.integration.spec.ts` | Procesamiento de órdenes: stock suficiente → COMPLETED, stock insuficiente → FAILED sin descuento parcial, frágiles → FILLER | HU2, HU3, HU4 |

### 2.3 Tests E2E — API

| Archivo | Descripción | HU |
|---|---|---|
| `shopify-webhook.spec.ts` | Recepción de webhooks: 200 OK, HMAC válido/inválido, duplicados, formato inválido | HU1 |
| `orders-api.spec.ts` | GET /orders (lista, paginación, filtro por estado), GET /orders/:id | HU5 |
| `inventory-api.spec.ts` | GET /inventory (lista completa, 6 materiales, stock no negativo), GET /inventory/:materialId, GET /inventory/low-stock, consistencia tras procesamiento | HU4, HU5 |
| `legacy-php.spec.ts` | GET /materiales-bajo-stock.php: formato JSON con `material` y `stock`, códigos válidos, array puede estar vacío, health check | HU5 |

### 2.4 Tests E2E — Proceso de Negocio

| Archivo | Descripción | HU |
|---|---|---|
| `packaging-calculation.spec.ts` | Cálculo de materiales: BOX_SMALL/MEDIUM/LARGE, LABEL/TAPE, FILLER con/sin frágiles, orden vacía | HU3 |
| `order-lifecycle.spec.ts` | Ciclo de vida: completar orden, orden vacía, motivo fallo, auditoría, idempotencia post-crash | HU2 |
| `inventory-transactional.spec.ts` | Verificación stock, reserva transaccional, stock insuficiente → FAILED, stock no negativo, anti-doble-descuento | HU4 |
| `inventory-concurrency.spec.ts` | **Concurrencia:** stock nunca negativo bajo carga paralela, sin descuento parcial, idempotencia (doble webhook), frágiles en paralelo, consistencia global (delta = suma de descuentos), 100+ órdenes simultáneas | HU2, HU4 |

### 2.5 Tests E2E — Dashboard (Frontend)

| Archivo | Descripción | HU |
|---|---|---|
| `orders-view.spec.ts` | Vista de órdenes: tabla, status badges, navegación a detalle | HU5 |
| `inventory-view.spec.ts` | Vista inventario: materiales con stock, indicadores estado, vista bajo stock | HU5 |

---

## 3. Cobertura Esperada

| Capa | Cobertura Mínima |
|---|---|
| **Dominio** (reglas de negocio) | 90% |
| **Aplicación** (casos de uso) | 70% |
| **Reglas críticas** (HU3 cálculo de caja, HU4 reserva de inventario) | 100% |

---

## 4. Escenarios Críticos a Probar

### HU1 — Recepción de Órdenes

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Webhook válido con HMAC correcto | 200 OK, evento registrado, job encolado |
| 2 | Webhook con HMAC inválido | 401 Unauthorized |
| 3 | Webhook duplicado (mismo `shopify_event_id`) | 200 OK, sin crear orden ni encolar job |
| 4 | Webhook sin lógica de negocio pesada | Respuesta en < 500ms |

### HU2 — Procesamiento Masivo

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Procesamiento de 100 órdenes simuladas | Todas procesadas con estado final (COMPLETED o FAILED) |
| 2 | Error transitorio durante procesamiento | Reintento automático con backoff |
| 3 | Trazabilidad por orden | Cada orden tiene registro de su procesamiento |
| 4 | 100+ órdenes simultáneas | Sin inconsistencias de inventario |

### HU3 — Cálculo de Materiales

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Orden con 1 producto | BOX_SMALL + LABEL + TAPE |
| 2 | Orden con 2 productos | BOX_SMALL + LABEL + TAPE |
| 3 | Orden con 3 productos | BOX_MEDIUM + LABEL + TAPE |
| 4 | Orden con 5 productos | BOX_MEDIUM + LABEL + TAPE |
| 5 | Orden con 6 productos | BOX_LARGE + LABEL + TAPE |
| 6 | Orden con productos frágiles | +1 FILLER |
| 7 | Orden con múltiples frágiles | Solo 1 FILLER (no por cada frágil) |
| 8 | Orden sin frágiles | Sin FILLER |

### HU4 — Control de Inventario

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Stock suficiente para todos los materiales | Orden COMPLETED, stock descontado |
| 2 | Stock insuficiente para 1 material | Orden FAILED, **sin descuento parcial** |
| 3 | Stock insuficiente para múltiples materiales | Orden FAILED, **sin descuento parcial** |
| 4 | Dos órdenes simultáneas con stock exacto | Solo una tiene éxito (SELECT FOR UPDATE) |
| 5 | Stock exacto (queda en 0) | Orden COMPLETED, stock = 0 |
| 6 | Múltiples órdenes en paralelo | Stock nunca negativo, sin doble descuento |
| 7 | Webhook duplicado | No causa doble descuento |

### HU5 — Panel Operativo

| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | Carga del dashboard | Muestra indicadores, órdenes e inventario |
| 2 | Filtrar órdenes por estado | Solo muestra órdenes del estado seleccionado |
| 3 | Ver detalle de materiales por orden | Muestra materiales utilizados |
| 4 | Estado de carga | Muestra indicador mientras carga datos |
| 5 | Estado de error | Muestra mensaje de error si falla la API |
| 6 | Legacy PHP (`materiales-bajo-stock.php`) | Retorna JSON con formato `[{"material": "BOX_SMALL", "stock": 5}]` |

---

## 5. Datos de Prueba

### Inventario Inicial (Fixture)

```typescript
const initialInventory = [
  { code: 'BOX_SMALL',  name: 'Caja pequeña',          stock: 100 },
  { code: 'BOX_MEDIUM', name: 'Caja mediana',          stock: 80 },
  { code: 'BOX_LARGE',  name: 'Caja grande',           stock: 50 },
  { code: 'LABEL',      name: 'Etiqueta',              stock: 500 },
  { code: 'TAPE',       name: 'Cinta',                 stock: 200 },
  { code: 'FILLER',     name: 'Material de protección', stock: 120 },
];
```

### Órdenes de Ejemplo

```typescript
const sampleOrders = [
  { id: 'ord-001', items: [{ sku: 'SKU-1', qty: 1, fragile: false }] },           // BOX_SMALL
  { id: 'ord-002', items: [{ sku: 'SKU-1', qty: 1, fragile: true }] },            // BOX_SMALL + FILLER
  { id: 'ord-003', items: [{ sku: 'SKU-1', qty: 3, fragile: false }] },           // BOX_MEDIUM
  { id: 'ord-004', items: [{ sku: 'SKU-1', qty: 6, fragile: true }] },            // BOX_LARGE + FILLER
  { id: 'ord-005', items: [{ sku: 'SKU-1', qty: 2, fragile: true },               // BOX_MEDIUM + FILLER
                           { sku: 'SKU-2', qty: 1, fragile: true }] },
];
```

---

## 6. Comandos

```bash
# Tests unitarios
cd backend && npm run test

# Tests con cobertura
cd backend && npm run test:cov

# Tests e2e (backend)
cd backend && npm run test:e2e

# Tests e2e (Playwright)
cd e2e-tests && npx playwright test

# Tests del frontend
cd frontend && npm run test

# Tests del frontend con cobertura
cd frontend && npm run test:cov
```

---

**Documento generado por:** OWL — Senior Software Architect
**Versión:** 4.0
**Fecha:** 2025-07-15
