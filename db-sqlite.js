// src/db.js — selector de motor de base de datos.
//
// Si existe DATABASE_URL (una URL de conexión Postgres real), usa
// PostgreSQL — así se configura producción. Si no existe, usa SQLite —
// así funciona el desarrollo local, sin que nadie tenga que instalar
// nada. La decisión se toma UNA vez acá; el resto del código (repository.js
// y todas las rutas) llaman siempre a db.query(...), sin saber cuál de
// los dos está corriendo.
const motor = process.env.DATABASE_URL ? require('./db-postgres') : require('./db-sqlite');

module.exports = motor;
