# Dashboard gerencial de productos

Aplicación fullstack para gestionar el inventario de productos de una tienda, con un dashboard gerencial de métricas de negocio, autenticación con roles y administración de usuarios.

> Proyecto en desarrollo. Las secciones de instalación y ejecución se completarán a medida que se implementen el backend y el frontend.

## Stack

| Capa           | Tecnologías                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| Backend        | Node.js LTS, TypeScript, Express, MongoDB, Mongoose, JWT                                  |
| Frontend       | React, Material UI, React Router DOM, React Hook Form, Recharts, decimal.js, Dayjs, Axios |
| Pruebas de API | Postman                                                                                   |

## Estructura del repositorio

```
.
├── backend/    # API REST (Express + TypeScript + Mongoose)
├── frontend/   # Dashboard (React + Material UI)
└── postman/    # Colección de Postman exportada (.json)
```

## Requisitos previos

- Node.js LTS (20 o superior) y npm
- Docker con Docker Compose, para levantar MongoDB (o una instancia de MongoDB propia)

## Instalación y ejecución

El repositorio es un monorepo con npm workspaces: las dependencias se instalan una sola vez desde la raíz.

```bash
# 1. Instalar dependencias (raíz + workspaces)
npm install

# 2. Crear el archivo de entorno del backend y ajustarlo si hace falta
cp backend/.env.example backend/.env

# 3. Levantar MongoDB en Docker (puerto 27017, datos en un volumen con nombre)
npm run db:up

# 4. Arrancar la API en modo desarrollo con recarga (http://localhost:4000)
npm run dev:api
```

Para crear los usuarios de prueba, ejecuta `npm run seed` con MongoDB levantado (ver [Credenciales de prueba](#credenciales-de-prueba)).

`npm run dev` hace los pasos 3 y 4 en un solo comando. Para detener MongoDB: `npm run db:down` (los datos se conservan en el volumen).

Comprobación rápida: `GET http://localhost:4000/api/health` responde `200 { "status": "ok", "database": "connected" }`. Si MongoDB no está disponible, la API sigue arrancada, reintenta la conexión en segundo plano y responde `503 { "status": "degraded", "database": "disconnected" }`.

Otros comandos:

| Comando                        | Descripción                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `npm run build`                | Compila TypeScript a `backend/dist/`                                                |
| `npm start -w backend`         | Ejecuta la versión compilada (`node dist/server.js`)                                |
| `npm test`                     | Ejecuta las pruebas (Vitest + Supertest con MongoDB en memoria; no requiere Docker) |
| `npm run lint -w backend`      | Revisa el código con ESLint                                                         |
| `npm run typecheck -w backend` | Verifica los tipos sin compilar                                                     |
| `npm run format`               | Formatea el código con Prettier                                                     |

## Variables de entorno

Se leen de `backend/.env` (ver `backend/.env.example`). Al arrancar se validan y, si falta una obligatoria o tiene un valor inválido, el proceso termina indicando qué variable falla.

| Variable              | Obligatoria | Valor por defecto       | Descripción                                                                     |
| --------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------- |
| `PORT`                | No          | `4000`                  | Puerto HTTP de la API                                                           |
| `MONGODB_URI`         | Sí          | —                       | Cadena de conexión a MongoDB (`mongodb://localhost:27017/dashboard` con Docker) |
| `JWT_SECRET`          | Sí          | —                       | Secreto para firmar los tokens JWT                                              |
| `JWT_EXPIRES_IN`      | No          | `1d`                    | Vigencia de los tokens JWT                                                      |
| `CORS_ORIGIN`         | No          | `http://localhost:5173` | Origen permitido del frontend                                                   |
| `SEED_ADMIN_PASSWORD` | No          | —                       | Contraseña del usuario `ADMIN` creado por el seed                               |
| `SEED_USER_PASSWORD`  | No          | —                       | Contraseña del usuario `USER` creado por el seed                                |

## Credenciales de prueba

Con MongoDB levantado y `backend/.env` creado, el seed crea un usuario por rol:

```bash
npm run seed
```

| Rol     | Email                  | Contraseña (por defecto en `.env.example`) |
| ------- | ---------------------- | ------------------------------------------ |
| `ADMIN` | `admin@dashboard.test` | `Admin123!` (`SEED_ADMIN_PASSWORD`)        |
| `USER`  | `user@dashboard.test`  | `User1234!` (`SEED_USER_PASSWORD`)         |

Las contraseñas se leen de `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` (mínimo 8 caracteres); si falta alguna, el seed termina indicando cuál. Es idempotente: si un email ya existe, lo omite sin modificarlo, así que ejecutarlo varias veces mantiene los mismos 2 usuarios. Para cambiar la contraseña de una cuenta ya creada, elimina ese usuario de la base de datos y vuelve a ejecutar el seed.

## API

Todas las rutas están bajo `/api`. Los errores siguen el formato `{ "error": { "code", "message", "details"? } }`; las rutas que usan la base de datos responden `503 DATABASE_UNAVAILABLE` si MongoDB no está disponible.

### Usuarios

| Método  | Ruta                    | Descripción                                                                                        |
| ------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/users`            | Lista paginada, más recientes primero. Query: `offset` (0), `limit` (10, máx. 100), `active`       |
| `GET`   | `/api/users/:id`        | Detalle de un usuario                                                                              |
| `POST`  | `/api/users`            | Crea un usuario: `{ email, password, name, role? }` (`role`: `ADMIN` o `USER`, por defecto `USER`) |
| `PATCH` | `/api/users/:id`        | Actualiza `{ name?, role?, active? }` (al menos un campo)                                          |
| `PATCH` | `/api/users/:id/status` | Inactiva o reactiva sin eliminar: `{ active }`                                                     |

La lista responde `{ data, meta: { total, offset, limit } }`. Las contraseñas se guardan con bcrypt y nunca se devuelven. Errores principales: `400 VALIDATION_ERROR` (con `details: [{ path, message }]`, también si `limit` supera 100 o el body trae campos no permitidos como `password` o `email` en el `PATCH`), `400 INVALID_ID`, `404 USER_NOT_FOUND` y `409 EMAIL_ALREADY_EXISTS` (el email no distingue mayúsculas).

## Colección de Postman

_Pendiente._

## Convenciones

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
