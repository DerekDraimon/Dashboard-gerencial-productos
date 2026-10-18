<div align="center">

# 📊 Dashboard gerencial de productos

Inventario de una tienda con métricas de negocio, autenticación por roles y administración de usuarios.

[![CI](https://github.com/DerekDraimon/Dashboard-gerencial-productos/actions/workflows/ci.yml/badge.svg)](https://github.com/DerekDraimon/Dashboard-gerencial-productos/actions/workflows/ci.yml)
![Node.js 24](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB 7](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)

[Puesta en marcha](#-puesta-en-marcha) · [Credenciales](#-credenciales-de-prueba) · [Scripts](#-scripts) · [Postman](#-probar-con-postman) · [API](docs/api.md) · [Arquitectura](docs/arquitectura.md)

</div>

---

## ✅ Requisitos previos

| Herramienta | Versión         | Para qué                                                      |
| ----------- | --------------- | ------------------------------------------------------------- |
| Node.js     | 24 LTS (npm 11) | Correr la API y la web                                        |
| Docker      | Cualquiera      | Levantar MongoDB 7 con un comando (o usa tu propio MongoDB 7) |

## 🚀 Puesta en marcha

Todo se ejecuta desde la **raíz** del repositorio:

```bash
# 1. Instalar dependencias (backend y frontend a la vez)
npm install

# 2. Crear el archivo de variables de entorno a partir de la plantilla
cp backend/.env.example backend/.env

# 3. Levantar MongoDB en Docker
npm run db:up

# 4. Crear los usuarios de prueba y 20 productos de ejemplo
npm run seed

# 5. Arrancar la API y la web
npm run dev
```

Listo. Abre la web e inicia sesión con las [credenciales de prueba](#-credenciales-de-prueba):

| Servicio | URL                                                    |
| -------- | ------------------------------------------------------ |
| 🖥️ Web   | [http://localhost:5173](http://localhost:5173)         |
| 🔌 API   | [http://localhost:4000/api](http://localhost:4000/api) |

> [!TIP]
> Para comprobar que la API está viva: `GET http://localhost:4000/api/health` responde `{ "status": "ok", "database": "connected" }`. Si MongoDB se cae, la API sigue arriba, responde `503` y se reconecta sola.

<details>
<summary><b>¿Sin Docker? Usar un MongoDB propio</b></summary>

<br>

Inicia tu MongoDB 7 y, en `backend/.env`, cambia `MONGODB_URI` (por ejemplo `mongodb://localhost:27017/dashboard`). Después sigue desde el paso 4.

</details>

<details>
<summary><b>Volver a los datos de ejemplo desde cero</b></summary>

<br>

```bash
docker compose down -v   # ⚠️ borra el volumen de MongoDB y todos sus datos
npm run db:up
npm run seed
```

</details>

## 🔑 Credenciales de prueba

`npm run seed` crea un usuario por rol:

| Rol        | Email                  | Contraseña  | Puede                                                          |
| ---------- | ---------------------- | ----------- | -------------------------------------------------------------- |
| 👑 `ADMIN` | `admin@dashboard.test` | `Admin123!` | Todo: crear, editar y eliminar productos; administrar usuarios |
| 👤 `USER`  | `user@dashboard.test`  | `User1234!` | Consultar: ver el dashboard, el inventario y el detalle        |

> [!NOTE]
> Las contraseñas salen de `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` en `backend/.env`. El seed no modifica usuarios que ya existen, y solo crea productos si la colección está vacía.

## ⚙️ Variables de entorno

La plantilla `backend/.env.example` ya trae valores que funcionan en local: **no hace falta cambiar nada** para probar la app. Al arrancar, la API valida cada variable y, si alguna falta o es inválida, se detiene indicando cuál.

<details>
<summary><b>Ver todas las variables del backend</b></summary>

<br>

| Variable                     | Obligatoria | Por defecto             | Descripción                                                                            |
| ---------------------------- | :---------: | ----------------------- | -------------------------------------------------------------------------------------- |
| `MONGODB_URI`                |     Sí      | —                       | Conexión a MongoDB (`mongodb://localhost:27017/dashboard` con Docker)                  |
| `JWT_SECRET`                 |     Sí      | —                       | Secreto para firmar los tokens (mínimo 32 caracteres)                                  |
| `JWT_EXPIRES_IN`             |     No      | `1d`                    | Vigencia del token: segundos (`3600`) o con unidad (`15m`, `12h`, `1d`)                |
| `PORT`                       |     No      | `4000`                  | Puerto de la API                                                                       |
| `CORS_ORIGIN`                |     No      | `http://localhost:5173` | Origen permitido del frontend                                                          |
| `NODE_ENV`                   |     No      | `development`           | `development`, `test` o `production`                                                   |
| `LOGIN_RATE_LIMIT_WINDOW_MS` |     No      | `900000`                | Ventana del límite de intentos de login, en milisegundos (15 minutos)                  |
| `LOGIN_RATE_LIMIT_MAX`       |     No      | `10`                    | Intentos de login permitidos por IP en cada ventana                                    |
| `SEED_ADMIN_PASSWORD`        |  Solo seed  | —                       | Contraseña del usuario `ADMIN` del seed (mínimo 8 caracteres)                          |
| `SEED_USER_PASSWORD`         |  Solo seed  | —                       | Contraseña del usuario `USER` del seed (mínimo 8 caracteres)                           |
| `TRUST_PROXY`                |     No      | sin definir             | Solo detrás de un proxy inverso: número de saltos (`1`) o lista de subredes. Ver abajo |

`TRUST_PROXY` hace que `req.ip` y el límite de login usen la IP real de `X-Forwarded-For`. Vacío equivale a no definirla. Prefiere `TRUST_PROXY=1` o una lista de subredes (`loopback, 10.0.0.0/8`), y **nunca uses `true` en producción**: confiaría en cualquier `X-Forwarded-For`, y un cliente podría falsear su IP para esquivar el límite.

</details>

<details>
<summary><b>Frontend (opcional)</b></summary>

<br>

No necesita archivo de entorno: en desarrollo llama a `/api` y Vite reenvía esas peticiones a `http://localhost:4000`. Solo si la API está en otra dirección, crea `frontend/.env.local` con `VITE_API_URL` (por ejemplo `http://localhost:4000/api`) y agrega ese origen del frontend a `CORS_ORIGIN`.

</details>

## 📜 Scripts

| Comando            | Qué hace                                                         |
| ------------------ | ---------------------------------------------------------------- |
| `npm run dev`      | Levanta MongoDB y arranca la API y la web, con recarga           |
| `npm run dev:api`  | Solo la API, en http://localhost:4000                            |
| `npm run dev:web`  | Solo la web, en http://localhost:5173                            |
| `npm run db:up`    | Levanta MongoDB en Docker                                        |
| `npm run db:down`  | Detiene MongoDB (los datos se conservan)                         |
| `npm run seed`     | Crea los usuarios de prueba y los productos de ejemplo           |
| `npm test`         | Corre todas las pruebas (no necesita Docker)                     |
| `npm run test:api` | Corre la colección de Postman con Newman contra la API en marcha |
| `npm run lint`     | Revisa el código con ESLint                                      |
| `npm run build`    | Compila la API y la web para producción                          |

<details>
<summary><b>Scripts por workspace</b></summary>

<br>

| Comando                         | Qué hace                                  |
| ------------------------------- | ----------------------------------------- |
| `npm test -w backend`           | Pruebas de la API                         |
| `npm test -w frontend`          | Pruebas de la web                         |
| `npm run typecheck -w backend`  | Verifica los tipos de la API              |
| `npm run typecheck -w frontend` | Verifica los tipos de la web              |
| `npm start -w backend`          | Ejecuta la API compilada                  |
| `npm run preview -w frontend`   | Sirve el build de la web para revisarlo   |
| `npm run format`                | Formatea todo el repositorio con Prettier |

</details>

## 🧪 Probar con Postman

En la carpeta `postman/` hay dos archivos: la **colección**, con todos los endpoints y sus comprobaciones, y el **entorno "Local"**, con la URL y las credenciales del seed.

Con la API en marcha (`npm run dev`):

1. En Postman, haz clic en **Import** y elige los dos archivos de `postman/`.
2. Selecciona el entorno **Local**, arriba a la derecha.
3. Abre la colección y ejecútala con **Run collection**, en el orden en que viene.

O desde la terminal, sin abrir Postman:

```bash
npm run test:api
```

> [!TIP]
> Cada corrida hace 3 logins, que cuentan para el límite de intentos (10 cada 15 minutos). Si la vas a correr muchas veces seguidas, sube `LOGIN_RATE_LIMIT_MAX` en `backend/.env` y reinicia la API.

## 📚 Más documentación

| Documento                               | Contenido                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| 📡 [Referencia de la API](docs/api.md)  | Endpoints, permisos por rol, reglas de validación y códigos de error |
| 🏗️ [Arquitectura](docs/arquitectura.md) | Stack, estructura de carpetas, decisiones técnicas y mejoras futuras |

**En resumen:** el backend es un monolito modular (cada módulo con `routes` → `controller` → `service` → `model`), y el frontend está organizado por features con el patrón contenedor/presentación. Las métricas del dashboard son funciones puras con `reduce`, `map` y `filter`, y el dinero se calcula con decimal.js.
