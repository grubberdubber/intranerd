# IntraNerd · Backend API

API RESTful modular que da soporte a los 8 módulos de la plataforma escolar **IntraNerd**: notas, talleres, personas extraviadas, profesores, objetos perdidos, calendario, anuncios y tareas.

La implementación activa es **Node.js + Express 5 + SQLite** usando el módulo nativo `node:sqlite` (sin ORM, sin binarios nativos). Está probada de punta a punta con el test runner de Node.

---

## 1. Stack y decisiones técnicas

| Pieza         | Tecnología                                  | Motivo                                                                   |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Runtime       | Node.js **24+**                             | `node:sqlite` estable, `fetch`/`FormData` nativos, `process.loadEnvFile` |
| HTTP          | Express 5                                   | Middleware maduro y manejo nativo de errores async                       |
| Base de datos | SQLite (`node:sqlite`)                      | Persistencia real en un archivo, cero servicios externos                 |
| Validación    | Zod 4                                       | Esquemas declarativos, coerción y mensajes en español                    |
| Archivos      | Parser `multipart/form-data` propio         | Sustituye a Multer sin dependencias extra                                |
| Logs          | morgan                                      | Formato `dev` en desarrollo y `combined` en producción                   |
| Seguridad     | CORS, rate limit, cabeceras, MIME allowlist | Endurecimiento sin dependencias pesadas                                  |

> La API activa es la descrita en este documento (SQLite). El antiguo borrador
> PostgreSQL y las utilidades JWT fueron retirados para evitar dos fuentes de
> verdad incompatibles.

---

## 2. Inicio rápido

Requisitos: **Node.js 24 o superior**.

```bash
cd backend
npm install
cp .env.example .env
npm run db:seed      # datos de demostración (idempotente)
npm run dev          # recarga automática
```

Producción:

```bash
npm start
```

La API queda disponible en:

- `http://localhost:4000/api/v1` — ruta canónica versionada.
- `http://localhost:4000/api` — alias sin versión para la SPA.
- `http://localhost:4000/api/v1/health` — health check.
- `http://localhost:4000/uploads/...` — archivos subidos.

Con Docker (desde la raíz del repositorio):

```bash
docker compose up -d --build
```

El contenedor de la API usa SQLite en `/app/data/intranerd.db` y guarda archivos en `/app/uploads` (declarados como volúmenes).

### Scripts

| Script                                       | Acción                                       |
| -------------------------------------------- | -------------------------------------------- |
| `npm start`                                  | Inicia el servidor                           |
| `npm run dev`                                | Inicia con `--watch`                         |
| `npm run db:migrate`                         | Crea/verifica el esquema SQLite              |
| `npm run db:seed`                            | Carga datos demo si la base está vacía       |
| `npm run db:seed:force` / `npm run db:reset` | Vacía y recarga los datos demo               |
| `npm test`                                   | Ejecuta la suite de integración (10 pruebas) |

---

## 3. Arquitectura

```
backend/
├── src/
│   ├── server.js                 # bootstrap: esquema + seed + listen
│   ├── app.js                    # Express, CORS, seguridad, rutas
│   ├── config/
│   │   └── env.js                # variables de entorno tipadas
│   ├── db/
│   │   ├── connection.js         # DatabaseSync, PRAGMAs, transacciones
│   │   ├── schema.sql            # DDL idempotente
│   │   ├── migrate.js            # CLI de esquema
│   │   └── seed.js               # datos de demostración
│   ├── routes/                   # 8 routers + índice /api/v1
│   ├── controllers/              # HTTP: lee req.validated y responde
│   ├── services/                 # reglas de negocio y cálculos
│   ├── repositories/             # SQL preparado y mapeo a camelCase
│   ├── validators/               # esquemas Zod por módulo
│   ├── middlewares/
│   │   ├── validate.js           # Zod -> 422 estandarizado
│   │   ├── upload.js             # multipart + almacenamiento seguro
│   │   ├── errorHandler.js       # errores globales
│   │   ├── notFound.js
│   │   ├── rateLimit.js
│   │   └── security.js
│   └── utils/                    # ApiError, response, paginación, notas
├── tests/api.test.js             # integración HTTP con node:test
├── data/                         # SQLite (ignorado por git)
└── uploads/                      # archivos (ignorado por git)
```

