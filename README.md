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
├── frontend/   # Dashboard (React + Vite + TypeScript + Material UI)
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

# 3. Levantar MongoDB, la API y el frontend en modo desarrollo
npm run dev
```

`npm run dev` levanta MongoDB en Docker (puerto 27017, datos en un volumen con nombre) y arranca en paralelo, con recarga, la API (`api`, http://localhost:4000) y el frontend (`web`, http://localhost:5173). Abre http://localhost:5173 en el navegador.

Para arrancar cada parte por separado:

| Comando           | Descripción                                      |
| ----------------- | ------------------------------------------------ |
| `npm run db:up`   | Levanta solo MongoDB en Docker                   |
| `npm run dev:api` | Arranca solo la API (http://localhost:4000)      |
| `npm run dev:web` | Arranca solo el frontend (http://localhost:5173) |

Para crear los usuarios de prueba y los productos de ejemplo, ejecuta `npm run seed` con MongoDB levantado (ver [Credenciales de prueba](#credenciales-de-prueba)).

Para detener MongoDB: `npm run db:down` (los datos se conservan en el volumen).

Comprobación rápida: `GET http://localhost:4000/api/health` responde `200 { "status": "ok", "database": "connected" }`. Si MongoDB no está disponible, la API sigue arrancada, reintenta la conexión en segundo plano y responde `503 { "status": "degraded", "database": "disconnected" }`.

Otros comandos:

| Comando                         | Descripción                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| `npm run build`                 | Compila el backend a `backend/dist/` y el frontend a `frontend/dist/` |
| `npm start -w backend`          | Ejecuta la versión compilada de la API (`node dist/server.js`)        |
| `npm test`                      | Ejecuta las pruebas de ambos workspaces (no requiere Docker)          |
| `npm test -w backend`           | Pruebas de la API (Vitest + Supertest con MongoDB en memoria)         |
| `npm test -w frontend`          | Pruebas del frontend (Vitest + Testing Library + jsdom)               |
| `npm run lint`                  | Revisa el código de ambos workspaces con ESLint                       |
| `npm run typecheck -w backend`  | Verifica los tipos de la API sin compilar                             |
| `npm run typecheck -w frontend` | Verifica los tipos del frontend sin compilar                          |
| `npm run preview -w frontend`   | Sirve el build del frontend para revisarlo localmente                 |
| `npm run format`                | Formatea el código con Prettier                                       |

## Variables de entorno

### Backend

Se leen de `backend/.env` (ver `backend/.env.example`). Al arrancar se validan y, si falta una obligatoria o tiene un valor inválido, el proceso termina indicando qué variable falla.

| Variable                     | Obligatoria | Valor por defecto       | Descripción                                                                                         |
| ---------------------------- | ----------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `PORT`                       | No          | `4000`                  | Puerto HTTP de la API                                                                               |
| `MONGODB_URI`                | Sí          | —                       | Cadena de conexión a MongoDB (`mongodb://localhost:27017/dashboard` con Docker)                     |
| `JWT_SECRET`                 | Sí          | —                       | Secreto para firmar los tokens JWT (mínimo 32 caracteres)                                           |
| `JWT_EXPIRES_IN`             | No          | `1d`                    | Vigencia de los tokens JWT: segundos (`3600`) o número con `s`, `m`, `h` o `d` (`15m`, `12h`, `1d`) |
| `CORS_ORIGIN`                | No          | `http://localhost:5173` | Origen permitido del frontend                                                                       |
| `SEED_ADMIN_PASSWORD`        | No          | —                       | Contraseña del usuario `ADMIN` creado por el seed                                                   |
| `SEED_USER_PASSWORD`         | No          | —                       | Contraseña del usuario `USER` creado por el seed                                                    |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No          | `900000`                | Ventana en milisegundos del límite de intentos de login (15 minutos)                                |
| `LOGIN_RATE_LIMIT_MAX`       | No          | `10`                    | Intentos de login permitidos por IP en cada ventana                                                 |

### Frontend

El frontend no necesita archivo de entorno: en desarrollo llama a `/api` y Vite reenvía esas peticiones a la API en `http://localhost:4000`. Si la API está en otra dirección, crea `frontend/.env.local` con la variable:

