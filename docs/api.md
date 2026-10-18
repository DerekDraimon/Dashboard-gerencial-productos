# 📡 Referencia de la API

[← Volver al README](../README.md)

**Base:** `http://localhost:4000/api`

Las rutas protegidas requieren la cabecera:

```http
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login` y vence según `JWT_EXPIRES_IN`. En cada petición la API vuelve a leer el usuario: si fue inactivado o eliminado, responde `401`; si cambió su rol, aplica el nuevo.

## 🔐 Permisos

| Recurso                                           | `ADMIN` | `USER` | Sin token |
| ------------------------------------------------- | :-----: | :----: | :-------: |
| `POST /api/auth/login`                            |   ✅    |   ✅   |    ✅     |
| `GET /api/auth/me`                                |   ✅    |   ✅   |   `401`   |
| `GET /api/products` (lista, detalle y categorías) |   ✅    |   ✅   |   `401`   |
| `POST`, `PATCH` y `DELETE /api/products`          |   ✅    | `403`  |   `401`   |
| `/api/users` (todas)                              |   ✅    | `403`  |   `401`   |

## 🧭 Endpoints

### Salud y autenticación

| Método | Ruta              | Descripción                                 |
| ------ | ----------------- | ------------------------------------------- |
| `GET`  | `/api/health`     | Estado de la API y de la conexión a MongoDB |
| `POST` | `/api/auth/login` | `{ email, password }` → `{ token, user }`   |
| `GET`  | `/api/auth/me`    | Usuario autenticado                         |

### Productos

| Método   | Ruta                       | Descripción                                                                                                                  |
| -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/products`            | Lista paginada por `creationAt` descendente. Query: `offset` (0), `limit` (10, máx. 100), `search`, `category`, `from`, `to` |
| `GET`    | `/api/products/categories` | Categorías existentes, sin repetir y en orden alfabético                                                                     |
| `GET`    | `/api/products/:id`        | Detalle de un producto                                                                                                       |
| `POST`   | `/api/products`            | `{ title, description, price, category, images?, stock }`                                                                    |
| `PATCH`  | `/api/products/:id`        | Cualquiera de esos campos (al menos uno)                                                                                     |
| `DELETE` | `/api/products/:id`        | Elimina el producto definitivamente; responde `204` sin cuerpo                                                               |

### Usuarios

| Método  | Ruta                    | Descripción                                                                                  |
| ------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `GET`   | `/api/users`            | Lista paginada, más recientes primero. Query: `offset` (0), `limit` (10, máx. 100), `active` |
| `GET`   | `/api/users/:id`        | Detalle de un usuario                                                                        |
| `POST`  | `/api/users`            | `{ email, password, name, role? }` (`role`: `ADMIN` o `USER`, por defecto `USER`)            |
| `PATCH` | `/api/users/:id`        | `{ name?, role?, active? }` (al menos un campo)                                              |
| `PATCH` | `/api/users/:id/status` | Inactiva o reactiva sin eliminar: `{ active }`                                               |

## 📋 Reglas

- Las listas responden `{ data, meta: { total, offset, limit } }`.
- `search` busca en el título sin distinguir mayúsculas y se toma literal (no es una expresión regular).
- `category` filtra por la categoría exacta (la que lista `GET /api/products/categories`).

  > [!NOTE]
  > El filtro por categoría no lo pide el enunciado: se agregó porque el inventario se recorre por categoría.

- `from` y `to` son fechas `YYYY-MM-DD` en UTC, inclusivas (`to` cubre el día completo) y se pueden usar por separado. Si `from` es posterior a `to` o una fecha no existe (`2026-02-30`), responde `400`.
- **Productos:**
  - `title` hasta 120 caracteres, `description` hasta 2000 y `category` hasta 60. Los tres son obligatorios y no pueden empezar ni terminar con espacios.
  - `price` mayor que 0, con hasta 2 decimales.
  - `stock` entero mayor o igual a 0.
  - `images` hasta 10 URLs `http` o `https` (por defecto `[]`).
- **Usuarios:**
  - El email no distingue mayúsculas.
  - La contraseña tiene entre 8 y 72 caracteres, se guarda con bcrypt y nunca se devuelve.
  - Un administrador no puede inactivarse ni cambiar su propio rol.
- Los cuerpos JSON tienen un límite de 100 KB.

## ⚠️ Errores

Todos los errores siguen el mismo formato; los de validación incluyen `details`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "…",
    "details": [{ "path": "price", "message": "…" }]
  }
}
```

| HTTP  | `code`                                             | Cuándo                                                                       |
| ----- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `400` | `VALIDATION_ERROR`, `INVALID_ID`, `INVALID_JSON`   | Datos inválidos o campos no permitidos, id mal formado, JSON mal formado     |
| `401` | `INVALID_CREDENTIALS`                              | Email o contraseña incorrectos (mismo error en ambos casos)                  |
| `401` | `UNAUTHENTICATED`, `INVALID_TOKEN`                 | Falta el token, o es inválido, expiró o su usuario está inactivo o no existe |
| `403` | `USER_INACTIVE`, `FORBIDDEN`                       | Login de un usuario inactivo; el rol no tiene permiso                        |
| `404` | `PRODUCT_NOT_FOUND`, `USER_NOT_FOUND`, `NOT_FOUND` | El recurso o la ruta no existe                                               |
| `409` | `EMAIL_ALREADY_EXISTS`, `CANNOT_MODIFY_SELF`       | Email repetido; un administrador intenta inactivarse o cambiar su rol        |
| `413` | `PAYLOAD_TOO_LARGE`                                | El cuerpo supera los 100 KB                                                  |
| `429` | `TOO_MANY_REQUESTS`                                | Demasiados intentos de login desde la misma IP                               |
| `503` | `DATABASE_UNAVAILABLE`                             | MongoDB no está disponible                                                   |
