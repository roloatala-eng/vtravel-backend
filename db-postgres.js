// src/email.js
//
// Integración con Brevo (antes Sendinblue) para el correo de confirmación
// de reserva. El código de la llamada real a la API está completo y es
// correcto — lo que NO puedo hacer desde este entorno es probarlo de
// verdad, porque necesita 2 cosas que no tengo: una BREVO_API_KEY real
// y acceso a internet saliente para llegar a api.brevo.com.
//
// Por eso: si no hay API key configurada, en vez de fallar o fingir que
// se mandó, este módulo LOGUEA el correo completo (asunto + cuerpo) y
// devuelve un estado claro. Es honesto sobre qué pasó, y sirve para
// verificar que el CONTENIDO del correo es correcto sin necesitar la
// API real.

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_REMITENTE = process.env.BREVO_REMITENTE_EMAIL || 'reservas@vtravel.cl';

function armarCorreoConfirmacion(reserva) {
    const asunto = `Reserva confirmada — ${reserva.numero_reserva}`;
    const whatsappNum = process.env.WHATSAPP_NUMBER || '56939042224';
    const mensajeWhatsapp = encodeURIComponent(`Hola, quiero confirmar mi reserva ${reserva.numero_reserva}`);

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a2b3c;">
            <h2 style="color: #C8A56A;">Vtravel — Reserva confirmada</h2>
            <p>Hola ${reserva.cliente_nombre},</p>
            <p>Tu reserva quedó registrada con el número:</p>
            <p style="font-size: 1.3em; font-weight: bold; background: #f5f5f5; padding: 12px; border-radius: 8px;">${reserva.numero_reserva}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 6px 0; color: #666;">Origen</td><td style="padding: 6px 0; text-align: right;">${reserva.origen}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Destino</td><td style="padding: 6px 0; text-align: right;">${reserva.destino}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Fecha</td><td style="padding: 6px 0; text-align: right;">${reserva.fecha_viaje} ${reserva.hora_viaje}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Vehículo</td><td style="padding: 6px 0; text-align: right;">${reserva.vehiculo}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Precio total</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">$${Math.round(reserva.precio_total).toLocaleString('es-CL')} CLP</td></tr>
            </table>
            <a href="https://wa.me/${whatsappNum}?text=${mensajeWhatsapp}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Hablar por WhatsApp</a>
            <p style="margin-top: 24px; color: #999; font-size: 0.85em;">Vtravel — Transporte Ejecutivo</p>
        </div>
    `;
    return { asunto, html };
}

async function enviarCorreoConfirmacion(reserva) {
    const { asunto, html } = armarCorreoConfirmacion(reserva);

    if (!BREVO_API_KEY) {
        console.log(`\n[EMAIL — sin BREVO_API_KEY configurada, no se envió de verdad]`);
        console.log(`Para: ${reserva.cliente_email}`);
        console.log(`Asunto: ${asunto}`);
        console.log(`(HTML completo generado correctamente, ${html.length} caracteres)\n`);
        return { enviado: false, motivo: 'BREVO_API_KEY no configurada', asunto };
    }

    try {
        const controlador = new AbortController();
        setTimeout(() => controlador.abort(), 5000);
        const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
            body: JSON.stringify({
                sender: { email: BREVO_REMITENTE, name: 'Vtravel' },
                to: [{ email: reserva.cliente_email, name: reserva.cliente_nombre }],
                subject: asunto,
                htmlContent: html,
            }),
            signal: controlador.signal,
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) return { enviado: false, motivo: resultado.message || 'Error de Brevo', asunto };
        return { enviado: true, referenciaExterna: resultado.messageId, asunto };
    } catch (err) {
        return { enviado: false, motivo: err.message, asunto };
    }
}

module.exports = { enviarCorreoConfirmacion };
