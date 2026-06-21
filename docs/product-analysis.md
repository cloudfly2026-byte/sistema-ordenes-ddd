# Análisis de Producto: Sistema de Gestión de Empaque y Inventario para Shopify

## 1. Resumen Ejecutivo

### Contexto
El presente documento detalla el análisis de producto para el desarrollo de un sistema de gestión de empaque e inventario diseñado para integrarse con la plataforma Shopify. El sistema nace de la necesidad de automatizar y optimizar el proceso de preparación de pedidos (picking y packing) en un entorno de comercio electrónico, asegurando que cada orden sea empaquetada correctamente según las características de los productos y que el inventario se gestione de manera precisa y transaccional.

### Alcance
El sistema cubre los siguientes procesos de negocio:
1.  **Recepción de Órdenes:** Captura automática de nuevas órdenes a través de webhooks de Shopify.
2.  **Cálculo de Materiales:** Determinación dinámica de los materiales de empaque (cajas, etiquetas, cinta, relleno) basada en reglas de negocio predefinidas.
3.  **Gestión de Inventario:** Reserva y consumo atómico de materiales de empaque, garantizando la consistencia del stock.
4.  **Monitoreo:** Exposición de un dashboard en tiempo real para el seguimiento de órdenes, inventario y estado del sistema.
5.  **Alertas:** Notificaciones automáticas cuando el stock de materiales cae por debajo de umbrales críticos.

### Valor de Negocio
*   **Reducción de Errores:** Automatización del cálculo de materiales, eliminando errores humanos en la selección de cajas y materiales.
*   **Optimización de Costos:** Uso eficiente de materiales de empaque (evitar cajas demasiado grandes, reducir desperdicio).
*   **Mejora en la Experiencia del Cliente:** Envíos mejor protegidos (uso correcto de relleno para frágiles) y tiempos de procesamiento más rápidos.
*   **Visibilidad Operativa:** Dashboard en tiempo real para la toma de decisiones y la identificación de cuellos de botella.
*   **Escalabilidad:** Capacidad para manejar un volumen creciente de órdenes sin degradar el rendimiento.
*   **Integración Nativa:** Conexión directa con Shopify, aprovechando su ecosistema y eventos.

## 2. Requerimientos Funcionales

**RF-001: Recepción de Webhook de Creación de Orden**
El sistema debe ser capaz de recibir y procesar webhooks de Shopify del tipo `orders/create` de forma asíncrona y segura.

**RF-002: Validación de Webhook**
El sistema debe validar la autenticidad de cada webhook recibido de Shopify utilizando la firma HMAC proporcionada en los headers.

**RF-003: Extracción de Datos de la Orden**
Una vez validado el webhook, el sistema debe extraer la información relevante de la orden, incluyendo: ID de la orden, lista de productos (SKU, cantidad, atributo de fragilidad), y datos del cliente.

**RF-004: Cálculo de Tipo de Caja**
El sistema debe determinar el tipo de caja necesario basado en la cantidad total de productos en la orden:
*   1-2 productos: `BOX_SMALL`
*   3-5 productos: `BOX_MEDIUM`
*   6+ productos: `BOX_LARGE`

**RF-005: Cálculo de Materiales Obligatorios**
Para cada orden procesada, el sistema debe asignar automáticamente los siguientes materiales:
*   1 `LABEL`
*   1 `TAPE`

**RF-006: Cálculo de Material Adicional para Frágiles**
Si uno o más productos en la orden están marcados como frágiles, el sistema debe añadir 1 unidad de `FILLER` a la lista de materiales requeridos.

**RF-007: Verificación de Disponibilidad de Stock**
Antes de procesar una orden, el sistema debe verificar que exista stock suficiente para todos los materiales de empaque calculados.

**RF-008: Reserva de Inventario**
Si hay stock suficiente, el sistema debe reservar las cantidades necesarias de cada material de empaque de forma transaccional, evitando que otras órdenes puedan consumir ese stock simultáneamente.

