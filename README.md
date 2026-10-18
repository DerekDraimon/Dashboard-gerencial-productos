# Dashboard gerencial de productos

Aplicación fullstack para gestionar el inventario de productos de una tienda. Incluye un dashboard gerencial con métricas de negocio (valor del inventario, categoría líder, distribución por categoría, productos más caros y más recientes), autenticación con JWT y roles (`ADMIN` y `USER`) y administración de usuarios.

## Stack

| Capa           | Tecnologías                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| Backend        | Node.js, TypeScript, Express 5, MongoDB, Mongoose, JWT, Zod                               |
| Frontend       | React, Material UI, React Router DOM, React Hook Form, Recharts, decimal.js, Dayjs, Axios |
| Pruebas        | Vitest, Supertest, mongodb-memory-server, Testing Library                                 |
| Pruebas de API | Postman y Newman                                                                          |

## Requisitos previos

- **Node.js 24 LTS** y **npm 11**.
- **MongoDB 7**: con **Docker** (Docker Compose levanta la imagen `mongo:7`) o una instancia local de MongoDB 7.

## Puesta en marcha rápida

El repositorio es un monorepo con npm workspaces: las dependencias se instalan una sola vez desde la raíz.

```bash
npm install                              # 1. Dependencias de la raíz y de los workspaces
cp backend/.env.example backend/.env     # 2. Variables de entorno del backend
npm run db:up                            # 3. MongoDB 7 en Docker (puerto 27017)
npm run seed                             # 4. Usuarios de prueba y 20 productos de ejemplo
npm run dev                              # 5. API y frontend con recarga
```

| Servicio | URL                       |
| -------- | ------------------------- |
| Web      | http://localhost:5173     |
| API      | http://localhost:4000/api |

`npm run dev` también ejecuta `db:up` y arranca en paralelo la API (`api`) y el frontend (`web`). Para arrancar cada parte por separado usa `npm run dev:api` y `npm run dev:web`.

Comprobación rápida: `GET http://localhost:4000/api/health` responde `200 { "status": "ok", "database": "connected" }`. Si MongoDB no está disponible, la API sigue arrancada, reintenta la conexión en segundo plano y responde `503 { "status": "degraded", "database": "disconnected" }`.

## Credenciales de prueba

`npm run seed` crea un usuario por rol:

| Rol     | Nombre            | Email                  | Contraseña (por defecto en `.env.example`) |
| ------- | ----------------- | ---------------------- | ------------------------------------------ |
| `ADMIN` | Administrador     | `admin@dashboard.test` | `Admin123!` (`SEED_ADMIN_PASSWORD`)        |
| `USER`  | Usuario de prueba | `user@dashboard.test`  | `User1234!` (`SEED_USER_PASSWORD`)         |

- Las contraseñas se leen de `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` (mínimo 8 caracteres); si falta alguna, el seed termina indicando cuál.
- Es idempotente: si un email ya existe, lo omite sin modificarlo. Para cambiar la contraseña de una cuenta ya creada, elimina ese usuario y vuelve a ejecutar el seed.
- Después inserta 20 productos en 5 categorías (`Electrónica`, `Libros`, `Deportes`, `Hogar`, `Juguetes`), con precios y stock variados y fechas de creación (`creationAt`) en los últimos 60 días. Solo lo hace si la colección de productos está vacía.

## MongoDB

| Opción              | Cómo                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Contenedor (Docker) | `npm run db:up` levanta `mongo:7` en el puerto 27017 con un volumen con nombre; `npm run db:down` lo detiene (los datos se conservan). |
| Instalación local   | Inicia tu MongoDB 7 y ajusta `MONGODB_URI` en `backend/.env` (por ejemplo `mongodb://localhost:27017/dashboard`).                      |

Para restablecer los datos de ejemplo en el contenedor, borra el volumen y vuelve a sembrar:

```bash
docker compose down -v   # Atención: elimina el volumen local de MongoDB y todos sus datos
npm run db:up
npm run seed
```

