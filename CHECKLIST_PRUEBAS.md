# CHECKLIST DE PRUEBAS EJECUTADAS

## RC-BACKEND-02 (esta ronda) — flujo end-to-end real

| # | Prueba | Resultado real |
|---|---|---|
| 1 | Sintaxis de los 12 archivos JS nuevos/modificados | Sin errores ✅ |
| 2 | Flujo completo por API: cliente → cotización → reserva | Reserva creada con ficha completa (cliente + ruta + vehículo + precio) en una sola consulta ✅ |
| 3 | Email de confirmación sin `BREVO_API_KEY` | Logueó el HTML completo (1.665 caracteres) y devolvió `{enviado:false, motivo:"..."}` — no fingió el envío ✅ |
| 4 | Cotización pasa a estado `reservada` automáticamente al crear la reserva | Confirmado ✅ |
| 5 | Dashboard resumen (`/api/dashboard/resumen`) | Conteos correctos tras crear datos reales ✅ |
| 6 | Buscar reserva por nombre de cliente | Encontró la reserva correcta ✅ |
| 7 | Cambiar estado de reserva (`PUT /estado`) | Cambió y se reflejó en la consulta siguiente ✅ |
| 8 | Reprogramar reserva (`PUT /reprogramar`) | Fecha/hora actualizadas correctamente ✅ |
| 9 | Cancelar reserva (`PUT /cancelar`) | Estado pasó a `cancelada` ✅ |
| 10 | Estado inválido rechazado | `400 {"error":"Estado inválido"}` ✅ |
| 11 | Cargar `/dashboard` (HTML del panel) | `200`, 7.171 bytes ✅ |
| 12 | **Prueba end-to-end desde el sitio real**: Playwright simuló un usuario completando el cotizador del sitio de verdad, llenando el formulario CRM real, y haciendo click en "Reservar Ahora" | La reserva apareció en el backend con los datos reales tipeados ("Carla Muñoz"), número de reserva real generado (`VTR-2026-268862`), incluido en el mensaje de WhatsApp abierto, **y visible en la consulta del Dashboard inmediatamente después** ✅ |
| 13 | Sitio real con `VTRAVEL_API_URL` vacía (estado normal de entrega, backend no desplegado) | 12/12 pruebas del cotizador siguen pasando, cero regresiones ✅ |

La prueba #12 es la que verifica el pedido central de esta ronda: "el sitio funcione de punta a punta como un sistema real" — no se validó pieza por pieza únicamente, se validó el camino completo que sigue un usuario real.

## RC-BACKEND-01 (ronda anterior, se mantiene)
Ver historial — 12 pruebas de auth/CRUD básico, todas siguen pasando tras el refactor a repositorio (reverificado, no asumido).