**RF-009: Consumo de Inventario**
Una vez que la orden ha sido completamente procesada y empaquetada, el sistema debe consumir definitivamente el inventario reservado.

**RF-010: Manejo de Stock Insuficiente**
Si no hay stock suficiente para todos los materiales requeridos, la orden debe ser marcada como `FAILED` y no se debe realizar ningún descuento parcial de inventario.

**RF-011: Actualización de Estado de Orden**
El sistema debe actualizar el estado de la orden (`PROCESSING`, `COMPLETED`, `FAILED`) y registrar el motivo del fallo en caso de ser `FAILED`.

**RF-012: Registro de Auditoría**
Todas las acciones realizadas sobre una orden y el inventario deben ser registradas con marca de tiempo y detalles relevantes para fines de auditoría.

**RF-013: Dashboard de Monitoreo**
El sistema debe exponer un dashboard web que permita visualizar:
*   Órdenes recientes y su estado.
*   Niveles actuales de inventario de materiales.
*   Alertas de bajo stock.
*   Métricas de rendimiento del sistema.

**RF-014: Endpoint de Bajo Stock (Legacy)**
El sistema debe mantener un endpoint PHP legacy que permita consultar el estado de bajo stock de los materiales.

**RF-015: Notificación de Bajo Stock**
El sistema debe generar una alerta (visual en dashboard y/o log) cuando el stock de cualquier material caiga por debajo de un umbral predefinido.

## 3. Requerimientos No Funcionales

### Rendimiento
*   **RNF-001:** El sistema debe ser capaz de procesar un webhook de Shopify en menos de 500ms (excluyendo el tiempo de respuesta de la red).
*   **RNF-002:** El dashboard debe cargar y mostrar los datos actualizados en menos de 2 segundos.
*   **RNF-003:** El sistema debe soportar un throughput mínimo de 100 órdenes por minuto.

### Disponibilidad
*   **RNF-004:** El sistema debe tener una disponibilidad del 99.9% (excluyendo mantenimiento programado).
*   **RNF-005:** En caso de fallo en el procesamiento de un webhook, el sistema debe reintentar el procesamiento al menos 3 veces con un backoff exponencial.

### Seguridad
*   **RNF-006:** Todas las comunicaciones externas (webhooks, API del dashboard) deben ser cifradas mediante HTTPS.
*   **RNF-007:** La autenticación de webhooks de Shopify debe ser validada estrictamente.
*   **RNF-008:** El acceso al dashboard debe estar protegido por autenticación (ej. JWT, OAuth).
*   **RNF-009:** Los datos sensibles de los clientes deben ser tratados conforme a las políticas de privacidad y no deben ser almacenados innecesariamente.

### Escalabilidad
*   **RNF-010:** La arquitectura debe permitir el escalado horizontal de los componentes de procesamiento de órdenes.
*   **RNF-011:** La base de datos debe ser capaz de manejar un crecimiento en el volumen de órdenes y transacciones de inventario sin degradar el rendimiento.

### Mantenibilidad
*   **RNF-012:** El código debe seguir estándares de codificación y estar documentado.
*   **RNF-013:** El sistema debe incluir logging estructurado para facilitar la depuración y el monitoreo.

## 4. Restricciones Técnicas

*   **RT-001:** El backend principal debe ser desarrollado en **Node.js (v18 o superior)**.
*   **RT-002:** El frontend del dashboard debe ser desarrollado en **Vue 3** con **TypeScript**.
*   **RT-003:** La base de datos principal debe ser **PostgreSQL (v14 o superior)**.
*   **RT-004:** El endpoint de bajo stock legacy debe ser implementado en **PHP (v8.1 o superior)**.
*   **RT-005:** Se debe utilizar un sistema de colas (ej. RabbitMQ, Redis, o similar) para el procesamiento asíncrono de webhooks.
*   **RT-006:** El despliegue debe ser compatible con contenedores Docker.
*   **RT-007:** Se debe utilizar un ORM/Query Builder para la interacción con la base de datos (ej. Prisma, TypeORM, Knex).

