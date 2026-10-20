# ☁️ Despliegue en Render

[← Volver al README](../README.md)

El archivo [`render.yaml`](../render.yaml) es un **Blueprint** de Render que crea dos servicios gratuitos:

| Servicio                  | Tipo                  | Qué es                                       |
| ------------------------- | --------------------- | -------------------------------------------- |
| `dashboard-gerencial-api` | Web service (Node 24) | La API; health check en `/api/health`        |
| `dashboard-gerencial-web` | Static site           | La web compilada con Vite, con rewrite a SPA |

Render no ofrece MongoDB, así que la base vive en **MongoDB Atlas** (plan gratuito M0).

## 1. MongoDB Atlas

1. Crea un cluster **M0** y un usuario de base de datos con contraseña.
2. En **Network Access**, permite `0.0.0.0/0`: los servicios gratuitos de Render no tienen una IP fija.
3. Copia la cadena de conexión, **quita** la parte `<db_username>:<db_password>@` y agrega el nombre de la base al final: `mongodb+srv://cluster0.xxxxx.mongodb.net/dashboard`. El usuario y la contraseña van aparte.

## 2. Blueprint en Render

1. En Render, **New → Blueprint** y conecta este repositorio. Render lee `render.yaml`.
2. Completa los valores que pide (solo se piden esta vez):

   | Variable           | Servicio | Valor                                                                                       |
   | ------------------ | -------- | ------------------------------------------------------------------------------------------- |
   | `MONGODB_URI`      | API      | La cadena de Atlas sin usuario ni contraseña, con `/dashboard` al final                     |
   | `MONGODB_USER`     | API      | El usuario de la base de datos                                                              |
   | `MONGODB_PASSWORD` | API      | Su contraseña (la API la codifica, así que puede tener `@`, `:` o `/`)                      |
   | `CORS_ORIGIN`      | API      | La URL de la web, por ejemplo `https://dashboard-gerencial-web.onrender.com`                |
   | `VITE_API_URL`     | Web      | La URL de la API más `/api`, por ejemplo `https://dashboard-gerencial-api.onrender.com/api` |

3. Aplica el Blueprint. `JWT_SECRET` se genera solo y `TRUST_PROXY=1` ya viene configurado.

> [!IMPORTANT]
> Si Render no puede usar esos nombres, agrega un sufijo a la URL (por ejemplo `dashboard-gerencial-api-x1y2.onrender.com`). En ese caso corrige `CORS_ORIGIN` y `VITE_API_URL` en la pestaña **Environment** de cada servicio y vuelve a desplegar la web, porque `VITE_API_URL` se fija al compilar.

## 3. Datos de prueba

El seed se ejecuta una vez desde tu máquina contra Atlas. La variable de entorno tiene prioridad sobre `backend/.env`, y las contraseñas de los usuarios de prueba se toman de ese archivo:

```bash
MONGODB_URI="<cadena de Atlas>" MONGODB_USER="<usuario>" MONGODB_PASSWORD="<contraseña>" npm run seed
```

En PowerShell:

```powershell
$env:MONGODB_URI = "<cadena de Atlas>"; $env:MONGODB_USER = "<usuario>"; $env:MONGODB_PASSWORD = "<contraseña>"
npm run seed
Remove-Item Env:MONGODB_URI, Env:MONGODB_USER, Env:MONGODB_PASSWORD
```

## Cómo se comporta

- **Despliegues automáticos** al hacer push a `main`, solo si pasan las comprobaciones de GitHub Actions (`autoDeployTrigger: checksPass`). Cada servicio se vuelve a desplegar solo si cambió su carpeta.
- **Plan gratuito:** la API se duerme tras unos 15 minutos sin uso, y la primera petición puede tardar cerca de un minuto mientras despierta. La web espera esa respuesta sin cortar la petición.
- **Las credenciales de prueba son públicas** (están en el README): cualquiera puede entrar como `ADMIN`. Para restablecer los datos, vacía las colecciones en Atlas y vuelve a correr el seed.
