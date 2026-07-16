// src/repository.js
//
// CAPA DE ACCESO A DATOS — el resto del código nunca escribe SQL directo
// contra un motor específico. Todo pasa por acá, y todo es async (incluso
// contra SQLite, donde no haría falta) porque así es como debe llamarse
// Postgres en producción — esta capa está escrita para producción, no
// para la comodidad del entorno de desarrollo.

const db = require('./db');

const repo = {
    // ---------- CLIENTES ----------
    async buscarClientePorEmail(email) {
        const { rows } = await db.query('SELECT * FROM clientes WHERE email = ?', [email]);
        return rows[0] || null;
    },

    async crearCliente({ nombre, apellido, email, whatsapp, consentimiento_marketing, origen_registro }) {
        const r = await db.query(`
            INSERT INTO clientes (nombre, apellido, email, whatsapp, consentimiento_marketing, fecha_consentimiento, origen_registro)
            VALUES (?,?,?,?,?,?,?)
        `, [nombre, apellido, email, whatsapp, consentimiento_marketing ? 1 : 0,
            consentimiento_marketing ? new Date().toISOString() : null, origen_registro || null]);
        return this.obtenerCliente(r.lastInsertRowid);
    },

    async actualizarCliente(id, { nombre, apellido, whatsapp }) {
        await db.query('UPDATE clientes SET nombre=?, apellido=?, whatsapp=? WHERE id=?', [nombre, apellido, whatsapp, id]);
        return this.obtenerCliente(id);
    },

    async obtenerCliente(id) {
        const { rows } = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async listarClientes({ busqueda } = {}) {
        const base = `
            SELECT cl.*,
                (SELECT COUNT(*) FROM reservas WHERE cliente_id = cl.id) AS numero_reservas,
                (SELECT MAX(fecha_reserva) FROM reservas WHERE cliente_id = cl.id) AS ultima_reserva,
                (SELECT MAX(creado_en) FROM cotizaciones WHERE cliente_id = cl.id) AS ultima_cotizacion
            FROM clientes cl
        `;
        if (busqueda) {
            const like = `%${busqueda}%`;
            const { rows } = await db.query(base + ' WHERE cl.nombre LIKE ? OR cl.apellido LIKE ? OR cl.email LIKE ? ORDER BY cl.creado_en DESC LIMIT 200', [like, like, like]);
            return rows;
        }
        const { rows } = await db.query(base + ' ORDER BY cl.creado_en DESC LIMIT 200');
        return rows;
    },

    // ---------- COTIZACIONES ----------
    async crearCotizacion(datos) {
        const r = await db.query(`
            INSERT INTO cotizaciones (cliente_id, vehiculo_id, origen, destino, fecha_servicio, hora_servicio, tipo_servicio, distancia_km, ida_vuelta, pasajeros, precio_total, estado)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,'nueva')
        `, [datos.cliente_id, datos.vehiculo_id, datos.origen, datos.destino, datos.fecha_servicio,
            datos.hora_servicio, datos.tipo_servicio, datos.distancia_km, datos.ida_vuelta ? 1 : 0,
            datos.pasajeros, datos.precio_total]);
        return this.obtenerCotizacion(r.lastInsertRowid);
    },

    async obtenerCotizacion(id) {
        const { rows } = await db.query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async listarCotizaciones({ estado } = {}) {
        if (estado) {
            const { rows } = await db.query('SELECT * FROM cotizaciones WHERE estado = ? ORDER BY creado_en DESC LIMIT 200', [estado]);
            return rows;
        }
        const { rows } = await db.query('SELECT * FROM cotizaciones ORDER BY creado_en DESC LIMIT 200');
        return rows;
    },

    async marcarCotizacionComo(id, estado) {
        await db.query('UPDATE cotizaciones SET estado=? WHERE id=?', [estado, id]);
    },

    // ---------- RESERVAS ----------
    async crearReserva({ cotizacion_id, cliente_id, pasajeros, fecha_viaje, hora_viaje }) {
        const numeroReserva = `VTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
        const r = await db.query(`
            INSERT INTO reservas (numero_reserva, cotizacion_id, cliente_id, pasajeros, fecha_viaje, hora_viaje)
            VALUES (?,?,?,?,?,?)
        `, [numeroReserva, cotizacion_id, cliente_id, pasajeros, fecha_viaje, hora_viaje]);
        await this.marcarCotizacionComo(cotizacion_id, 'reservada');
        return this.obtenerReserva(r.lastInsertRowid);
    },

    async obtenerReserva(id) {
        const filas = await this._reservaCompleta('r.id = ?', [id]);
        return filas[0] || null;
    },

    async _reservaCompleta(condicionWhere, params) {
        const { rows } = await db.query(`
            SELECT
                r.id, r.numero_reserva, r.pasajeros, r.estado, r.fecha_viaje, r.hora_viaje, r.fecha_reserva,
                cl.id AS cliente_id, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
                cl.email AS cliente_email, cl.whatsapp AS cliente_whatsapp,
                co.origen, co.destino, co.distancia_km, co.precio_total, co.tipo_servicio,
                v.nombre AS vehiculo
            FROM reservas r
            JOIN clientes cl ON cl.id = r.cliente_id
            JOIN cotizaciones co ON co.id = r.cotizacion_id
            JOIN vehiculos v ON v.id = co.vehiculo_id
            WHERE ${condicionWhere}
            ORDER BY r.fecha_reserva DESC
        `, params);
        return rows;
    },

    async listarReservas({ estado, busqueda, soloHoy, soloFuturas } = {}) {
        let condiciones = ['1=1'];
        let params = [];
        if (estado) { condiciones.push('r.estado = ?'); params.push(estado); }
        if (busqueda) { condiciones.push('(cl.nombre LIKE ? OR cl.apellido LIKE ? OR r.numero_reserva LIKE ?)'); params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`); }
        if (soloHoy) { condiciones.push("r.fecha_viaje = date('now')"); }
        if (soloFuturas) { condiciones.push("r.fecha_viaje >= date('now')"); }
        return this._reservaCompleta(condiciones.join(' AND '), params);
    },

    async actualizarEstadoReserva(id, estado) {
        const estadosValidos = ['pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada'];
        if (!estadosValidos.includes(estado)) throw new Error('Estado inválido');
        await db.query('UPDATE reservas SET estado=? WHERE id=?', [estado, id]);
        return this.obtenerReserva(id);
    },

    async reprogramarReserva(id, { fecha_viaje, hora_viaje }) {
        await db.query('UPDATE reservas SET fecha_viaje=?, hora_viaje=? WHERE id=?', [fecha_viaje, hora_viaje, id]);
        return this.obtenerReserva(id);
    },

    // ---------- DASHBOARD ----------
    async resumenDashboard() {
        const [reservasHoy, reservasFuturas, cotizacionesTotal, clientesTotal, porEstado] = await Promise.all([
            db.query("SELECT COUNT(*) AS n FROM reservas WHERE fecha_viaje = date('now')").then(r => r.rows[0].n),
            db.query("SELECT COUNT(*) AS n FROM reservas WHERE fecha_viaje > date('now')").then(r => r.rows[0].n),
            db.query('SELECT COUNT(*) AS n FROM cotizaciones').then(r => r.rows[0].n),
            db.query('SELECT COUNT(*) AS n FROM clientes').then(r => r.rows[0].n),
            db.query('SELECT estado, COUNT(*) AS n FROM reservas GROUP BY estado').then(r => r.rows),
        ]);
        return { reservasHoy, reservasFuturas, cotizacionesTotal, clientesTotal, porEstado };
    },

    // ---------- VEHICULOS ----------
    async listarVehiculos() {
        const { rows } = await db.query('SELECT * FROM vehiculos WHERE activo = 1');
        return rows;
    },
};

module.exports = repo;