## 5. Riesgos

| ID Riesgo | Descripción | Probabilidad | Impacto | Mitigación |
| :-------- | :---------- | :----------- | :------ | :--------- |
| R-001     | Pérdida de webhooks debido a caídas del sistema o problemas de red. | Medio | Alto | Implementar un sistema de colas persistente con reintentos y dead letter queue. Considerar un mecanismo de polling de respaldo para órdenes no procesadas. |
| R-002     | Inconsistencia en el inventario debido a race conditions en la reserva/consumo. | Alto | Alto | Implementar transacciones de base de datos estrictas con bloqueo a nivel de fila (SELECT ... FOR UPDATE) o bloqueo optimista con reintentos. |
| R-003     | Rendimiento degradado del sistema bajo picos de alta demanda. | Medio | Alto | Diseñar para escalado horizontal. Implementar rate limiting en la recepción de webhooks. Optimizar consultas a la base de datos. |
| R-004     | Vulnerabilidades de seguridad en la validación de webhooks o acceso al dashboard. | Bajo | Alto | Realizar auditorías de seguridad. Implementar validación estricta de HMAC. Usar prácticas de seguridad estándar para autenticación y autorización. |
| R-005     | Fallos en la integración con la API de Shopify (cambios, rate limits). | Medio | Medio | Monitorear la API de Shopify. Implementar manejo robusto de errores y reintentos para llamadas a la API. |
| R-006     | Complejidad en la migración o mantenimiento del endpoint PHP legacy. | Medio | Bajo | Documentar claramente el endpoint. Considerar una estrategia de reemplazo a futuro si es posible. |

## 6. Dependencias

### Entre Componentes
*   **D-001:** El componente de recepción de webhooks depende del sistema de colas para encolar las órdenes.
*   **D-002:** El componente de procesamiento de órdenes (cálculo de materiales, gestión de inventario) depende del sistema de colas para obtener las órdenes.
*   **D-003:** El componente de gestión de inventario depende de la base de datos PostgreSQL.
*   **D-004:** El dashboard (frontend Vue 3) depende de una API backend (Node.js) para obtener datos de órdenes e inventario.
*   **D-005:** El endpoint PHP legacy depende de la base de datos PostgreSQL (directamente o a través de un servicio).
*   **D-006:** El componente de notificación de bajo stock depende del componente de gestión de inventario.

### Externas
*   **D-007:** El sistema depende de la plataforma Shopify para enviar webhooks (`orders/create`).
*   **D-008:** El sistema depende de la API de Shopify para obtener detalles adicionales de productos si no vienen completos en el webhook (aunque el RF-003 asume extracción del webhook, esto es una dependencia potencial).
*   **D-009:** El sistema depende de la infraestructura de red para la recepción de webhooks y el acceso al dashboard.

## 7. Casos Límite y Edge Cases