## Variables de entorno

### Backend

Se leen de `backend/.env` (plantilla en `backend/.env.example`). Se validan al arrancar: si falta una obligatoria o un valor es inválido, el proceso termina indicando qué variable falla.

| Variable                     | Obligatoria | Por defecto             | Descripción                                                                                                                        |
| ---------------------------- | ----------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                   | No          | `development`           | `development`, `test` o `production`                                                                                               |
| `PORT`                       | No          | `4000`                  | Puerto HTTP de la API (1 a 65535)                                                                                                  |
| `MONGODB_URI`                | Sí          | —                       | Cadena de conexión a MongoDB (`mongodb://localhost:27017/dashboard` con Docker)                                                    |
| `JWT_SECRET`                 | Sí          | —                       | Secreto para firmar los JWT (mínimo 32 caracteres)                                                                                 |
| `JWT_EXPIRES_IN`             | No          | `1d`                    | Vigencia del token: segundos (`3600`) o número con `s`, `m`, `h` o `d` (`15m`, `12h`, `1d`)                                        |
| `CORS_ORIGIN`                | No          | `http://localhost:5173` | Origen permitido del frontend                                                                                                      |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No          | `900000`                | Ventana en milisegundos del límite de intentos de login (15 minutos)                                                               |
| `LOGIN_RATE_LIMIT_MAX`       | No          | `10`                    | Intentos de login permitidos por IP en cada ventana                                                                                |
| `SEED_ADMIN_PASSWORD`        | Solo seed   | —                       | Contraseña del usuario `ADMIN` del seed (mínimo 8 caracteres)                                                                      |
| `SEED_USER_PASSWORD`         | Solo seed   | —                       | Contraseña del usuario `USER` del seed (mínimo 8 caracteres)                                                                       |
| `TRUST_PROXY`                | No          | sin definir             | `true`, `false`, número de saltos (`1`) o lista de direcciones o subredes separadas por comas (`loopback, 10.0.0.0/8`). Ver abajo. |

`TRUST_PROXY` solo hace falta si la API corre detrás de un proxy inverso: así `req.ip` y el límite de intentos de login usan la IP real de `X-Forwarded-For`. Vacío equivale a no definirla; un valor inválido detiene el arranque. Prefiere un número de saltos (`TRUST_PROXY=1`) o una lista de subredes, y **nunca uses `true` en producción**: confiaría en cualquier `X-Forwarded-For` y un cliente podría falsear su IP para esquivar el límite.

### Frontend

No necesita archivo de entorno: en desarrollo llama a `/api` y Vite reenvía esas peticiones a `http://localhost:4000`. Si la API está en otra dirección, crea `frontend/.env.local`:

| Variable       | Obligatoria | Por defecto | Descripción                                                  |
| -------------- | ----------- | ----------- | ------------------------------------------------------------ |
| `VITE_API_URL` | No          | `/api`      | URL base de la API (por ejemplo `http://localhost:4000/api`) |

Si `VITE_API_URL` apunta a otro origen, ese origen del frontend debe estar en `CORS_ORIGIN`.

## Scripts

Desde la raíz:

| Comando            | Descripción                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `npm run dev`      | Levanta MongoDB (`db:up`) y arranca API y frontend en paralelo, con recarga |
| `npm run dev:api`  | Solo la API (nodemon + tsx) en http://localhost:4000                        |
| `npm run dev:web`  | Solo el frontend (Vite) en http://localhost:5173                            |
| `npm run db:up`    | Levanta MongoDB en Docker                                                   |
| `npm run db:down`  | Detiene MongoDB (conserva el volumen)                                       |
| `npm run seed`     | Crea los usuarios de prueba y los productos de ejemplo                      |
| `npm run build`    | Compila el backend a `backend/dist/` y el frontend a `frontend/dist/`       |
| `npm test`         | Pruebas de ambos workspaces (no requiere Docker)                            |
| `npm run lint`     | ESLint en ambos workspaces                                                  |
| `npm run format`   | Formatea el repositorio con Prettier                                        |
| `npm run test:api` | Ejecuta la colección de Postman con Newman contra la API en marcha          |