Flujo de una petición:

```
Request → security/CORS/rate-limit → upload (si multipart) → Zod
        → controller → service → repository (SQL) → service (cálculo)
        → controller → { success, data, error } → errorHandler si falla
```

La separación evita que los controladores contengan SQL o reglas de negocio, y permite cambiar SQLite por PostgreSQL reemplazando únicamente la capa `repositories/`.

---

## 4. Contrato de respuestas

Todas las respuestas usan la misma envoltura:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error controlado:

```json
{
  "success": false,
  "data": null,
  "error": "La asignatura solicitada no existe."
}
```

Error de validación (HTTP 422), con detalle por campo:

```json
{
  "success": false,
  "data": null,
  "error": "Datos de entrada inválidos.",
  "details": [{ "field": "value", "message": "La nota máxima es 7.0", "code": "too_big" }]
}
```

Códigos usados: `200` lectura/actualización, `201` creación, `400` petición mal formada, `404` no encontrado, `409` conflicto (duplicado, cupo lleno), `413` archivo demasiado grande, `422` validación, `429` rate limit y `500` error interno.

### Paginación

Los listados devuelven:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Parámetros comunes: `?page=1&limit=20` (`limit` máximo 100). Varios listados aceptan `q` para búsqueda textual.

---

## 5. Endpoints

Base canónica: **`/api/v1`**. También disponible bajo **`/api`**.

### 5.1 Notas — `/grades`

| Método   | Ruta                          | Descripción                              |
| -------- | ----------------------------- | ---------------------------------------- |
| `GET`    | `/grades?studentName=`        | Asignaturas, promedios y resumen general |
| `POST`   | `/grades/subjects`            | Crear asignatura                         |
| `GET`    | `/grades/subjects/:id`        | Detalle con notas y promedios            |
| `PATCH`  | `/grades/subjects/:id`        | Editar asignatura                        |
| `DELETE` | `/grades/subjects/:id`        | Eliminar asignatura y sus notas          |
| `POST`   | `/grades/subjects/:id/grades` | Agregar nota (`semester`, `value`)       |
| `PATCH`  | `/grades/entries/:gradeId`    | Editar nota                              |
| `DELETE` | `/grades/entries/:gradeId`    | Eliminar nota                            |

Crear asignatura:

```bash
curl -X POST http://localhost:4000/api/v1/grades/subjects \
  -H "Content-Type: application/json" \
  -d '{"name":"Matemáticas","studentName":"Alumno Demo","teacherName":"Prof. Moya","color":"#1e40af"}'
```

Agregar nota:

```bash
curl -X POST http://localhost:4000/api/v1/grades/subjects/<id>/grades \
  -H "Content-Type: application/json" \
  -d '{"semester":1,"value":6.5,"label":"Prueba 1"}'
```

Regla de cálculo (idéntica a la calculadora original):

- Promedio semestral = media simple de las notas válidas (1.0–7.0), redondeado a 1 decimal.
- Promedio final = media de ambos semestres si existen; si solo hay uno, se usa ese.
- Aprobado desde **4.0**. `status`: `APROBADO`, `REPROBADO` o `SIN_NOTAS`.
- `summary.generalAverage` = media de los promedios finales de las asignaturas con notas.

Respuesta de `GET /grades`:

```json
{
  "success": true,
  "data": {
    "studentName": "Alumno Demo",
    "subjects": [
      {
        "id": "sub_...",
        "name": "Matemáticas",
        "grades": { "semester1": [], "semester2": [] },
        "semesterAverages": { "semester1": 6.2, "semester2": 6.2 },
        "finalAverage": 6.2,
        "status": "APROBADO",
        "approved": true
      }
    ],
    "summary": {
      "subjectCount": 5,
      "gradedSubjectCount": 4,
      "approvedCount": 4,
      "failedCount": 0,
      "pendingCount": 1,
      "generalAverage": 5.7,
      "passingGrade": 4
    }
  },
  "error": null
}
```

### 5.2 Personas extraviadas — `/missing-persons`

| Método   | Ruta                                       | Descripción                          |
| -------- | ------------------------------------------ | ------------------------------------ |
| `GET`    | `/missing-persons?status=&q=&page=&limit=` | Listado filtrable                    |
| `GET`    | `/missing-persons/:id`                     | Detalle                              |
| `POST`   | `/missing-persons`                         | Crear reporte (`multipart` o JSON)   |
| `PATCH`  | `/missing-persons/:id`                     | Editar reporte                       |
| `PATCH`  | `/missing-persons/:id/status`              | `{ "status": "MISSING" \| "FOUND" }` |
| `PATCH`  | `/missing-persons/:id/found`               | `{ "found": true }` (atajo)          |
| `DELETE` | `/missing-persons/:id`                     | Eliminar                             |

`POST` y `PATCH` aceptan `multipart/form-data` con el archivo **`photo`** (imagen o video). También aceptan `photoUrl` / `exampleImageUrl` en JSON.

```bash
curl -X POST http://localhost:4000/api/v1/missing-persons \
  -F "name=Sofía Ramos" \
  -F "age=13" \
  -F "description=Sudadera gris, mochila rosa" \
  -F "lastSeenPlace=Patio central" \
  -F "contact=+56 9 1234 5678" \
  -F "photo=@foto.png"

curl -X PATCH http://localhost:4000/api/v1/missing-persons/<id>/found \
  -H "Content-Type: application/json" -d '{"found":true}'
```

Al marcar `FOUND` se registra automáticamente `foundAt`. Al volver a `MISSING` se limpia.

### 5.3 Profesores — `/teachers`

| Método   | Ruta                                 | Descripción                          |
| -------- | ------------------------------------ | ------------------------------------ |
| `GET`    | `/teachers?q=&subject=&page=&limit=` | Directorio con promedio y puntos     |
| `GET`    | `/teachers/:id`                      | Detalle + reseñas + distribución 1–5 |
| `POST`   | `/teachers`                          | Crear profesor (`photo`)             |
| `PATCH`  | `/teachers/:id`                      | Editar                               |
| `DELETE` | `/teachers/:id`                      | Eliminar profesor y reseñas          |
| `GET`    | `/teachers/:id/reviews`              | Reseñas                              |
| `POST`   | `/teachers/:id/reviews`              | Crear reseña (`evidence` opcional)   |
| `DELETE` | `/teachers/:id/reviews/:reviewId`    | Eliminar reseña                      |

```bash
curl -X POST http://localhost:4000/api/v1/teachers/<id>/reviews \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Camila R.","text":"Excelente docente","rating":5}'
```

Cada profesor expone `reviewCount`, `totalPoints`, `averageRating` (1 decimal) y `ratingDistribution` (`{"1":0,...,"5":3}`). El promedio se deriva siempre de las reseñas, nunca de un campo editado a mano.

### 5.4 Objetos perdidos y encontrados — `/lost-found`

| Método   | Ruta                                                   | Descripción                              |
| -------- | ------------------------------------------------------ | ---------------------------------------- |
| `GET`    | `/lost-found?type=FOUND\|LOST&status=&q=&page=&limit=` | Doble panel filtrable                    |
| `GET`    | `/lost-found/:id`                                      | Detalle                                  |
| `POST`   | `/lost-found`                                          | Publicar objeto/aviso (`photo` opcional) |
| `PATCH`  | `/lost-found/:id`                                      | Editar                                   |
| `PATCH`  | `/lost-found/:id/status`                               | `OPEN`, `CLAIMED` o `RETURNED`           |
| `DELETE` | `/lost-found/:id`                                      | Eliminar                                 |