1.  **Orden con 0 productos:** ¿Cómo se maneja una orden vacía? (Probablemente `FAILED` o ignorada).
2.  **Orden con exactamente 2 productos:** Debe usar `BOX_SMALL`.
3.  **Orden con exactamente 3 productos:** Debe usar `BOX_MEDIUM`.
4.  **Orden con exactamente 5 productos:** Debe usar `BOX_MEDIUM`.
5.  **Orden con exactamente 6 productos:** Debe usar `BOX_LARGE`.
6.  **Producto frágil único:** Debe usar `BOX_SMALL`, `LABEL`, `TAPE`, `FILLER`.
7.  **Múltiples productos frágiles en una orden:** Solo se añade 1 `FILLER` adicional, independientemente de la cantidad de frágiles.
8.  **Stock exacto para una orden:** La orden debe completarse y el stock debe quedar en 0.
9.  **Stock insuficiente para un solo material:** La orden debe fallar completamente (`FAILED`), sin descontar nada.
10. **Stock insuficiente para múltiples materiales:** La orden debe fallar completamente (`FAILED`), sin descontar nada.
11. **Webhook duplicado:** El sistema debe ser capaz de identificar y ignorar webhooks duplicados para la misma orden.
12. **Webhook con formato inválido:** El sistema debe rechazar el webhook y registrar el error.
13. **Webhook con datos incompletos:** El sistema debe manejar la falta de datos (ej. sin lista de productos) y marcar la orden como `FAILED`.
14. **Caída del sistema durante la reserva de inventario:** Al recuperarse, el sistema debe ser capaz de identificar y liberar reservas no completadas.
15. **Caída del sistema durante el consumo de inventario:** Al recuperarse, el sistema debe ser capaz de identificar reservas pendientes de consumo y completarlas o revertirlas según la lógica de negocio.
16. **Intento de procesar una orden ya procesada:** El sistema debe ignorar el reintento si la orden ya está en estado `COMPLETED` o `FAILED`.
17. **Productos con cantidad 0 en la línea de la orden:** ¿Cómo se manejan? (Probablemente se ignoran para el cálculo de la caja, pero se registran).
18. **Materiales de empaque no definidos en el sistema:** ¿Qué pasa si un material requerido no existe en la tabla de inventario? (Probablemente `FAILED`).

## 8. Escenarios de Concurrencia

### Race Conditions Identificadas

1.  **Reserva de Inventario (Read-Modify-Write):**
    *   **Escenario:** Dos órdenes (A y B) intentan reservar la última unidad de `BOX_SMALL` simultáneamente.
    *   **Problema:** Ambas leen que hay 1 unidad disponible. Ambas proceden a reservar y a actualizar el stock a 0. Esto lleva a una sobreventa.
    *   **Prevención:** Utilizar transacciones de base de datos con bloqueo pesimista (`SELECT ... FOR UPDATE`) en la fila del material de inventario antes de verificar y descontar. Alternativamente, usar bloqueo optimista con un campo de versión y reintentar la transacción en caso de conflicto.

2.  **Consumo de Inventario (Read-Modify-Write):**
    *   **Escenario:** Dos procesos intentan consumir la misma reserva de inventario simultáneamente.
    *   **Problema:** El inventario se consume dos veces, o la reserva no se libera correctamente.
    *   **Prevención:** Similar a la reserva, usar transacciones con bloqueo pesimista o optimista sobre la fila de la reserva o del material.

3.  **Procesamiento de Webhook Duplicado:**
    *   **Escenario:** Shopify envía dos webhooks para la misma orden de creación casi simultáneamente.
    *   **Problema:** La orden se procesa dos veces, llevando a un doble descuento de inventario o estados inconsistentes.
    *   **Prevención:** Implementar idempotencia en el procesamiento de webhooks. Al recibir un webhook, verificar si la orden ya existe en la base de datos. Si existe y ya fue procesada (`COMPLETED` o `FAILED`), ignorar el webhook. Si existe y está `PROCESSING`, se puede encolar de nuevo o esperar. Se puede usar un unique constraint en el ID de la orden de Shopify en la base de datos.

4.  **Actualización de Estado de Orden:**
    *   **Escenario:** Un proceso intenta marcar una orden como `COMPLETED` mientras otro intenta marcarla como `FAILED` (ej. por un error tardío en la reserva).
    *   **Problema:** Estado inconsistente de la orden.
    *   **Prevención:** Usar transacciones atómicas para actualizar el estado de la orden. Implementar una máquina de estados clara donde las transiciones sean explícitas y atómicas.

## 9. Backlog Completo

### Épica 1: Integración con Shopify (Total Story Points: 21)

