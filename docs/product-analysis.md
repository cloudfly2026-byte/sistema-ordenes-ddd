# Análisis de Producto: Gestión de Órdenes Shopify e Inventario de Material de Empaque

## 1. Resumen Ejecutivo

### Contexto

Una empresa de comercio electrónico opera múltiples tiendas en Shopify y requiere desarrollar una solución completa (Frontend y Backend) para gestionar el procesamiento de órdenes, el control de inventario de material de empaque y la trazabilidad operativa de los pedidos.

### Alcance

El sistema cubre los siguientes procesos de negocio:

1. **Recepción de Órdenes:** Captura automática de órdenes vía webhooks de Shopify (`orders/create`).
2. **Procesamiento Masivo:** Procesamiento desacoplado de órdenes para soportar picos de alta demanda.
3. **Cálculo de Materiales:** Determinación automática de materiales de empaque según reglas de negocio.
4. **Control de Inventario:** Descuento atómico de inventario, evitando descuadres y consumo concurrente.
5. **Panel Operativo:** Dashboard unificado para consultar órdenes procesadas, inventario y materiales consumidos.
6. **Compatibilidad Legacy:** Componente PHP para consulta de materiales con bajo inventario.

### Valor de Negocio

- **Escalabilidad:** Capacidad para manejar volúmenes crecientes de órdenes sin degradar el rendimiento.
- **Mantenibilidad:** Arquitectura modular con DDD y principios SOLID.
- **Consistencia de Inventario:** Transacciones ACID que previenen descuadres y sobreventa.
- **Rendimiento:** Procesamiento asíncrono que soporta picos de alta demanda.
- **Trazabilidad:** Registro completo del ciclo de vida de cada orden.
- **Compatibilidad:** Integración sin interrupciones con sistemas legacy existentes.

---

## 2. Requerimientos Técnicos

### 2.1 Backend

| Requerimiento | Especificación |
|---|---|
| **Framework** | NestJS |
| **Lenguaje** | TypeScript |
| **Base de Datos** | PostgreSQL |
| **Caché** | Redis |
| **Arquitectura** | Domain Driven Design (DDD), principios SOLID, arquitectura modular |
| **Procesamiento Asíncrono** | Mecanismo desacoplado para el procesamiento de órdenes |
| **Integración** | Recepción de Webhooks Shopify |
| **Compatibilidad Legacy** | Desarrollo de un componente en PHP |
| **Pruebas** | Unitarias y de integración |
| **Documentación** | Swagger / OpenAPI |

### 2.2 Frontend

| Requerimiento | Especificación |
|---|---|
| **Framework** | Vue.js (2 o 3) o Svelte |
| **Interfaz gráfica** | Polaris Web Components o diseño inspirado en Shopify Admin |
| **Manejo de estado** | Pinia, Vuex o equivalente |
| **Pruebas** | Jest, Vitest o Testing Library |
| **Experiencia de usuario** | Estados de carga, error, filtros y actualización automática de información |

---

## 3. Historias de Usuario

### HU1 — Recepción de Órdenes desde Shopify

**Descripción:** Como sistema, quiero recibir órdenes provenientes de Shopify para iniciar su procesamiento sin afectar el tiempo de respuesta del webhook.

**Criterios de Aceptación:**

| # | Criterio |
|---|---|
| 1 | Implementar un endpoint para recibir órdenes desde Shopify. |
| 2 | Registrar el evento recibido. |
| 3 | Evitar el procesamiento duplicado de una misma orden. |
| 4 | Garantizar que la lógica de negocio no se ejecute directamente desde el webhook. |

---

### HU2 — Procesamiento Masivo de Órdenes

**Descripción:** Como sistema, quiero procesar órdenes de forma desacoplada para soportar picos de alta demanda sin afectar la estabilidad de la plataforma.

**Criterios de Aceptación:**

| # | Criterio |
|---|---|
| 1 | Implementar un mecanismo que permita desacoplar la recepción de órdenes de su procesamiento. |
| 2 | Implementar un componente encargado exclusivamente del procesamiento de órdenes. |
| 3 | Procesar al menos 100 órdenes simuladas. |
| 4 | Registrar el estado de cada orden. |
| 5 | Permitir reintentos ante errores temporales. |
| 6 | Mantener trazabilidad por identificador de orden. |

---

### HU3 — Cálculo de Material de Empaque

**Descripción:** Como sistema, quiero calcular automáticamente los materiales de empaque requeridos para cada orden con el fin de descontarlos correctamente del inventario.

**Criterios de Aceptación:**

