const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { enviarJSON } = require('./utils/http');
const { verificar } = require('./auth');

const rutasAuth = require('./routes/auth');
const rutasClientes = require('./routes/clientes');
const rutasCotizaciones = require('./routes/cotizaciones');
const rutasReservas = require('./routes/reservas');
const rutasDashboard = require('./routes/dashboard');

const PORT = process.env.PORT || 3500;

function requiereAuth(req) {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    return token ? verificar(token) : null;
}

// Rate limiting simple en memoria (por IP). Documentado en README.md que
// para más de una instancia del servidor esto necesitaría Redis.
const intentos = new Map();
function rateLimited(ip) {
    const ahora = Date.now();
    const recientes = (intentos.get(ip) || []).filter(t => ahora - t < 60000);
    recientes.push(ahora);
    intentos.set(ip, recientes);
    return recientes.length > 60; // subido de 30 a 60/min: el dashboard hace más pedidos que el sitio público
}

const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress;
    if (rateLimited(ip)) return enviarJSON(res, 429, { error: 'Demasiadas solicitudes, esperá un momento' });

    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' });
        return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname.split('/').filter(Boolean); // ej: ['api','reservas','12','estado']

    // Panel administrador (HTML estático, la lógica vive en el navegador
    // y llama a la misma API de abajo)
    if (url.pathname === '/dashboard' || url.pathname === '/dashboard.html') {
        const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'dashboard.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    try {
        // Rutas públicas (sin autenticación) — las usa el sitio real
        if (p[0] === 'api' && p[1] === 'health') return enviarJSON(res, 200, { estado: 'ok', hora: new Date().toISOString() });
        if (p[0] === 'api' && p[1] === 'auth' && p[2] === 'login' && req.method === 'POST') return await rutasAuth.login(req, res);
        if (p[0] === 'api' && p[1] === 'clientes' && p.length === 2 && req.method === 'POST') return await rutasClientes.crear(req, res);
        if (p[0] === 'api' && p[1] === 'cotizaciones' && p.length === 2 && req.method === 'POST') return await rutasCotizaciones.crear(req, res);
        if (p[0] === 'api' && p[1] === 'reservas' && p.length === 2 && req.method === 'POST') return await rutasReservas.crear(req, res);

        // Todo lo demás bajo /api requiere JWT — es el panel administrador
        if (p[0] === 'api') {
            const usuario = requiereAuth(req);
            if (!usuario) return enviarJSON(res, 401, { error: 'No autorizado' });

            if (p[1] === 'dashboard' && p[2] === 'resumen') return rutasDashboard.resumen(req, res);

            if (p[1] === 'clientes') {
                if (p.length === 2 && req.method === 'GET') return rutasClientes.listar(req, res, url);
                if (p.length === 3 && req.method === 'GET') return rutasClientes.obtener(req, res, p[2]);
            }

            if (p[1] === 'cotizaciones' && p.length === 2 && req.method === 'GET') return rutasCotizaciones.listar(req, res, url);

            if (p[1] === 'reservas') {
                if (p.length === 2 && req.method === 'GET') return rutasReservas.listar(req, res, url);
                if (p.length === 3 && req.method === 'GET') return rutasReservas.obtener(req, res, p[2]);
                if (p.length === 4 && p[3] === 'estado' && req.method === 'PUT') return await rutasReservas.actualizarEstado(req, res, p[2]);
                if (p.length === 4 && p[3] === 'cancelar' && req.method === 'PUT') return await rutasReservas.cancelar(req, res, p[2]);
                if (p.length === 4 && p[3] === 'reprogramar' && req.method === 'PUT') return await rutasReservas.reprogramar(req, res, p[2]);
            }
        }

        enviarJSON(res, 404, { error: 'Ruta no encontrada' });
    } catch (err) {
        enviarJSON(res, 500, { error: 'Error interno', detalle: err.message });
    }
});

if (require.main === module) {
    server.listen(PORT, () => console.log(`Vtravel backend escuchando en http://localhost:${PORT}`));
}

module.exports = server;
