# MANUAL DE INSTALACIÓN — Vtravel Backend (RC-BACKEND-01)

## Requisitos
- Node.js 22.5 o superior (usa `node:sqlite`, nativo desde esa versión — no hace falta instalar nada con `npm install`, y es intencional: este backend corre con cero dependencias externas).

## Pasos

```bash
# 1. Entrar a la carpeta
cd vtravel-backend

# 2. Copiar las variables de entorno
cp .env.example .env
# Editar .env y cambiar JWT_SECRET por un valor real y aleatorio

# 3. Levantar el servidor (esto también crea la base de datos SQLite
#    y las tablas automáticamente la primera vez)
node src/server.js
```

Debería ver:
```
Vtravel backend escuchando en http://localhost:3500
```

## Crear el primer usuario administrador

```bash
node src/seed-admin.js admin@vtravel.cl unaClaveSegura
```

## Probar que funciona

```bash
curl http://localhost:3500/api/health
# {"estado":"ok","hora":"..."}
```

## Acceder al Dashboard

Con el servidor corriendo, abrir en el navegador:
```
http://localhost:3500/dashboard
```
Entrar con el email/clave del usuario admin sembrado en el paso anterior.

## Nota importante sobre esta versión

Esta base de datos es **SQLite**, no PostgreSQL, y el ORM es SQL directo, no Prisma. La razón está en `README.md` — en resumen: el entorno donde se construyó este backend no tiene acceso a internet, y tanto PostgreSQL como Prisma requieren descargarse. El diseño (`schema.sql` de la carpeta del CRM) sigue siendo el de PostgreSQL — migrar de SQLite a Postgres real, en un servidor con acceso a internet, es un paso directo (mismo modelo de datos, cambia el driver de conexión).
