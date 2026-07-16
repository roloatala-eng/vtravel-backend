# MANUAL DE DESPLIEGUE — Vtravel Backend a Producción

## Recomendación concreta: Railway

Elegí Railway como recomendación específica, no una lista de opciones, porque: detecta Node.js automáticamente sin configuración, ofrece PostgreSQL como servicio con un click, y el despliegue completo (código + base de datos) se hace desde una sola cuenta. Render es una alternativa equivalente si preferís esa — los pasos son casi idénticos.

*(Nota: precios y límites exactos de los planes cambian con el tiempo — confirmá el plan vigente en el sitio del proveedor al momento de desplegar, no me guío por un precio que podría estar desactualizado.)*

## Paso a paso

### 1. Subir el código a GitHub
Railway despliega desde un repositorio Git. El proyecto ya tiene historial real de git (`git log` adentro del ZIP lo muestra) — falta conectarlo a GitHub:
```bash
# Dentro de la carpeta vtravel-backend/
git remote add origin https://github.com/TU-USUARIO/vtravel-backend.git
git push -u origin master
```

### 2. Crear el proyecto en Railway
1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → elegir `vtravel-backend`.
2. Railway detecta `package.json` y el script `start` automáticamente. No hace falta configurar nada más acá.

### 3. Agregar PostgreSQL
1. Dentro del proyecto en Railway → **New** → **Database** → **PostgreSQL**.
2. Railway genera automáticamente una variable `DATABASE_URL` — es exactamente la que `src/db.js` ya está esperando.

### 4. Cargar el schema en la base de datos nueva
El `schema.sql` de este proyecto está escrito en sintaxis SQLite (`AUTOINCREMENT`, `datetime('now')`). Para Postgres hace falta la versión con sintaxis Postgres — **es la misma que ya diseñamos y validamos hace 2 rondas** en `Vtravel_CRM_Diseño.zip` (`schema.sql`, con `SERIAL`, `TIMESTAMPTZ`, etc.). Conectar con el cliente de Postgres de Railway (o `psql "$DATABASE_URL"` desde tu computadora) y correr ese archivo.

### 5. Variables de entorno en Railway
En **Variables**, agregar:
```
JWT_SECRET=<generar uno nuevo y largo, no el de ejemplo>
BREVO_API_KEY=<tu key real de Brevo>
BREVO_REMITENTE_EMAIL=reservas@vtravel.cl
WHATSAPP_NUMBER=56939042224
```
`DATABASE_URL` y `PORT` ya los pone Railway solo.

### 6. Confirmar que corre
Railway entrega una URL pública automáticamente (`https://vtravel-backend-production.up.railway.app` o similar). Probar:
```bash
curl https://TU-URL.up.railway.app/api/health
```

### 7. Crear el usuario administrador en producción
Railway permite correr comandos puntuales sobre el servicio desplegado (`railway run node src/seed-admin.js admin@vtravel.cl <clave-real>`) — revisar la documentación de Railway CLI para el comando exacto vigente.

### 8. Conectar el sitio real
En `js/main.js` del sitio, cambiar:
```js
const VTRAVEL_API_URL = 'https://TU-URL.up.railway.app';
```
Y volver a desplegar el sitio en Netlify (mismo paso de siempre: arrastrar el ZIP actualizado).

## Lo que no pude verificar desde acá
Los pasos 2 en adelante necesitan una cuenta real y acceso a internet — no pude ejecutarlos ni confirmarlos yo mismo. Están escritos con la mecánica de despliegue de Railway tal como la documentaba hasta mi fecha de corte de conocimiento (enero 2026) — si algo cambió en su interfaz, la lógica general (conectar repo → agregar Postgres → variables de entorno) se mantiene en cualquier plataforma similar.
