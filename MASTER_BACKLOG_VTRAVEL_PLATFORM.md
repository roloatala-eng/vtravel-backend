# MASTER_BACKLOG_VTRAVEL_PLATFORM.md

Documento vivo. Cada mejora o módulo futuro detectado se agrega acá, priorizado, **sin implementarse todavía**. Este es el punto de partida de Vtravel Platform 2.0, una vez que 1.0 esté validado en producción con clientes reales.

Última actualización: 16 de julio de 2026.

---

## Cómo usar este documento
Cuando 1.0 esté funcionando en producción, este backlog se retoma módulo por módulo, validando cada uno antes de empezar el siguiente — la misma metodología que ya acordamos para esta etapa.

---

## Prioridad ALTA (mayor impacto de negocio, base para todo lo demás)

| Módulo | Ítem | Por qué es base |
|---|---|---|
| API Central | Migrar de rutas manuales a un framework real (Express/Fastify) una vez que `npm install` esté disponible en el servidor de producción | Hoy el router a mano fue una decisión forzada por no tener acceso a npm en este entorno — en producción, con `npm install` disponible, un framework estándar da middleware, validación y manejo de errores mucho más robusto |
| Dashboard Administrativo | Vehículos y Conductores como entidades propias con CRUD (hoy Conductores existe en el diseño de schema pero no tiene endpoints construidos) | Es el siguiente dato que falta para que Centro de Operaciones y App de Conductores tengan algo real de qué depender |
| Marketing Automation | Conectar `campanas` + `historial_comunicaciones` (ya diseñadas en el schema) a Brevo de verdad, más allá del email transaccional ya construido | Todo el resto de automatizaciones (bienvenida, inactivos, cumpleaños) depende de esto |
| ERP Financiero | Conectar `servicio_financiero` y `liquidaciones` (ya diseñadas y validadas en `Vtravel_CRM_Diseño.zip`) a endpoints reales | El diseño ya existe completo — falta la capa de API, que ahora es mecánica dado el repositorio ya desacoplado |

## Prioridad MEDIA (alto valor, no bloquea el resto)

| Módulo | Ítem |
|---|---|
| Chatbot IA | Asistente comercial que cotiza y vende en lenguaje natural — depende de la API Central ya estable, y de decidir qué proveedor de IA se integra |
| App de Conductores | Diseño de la app (móvil o web) + endpoints de aceptar/rechazar/iniciar/finalizar servicio, sincronizados con el estado de `reservas` que ya existe |
| Centro de Operaciones (Dispatch) | Vista de asignación/reasignación en tiempo real — depende de que exista Conductores como entidad real (ver Prioridad Alta) |
| Dashboard Gerencial / BI | Gráficos y comparativos sobre los datos que `dashboard_queries.sql` ya sabe calcular — falta la capa visual |
| Inteligencia de Negocio | Proyecciones y KPIs comparativos — depende de tener volumen real de datos primero, no tiene sentido antes |

## Prioridad BAJA (valiosas, sin urgencia)

| Módulo | Ítem |
|---|---|
| CRM | Segmentación avanzada por agencias/hoteles (hoy el schema soporta "empresa" en clientes, faltaría un tipo de cliente más granular) |
| Marketing | Encuestas post-viaje automatizadas |
| Sitio Web | Multilenguaje (español/portugués/inglés) — el campo `idioma` ya existe en clientes, falta el sitio en sí |
| Plataforma general | Multi-sucursal / multi-país — el modelo de datos actual no lo excluye, pero tampoco lo modela explícitamente todavía |

---

## Riesgos técnicos identificados (para tener en cuenta cuando se retome)

1. **El router manual actual no escala bien a la complejidad de Platform 2.0.** Con 8-10 módulos más, mantenerlo sin un framework real se vuelve una fuente de errores. Resolver esto es la Prioridad Alta #1 de arriba.
2. **`node:sqlite` es experimental** — no usar en producción bajo ninguna circunstancia (ya se resolvió con el adaptador de Postgres, pero vale dejarlo escrito).
3. **Rate limiting en memoria no funciona con más de una instancia del servidor** — si Platform 2.0 necesita escalar horizontalmente, esto necesita moverse a Redis antes.
4. **WhatsApp Business API y el Chatbot IA dependen de aprobaciones y contrataciones externas** (Meta, proveedor de IA) que no están bajo control técnico — planificar tiempos de espera, no solo tiempo de desarrollo.

---

## Checklist de construcción para cuando arranque Platform 2.0

- [ ] Vtravel 1.0 en producción, validado con clientes reales, sin incidentes críticos por al menos 2-4 semanas
- [ ] Definir framework backend real (reemplazar el router manual)
- [ ] Completar entidad Conductores (CRUD real)
- [ ] Conectar módulo financiero ya diseñado
- [ ] Recién ahí: Chatbot, App Conductores, Centro de Operaciones, BI
