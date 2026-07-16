-- Vtravel Backend — schema SQLite (adaptado de schema.sql/Postgres,
-- que sigue siendo la referencia de diseño para cuando esto migre a
-- PostgreSQL real en un servidor de verdad — ver README.md)

CREATE TABLE IF NOT EXISTS vehiculos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL UNIQUE,
    nombre          TEXT NOT NULL,
    capacidad_min   INTEGER NOT NULL,
    capacidad_max   INTEGER NOT NULL,
    precio_por_km   REAL,
    tarifa_minima   REAL,
    activo          INTEGER NOT NULL DEFAULT 1,
    creado_en       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre                    TEXT NOT NULL,
    apellido                  TEXT NOT NULL,
    email                     TEXT NOT NULL UNIQUE,
    whatsapp                  TEXT NOT NULL,
    pais                      TEXT,
    ciudad                    TEXT,
    idioma                    TEXT DEFAULT 'es',
    empresa                   TEXT,
    consentimiento_marketing  INTEGER NOT NULL DEFAULT 0,
    fecha_consentimiento      TEXT,
    origen_registro           TEXT,
    activo                    INTEGER NOT NULL DEFAULT 1,
    creado_en                 TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cotizaciones (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id        INTEGER NOT NULL REFERENCES clientes(id),
    vehiculo_id       INTEGER NOT NULL REFERENCES vehiculos(id),
    origen            TEXT NOT NULL,
    destino           TEXT NOT NULL,
    fecha_servicio    TEXT NOT NULL,
    hora_servicio     TEXT NOT NULL,
    tipo_servicio     TEXT NOT NULL,
    distancia_km      REAL NOT NULL,
    ida_vuelta        INTEGER NOT NULL DEFAULT 0,
    pasajeros         INTEGER NOT NULL,
    precio_total      REAL NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'nueva'
                        CHECK (estado IN ('nueva','pendiente','reservada','pagada','cancelada')),
    creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reservas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_reserva      TEXT NOT NULL UNIQUE,
    cotizacion_id       INTEGER NOT NULL REFERENCES cotizaciones(id),
    cliente_id          INTEGER NOT NULL REFERENCES clientes(id),
    pasajeros           INTEGER NOT NULL,
    estado              TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','confirmada','en_curso','completada','cancelada')),
    fecha_viaje         TEXT NOT NULL,
    hora_viaje          TEXT NOT NULL,
    fecha_reserva       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios_admin (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    creado_en       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(cliente_id);