*   **HU-001: Como sistema, quiero recibir webhooks de creación de órdenes de Shopify para iniciar el procesamiento automatizado.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given un webhook válido de `orders/create` de Shopify es enviado al endpoint del sistema.
        *   When el sistema recibe el webhook.
        *   Then el sistema debe validar la firma HMAC del webhook.
        *   And el sistema debe encolar la orden para su procesamiento asíncrono.
        *   And el sistema debe responder con un código 200 OK a Shopify.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-002: Como sistema, quiero validar la autenticidad de los webhooks de Shopify para prevenir procesamiento de datos falsos.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given un webhook recibido con una firma HMAC válida.
        *   When el sistema procesa el webhook.
        *   Then el webhook debe ser aceptado para su procesamiento.
        *   Given un webhook recibido con una firma HMAC inválida.
        *   When el sistema procesa el webhook.
        *   Then el webhook debe ser rechazado.
        *   And se debe registrar un error de seguridad.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-003: Como sistema, quiero extraer los datos relevantes de la orden del webhook para realizar cálculos de materiales.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given un webhook de `orders/create` válido y autenticado.
        *   When el sistema extrae los datos.
        *   Then se debe obtener el ID de la orden de Shopify.
        *   And se debe obtener la lista de productos con SKU, cantidad y atributo de fragilidad.
        *   And se deben almacenar estos datos en la base de datos local.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-004: Como sistema, quiero manejar webhooks duplicados para evitar procesamiento redundante.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given un webhook de `orders/create` para una orden que ya existe en el sistema y está en estado `COMPLETED` o `FAILED`.
        *   When el sistema recibe el webhook duplicado.
        *   Then el sistema debe ignorar el webhook.
        *   And no se debe realizar ningún procesamiento adicional.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-005: Como sistema, quiero manejar webhooks con formato inválido o datos incompletos para mantener la estabilidad.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given un webhook con un cuerpo JSON mal formado.
        *   When el sistema intenta parsear el webhook.
        *   Then el sistema debe registrar un error de parseo.
        *   And el webhook debe ser rechazado.
        *   Given un webhook válido pero sin la lista de productos.
        *   When el sistema procesa el webhook.
        *   Then la orden debe ser marcada como `FAILED` con motivo "Datos incompletos".
    *   **Story Points:** 5
    *   **Prioridad:** Must

### Épica 2: Cálculo de Materiales de Empaque (Total Story Points: 13)

*   **HU-006: Como sistema, quiero calcular el tipo de caja necesario basado en la cantidad de productos para optimizar el empaque.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden con 1 producto.
        *   When se calcula el material de empaque.
        *   Then el sistema debe asignar `BOX_SMALL`.
        *   Given una orden con 3 productos.
        *   When se calcula el material de empaque.
        *   Then el sistema debe asignar `BOX_MEDIUM`.
        *   Given una orden con 7 productos.
        *   When se calcula el material de empaque.
        *   Then el sistema debe asignar `BOX_LARGE`.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-007: Como sistema, quiero asignar materiales obligatorios (LABEL, TAPE) a cada orden para asegurar el envío.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given cualquier orden procesada.
        *   When se calculan los materiales de empaque.
        *   Then el sistema debe asignar 1 `LABEL`.
        *   And el sistema debe asignar 1 `TAPE`.
    *   **Story Points:** 2
    *   **Prioridad:** Must

*   **HU-008: Como sistema, quiero añadir material de relleno (FILLER) si la orden contiene productos frágiles para protegerlos.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden con al menos un producto marcado como frágil.
        *   When se calculan los materiales de empaque.
        *   Then el sistema debe asignar 1 `FILLER`.
        *   Given una orden sin productos frágiles.
        *   When se calculan los materiales de empaque.
        *   Then el sistema NO debe asignar `FILLER`.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-009: Como sistema, quiero manejar órdenes con 0 productos para evitar errores de cálculo.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden con 0 productos.
        *   When se intenta calcular los materiales.
        *   Then la orden debe ser marcada como `FAILED` con motivo "Orden vacía".
    *   **Story Points:** 2
    *   **Prioridad:** Must

