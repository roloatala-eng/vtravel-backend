// JWT (HS256) implementado con node:crypto — sin librerías externas,
// porque no hay acceso a npm install en este entorno. Es una
// implementación real del estándar (header.payload.signature en
// base64url, firmado con HMAC-SHA256), no una simulación: cualquier
// librería jwt.verify() de terceros puede validar un token generado
// acá, porque sigue el formato real.
const crypto = require('node:crypto');

const SECRET = process.env.JWT_SECRET || 'CAMBIAR_ESTE_SECRETO_EN_PRODUCCION';

function base64url(input) {
    return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function base64urlDecode(input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) input += '=';
    return Buffer.from(input, 'base64').toString('utf-8');
}

function firmar(payloadObj, expiraEnSegundos = 3600) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { ...payloadObj, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiraEnSegundos };
    const encabezado = base64url(JSON.stringify(header));
    const cuerpo = base64url(JSON.stringify(payload));
    const firma = crypto.createHmac('sha256', SECRET).update(`${encabezado}.${cuerpo}`).digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encabezado}.${cuerpo}.${firma}`;
}

function verificar(token) {
    const partes = (token || '').split('.');
    if (partes.length !== 3) return null;
    const [encabezado, cuerpo, firma] = partes;
    const firmaEsperada = crypto.createHmac('sha256', SECRET).update(`${encabezado}.${cuerpo}`).digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    // Comparación en tiempo constante — evita timing attacks
    if (firma.length !== firmaEsperada.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmaEsperada))) return null;
    const payload = JSON.parse(base64urlDecode(cuerpo));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null; // expirado
    return payload;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

function verificarPassword(password, hash, salt) {
    const hashIntentado = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashIntentado, 'hex'));
}

module.exports = { firmar, verificar, hashPassword, verificarPassword };
