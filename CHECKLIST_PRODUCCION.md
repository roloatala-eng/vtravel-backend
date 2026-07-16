# CHECKLIST DE PRODUCCIÓN — Vtravel

## Antes de anunciar el lanzamiento

- [ ] Backend desplegado y `/api/health` responde desde la URL pública
- [ ] PostgreSQL de producción creado y `schema.sql` (versión Postgres) cargado
- [ ] `JWT_SECRET` cambiado del valor de ejemplo a uno real y único
- [ ] Usuario administrador creado en la base de producción (no la de desarrollo)
- [ ] `BREVO_API_KEY` real configurada — probar enviando una reserva de prueba y confirmar que el email llega de verdad
- [ ] Las 5 API Keys de Google Maps confirmadas activas y con cuota en Google Cloud Console
- [ ] Sitio (`js/main.js`) con `VTRAVEL_API_URL` apuntando a la URL real del backend, no a localhost
- [ ] Sitio redesplegado en Netlify con ese cambio
- [ ] CORS del backend restringido al dominio real (`https://www.vtravel.cl`), no `*` — ver nota abajo
- [ ] Flujo completo probado en producción real: cotizar → reservar → confirmar que llega el email → confirmar que aparece en `/dashboard`
- [ ] Backup automático de la base de datos activado y **restaurado al menos una vez de prueba**
- [ ] Datos legales completos en Términos y Privacidad (pendiente del propietario)
- [ ] RUT / razón social configurados donde corresponda

## Nota sobre CORS
El backend hoy permite `Access-Control-Allow-Origin: *` (cualquier origen) — correcto para desarrollo/pruebas, pero en producción debería restringirse a `https://www.vtravel.cl` específicamente, en `src/utils/http.js` y `src/server.js`. Es un cambio de una línea, pendiente hasta confirmar el dominio final real.

## No pasar a producción sin
Confirmar que el punto anterior (CORS abierto) se cerró — dejarlo así en un backend con datos de clientes reales es un riesgo de seguridad innecesario y evitable.
