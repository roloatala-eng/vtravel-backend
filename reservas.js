// src/utils/http.js — helpers compartidos por todas las rutas, para no
// repetir "leer el body" o "responder JSON" en cada archivo.

function enviarJSON(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(body);
}

function leerCuerpo(req) {
    return new Promise((resolve, reject) => {
        let datos = '';
        req.on('data', chunk => {
            datos += chunk;
            if (datos.length > 1e6) req.destroy();
        });
        req.on('end', () => {
            try { resolve(datos ? JSON.parse(datos) : {}); }
            catch { reject(new Error('JSON inválido')); }
        });
        req.on('error', reject);
    });
}

function sanitizarTexto(valor) {
    if (typeof valor !== 'string') return valor;
    return valor.replace(/[<>]/g, '').trim().slice(0, 500);
}

module.exports = { enviarJSON, leerCuerpo, sanitizarTexto };