*   **HU-010: Como sistema, quiero manejar productos con cantidad 0 en la línea de la orden para el cálculo de la caja.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden con un producto que tiene cantidad 0.
        *   When se calcula el tipo de caja.
        *   Then ese producto con cantidad 0 no debe contribuir al conteo total de productos para la selección de la caja.
    *   **Story Points:** 3
    *   **Prioridad:** Should

### Épica 3: Gestión de Inventario (Total Story Points: 21)

*   **HU-011: Como sistema, quiero verificar la disponibilidad de stock antes de procesar una orden para asegurar la viabilidad.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden requiere 1 `BOX_SMALL`, 1 `LABEL`, 1 `TAPE`.
        *   When el sistema verifica el stock.
        *   And hay 1 `BOX_SMALL`, 1 `LABEL`, 1 `TAPE` disponibles.
        *   Then el sistema debe indicar que hay stock suficiente.
        *   Given una orden requiere 1 `BOX_SMALL`, 1 `LABEL`, 1 `TAPE`.
        *   When el sistema verifica el stock.
        *   And hay 0 `BOX_SMALL` disponibles.
        *   Then el sistema debe indicar que NO hay stock suficiente.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-012: Como sistema, quiero reservar el inventario de materiales de forma transaccional para evitar sobreventa.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden requiere 1 `BOX_SMALL` y hay 1 disponible.
        *   When el sistema reserva el material.
        *   Then el stock de `BOX_SMALL` debe ser descontado en 1.
        *   And la reserva debe quedar registrada para la orden.
        *   Given dos órdenes intentan reservar la última `BOX_SMALL` simultáneamente.
        *   When el sistema procesa las reservas.
        *   Then solo una orden debe tener éxito en la reserva.
        *   And la otra orden debe fallar por falta de stock.
    *   **Story Points:** 8
    *   **Prioridad:** Must

*   **HU-013: Como sistema, quiero consumir definitivamente el inventario reservado una vez que la orden es completada.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden en estado `PROCESSING` con materiales reservados.
        *   When la orden es marcada como `COMPLETED`.
        *   Then la reserva de materiales debe ser eliminada.
        *   And el stock debe reflejar el consumo final.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-014: Como sistema, quiero manejar la falta de stock de forma atómica, marcando la orden como FAILED sin descuentos parciales.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden requiere 1 `BOX_SMALL`, 1 `LABEL`, 1 `TAPE`.
        *   When el sistema intenta reservar y solo hay 1 `LABEL` y 1 `TAPE` disponibles (falta `BOX_SMALL`).
        *   Then la orden debe ser marcada como `FAILED` con motivo "Stock insuficiente".
        *   And el stock de `LABEL` y `TAPE` NO debe haber sido descontado.
    *   **Story Points:** 5
    *   **Prioridad:** Must

### Épica 4: Procesamiento de Órdenes y Estados (Total Story Points: 13)

*   **HU-015: Como sistema, quiero actualizar el estado de una orden (PROCESSING, COMPLETED, FAILED) para reflejar su progreso.**
    *   **Criterios de Aceptación (Gherkin):**
        *   When una orden es recibida y encolada.
        *   Then su estado inicial debe ser `PROCESSING`.
        *   When una orden es procesada exitosamente (materiales calculados, stock reservado).
        *   Then su estado debe cambiar a `COMPLETED`.
        *   When una orden falla en cualquier etapa (stock inválido, datos incompletos).
        *   Then su estado debe cambiar a `FAILED`.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-016: Como sistema, quiero registrar el motivo del fallo cuando una orden es marcada como FAILED para facilitar la depuración.**
    *   **Criterios de Aceptación (Gherkin):**
        *   When una orden es marcada como `FAILED`.
        *   Then se debe almacenar un motivo de fallo (ej. "Stock insuficiente", "Datos incompletos", "Error de validación").
        *   And este motivo debe ser visible en el dashboard.
    *   **Story Points:** 2
    *   **Prioridad:** Should

