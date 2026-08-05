# Soporte SENA — Backend

API para el sistema de gestion de casos de soporte tecnico. Cubre todo el ciclo:
reporte desde el QR unico del campus, cola de casos para tecnicos, resolucion con
evidencia obligatoria y reportes para el administrador.

## Stack

Node.js + Express + Sequelize + MySQL, mismo combo usado en PROYECTO-COMPLETO
(Winston para logs, express-validator para validacion, respuestas estandarizadas,
codigos de error `ERR_XXX`).

## Requisitos

- Node.js 18 o superior
- MySQL 8.0 o superior, local o accesible por red (Railway, PlanetScale, RDS, etc.)

## Instalacion

```bash
npm install
cp .env.example .env
```

Edita `.env` con los datos reales de tu base de datos y un `JWT_SECRET` seguro.

## Primer arranque

```bash
mysql -u tu_usuario -p < database/schema.sql   # crea las tablas y siembra las categorias
npm run dev                                     # solo conecta y levanta el servidor
npm run seed                                    # en OTRA terminal: crea el usuario administrador
```

El seed crea `admin@sena.edu.co` / `cambiar123` — cambia esa contrasena apenas
puedas iniciar sesion.

`database/schema.sql` es la fuente de verdad de la estructura: tipos, indices,
las reglas `ON DELETE` correctas (por ejemplo, `RESTRICT` en `espacio_id` y
`categoria_id` para que borrar un espacio o categoria nunca arrastre en
cascada el historial de casos), `CHECK` de consistencia temporal, y dos vistas
de solo lectura para reportes:

- `vista_casos_completos`: cada caso con espacio/categoria/tecnico ya
  resueltos por nombre, mas los minutos hasta asignacion y hasta resolucion.
- `vista_espacios_estadisticas`: total de casos, activos, resueltos y
  reabiertos por espacio — para detectar cuales necesitan mantenimiento de
  fondo en vez de otro parche puntual.

El servidor NO recrea tablas por defecto.
Si prefieres que Sequelize las genere automaticamente en desarrollo, pon
`DB_AUTO_SYNC=true` en `.env` — pero el DDL que genera no replica esas
mismas reglas `ON DELETE` (tiende a usar `CASCADE` en columnas `NOT NULL`),
asi que no es el camino recomendado ni para produccion ni para mantener el
esquema documentado de forma confiable.

## Estructura

```
database/
  schema.sql    fuente de verdad del esquema (tablas, indices, FKs, categorias)
src/
  config/       conexion a BD y logger
  models/       Espacio, Categoria, Usuario, Caso, HistorialCaso
  controllers/  logica de negocio
  routes/       definicion de endpoints
  middleware/   auth, validacion, upload, rate limit, manejo de errores
  validators/   reglas de express-validator
  utils/        respuestas estandarizadas y codigos de error
  seeders/      datos iniciales
```

## Endpoints

### Publicos (sin login — usados desde el formulario que abre el QR)

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/espacios?tipo=&busqueda=` | Lista de espacios activos para el selector |
| GET | `/api/categorias` | Lista de categorias, para el selector de novedad |
| POST | `/api/casos` | Crea un caso. Body: `reportado_por, espacio_id, categoria_id, descripcion` + archivo opcional `foto_novedad` |
| GET | `/api/casos/consultar/:numero_caso` | Consulta de estado sin cuenta (tracking). Incluye categoria, prioridad, tecnico asignado, evidencia e historial completo |
| GET | `/api/invitaciones/:token` | Detalle de una invitacion (email, nombre, rol) para prellenar el formulario de activacion |
| POST | `/api/invitaciones/:token/aceptar` | Body: `password` — crea la cuenta real y devuelve JWT (login automatico) |
| POST | `/api/auth/olvide-password` | Body: `email` — misma respuesta exista o no la cuenta (anti-enumeracion) |
| POST | `/api/auth/restablecer-password` | Body: `token, password` |

### Requieren sesion (tecnico o administrador)

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/login` | Devuelve JWT |
| GET | `/api/auth/perfil` | Usuario autenticado |
| GET | `/api/casos?estado=&espacio_id=&tecnico_id=&desde=&hasta=` | Lista/filtra casos |
| POST | `/api/casos/:id/tomar` | El tecnico se autoasigna el caso |
| POST | `/api/casos/:id/iniciar` | Pasa de Asignado a En proceso |
| POST | `/api/casos/:id/notas` | Body: `nota` — agrega una entrada al historial sin cambiar el estado |
| POST | `/api/casos/:id/resolver` | Body opcional: `notas_resolucion` + archivo `foto_evidencia` (obligatorio) |
| POST | `/api/casos/:id/reabrir` | Vuelve a abrir un caso resuelto o cerrado |