Por workspace (`-w backend` o `-w frontend`):

| Comando                         | Descripción                                           |
| ------------------------------- | ----------------------------------------------------- |
| `npm start -w backend`          | Ejecuta la API compilada (`node dist/server.js`)      |
| `npm test -w backend`           | Pruebas de la API                                     |
| `npm test -w frontend`          | Pruebas del frontend                                  |
| `npm run typecheck -w backend`  | Verifica los tipos de la API sin compilar             |
| `npm run typecheck -w frontend` | Verifica los tipos del frontend                       |
| `npm run preview -w frontend`   | Sirve el build del frontend para revisarlo localmente |

## API

Base: `http://localhost:4000/api`. Las rutas protegidas requieren la cabecera:

```http
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login` y vence según `JWT_EXPIRES_IN`. En cada petición la API vuelve a leer el usuario: si fue inactivado o eliminado, responde `401`; si cambió su rol, aplica el nuevo.

### Permisos

| Recurso                                           | `ADMIN` | `USER` | Sin token |
| ------------------------------------------------- | ------- | ------ | --------- |
| `POST /api/auth/login`                            | Sí      | Sí     | Sí        |
| `GET /api/auth/me`                                | Sí      | Sí     | `401`     |
| `GET /api/products` (lista, detalle y categorías) | Sí      | Sí     | `401`     |
| `POST`, `PATCH` y `DELETE /api/products`          | Sí      | `403`  | `401`     |
| `/api/users` (todas)                              | Sí      | `403`  | `401`     |

### Endpoints

