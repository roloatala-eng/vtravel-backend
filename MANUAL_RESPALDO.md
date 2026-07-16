# MANUAL DE RESPALDO — Vtravel Backend

## Qué respaldar

**La base de datos es lo único con estado real** — clientes, cotizaciones, reservas. El código está en git (recuperable siempre); los datos de producción no.

## Respaldo automático (recomendado)

Railway y Render ofrecen backups automáticos diarios de PostgreSQL en sus planes pagos — activarlo desde el panel de la base de datos es la opción más confiable, porque no depende de que alguien se acuerde de correr un comando.

## Respaldo manual (mientras tanto, o como respaldo adicional)

```bash
# Backup completo
pg_dump "$DATABASE_URL" > respaldo_vtravel_$(date +%Y%m%d).sql

# Restaurar desde un respaldo
psql "$DATABASE_URL" < respaldo_vtravel_20260716.sql
```

Recomendación: correr el backup manual al menos 1 vez por semana hasta confirmar que el backup automático de la plataforma está activo y funcionando — probarlo restaurando en una base de prueba, no asumir que "está activado" sin haberlo restaurado nunca.

## Qué NO hace falta respaldar
- El código (`git log` ya es el historial completo).
- `node_modules` (se regenera con `npm install`).
- La base SQLite de desarrollo (`data/vtravel.db`) — es descartable, se regenera sola al arrancar el servidor.

## Plan de recuperación ante desastre (resumen)
1. Levantar un backend nuevo desde el mismo repositorio de GitHub (Railway/Render lo hacen en minutos).
2. Restaurar el último `pg_dump` en la base nueva.
3. Confirmar `/api/health` y hacer una cotización de prueba de punta a punta antes de volver a apuntar el sitio real a la URL nueva.
