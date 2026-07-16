<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Vtravel — Panel Administrador</title>
<style>
    body { font-family: -apple-system, sans-serif; background: #0a1520; color: #e8e8e8; margin: 0; padding: 2rem; }
    h1 { color: #C8A56A; }
    .oculto { display: none; }
    input, select, button { padding: 0.6rem; border-radius: 6px; border: 1px solid #444; background: #1a2938; color: #fff; }
    button { background: #C8A56A; color: #0a1520; font-weight: bold; cursor: pointer; border: none; }
    button.secundario { background: transparent; color: #C8A56A; border: 1px solid #C8A56A; }
    button.peligro { background: #c0392b; color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.6rem; border-bottom: 1px solid #2a3947; font-size: 0.9rem; }
    th { color: #C8A56A; }
    .resumen { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0; }
    .tarjeta { background: #10283B; padding: 1rem 1.5rem; border-radius: 10px; min-width: 140px; }
    .tarjeta .num { font-size: 1.8rem; font-weight: bold; color: #C8A56A; }
    .tarjeta .label { font-size: 0.8rem; color: #999; }
    .estado { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; }
    .estado-pendiente { background: #5a4a1a; color: #ffd479; }
    .estado-confirmada { background: #1a4a2a; color: #7fdb9c; }
    .estado-completada { background: #1a3a4a; color: #79c4e8; }
    .estado-cancelada { background: #4a1a1a; color: #e87979; }
    .barra { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
</style>
</head>
<body>

<div id="loginBox">
    <h1>Vtravel — Panel Administrador</h1>
    <input type="email" id="loginEmail" placeholder="Email"><br><br>
    <input type="password" id="loginPassword" placeholder="Contraseña"><br><br>
    <button onclick="login()">Entrar</button>
    <p id="loginError" style="color: #e87979;"></p>
</div>

<div id="panel" class="oculto">
    <h1>Vtravel — Panel Administrador</h1>

    <div class="resumen" id="resumenTarjetas"></div>

    <h2>Reservas</h2>
    <div class="barra">
        <input type="text" id="buscarReserva" placeholder="Buscar por nombre o número de reserva" oninput="cargarReservas()">
        <select id="filtroEstado" onchange="cargarReservas()">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="en_curso">En curso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
        </select>
    </div>
    <table>
        <thead><tr><th>N° Reserva</th><th>Cliente</th><th>Ruta</th><th>Fecha</th><th>Vehículo</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody id="tablaReservas"></tbody>
    </table>

    <h2>Clientes</h2>
    <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>WhatsApp</th><th># Reservas</th><th>Última reserva</th></tr></thead>
        <tbody id="tablaClientes"></tbody>
    </table>
</div>

<script>
const API = ''; // mismo origen — se sirve desde este mismo backend
let token = null;

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('loginError').textContent = data.error; return; }
    token = data.token;
    document.getElementById('loginBox').classList.add('oculto');
    document.getElementById('panel').classList.remove('oculto');
    cargarTodo();
}

function auth() { return { 'Authorization': `Bearer ${token}` }; }

async function cargarTodo() {
    await Promise.all([cargarResumen(), cargarReservas(), cargarClientes()]);
}

async function cargarResumen() {
    const res = await fetch(`${API}/api/dashboard/resumen`, { headers: auth() });
    const d = await res.json();
    document.getElementById('resumenTarjetas').innerHTML = `
        <div class="tarjeta"><div class="num">${d.reservasHoy}</div><div class="label">Reservas hoy</div></div>
        <div class="tarjeta"><div class="num">${d.reservasFuturas}</div><div class="label">Reservas futuras</div></div>
        <div class="tarjeta"><div class="num">${d.cotizacionesTotal}</div><div class="label">Cotizaciones totales</div></div>
        <div class="tarjeta"><div class="num">${d.clientesTotal}</div><div class="label">Clientes registrados</div></div>
    `;
}

async function cargarReservas() {
    const q = document.getElementById('buscarReserva').value;
    const estado = document.getElementById('filtroEstado').value;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (estado) params.set('estado', estado);
    const res = await fetch(`${API}/api/reservas?${params}`, { headers: auth() });
    const reservas = await res.json();
    document.getElementById('tablaReservas').innerHTML = reservas.map(r => `
        <tr>
            <td>${r.numero_reserva}</td>
            <td>${r.cliente_nombre} ${r.cliente_apellido}</td>
            <td>${r.origen} → ${r.destino}</td>
            <td>${r.fecha_viaje} ${r.hora_viaje}</td>
            <td>${r.vehiculo}</td>
            <td>$${Math.round(r.precio_total).toLocaleString('es-CL')}</td>
            <td><span class="estado estado-${r.estado}">${r.estado}</span></td>
            <td>
                <button class="secundario" onclick="cambiarEstado(${r.id})">Cambiar estado</button>
                <button class="peligro" onclick="cancelar(${r.id})">Cancelar</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="8">Sin reservas todavía</td></tr>';
}

async function cargarClientes() {
    const res = await fetch(`${API}/api/clientes`, { headers: auth() });
    const clientes = await res.json();
    document.getElementById('tablaClientes').innerHTML = clientes.map(c => `
        <tr>
            <td>${c.nombre} ${c.apellido}</td>
            <td>${c.email}</td>
            <td>${c.whatsapp}</td>
            <td>${c.numero_reservas}</td>
            <td>${c.ultima_reserva || '—'}</td>
        </tr>
    `).join('') || '<tr><td colspan="5">Sin clientes todavía</td></tr>';
}

async function cambiarEstado(id) {
    const nuevo = prompt('Nuevo estado (pendiente, confirmada, en_curso, completada, cancelada):');
    if (!nuevo) return;
    const res = await fetch(`${API}/api/reservas/${id}/estado`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
    });
    if (!res.ok) { alert((await res.json()).error); return; }
    cargarReservas();
}

async function cancelar(id) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await fetch(`${API}/api/reservas/${id}/cancelar`, { method: 'PUT', headers: auth() });
    cargarReservas();
}
</script>
</body>
</html>
