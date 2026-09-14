// src/webpay.js — Integración con Webpay Plus (Transbank). Archivo NUEVO,
// separado del resto del backend — no modifica ni depende de ningún otro
// archivo existente, salvo utils/http.js (enviarJSON, leerCuerpo), que ya
// usan todas las demás rutas.
//
// Usa las credenciales de AMBIENTE DE PRUEBA públicas de Transbank —
// documentadas oficialmente en transbankdevelopers.cl, las mismas para
// todo el mundo mientras se está probando. El día que llegue el Código de
// Comercio real (por ahora la cuenta está "en revisión"), estos 2 valores
// se reemplazan por variables de entorno en Railway — nada de código
// vuelve a tocarse.
//
// Flujo Webpay Plus (confirmado en documentación oficial, ver conversación
// 01/09/2026):
//   1. Crear transacción (POST) -> Transbank devuelve {token, url}
//   2. El navegador del cliente hace un POST (formulario) a esa url, con
//      token_ws = token -> el cliente paga en la página de Transbank
//   3. Transbank redirige de vuelta a nuestra returnUrl, con token_ws
//   4. Confirmar transacción (PUT) con ese token -> resultado final

const { enviarJSON, leerCuerpo } = require('./utils/http');

const TRANSBANK_COMMERCE_CODE = process.env.TRANSBANK_COMMERCE_CODE || '597055555532'; // código de prueba público
const TRANSBANK_API_KEY = process.env.TRANSBANK_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'; // llave de prueba pública
const TRANSBANK_BASE_URL = process.env.TRANSBANK_ENV === 'produccion'
    ? 'https://webpay3g.transbank.cl'
    : 'https://webpay3gint.transbank.cl'; // ambiente de integración/pruebas por defecto

const TRANSBANK_ENDPOINT = '/rswebpaytransaction/api/webpay/v1.0/transactions';

function headersTransbank() {
    return {
        'Tbk-Api-Key-Id': TRANSBANK_COMMERCE_CODE,
        'Tbk-Api-Key-Secret': TRANSBANK_API_KEY,
        'Content-Type': 'application/json',
    };
}

// Dónde vuelve el cliente después de pagar (sea que pagó o canceló).
// Apunta a una página del sitio que muestra el resultado.
function urlDeRetorno() {
    const base = process.env.FRONTEND_URL || 'https://www.vtravel.cl';
    return `${base}/pago-resultado.html`;
}

// Crea la transacción en Transbank y devuelve {token, url} para redirigir
// al cliente. buyOrder y sessionId identifican la compra de nuestro lado
// (usamos el id de la reserva/cotización) — Transbank no sabe nada de
// nuestra base de datos, solo maneja el pago en sí.
async function crearTransaccion({ buyOrder, sessionId, montoCLP }) {
    const res = await fetch(`${TRANSBANK_BASE_URL}${TRANSBANK_ENDPOINT}`, {
        method: 'POST',
        headers: headersTransbank(),
        body: JSON.stringify({
            buy_order: String(buyOrder).slice(0, 26), // Transbank limita el largo
            session_id: String(sessionId).slice(0, 61),
            amount: Math.round(montoCLP), // CLP no usa decimales
            return_url: urlDeRetorno(),
        }),
    });
    if (!res.ok) {
        const detalle = await res.text().catch(() => '');
        throw new Error(`Transbank rechazó la creación de la transacción (${res.status}): ${detalle}`);
    }
    return res.json(); // { token, url }
}

// Confirma la transacción cuando el cliente vuelve de pagar. Devuelve el
// resultado final: si fue aprobada o no, el monto, código de autorización, etc.
async function confirmarTransaccion(token) {
    const res = await fetch(`${TRANSBANK_BASE_URL}${TRANSBANK_ENDPOINT}/${token}`, {
        method: 'PUT',
        headers: headersTransbank(),
    });
    if (!res.ok) {
        const detalle = await res.text().catch(() => '');
        throw new Error(`Transbank rechazó la confirmación (${res.status}): ${detalle}`);
    }
    return res.json(); // { status: 'AUTHORIZED' | ..., amount, authorization_code, ... }
}

// Maneja las 2 rutas nuevas. Se llama UNA vez, al principio, desde
// server.js — si devuelve true, ya respondió y no hace falta hacer nada
// más; si devuelve false, la petición no era para acá y server.js sigue
// con su propio enrutamiento normal, sin ningún cambio.
async function manejarRutasPago(req, res, urlPath) {
    if (urlPath === '/api/pagos/iniciar' && req.method === 'POST') {
        try {
            const datos = await leerCuerpo(req);
            const resultado = await crearTransaccion({
                buyOrder: datos.reservaId || datos.cotizacionId || Date.now(),
                sessionId: datos.sessionId || `sesion-${Date.now()}`,
                montoCLP: datos.montoCLP,
            });
            enviarJSON(res, 200, resultado); // { token, url }
        } catch (err) {
            console.log('[WEBPAY] Error al iniciar pago:', err.message);
            enviarJSON(res, 500, { error: 'No se pudo iniciar el pago' });
        }
        return true;
    }

    if (urlPath === '/api/pagos/confirmar' && req.method === 'POST') {
        try {
            const datos = await leerCuerpo(req);
            const resultado = await confirmarTransaccion(datos.token);
            enviarJSON(res, 200, resultado);
        } catch (err) {
            console.log('[WEBPAY] Error al confirmar pago:', err.message);
            enviarJSON(res, 500, { error: 'No se pudo confirmar el pago' });
        }
        return true;
    }

    return false; // no era una ruta de pagos, server.js sigue normal
}

module.exports = { manejarRutasPago };