*   **HU-017: Como sistema, quiero registrar todas las acciones realizadas sobre una orden y el inventario para auditoría.**
    *   **Criterios de Aceptación (Gherkin):**
        *   When cualquier acción es realizada (recepción de webhook, cálculo de materiales, reserva de stock, cambio de estado).
        *   Then se debe registrar una entrada de log con marca de tiempo, tipo de acción, ID de la orden (si aplica) y detalles relevantes.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-018: Como sistema, quiero manejar la caída del sistema durante la reserva de inventario para evitar inconsistencias.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given una orden en estado `PROCESSING` con una reserva de inventario en curso.
        *   When el sistema se reinicia después de una caída.
        *   Then el sistema debe identificar reservas no completadas.
        *   And el sistema debe liberar esas reservas y marcar la orden como `FAILED` (o reintentar).
    *   **Story Points:** 8
    *   **Prioridad:** Must

### Épica 5: Dashboard de Monitoreo (Total Story Points: 21)

*   **HU-019: Como usuario del dashboard, quiero ver una lista de las órdenes recientes y su estado actual para monitorear el flujo.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que hay órdenes procesadas en el sistema.
        *   When accedo al dashboard.
        *   Then debo ver una tabla con las órdenes más recientes.
        *   And cada fila debe mostrar ID de la orden, fecha, estado y materiales asignados.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-020: Como usuario del dashboard, quiero ver los niveles actuales de inventario de cada material de empaque para gestionar el stock.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que hay materiales de empaque en el inventario.
        *   When accedo al dashboard.
        *   Then debo ver una sección que liste cada material (`BOX_SMALL`, `LABEL`, etc.) con su cantidad actual.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-021: Como usuario del dashboard, quiero ver alertas de bajo stock para reabastecer materiales a tiempo.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que el stock de `BOX_SMALL` está por debajo del umbral definido.
        *   When accedo al dashboard.
        *   Then debo ver una alerta visual destacada para `BOX_SMALL`.
        *   And la alerta debe indicar la cantidad actual y el umbral.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-022: Como usuario del dashboard, quiero ver métricas de rendimiento del sistema para identificar cuellos de botella.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que el sistema ha procesado varias órdenes.
        *   When accedo al dashboard.
        *   Then debo ver métricas como: número de órdenes procesadas por minuto, tiempo promedio de procesamiento, tasa de éxito/fallo.
    *   **Story Points:** 8
    *   **Prioridad:** Should

### Épica 6: Endpoint Legacy y Notificaciones (Total Story Points: 13)

*   **HU-023: Como sistema, quiero exponer un endpoint PHP legacy para consultar el estado de bajo stock.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que el stock de `TAPE` está por debajo del umbral.
        *   When se realiza una petición GET al endpoint PHP legacy `/low-stock`.
        *   Then la respuesta debe ser un JSON que liste `TAPE` como material de bajo stock.
        *   And la respuesta debe incluir la cantidad actual y el umbral.
    *   **Story Points:** 5
    *   **Prioridad:** Must

*   **HU-024: Como sistema, quiero generar una alerta (log y/o visual) cuando el stock de cualquier material caiga por debajo de un umbral.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que el stock de `FILLER` cae por debajo de su umbral.
        *   When el sistema detecta esto.
        *   Then se debe registrar una entrada de log de advertencia.
        *   And se debe activar una alerta visual en el dashboard.
    *   **Story Points:** 3
    *   **Prioridad:** Must

*   **HU-025: Como sistema, quiero permitir la configuración de umbrales de bajo stock para cada material de empaque.**
    *   **Criterios de Aceptación (Gherkin):**
        *   Given que se necesita cambiar el umbral de `LABEL` a 50 unidades.
        *   When se actualiza la configuración del umbral para `LABEL`.
        *   Then el sistema debe usar 50 como el nuevo umbral para las alertas de `LABEL`.
    *   **Story Points:** 5
    *   **Prioridad:** Could

---

**Total Story Points del Backlog: 102**
