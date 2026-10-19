# 🏗️ Arquitectura y decisiones

[← Volver al README](../README.md)

Monorepo con npm workspaces: `backend/` (API), `frontend/` (web) y la colección de Postman en `postman/`.

## 🧰 Stack

| Capa           | Tecnologías                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| Backend        | Node.js, TypeScript, Express 5, MongoDB, Mongoose, JWT, Zod                               |
| Frontend       | React, Material UI, React Router DOM, React Hook Form, Recharts, decimal.js, Dayjs, Axios |
| Pruebas        | Vitest, Supertest, mongodb-memory-server, Testing Library                                 |
| Pruebas de API | Postman y Newman                                                                          |

## ⚙️ Backend: monolito modular

Cada módulo agrupa sus capas: `routes` → `controller` → `service` → `model`, con esquemas Zod para validar la entrada. Lo transversal vive en `shared/`.

```text
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

## 🖥️ Frontend: por features, contenedor/presentación

Cada feature separa sus piezas:

- `api`: llamadas HTTP;
- `hooks`: estado y datos;
- `components`: presentación reutilizable;
- `views`: páginas contenedoras.

Los componentes, hooks y utilidades comunes viven en `shared/`.

```text
frontend/src/
├── app/             # App, rutas, tema de MUI y providers
├── features/
│   ├── auth/        # sesión, login, guardas de rutas por rol
│   ├── dashboard/   # métricas (funciones puras), KPIs y gráficos
│   ├── products/    # inventario: tabla, filtros, formulario, detalle
│   └── users/       # administración de usuarios
└── shared/          # api, components, hooks, forms, format, layout, feedback, pages
```

## 💡 Decisiones técnicas

| Decisión                                                      | Por qué                                                                                                                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **decimal.js para dinero**                                    | Evita errores de coma flotante al sumar precios (`0.1 + 0.2`)                                                                                                                           |
| **Métricas como funciones puras** (`reduce`, `map`, `filter`) | Separadas de los componentes: fáciles de probar y de reutilizar                                                                                                                         |
| **Valor del inventario = suma de los precios**                | Así lo define el enunciado (no multiplica por el stock)                                                                                                                                 |
| **Precios en pesos colombianos (COP)**                        | Sin centavos cuando el monto es entero (`$ 89.900`) y con dos decimales cuando los tiene (`$ 24,99`)                                                                                    |
| **Token en `localStorage`**, revalidado con `/auth/me`        | La API vuelve a leer el usuario en cada petición (un usuario inactivo pierde el acceso al instante). React escapa el contenido, y el token se borra al cerrar sesión o al recibir `401` |
| **Ids de MongoDB (ObjectId)**                                 | La API valida el formato y responde `400 INVALID_ID` antes de consultar                                                                                                                 |
| **Productos: borrado definitivo. Usuarios: inactivación**     | Un producto eliminado no se necesita más; un usuario se inactiva para conservar su historial y poder reactivarlo                                                                        |
| **Errores del servidor traducidos en la UI**                  | La API responde códigos estables (`code`) y el frontend los muestra en español                                                                                                          |
| **Páginas con carga diferida y chunks de vendor**             | Carga inicial menor; si falla la descarga de una página se muestra "Reintentar" en lugar de romper la app                                                                               |
| **Colores solo en el tema** (`app/theme.ts`)                  | Los componentes usan tokens con nombre (`tint.danger`, `surface.track`, `inverse.text`) y layout con `Grid` y `Stack`; un test falla si aparece un color fijo fuera del tema            |

## 🧪 Pruebas

| Workspace | Herramientas                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Backend   | Vitest y Supertest contra la app Express, con MongoDB en memoria (mongodb-memory-server): no requiere Docker ni una base de datos real |
| Frontend  | Vitest, Testing Library y jsdom: componentes, hooks, rutas protegidas y funciones puras de métricas                                    |

GitHub Actions corre lint, typecheck, build y pruebas en cada push y pull request a `main`.

## 🔭 Mejoras futuras

- **Revocar tokens al cerrar sesión**: lista de bloqueo con el `jti` hasta su `exp`, o tokens de vida corta con refresh token.
- **Cookie `httpOnly`** (`Secure`, `SameSite`) emitida por el backend en lugar de `localStorage`.
- **Almacén compartido para el límite de intentos** (por ejemplo Redis): hoy está en memoria y se reinicia con la API.
- **Recarga completa ante chunks obsoletos** tras un despliegue, y envío de errores a un servicio de monitoreo.
- **Despliegue continuo** además de las comprobaciones de CI.

> [!NOTE]
> Las métricas se calculan en el navegador a propósito, porque el enunciado evalúa el uso de `reduce`, `map` y `filter`. Con un catálogo grande convendría un endpoint de métricas con `$group` de MongoDB.