`type=FOUND` corresponde a objetos entregados al colegio; `type=LOST` a avisos de dueños. Valores en mayúsculas o minúsculas son aceptados y normalizados.

### 5.5 Calendario — `/calendar`

| Método   | Ruta                                                        | Descripción                |
| -------- | ----------------------------------------------------------- | -------------------------- |
| `GET`    | `/calendar?year=2026`                                       | Eventos + festivos del año |
| `GET`    | `/calendar/events?year=&month=&role=&from=&to=&authorName=` | Consulta de evaluaciones   |
| `GET`    | `/calendar/events/:id`                                      | Detalle                    |
| `POST`   | `/calendar/events`                                          | Programar evaluación       |
| `PATCH`  | `/calendar/events/:id`                                      | Editar                     |
| `DELETE` | `/calendar/events/:id`                                      | Eliminar                   |
| `GET`    | `/calendar/holidays?year=2026`                              | Festivos calculados        |

```bash
curl -X POST http://localhost:4000/api/v1/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Prueba de Matemáticas","description":"Unidad 3","date":"2026-11-05","role":"profesor","authorName":"Prof. Moya"}'
```

- `role` acepta `STUDENT`/`TEACHER` y también `alumno`/`profesor`.
- `date` debe ser `YYYY-MM-DD` y existir realmente (rechaza `2026-02-30`).
- Los festivos chilenos fijos y los móviles (Viernes/Sábado Santo, calculados con el algoritmo gregoriano de Pascua) se generan para cualquier año entre 1900 y 2100.

### 5.6 Talleres — `/workshops`

| Método   | Ruta                                                  | Descripción                        |
| -------- | ----------------------------------------------------- | ---------------------------------- |
| `GET`    | `/workshops?q=&category=&available=true&page=&limit=` | Catálogo con cupos                 |
| `GET`    | `/workshops/:id`                                      | Detalle + inscripciones            |
| `POST`   | `/workshops`                                          | Crear taller (`capacity`)          |
| `PATCH`  | `/workshops/:id`                                      | Editar (valida cupo vs. inscritos) |
| `DELETE` | `/workshops/:id`                                      | Eliminar taller                    |
| `GET`    | `/workshops/:id/enrollments`                          | Inscripciones                      |
| `POST`   | `/workshops/:id/enrollments`                          | Inscribir alumno                   |
| `DELETE` | `/workshops/:id/enrollments/:enrollmentId`            | Anular inscripción                 |

```bash
curl -X POST http://localhost:4000/api/v1/workshops/<id>/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Alumno Demo","studentEmail":"alumno@colegio.cl"}'
```

Reglas:

- `BEGIN IMMEDIATE` + relectura del cupo dentro de la transacción: dos inscripciones simultáneas no pueden sobrepasar `capacity`.
- `UNIQUE(workshop_id, student_name COLLATE NOCASE)`: un alumno no puede inscribirse dos veces (409).
- Cada taller expone `enrolledCount`, `availableSpots` e `isFull`.
- No se permite reducir `capacity` por debajo de los inscritos (409).

### 5.7 Anuncios — `/announcements`

| Método   | Ruta                                               | Descripción          |
| -------- | -------------------------------------------------- | -------------------- |
| `GET`    | `/announcements?category=&pinned=&q=&page=&limit=` | Feed                 |
| `GET`    | `/announcements/:id`                               | Detalle              |
| `POST`   | `/announcements`                                   | Publicar comunicado  |
| `PATCH`  | `/announcements/:id`                               | Editar               |
| `PATCH`  | `/announcements/:id/pin`                           | `{ "pinned": true }` |
| `DELETE` | `/announcements/:id`                               | Eliminar             |