### Solo administrador

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST / PUT | `/api/espacios` | CRUD de espacios |
| GET | `/api/usuarios?rol=` | Lista tecnicos/administradores con su conteo de casos resueltos |
| GET | `/api/roles` | Lista de roles (para el selector al invitar) |
| GET | `/api/historial?limite=` | Feed global de actividad reciente entre todos los casos |
| GET | `/api/reportes?desde=&hasta=` | Totales por estado, categoria y espacios recurrentes |
| POST | `/api/invitaciones` | Body: `email, nombre, rol_id` — crea la invitacion y manda el correo via Resend |
| GET | `/api/qr` | QR del campus como data URL (JSON) |
| GET | `/api/qr?formato=png` | QR del campus como PNG descargable (1024x1024, listo para imprimir) |

## Roles

`usuarios.rol_id` referencia una tabla `roles` (no un ENUM): agregar un rol
nuevo es un INSERT, no una migracion. Los permisos de cada rol siguen
viviendo en el codigo (`requireRol('administrador')` en las rutas) — una
matriz de permisos en base de datos seria sobre-ingenieria mientras solo
existan 2 roles con reglas fijas. La API sigue devolviendo `usuario.rol`
como string plano (`Usuario.toJSON()` aplana la asociacion), asi que el
frontend no tuvo que cambiar nada por este refactor.

## Invitaciones y restablecimiento de contrasena

No hay registro publico: la unica forma de crear una cuenta de tecnico o
administrador es que un admin la invite desde el panel. Ambos flujos
(invitacion y restablecimiento) comparten la tabla `tokens_acceso`:

- El token que se manda por correo es aleatorio de 256 bits; en la base de
  datos solo se guarda su hash SHA-256, nunca el token en claro.
- Invitaciones vencen a las 48h, restablecimientos a la 1h.
- Un token es de un solo uso (`usado_at`); reusarlo da 404.
- `/auth/olvide-password` responde 404 "correo no registrado" si la cuenta no
  existe (o esta inactiva); solo envia el correo a cuentas registradas.

El envio real de correos usa SMTP con [nodemailer](https://nodemailer.com)
(por defecto preparado para Gmail con "Contraseña de aplicacion"). Sin las
variables `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` configuradas, el correo se
registra en el log del servidor en vez de enviarse — util para desarrollo,
pero recuerda que **enviar un correo real requiere tus propias credenciales
SMTP**; no hay forma de probar la entrega real sin ellas (ver
`src/utils/mailer.js`).

## Codigo QR

Un solo QR para todo el campus (no uno por espacio — el espacio se elige a
mano en el formulario). `GET /api/qr` genera un QR que apunta a
`FRONTEND_URL`, en caliente con la libreria `qrcode`, no es una imagen
estatica guardada.

Todas las respuestas siguen el mismo formato:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "error": { "code": "ERR_XXX", "message": "...", "details": null } }
```

## Pendiente para las siguientes fases

- Editar/desactivar cuentas existentes desde el panel (hoy solo se crean por invitacion; no hay endpoint para editar nombre/rol o desactivar)
- CRUD completo de categorias (hoy solo lectura vía `/api/categorias`)
- Exportacion de `/api/reportes` a Excel/PDF, y agregaciones por dia para graficas de series de tiempo
- Notificaciones push (web push) — el bot de WhatsApp para tecnicos con iPhone que quedamos en priorizar
- Migrar `uploads/` (disco local) a Cloudinary o S3 antes de un despliegue serio
- Multer sigue en la rama 1.x (LTS) — vale la pena evaluar el salto a 2.x mas adelante

El frontend (PWA en React) ya esta construido y conectado a esta API — ver el
README del proyecto `soporte-sena-frontend`.