| # | Criterio |
|---|---|
| 1 | Implementar las reglas de negocio dentro del dominio de la aplicación. |
| 2 | Toda orden debe consumir una etiqueta y una unidad de cinta. |
| 3 | Si la orden contiene productos frágiles debe consumir material de protección adicional. |
| 4 | Registrar qué materiales fueron utilizados en cada orden. |

#### Reglas de Negocio (Cálculo de Materiales)

| Condición | Material |
|---|---|
| Hasta 2 productos | Caja pequeña |
| Entre 3 y 5 productos | Caja mediana |
| Más de 5 productos | Caja grande |
| Toda orden | Etiqueta |
| Toda orden | Cinta |
| Si contiene productos frágiles | Material de protección |

#### Inventario Inicial

| Código | Material | Stock |
|---|---|---|
| `BOX_SMALL` | Caja pequeña | 100 |
| `BOX_MEDIUM` | Caja mediana | 80 |
| `BOX_LARGE` | Caja grande | 50 |
| `LABEL` | Etiqueta | 500 |
| `TAPE` | Cinta | 200 |
| `FILLER` | Material de protección | 120 |

---

### HU4 — Sincronización y Control de Inventario

**Descripción:** Como sistema, quiero mantener un inventario consistente para evitar descuadres y problemas de disponibilidad de materiales.

**Criterios de Aceptación:**

| # | Criterio |
|---|---|
| 1 | Descontar inventario. |
| 2 | Si no existe inventario suficiente, la orden debe marcarse como **FALLIDA**. |
| 3 | No debe existir descuento parcial de inventario. |
| 4 | Evitar inconsistencias cuando múltiples órdenes consumen los mismos materiales simultáneamente. |

---

### HU5 — Panel Operativo y Compatibilidad Legacy

**Descripción:** Como usuario operativo, quiero consultar las órdenes procesadas, el estado del inventario y los materiales consumidos desde una única interfaz administrativa.

**Criterios de Aceptación:**

| # | Criterio |
|---|---|
| 1 | Desarrollar una interfaz en Vue.js o Svelte. |
| 2 | Mostrar indicadores generales de operación. |
| 3 | Mostrar listado de órdenes procesadas. |
| 4 | Mostrar inventario actual de materiales. |
| 5 | Permitir filtrar órdenes por estado. |
| 6 | Mostrar detalle de materiales utilizados por cada orden. |
| 7 | Manejar estados de carga y error. |

**Compatibilidad Legacy:**

Implementar un componente PHP para consultar materiales con bajo inventario:

Archivo: `legacy/materiales-bajo-stock.php`

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

## 4. Requerimientos No Funcionales

### Rendimiento

| ID | Requerimiento |
|---|---|
| **RNF-001** | El webhook debe responder en menos de 500ms (sin ejecutar lógica de negocio pesada). |
| **RNF-002** | El dashboard debe cargar y mostrar datos actualizados en menos de 2 segundos. |
| **RNF-003** | El sistema debe soportar el procesamiento de al menos 100 órdenes simuladas. |

### Disponibilidad

| ID | Requerimiento |
|---|---|
| **RNF-004** | En caso de fallo transitorio, el sistema debe reintentar el procesamiento automáticamente. |
| **RNF-005** | El sistema debe mantener trazabilidad por identificador de orden. |

### Seguridad

| ID | Requerimiento |
|---|---|
| **RNF-006** | Todas las comunicaciones externas deben ser cifradas mediante HTTPS. |
| **RNF-007** | La autenticación de webhooks de Shopify debe ser validada estrictamente (HMAC-SHA256). |

### Escalabilidad

| ID | Requerimiento |
|---|---|
| **RNF-008** | La arquitectura debe permitir el escalado horizontal de los componentes de procesamiento. |
| **RNF-009** | El procesamiento asíncrono debe desacoplar la recepción del webhook del procesamiento real. |

### Mantenibilidad

| ID | Requerimiento |
|---|---|
| **RNF-010** | El código debe seguir principios SOLID y estar documentado (Swagger/OpenAPI). |
| **RNF-011** | El sistema debe incluir logging estructurado para facilitar la depuración. |

---

## 5. Restricciones Técnicas

| ID | Restricción |
|---|---|
| **RT-001** | El backend debe ser desarrollado en **NestJS** con **TypeScript**. |
| **RT-002** | El frontend debe ser desarrollado en **Vue.js (2 o 3)** o **Svelte**. |
| **RT-003** | La base de datos debe ser **PostgreSQL**. |
| **RT-004** | El componente legacy debe ser implementado en **PHP**. |
| **RT-005** | Se debe utilizar un sistema de colas (BullMQ + Redis) para el procesamiento asíncrono. |
| **RT-006** | El despliegue debe ser compatible con contenedores Docker. |
| **RT-007** | La arquitectura debe seguir **Domain Driven Design (DDD)** con principios **SOLID**. |
| **RT-008** | La API debe estar documentada con **Swagger / OpenAPI**. |