| Variable       | Obligatoria | Valor por defecto | Descripción                                                  |
| -------------- | ----------- | ----------------- | ------------------------------------------------------------ |
| `VITE_API_URL` | No          | `/api`            | URL base de la API (por ejemplo `http://localhost:4000/api`) |

Si `VITE_API_URL` apunta directamente a la API (otro origen), la API debe permitir el origen del frontend en `CORS_ORIGIN` (por defecto `http://localhost:5173`).

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

Después de los usuarios, el seed inserta 20 productos de ejemplo en 5 categorías (`Electronics`, `Books`, `Sports`, `Home`, `Toys`), con precios y stock variados y fechas de creación (`creationAt`) repartidas en los últimos 60 días. Solo los inserta si la colección de productos está vacía: si ya existe algún producto, no crea ni modifica ninguno.

## API

Todas las rutas están bajo `/api`. Los errores siguen el formato `{ "error": { "code", "message", "details"? } }`; las rutas que usan la base de datos responden `503 DATABASE_UNAVAILABLE` si MongoDB no está disponible.

### Autenticación

| Método | Ruta              | Descripción                                                          |
| ------ | ----------------- | -------------------------------------------------------------------- |
| `POST` | `/api/auth/login` | Inicia sesión con `{ email, password }` y responde `{ token, user }` |
| `GET`  | `/api/auth/me`    | Devuelve el usuario autenticado (requiere token)                     |

El token es un JWT con vigencia `JWT_EXPIRES_IN`. Se envía en cada petición protegida con la cabecera:

```http
Authorization: Bearer <token>
```

En cada petición la API vuelve a leer el usuario de la base de datos: si fue inactivado o eliminado después de emitir el token, la siguiente petición responde `401`, y si cambió su rol se aplica el rol nuevo.

Errores: `400 VALIDATION_ERROR`, `429 TOO_MANY_REQUESTS` (demasiados intentos de login desde la misma IP; ver `LOGIN_RATE_LIMIT_WINDOW_MS` y `LOGIN_RATE_LIMIT_MAX`), `401 INVALID_CREDENTIALS` (el mismo para email desconocido y contraseña incorrecta), `403 USER_INACTIVE` (credenciales correctas pero usuario inactivo), `401 UNAUTHENTICATED` (falta el token), `401 INVALID_TOKEN` (token inválido, expirado o de un usuario inactivo o inexistente) y `403 FORBIDDEN` (el rol no tiene permiso).

### Permisos

| Recurso                                           | `ADMIN` | `USER` | Sin token |
| ------------------------------------------------- | ------- | ------ | --------- |
| `POST /api/auth/login`                            | Sí      | Sí     | Sí        |
| `GET /api/auth/me`                                | Sí      | Sí     | `401`     |
| `/api/users` (todas)                              | Sí      | `403`  | `401`     |
| `GET /api/products` (lista, detalle y categorías) | Sí      | Sí     | `401`     |
| `POST`, `PATCH` y `DELETE /api/products`          | Sí      | `403`  | `401`     |

### Usuarios

Todas las rutas de usuarios requieren un token de un usuario `ADMIN`.

| Método  | Ruta                    | Descripción                                                                                        |
| ------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/users`            | Lista paginada, más recientes primero. Query: `offset` (0), `limit` (10, máx. 100), `active`       |
| `GET`   | `/api/users/:id`        | Detalle de un usuario                                                                              |
| `POST`  | `/api/users`            | Crea un usuario: `{ email, password, name, role? }` (`role`: `ADMIN` o `USER`, por defecto `USER`) |
| `PATCH` | `/api/users/:id`        | Actualiza `{ name?, role?, active? }` (al menos un campo)                                          |
| `PATCH` | `/api/users/:id/status` | Inactiva o reactiva sin eliminar: `{ active }`                                                     |

La lista responde `{ data, meta: { total, offset, limit } }`. Las contraseñas se guardan con bcrypt y nunca se devuelven. Errores principales: `400 VALIDATION_ERROR` (con `details: [{ path, message }]`, también si `limit` supera 100 o el body trae campos no permitidos como `password` o `email` en el `PATCH`), `400 INVALID_ID`, `404 USER_NOT_FOUND`, `409 EMAIL_ALREADY_EXISTS` (el email no distingue mayúsculas) y `409 CANNOT_MODIFY_SELF` (un administrador no puede inactivarse ni cambiar su propio rol; sí puede cambiar su nombre). La contraseña debe tener entre 8 y 72 caracteres.

### Productos

Todas las rutas de productos requieren token. Cualquier rol puede consultar; solo `ADMIN` puede crear, actualizar y eliminar.

| Método   | Ruta                       | Descripción                                                                                                                   |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/products`            | Lista paginada, más recientes primero (por `creationAt`). Query: `offset` (0), `limit` (10, máx. 100), `search`, `from`, `to` |
| `GET`    | `/api/products/categories` | Categorías existentes, sin repetir y ordenadas alfabéticamente                                                                |
| `GET`    | `/api/products/:id`        | Detalle de un producto                                                                                                        |
| `POST`   | `/api/products`            | Crea un producto: `{ title, description, price, category, images?, stock }`                                                   |
| `PATCH`  | `/api/products/:id`        | Actualiza cualquiera de esos campos (al menos uno)                                                                            |
| `DELETE` | `/api/products/:id`        | Elimina el producto definitivamente; responde `204` sin cuerpo                                                                |

