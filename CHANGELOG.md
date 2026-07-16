const repo = require('../repository');
const { enviarJSON, leerCuerpo, sanitizarTexto } = require('../utils/http');

async function crear(req, res) {
    const body = await leerCuerpo(req);
    const nombre = sanitizarTexto(body.nombre);
    const apellido = sanitizarTexto(body.apellido);
    const email = sanitizarTexto(body.email);
    const whatsapp = sanitizarTexto(body.whatsapp);

    if (!nombre || !apellido || !email || !whatsapp) {
        return enviarJSON(res, 400, { error: 'Faltan campos requeridos' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return enviarJSON(res, 400, { error: 'Email inválido' });
    }

    const existente = await repo.buscarClientePorEmail(email);
    const cliente = existente
        ? await repo.actualizarCliente(existente.id, { nombre, apellido, whatsapp })
        : await repo.crearCliente({ nombre, apellido, email, whatsapp, consentimiento_marketing: !!body.consentimiento_marketing, origen_registro: 'cotizador' });

    enviarJSON(res, existente ? 200 : 201, cliente);
}

async function listar(req, res, url) {
    const busqueda = url.searchParams.get('q');
    enviarJSON(res, 200, await repo.listarClientes({ busqueda }));
}

async function obtener(req, res, id) {
    const cliente = await repo.obtenerCliente(id);
    if (!cliente) return enviarJSON(res, 404, { error: 'No encontrado' });
    enviarJSON(res, 200, cliente);
}

module.exports = { crear, listar, obtener };
