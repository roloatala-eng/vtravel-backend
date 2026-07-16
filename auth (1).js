// Crea (o actualiza) un usuario administrador para probar el login.
// Uso: node src/seed-admin.js admin@vtravel.cl claveSegura123
const db = require('./db');
const { hashPassword } = require('./auth');

const [,, email, password] = process.argv;
if (!email || !password) {
    console.error('Uso: node src/seed-admin.js <email> <password>');
    process.exit(1);
}

(async () => {
    const { hash, salt } = hashPassword(password);
    const { rows } = await db.query('SELECT id FROM usuarios_admin WHERE email = ?', [email]);
    if (rows[0]) {
        await db.query('UPDATE usuarios_admin SET password_hash=?, password_salt=? WHERE email=?', [hash, salt, email]);
        console.log(`Usuario admin actualizado: ${email}`);
    } else {
        await db.query('INSERT INTO usuarios_admin (email, password_hash, password_salt) VALUES (?,?,?)', [email, hash, salt]);
        console.log(`Usuario admin creado: ${email}`);
    }
    process.exit(0);
})();
