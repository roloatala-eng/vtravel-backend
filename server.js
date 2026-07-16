// src/db-sqlite.js — adaptador de desarrollo. Expone la misma interfaz
// async que db-postgres.js (query(sql, params) -> {rows}), aunque
// node:sqlite es síncrono por dentro — así el repositorio no necesita
// saber cuál de los dos motores está corriendo.
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'vtravel.db');
const conexion = new DatabaseSync(DB_PATH);
conexion.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8');
conexion.exec(schema);

const totalVehiculos = conexion.prepare('SELECT COUNT(*) as n FROM vehiculos').get().n;
if (totalVehiculos === 0) {
    const insertar = conexion.prepare(`INSERT INTO vehiculos (codigo, nombre, capacidad_min, capacidad_max, precio_por_km, tarifa_minima) VALUES (?,?,?,?,?,?)`);
    insertar.run('suv', 'SUV de Lujo', 1, 6, 1300, 10000);
    insertar.run('van', 'Van Ejecutiva', 7, 11, 1500, 15000);
    insertar.run('minibus', 'Minibús', 12, 19, 1800, 25000);
    insertar.run('bus', 'Bus', 20, 45, null, null);
}

// SQL del repositorio se escribe con placeholders '?' (estilo SQLite) y
// con 'INSERT ... RETURNING *' no soportado por node:sqlite — por eso acá
// se resuelve el id insertado con lastInsertRowid y se hace un SELECT
// aparte, mientras que en Postgres se usará RETURNING directo (ver
// db-postgres.js). El repositorio no ve esta diferencia.
async function query(sql, params = []) {
    const esInsert = /^\s*INSERT/i.test(sql);
    const esSelect = /^\s*SELECT/i.test(sql);
    const stmt = conexion.prepare(sql);
    if (esSelect) {
        return { rows: stmt.all(...params) };
    }
    const info = stmt.run(...params);
    return { rows: [], lastInsertRowid: info.lastInsertRowid, changes: info.changes };
}

module.exports = { query };