Categorías: `GENERAL`, `URGENT`, `EVENT`, `SUSPENSION`, `ACADEMIC`. Roles: `DIRECTION`, `TEACHER`, `STUDENT_COUNCIL`, `ADMIN`. El feed ordena primero los fijados y luego por fecha descendente.

### 5.8 Tareas — `/tasks`

| Método   | Ruta                                                      | Descripción                     |
| -------- | --------------------------------------------------------- | ------------------------------- |
| `GET`    | `/tasks?subject=&studentName=&completed=&q=&page=&limit=` | Listado con estado personal     |
| `GET`    | `/tasks/:id`                                              | Detalle + checklist completo    |
| `POST`   | `/tasks`                                                  | Publicar tarea                  |
| `PATCH`  | `/tasks/:id`                                              | Editar                          |
| `DELETE` | `/tasks/:id`                                              | Eliminar                        |
| `PATCH`  | `/tasks/:id/completion`                                   | Marcar/desmarcar para un alumno |
| `GET`    | `/tasks/:id/completions`                                  | Registros de completado         |
| `DELETE` | `/tasks/:id/completions/:studentName`                     | Borrar registro                 |

```bash
curl -X PATCH http://localhost:4000/api/v1/tasks/<id>/completion \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Alumno Demo","completed":true}'
```

El checklist es **personal**: cada alumno tiene su propio registro (`UNIQUE(task_id, student_name)`) y el listado devuelve `completed`, `completedBy` y `completedCount`. `completed=` exige `studentName=` (422 si falta).

---

## 6. Carga de archivos

Middleware propio (`src/middlewares/upload.js`), compatible con JSON y `multipart/form-data`.

| Módulo               | Campo      | Tipos                           |
| -------------------- | ---------- | ------------------------------- |
| Personas extraviadas | `photo`    | JPEG, PNG, WebP, GIF, MP4, WebM |
| Profesores           | `photo`    | Ídem                            |
| Reseñas              | `evidence` | Ídem + PDF                      |
| Objetos perdidos     | `photo`    | Ídem                            |

- Tamaño máximo por archivo: `MAX_UPLOAD_MB` (10 MB por defecto).
- Máximo 4 archivos por petición y cuerpo total acotado.
- Los nombres se generan con UUID y la extensión se deriva del **MIME real declarado**, nunca del nombre original.
- SVG se rechaza a propósito (puede contener scripts).
- Los archivos se sirven en `/uploads/<nombre>` con `X-Content-Type-Options: nosniff`.
- Si la petición falla después de subir, el `errorHandler` elimina los archivos temporales para no dejar huérfanos.

---

## 7. Base de datos

Archivo: `backend/data/intranerd.db` (configurable con `DATABASE_PATH`). WAL activado, `foreign_keys=ON` y `busy_timeout=5000`.

| Tabla                                | Propósito                                   |
| ------------------------------------ | ------------------------------------------- |
| `subjects` / `grades`                | Asignaturas por alumno y notas por semestre |
| `missing_persons`                    | Reportes de personas extraviadas            |
| `teachers` / `teacher_reviews`       | Directorio y reseñas con rating 1–5         |
| `lost_found_items`                   | Objetos `FOUND` / `LOST`                    |
| `calendar_events`                    | Evaluaciones por fecha y rol                |
| `workshops` / `workshop_enrollments` | Talleres y cupos                            |
| `announcements`                      | Tablón institucional                        |
| `tasks` / `task_completions`         | Tareas y checklist por alumno               |

Todas las claves primarias son TEXT con prefijo (`sub_`, `grd_`, `msp_`, `tch_`, `rev_`, `lfi_`, `evt_`, `wsp_`, `enr_`, `ann_`, `tsk_`, `cmp_`). Los CHECK de SQLite protegen rangos críticos (notas 1.0–7.0, rating 1–5, semestres 1–2, estados válidos, cupos > 0).

Para reiniciar todo:

```bash
rm -f backend/data/intranerd.db*
npm --prefix backend run db:seed
```

---

## 8. Seguridad y robustez

