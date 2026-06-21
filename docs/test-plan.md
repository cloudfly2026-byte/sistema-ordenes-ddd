# Plan de Pruebas - Sistema de Gestión de Empaque e Inventario

## 1. Resumen

Este documento describe la estrategia de testing para el sistema de procesamiento de órdenes Shopify.

## 2. Tipos de Pruebas

### 2.1 Tests Unitarios

#### Dominio
| Archivo | Descripción | Casos |
|---|---|---|
| `packaging-calculator.spec.ts` | Cálculo de materiales | BOX_SMALL (1-2), BOX_MEDIUM (3-5), BOX_LARGE (6+), FILLER con frágiles, sin frágiles, orden vacía |
| `inventory-domain-service.spec.ts` | Lógica de inventario | canReserve, calculateAvailable, isBelowThreshold |

#### Aplicación
| Archivo | Descripción | Casos |
|---|---|---|
| `process-order.use-case.spec.ts` | Procesamiento de órdenes | Orden válida, orden inválida |

#### Guards
| Archivo | Descripción | Casos |
|---|---|---|
| `shopify-hmac.guard.spec.ts` | Validación HMAC | HMAC válido, HMAC inválido, sin HMAC |

### 2.2 Tests de Integración

| Archivo | Descripción |
|---|---|
| `webhook.controller.spec.ts` | Flujo completo de webhook: recepción → validación → encolamiento |
| `inventory.repository.spec.ts` | Operaciones CRUD con PostgreSQL, SELECT FOR UPDATE |

### 2.3 Tests E2E

| Archivo | Descripción |
|---|---|
| `order-processing.e2e-spec.ts` | Flujo completo: webhook → worker → cálculo → reserva → consumo |

## 3. Cobertura Esperada

- **Mínimo:** 80% en código de dominio
- **Mínimo:** 60% en código de aplicación
- **100%** en reglas de negocio críticas (cálculo de caja, reserva de inventario)

## 4. Escenarios Críticos a Probar

### HU-012: Reserva Transaccional
- Dos órdenes simultáneas con stock exacto
- Solo una debe tener éxito
- SELECT ... FOR UPDATE debe prevenir race conditions

### HU-004: Idempotencia
- Webhook duplicado debe ser ignorado
- No debe haber doble descuento de inventario

### HU-014: Stock Insuficiente Atómico
- Si falta un material, ningún material debe descontarse
- Rollback transaccional

## 5. Comandos

```bash
# Tests unitarios
cd backend && npm run test

# Tests con cobertura
cd backend && npm run test:cov

# Tests e2e
cd backend && npm run test:e2e
```