| Método   | Ruta                       | Descripción                                                                                                      |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/health`              | Estado de la API y de la conexión a MongoDB                                                                      |
| `POST`   | `/api/auth/login`          | `{ email, password }` → `{ token, user }`                                                                        |
| `GET`    | `/api/auth/me`             | Usuario autenticado                                                                                              |
| `GET`    | `/api/users`               | Lista paginada, más recientes primero. Query: `offset` (0), `limit` (10, máx. 100), `active`                     |
| `GET`    | `/api/users/:id`           | Detalle de un usuario                                                                                            |
| `POST`   | `/api/users`               | `{ email, password, name, role? }` (`role`: `ADMIN` o `USER`, por defecto `USER`)                                |
| `PATCH`  | `/api/users/:id`           | `{ name?, role?, active? }` (al menos un campo)                                                                  |
| `PATCH`  | `/api/users/:id/status`    | Inactiva o reactiva sin eliminar: `{ active }`                                                                   |
| `GET`    | `/api/products`            | Lista paginada por `creationAt` descendente. Query: `offset` (0), `limit` (10, máx. 100), `search`, `from`, `to` |
| `GET`    | `/api/products/categories` | Categorías existentes, sin repetir y en orden alfabético                                                         |
| `GET`    | `/api/products/:id`        | Detalle de un producto                                                                                           |
| `POST`   | `/api/products`            | `{ title, description, price, category, images?, stock }`                                                        |
| `PATCH`  | `/api/products/:id`        | Cualquiera de esos campos (al menos uno)                                                                         |
| `DELETE` | `/api/products/:id`        | Elimina el producto definitivamente; responde `204` sin cuerpo                                                   |

Detalles:

- Las listas responden `{ data, meta: { total, offset, limit } }`.
- `search` busca en el título sin distinguir mayúsculas y se toma literal (no es una expresión regular).
- `from` y `to` son fechas `YYYY-MM-DD` en UTC, inclusivas (`to` cubre el día completo) y se pueden usar por separado. Si `from` es posterior a `to` o una fecha no existe (`2026-02-30`), responde `400`.
- Productos: `title` hasta 120 caracteres, `description` hasta 2000 y `category` hasta 60 (obligatorios, sin espacios al inicio ni al final); `price` mayor que 0 con hasta 2 decimales; `stock` entero mayor o igual a 0; `images` hasta 10 URLs `http` o `https` (por defecto `[]`).
- Usuarios: el email no distingue mayúsculas; la contraseña tiene entre 8 y 72 caracteres, se guarda con bcrypt y nunca se devuelve. Un administrador no puede inactivarse ni cambiar su propio rol.
- Los cuerpos JSON tienen un límite de 100 KB.

### Errores

Todos los errores siguen el formato `{ "error": { "code", "message", "details"? } }`; los de validación incluyen `details: [{ path, message }]`.

| Código HTTP | `code`                                             | Cuándo                                                                       |
| ----------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `400`       | `VALIDATION_ERROR`, `INVALID_ID`, `INVALID_JSON`   | Datos inválidos o campos no permitidos, id mal formado, JSON mal formado     |
| `401`       | `INVALID_CREDENTIALS`                              | Email o contraseña incorrectos (mismo error en ambos casos)                  |
| `401`       | `UNAUTHENTICATED`, `INVALID_TOKEN`                 | Falta el token, o es inválido, expiró o su usuario está inactivo o no existe |
| `403`       | `USER_INACTIVE`, `FORBIDDEN`                       | Login de un usuario inactivo; el rol no tiene permiso                        |
| `404`       | `PRODUCT_NOT_FOUND`, `USER_NOT_FOUND`, `NOT_FOUND` | El recurso o la ruta no existe                                               |
| `409`       | `EMAIL_ALREADY_EXISTS`, `CANNOT_MODIFY_SELF`       | Email repetido; un administrador intenta inactivarse o cambiar su rol        |
| `413`       | `PAYLOAD_TOO_LARGE`                                | El cuerpo supera los 100 KB                                                  |
| `429`       | `TOO_MANY_REQUESTS`                                | Demasiados intentos de login desde la misma IP                               |
| `503`       | `DATABASE_UNAVAILABLE`                             | MongoDB no está disponible                                                   |

## Probar con Postman

| Archivo                                               | Contenido                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `postman/dashboard-gerencial.postman_collection.json` | Requests de todos los endpoints en carpetas (`00 Health`, `01 Auth`, `02 Products`, `03 Users`)          |
| `postman/local.postman_environment.json`              | Entorno "Local": `baseUrl` (`http://localhost:4000/api`), credenciales del seed y variables de ejecución |

Cada request comprueba el código de estado y la estructura de la respuesta. La colección es autosuficiente y repetible: inicia sesión y guarda `adminToken` y `userToken`, crea, actualiza y elimina un producto con payloads de ejemplo, y crea un usuario con email único que termina inactivado.

Con MongoDB levantado, el seed ejecutado y la API en marcha (`npm run dev:api`):

1. En Postman, **Import** y selecciona los dos archivos de `postman/`.
2. Elige el entorno **Local**.
3. Ejecuta la colección con el **Runner** en el orden en que viene (cada request usa variables que guardan los anteriores).

