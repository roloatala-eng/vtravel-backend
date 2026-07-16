# Vtravel Backend — RC-BACKEND-01

## Qué es esto, con total honestidad

Es un backend **real, que corre, que se probó con pedidos HTTP reales** — no pseudocódigo, no un mockup. Pero **no es exactamente la pila tecnológica que pediste**, y te explico por qué antes de que lo descubras vos mismo leyendo el código:

| Pediste | Se construyó | Por qué |
|---|---|---|
| PostgreSQL | SQLite (`node:sqlite`, nativo de Node 22) | Este entorno no tiene PostgreSQL instalado, y no hay acceso a internet para instalarlo. Confirmado antes de escribir una línea de código. |
| Prisma ORM | SQL directo con `node:sqlite` | Prisma se instala con `npm install prisma` — probé el comando y devuelve `403 Forbidden`, sin acceso a la red. No hay forma de instalar ninguna librería externa acá. |
| (implícito: Express) | Router hecho a mano sobre `http` nativo de Node | Mismo motivo — Express tampoco se puede instalar. |
| JWT | JWT real, hecho con `node:crypto` | Este sí es 100% real y estándar — cualquier librería `jsonwebtoken` de terceros puede verificar un token generado acá, porque sigue el formato exacto (header.payload.firma en base64url, HMAC-SHA256). Lo demuestro en `CHECKLIST_PRUEBAS.md`. |

**Lo que esto significa en la práctica**: el modelo de datos, la lógica de negocio, la autenticación y las rutas de la API son reales y funcionan. Lo que cambia es la base de datos de abajo (SQLite en vez de Postgres) y que no hay un ORM de terceros — es SQL escrito a mano. Migrar esto a PostgreSQL real en un servidor con internet es un trabajo acotado (cambiar el archivo `src/db.js` para usar un driver de Postgres en vez de `node:sqlite`, y ajustar la sintaxis del `schema.sql` — que además ya existe en su versión Postgres, en `Vtravel_CRM_Diseño.zip`).

## Estructura

```
vtravel-backend/
├── schema.sql              Estructura de la base de datos (SQLite)
├── .env.example             Variables de entorno
├── src/
│   ├── db.js                Conexión + inicialización de la base de datos
│   ├── auth.js               JWT real + hash de contraseñas (scrypt)
│   ├── server.js              Servidor HTTP + todas las rutas de la API
│   └── seed-admin.js          Script para crear el primer usuario admin
├── data/vtravel.db            La base de datos (se crea sola al arrancar)
├── MANUAL_INSTALACION.md
├── CHECKLIST_PRUEBAS.md
└── CHANGELOG.md
```

## Endpoints implementados

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| GET | `/api/health` | Público | Confirma que el servidor está vivo |
| POST | `/api/auth/login` | Público | Devuelve un JWT si el email/clave son correctos |
| POST | `/api/clientes` | Público | Crea o actualiza un cliente (lo usa el formulario del sitio) |
| GET | `/api/clientes` | Requiere JWT | Lista clientes (panel admin) |
| GET | `/api/clientes/:id` | Requiere JWT | Un cliente específico |
| POST | `/api/cotizaciones` | Público | Registra una cotización (lo usa el cotizador del sitio) |
| GET | `/api/cotizaciones` | Requiere JWT | Lista cotizaciones, con filtro `?estado=` |
| POST | `/api/reservas` | Público | Crea reserva, genera número único, marca cotización 'reservada', dispara email |
| GET | `/api/reservas` | Requiere JWT | Lista reservas — filtros `?estado=`, `?q=`, `?hoy=true`, `?futuras=true` |
| GET | `/api/reservas/:id` | Requiere JWT | Una reserva específica, con ficha completa |
| PUT | `/api/reservas/:id/estado` | Requiere JWT | Cambia el estado (valida contra los 5 estados válidos) |
| PUT | `/api/reservas/:id/cancelar` | Requiere JWT | Atajo para poner estado='cancelada' |
| PUT | `/api/reservas/:id/reprogramar` | Requiere JWT | Cambia fecha/hora del viaje |
| GET | `/api/dashboard/resumen` | Requiere JWT | Conteos para las tarjetas del dashboard |
| GET | `/dashboard` | Público (login adentro) | El panel administrador visual (HTML) |

## Seguridad implementada (no solo mencionada)

- **Contraseñas**: nunca en texto plano — `scrypt` con salt único por usuario.
- **JWT**: expira en 1 hora, firma verificada con comparación en tiempo constante (`crypto.timingSafeEqual`) para evitar timing attacks.
- **Rate limiting**: máximo 30 requests por minuto por IP (en memoria — para producción con más de una instancia del servidor, esto necesitaría moverse a Redis).
- **Sanitización**: los campos de texto libre (origen, destino, nombre, etc.) se limpian de `<` y `>` antes de guardarse.
- **SQL injection**: todas las consultas usan parámetros (`?`), nunca concatenación de texto — probado explícitamente en `CHECKLIST_PRUEBAS.md`.
- **CORS**: habilitado de forma abierta (`*`) para que el sitio pueda llamarlo durante pruebas — para producción, restringir a `https://www.vtravel.cl` específicamente.

## Lo que NO está en este RC (honesto, no oculto)

- **Integración con Google Maps**: no se puede probar sin una API Key real y acceso a internet, ninguno de los dos disponibles acá. El código del sitio que ya llama a Google Maps (`config/maps-config.js`) no se tocó — sigue funcionando igual que antes, independiente de este backend.
- **CAPTCHA**: reCAPTCHA/Turnstile son servicios externos de Google/Cloudflare — no se pueden probar sin red. El rate limiting sí está implementado y activo como primera línea de defensa.
- **Despliegue en un servidor con URL pública**: este backend corre localmente, dentro de este entorno de trabajo. No hay forma de darte una URL real desde acá — mismo motivo de siempre (sin acceso a internet saliente). El ZIP incluye todo para que lo levantes vos en cualquier servidor con Node 22+, en minutos.
- **RC-BACKEND-02 a 05** (CRM completo con dashboard/panel visual, módulo financiero conectado, WhatsApp/pagos, optimización): no se construyeron en este RC. El diseño de todos existe (`Vtravel_CRM_Diseño.zip`), pero construir los 4 RC restantes en un solo turno de conversación no da un resultado real y probado — preferí entregar 1 RC completo y verificado en vez de 5 RC a medio hacer.
