// src/db-postgres.js — adaptador de producción.
//
// AVISO HONESTO: este archivo usa la librería 'pg' (node-postgres), el
// driver estándar y más usado para Postgres en Node — pero 'pg' no está
// instalada en este entorno (sin acceso a npm install, ver README.md), así
// que este código no se pudo ejecutar contra una base real. Está escrito
// siguiendo la API documentada y estable de 'pg' (Pool, pool.query), no
// inventada — pero verificalo con `npm install pg` y una prueba real antes
// de confiar en él en producción. El adaptador de SQLite (db-sqlite.js) SÍ
// se probó de punta a punta, muchas veces, en este entorno.
//
// Instalar en el servidor de producción: npm install pg

let Pool;
try {
    Pool = require('pg').Pool;
} catch {
    throw new Error(
        "No se encontró el paquete 'pg'. En el servidor de producción, correr: npm install pg"
    );
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

// Traduce placeholders '?' (con los que está escrito repository.js, estilo
// SQLite) a '$1', '$2'... (estilo Postgres) — así el repositorio no
// necesita 2 versiones de cada consulta.
function traducirPlaceholders(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = []) {
    const esInsert = /^\s*INSERT/i.test(sql);
    let sqlFinal = traducirPlaceholders(sql);
    // Postgres necesita RETURNING explícito para obtener el id insertado
    // (SQLite lo da gratis con lastInsertRowid) — se agrega automáticamente
    // si el INSERT no lo pidió ya.
    if (esInsert && !/RETURNING/i.test(sqlFinal)) {
        sqlFinal += ' RETURNING id';
    }
    const resultado = await pool.query(sqlFinal, params);
    return {
        rows: resultado.rows,
        lastInsertRowid: esInsert ? resultado.rows[0]?.id : undefined,
        changes: resultado.rowCount,
    };
}

module.exports = { query };