Parámetros de la lista:

- `search`: busca en el título sin distinguir mayúsculas; el texto se toma literal (`.*` busca esos dos caracteres, no es una expresión regular).
- `from` y `to`: fechas `YYYY-MM-DD` (en UTC) para filtrar por `creationAt`; ambas son inclusivas y `to` cubre el día completo. Se pueden usar por separado. Si `from` es posterior a `to`, o una fecha tiene otro formato o no existe (por ejemplo `2026-02-30`), responde `400`.

La lista responde `{ data, meta: { total, offset, limit } }`. Reglas de los campos: `title` hasta 120 caracteres, `description` hasta 2000, `category` hasta 60 (los tres obligatorios y sin espacios al inicio ni al final); `price` mayor que 0 y con hasta 2 decimales; `stock` entero mayor o igual a 0; `images` lista de hasta 10 URLs `http` o `https` (por defecto `[]`).

Errores principales: `400 VALIDATION_ERROR` (con `details: [{ path, message }]`, también si el body trae campos no permitidos), `400 INVALID_ID`, `404 PRODUCT_NOT_FOUND`, `401 UNAUTHENTICATED` / `401 INVALID_TOKEN` y `403 FORBIDDEN` (un `USER` intenta crear, actualizar o eliminar).

## Probar con Postman

La carpeta `postman/` contiene la colección de la API y un entorno local:

| Archivo                                               | Contenido                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `postman/dashboard-gerencial.postman_collection.json` | Requests de todos los endpoints, ordenados en carpetas (`00 Health`, `01 Auth`, `02 Products`, `03 Users`)  |
| `postman/local.postman_environment.json`              | Entorno "Local": `baseUrl` (`http://localhost:4000/api`), credenciales del seed y variables de la ejecución |

Cada request comprueba el código de estado y la estructura de la respuesta. La colección es autosuficiente y se puede ejecutar varias veces: inicia sesión, guarda los tokens en el entorno, crea un producto con un payload de ejemplo, lo actualiza y lo elimina, y crea un usuario con un email único que termina inactivado. El login de `ADMIN` guarda `adminToken`, que la colección usa por defecto; las peticiones como `USER` usan `userToken`.

Requisitos previos:

1. MongoDB levantado (`npm run db:up`).
2. Datos de prueba creados con `npm run seed`.
3. La API en marcha en `http://localhost:4000` (`npm run dev:api`).

Desde Postman:

1. **Import** y selecciona los dos archivos de `postman/`.
2. Elige el entorno **Local** en el selector de entornos.
3. Ejecuta la colección completa con el **Runner**, en el orden en que viene (cada request usa variables que guardan los anteriores).

Desde la terminal, con [Newman](https://github.com/postmanlabs/newman) (se descarga con `npx`, no es una dependencia del proyecto):

```bash
npm run test:api
```

Termina con código distinto de 0 si falla alguna comprobación.

Cada ejecución hace 3 logins, que cuentan para el límite de intentos de login (10 cada 15 minutos por defecto). Para ejecutarla varias veces seguidas en local, sube `LOGIN_RATE_LIMIT_MAX` en `backend/.env` y reinicia la API.

## Convenciones

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