- **Validación Zod** en `params`, `query` y `body`, incluyendo coerción de multipart y fechas reales.
- **SQL preparado** en todas las consultas: sin interpolación de entrada del usuario.
- **Errores globales** que nunca filtran stack traces al cliente; los 500 se registran en consola.
- **Rate limit** en memoria por IP (300 req/min por defecto; `RATE_LIMIT_MAX=0` lo desactiva).
- **Cabeceras**: `X-Content-Type-Options`, `X-Frame-Options`, CSP, Referrer-Policy, Permissions-Policy, HSTS en producción.
- **CORS** configurable por lista de orígenes (por defecto `*` en desarrollo).
- **Límites de cuerpo** (`1mb` JSON y `MAX_UPLOAD_MB` por archivo).
- **Transacciones** para operaciones sensibles (inscripción con cupo, seed con `--force`).

> Autenticación y autorización no forman parte de esta entrega: todos los endpoints son públicos dentro de la red de la aplicación. Para producción se recomienda montar JWT/sesiones y un middleware de roles antes de exponer la API.

---

## 9. Pruebas

```bash
cd backend
npm test
```

La suite (`tests/api.test.js`) levanta la app en un puerto efímero con una base temporal y verifica:

1. Health check y envoltura 404.
2. Notas: creación, ambos semestres, promedio final, validación 422 y borrado.
3. Personas extraviadas: upload real, cambio a `FOUND`, búsqueda y rechazo de MIME.
4. Profesores: reseñas, promedio, puntos y distribución.
5. Objetos perdidos: doble panel, filtro y transición de estado.
6. Calendario: evento por rol, festivos fijos/móviles y fecha imposible.
7. Talleres: cupo lleno (409), duplicados y filtro de disponibilidad.
8. Anuncios: fijado y orden del feed.
9. Tareas: checklist personal, filtros y desmarcado.
10. Alias `/api`.

Resultado actual: **10/10 pruebas aprobadas**.

---

## 10. Variables de entorno

Copiar `.env.example` a `.env`:

| Variable         | Default              | Descripción                                  |
| ---------------- | -------------------- | -------------------------------------------- |
| `NODE_ENV`       | `development`        | Activa HSTS y logs `combined` en producción  |
| `PORT`           | `4000`               | Puerto HTTP                                  |
| `DATABASE_PATH`  | `data/intranerd.db`  | Ruta del archivo SQLite                      |
| `SEED_ON_START`  | `true` en desarrollo | Carga demo si la base está vacía             |
| `SEED_DEMO`      | —                    | Alias aceptado (usado por Docker Compose)    |
| `UPLOAD_DIR`     | `uploads`            | Carpeta de archivos                          |
| `MAX_UPLOAD_MB`  | `10`                 | Tamaño máximo por archivo                    |
| `CORS_ORIGINS`   | `*`                  | Lista separada por comas o `*`               |
| `RATE_LIMIT_MAX` | `300`                | Peticiones por IP por minuto (`0` desactiva) |

---

## 11. Integración con la SPA

La SPA puede apuntar a `/api` o `/api/v1` (`src/config.js` ya usa `/api`). El cliente debe leer `response.data` en las respuestas exitosas y `response.error` / `response.details` en los errores.

Para migrar la información existente en `localStorage`, un script de una sola ejecución puede leer las claves antiguas (`intra_professors_v1`, `intranerd_missing_v1`, `intra_found_v3`, `intra_lost_v3`) y hacer `POST` a los endpoints correspondientes. Los datos demo del backend ya replican esos formatos para facilitar la comparación.

Ejemplo de subida desde el navegador:

```js
const form = new FormData();
form.append('name', 'Sofía Ramos');
form.append('description', 'Sudadera gris');
form.append('lastSeenPlace', 'Patio central');
form.append('contact', '+56 9 1234 5678');
form.append('photo', fileInput.files[0]);

await fetch('/api/missing-persons', { method: 'POST', body: form });
```