Desde la terminal, con [Newman](https://github.com/postmanlabs/newman) (se descarga con `npx`):

```bash
npm run test:api   # termina con código distinto de 0 si falla alguna comprobación
```

Cada ejecución hace 3 logins, que cuentan para el límite de intentos (10 cada 15 minutos por defecto). Para ejecutarla varias veces seguidas en local, sube `LOGIN_RATE_LIMIT_MAX` en `backend/.env` y reinicia la API.

## Pruebas

```bash
npm test               # ambos workspaces
npm test -w backend    # API
npm test -w frontend   # frontend
```

| Workspace | Herramientas                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Backend   | Vitest y Supertest contra la app Express, con MongoDB en memoria (mongodb-memory-server): no requiere Docker ni una base de datos real |
| Frontend  | Vitest, Testing Library y jsdom: componentes, hooks, rutas protegidas y funciones puras de métricas                                    |

## Arquitectura

Monorepo con npm workspaces (`backend/`, `frontend/`) y la colección en `postman/`.

### Backend: monolito modular

Cada módulo agrupa sus capas: `routes` → `controller` → `service` → `model`, con esquemas Zod para validar la entrada. Lo transversal vive en `shared/`.

```
backend/src/
├── modules/
│   ├── auth/        # login, /me, middleware authenticate, límite de intentos
│   ├── products/    # routes, controller, service, model, schemas, constants
│   └── users/       # routes, controller, service, model, schemas
├── routes/          # router raíz /api y /api/health
├── shared/
│   ├── auth/        # firma y verificación de JWT, authorize por rol
│   ├── config/      # lectura y validación de variables de entorno
│   ├── db/          # conexión a MongoDB con reintentos
│   ├── errors/      # AppError
│   ├── http/        # paginación, ObjectId, límite del cuerpo
│   └── middlewares/ # manejo centralizado de errores, 404, validate, require-db
├── scripts/         # seed de usuarios y productos
├── app.ts           # composición de la app Express
└── server.ts        # arranque
```

### Frontend: por features, contenedor/presentación

Cada feature separa `api` (llamadas HTTP), `hooks` (estado y datos), `components` (presentación reutilizable) y `views` (páginas contenedoras). Los componentes, hooks y utilidades comunes viven en `shared/`.

```
frontend/src/
├── app/             # App, rutas, tema de MUI y providers
├── features/
│   ├── auth/        # sesión, login, guardas de rutas por rol
│   ├── dashboard/   # métricas (funciones puras), KPIs y gráficos
│   ├── products/    # inventario: tabla, filtros, formulario, detalle
│   └── users/       # administración de usuarios
└── shared/          # api, components, hooks, forms, format, layout, feedback, pages
```

## Decisiones técnicas

- **decimal.js para dinero**: evita errores de coma flotante al sumar precios (`0.1 + 0.2`).
- **Métricas como funciones puras** con `reduce`, `map` y `filter`, separadas de los componentes: fáciles de probar y de reutilizar.
- **Valor del inventario = suma de los precios**, tal como lo define el enunciado (no multiplica por el stock).
- **Token en `localStorage`**, revalidado con `/auth/me` al iniciar: la API vuelve a leer el usuario en cada petición (un usuario inactivo pierde el acceso al instante), React escapa el contenido y el token se borra al cerrar sesión o al recibir `401`.
- **Ids de MongoDB (ObjectId)**: la API valida el formato y responde `400 INVALID_ID` antes de consultar.
- **Borrado definitivo de productos e inactivación de usuarios**: un producto eliminado no se necesita para nada; un usuario se inactiva para conservar su historial y poder reactivarlo.
- **Errores del servidor traducidos en la UI**: la API responde códigos estables (`code`) y el frontend los muestra en español.
- **Páginas con carga diferida y chunks de vendor** (React, MUI, Recharts): la carga inicial es menor y un fallo al descargar una página muestra "Reintentar" en lugar de romper la app.

## Mejoras futuras

- **Revocar tokens al cerrar sesión**: lista de bloqueo en Redis con el `jti` hasta su `exp`, o tokens de vida corta con refresh token.
- **Cookie `httpOnly`** (`Secure`, `SameSite`) emitida por el backend en lugar de `localStorage`.
- **Endpoint de métricas en el backend** (`/products/metrics` con `$group` de MongoDB) en lugar de descargar todo el catálogo para calcularlas en el navegador.
- **Almacén compartido para el límite de intentos** (por ejemplo Redis): hoy está en memoria y se reinicia con la API.
- **Recarga completa ante chunks obsoletos** tras un despliegue, y envío de errores a un servicio de monitoreo.
- **CI/CD con despliegue** automático, además de las comprobaciones de lint, pruebas y build.

## Convenciones

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