---

## 6. Casos Límite y Edge Cases

| # | Escenario | Comportamiento Esperado |
|---|---|---|
| 1 | Orden con 0 productos | Orden marcada como FALLIDA o ignorada |
| 2 | Orden con exactamente 2 productos | Usa `BOX_SMALL` |
| 3 | Orden con exactamente 3 productos | Usa `BOX_MEDIUM` |
| 4 | Orden con exactamente 5 productos | Usa `BOX_MEDIUM` |
| 5 | Orden con exactamente 6 productos | Usa `BOX_LARGE` |
| 6 | Producto frágil único | Usa `BOX_SMALL` + `LABEL` + `TAPE` + `FILLER` |
| 7 | Múltiples productos frágiles | Solo 1 `FILLER` adicional (no por cada frágil) |
| 8 | Stock exacto para una orden | Orden completada, stock queda en 0 |
| 9 | Stock insuficiente para 1 material | Orden FALLIDA, sin descuento parcial |
| 10 | Stock insuficiente para múltiples materiales | Orden FALLIDA, sin descuento parcial |
| 11 | Webhook duplicado | Ignorado, sin doble procesamiento |
| 12 | Webhook con formato inválido | Rechazado, error registrado |
| 13 | Webhook con datos incompletos | Orden FALLIDA con motivo "Datos incompletos" |
| 14 | Caída del sistema durante reserva | Al recuperarse, liberar reservas incompletas |
| 15 | Intentar procesar orden ya completada | Rechazada sin modificación |
| 16 | Productos con cantidad 0 en línea | Ignorados para cálculo de caja |
| 17 | Material requerido no existe en BD | Orden FALLIDA |
| 18 | 100+ órdenes simultáneas | Procesamiento desacoplado sin pérdida |

---

## 7. Escenarios de Concurrencia

### Race Conditions Identificadas

| # | Escenario | Problema | Prevención |
|---|---|---|---|
| 1 | **Reserva de Inventario:** Dos órdenes intentan reservar el último material simultáneamente. | Sobreventa si ambas leen stock disponible. | `SELECT ... FOR UPDATE` con transacciones ACID. |
| 2 | **Consumo de Inventario:** Dos procesos intentan consumir la misma reserva. | Doble descuento o reserva no liberada. | Transacciones con bloqueo pesimista u optimista. |
| 3 | **Webhook Duplicado:** Shopify envía dos webhooks casi simultáneos. | Doble procesamiento y descuento. | Idempotencia: `UNIQUE(shopify_event_id)` + `ON CONFLICT DO NOTHING`. |
| 4 | **Actualización de Estado:** Un proceso marca COMPLETED mientras otro marca FAILED. | Estado inconsistente. | Transacciones atómicas con máquina de estados explícita. |

---

## 8. Riesgos

| ID | Descripción | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-001 | Pérdida de webhooks por caídas del sistema. | Media | Alta | Cola persistente (BullMQ) con reintentos y dead letter queue. |
| R-002 | Inconsistencia en inventario por race conditions. | Alta | Alta | Transacciones ACID con `SELECT ... FOR UPDATE`. |
| R-003 | Rendimiento degradado bajo picos de demanda. | Media | Alta | Procesamiento asíncrono desacoplado. Escalado horizontal. |
| R-004 | Vulnerabilidades en validación de webhooks. | Baja | Alta | Validación estricta de HMAC-SHA256. |
| R-005 | Complejidad del componente PHP legacy. | Media | Baja | Documentar como deprecated con plan de migración. |

---

## 9. Dependencias

### Entre Componentes

| ID | Dependencia |
|---|---|
| D-001 | El webhook receiver depende del sistema de colas para encolar órdenes. |
| D-002 | El procesador de órdenes depende de la cola para obtener órdenes. |
| D-003 | La gestión de inventario depende de PostgreSQL. |
| D-004 | El dashboard frontend depende de la API backend. |
| D-005 | El componente PHP legacy depende de PostgreSQL (consulta directa). |

### Externas

| ID | Dependencia |
|---|---|
| D-006 | El sistema depende de Shopify para enviar webhooks `orders/create`. |
| D-007 | El sistema depende de la infraestructura de red para recepción de webhooks. |

---

**Documento generado por:** OWL — Senior Software Architect
**Versión:** 3.0
**Fecha:** 2025-07-15
