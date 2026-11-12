# Arquitectura de IntraNerd

Documento técnico de integración. Complementa al [README](../README.md) y a la
[especificación OpenAPI](openapi.yaml).

## 1. Visión general

IntraNerd se compone de una SPA estática y una API REST opcional. La SPA es la
fuente de experiencia y persiste en el navegador; la API ofrece una base
compartida para integraciones y pruebas de contrato.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Navegador                                                        │
│  SPA ES Modules · CSS modular · localStorage (offline-first)      │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTP 80/443
┌───────────────▼──────────────────────────────────────────────────┐
│ Nginx                                                            │
│  · Sirve index.html, src/ y assets/                             │
│  · Fallback SPA (try_files)                                      │
│  · Proxy /api → backend:4000                                     │
│  · CSP, gzip, caché y límites de payload                         │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTP interno
┌───────────────▼──────────────────────────────────────────────────┐
│ API Express 5                                                    │
│  Routers → controladores → servicios → repositorios SQLite       │
│  Zod · rate limit · multipart propio · errores uniformes         │
└───────────────┬──────────────────────────────────────────────────┘
                │ archivo + WAL
┌───────────────▼──────────────────────────────────────────────────┐
│ SQLite (node:sqlite)                                             │
│  Volumen Docker `backend_data` · esquema idempotente · CHECK     │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Decisiones de diseño

| Decisión                          | Motivo                                                              | Consecuencia                                                        |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| SPA sin bundler                   | Cero toolchain, arranque inmediato, fácil auditoría                 | No hay tree-shaking; el build solo copia e inyecta configuración    |
| `localStorage` offline-first      | Requisito del producto y operación en aulas con red inestable       | Datos por navegador; no hay sincronización automática entre equipos |
| API REST separada                 | Desacopla la UI de la persistencia y permite datos compartidos      | La SPA usa adaptadores para traducir el contrato REST               |
| SQLite embebido                   | Cero servicios externos, backups por archivo, ideal para un colegio | Un solo escritor; suficiente para el volumen esperado               |
| Imágenes como data URL / archivos | Funciona offline y no requiere object storage                       | Payload mayor; límites de 2.5–4 MB en la SPA y 10 MB en la API      |
| Express 5                         | Manejo nativo de promesas y router maduro                           | Requiere Node.js 24+                                                |
| Sin autenticación                 | La entrega prioriza los módulos escolares y el modo offline         | No exponer la API a Internet sin añadir sesiones y roles            |

## 3. Frontend

### Capas

- `src/views/`: una vista por módulo, sin acceso directo a `fetch`.
- `src/components/`: layout, footer, documentos legales, consentimiento de
  cookies, centro de accesibilidad, modal, toasts, estrellas, file picker y
  estados.
- `src/services/`:
  - `storage.js`: prefijo versionado, serialización segura, fallback en memoria
    y evento `intranerd:storage`.
  - `http.js`: timeout, errores tipados y `AbortController`.
  - `api.js`: fábrica de repositorios con doble adaptador REST/localStorage.
  - `session.js`: perfil y rol local para autoría de contenido.
  - `chat.js`: contactos y conversaciones locales del módulo Mensajes.
  - `menu.js`: comentarios y sugerencias del menú semanal.
  - `migrate.js`: importa datos de los prototipos antiguos en `legacy/`.
- `src/data/`: catálogos, feriados, rotaciones del menú y seeds de demostración.
- `src/utils/`: formato, cálculos de notas, semanas ISO, filtros y reglas de
  sugerencias (`gradeGoals.js`, `lostFoundMatches.js`, `studyPlan.js`,
  `chat.js`, `menu.js`).
- `src/styles/`: tokens, layout y CSS por vista.

### Cálculos y sugerencias locales

El panel y los módulos incluyen tres apoyos que funcionan sin red ni servicios
externos:

- `utils/gradeGoals.js`: calcula el promedio por semestre o la próxima nota
  necesaria para una meta final. Supone que el otro semestre mantiene su
  promedio actual.
- `utils/lostFoundMatches.js`: compara categoría, palabras, lugar y fechas de
  los objetos encontrados y perdidos. Devuelve una puntuación y razones para
  que la persona confirme el cruce.
- `utils/studyPlan.js`: reparte tareas y evaluaciones en los próximos días,
  prioriza atrasos y entrega como máximo tres bloques diarios.

Son reglas deterministas y testeables; no hay IA generativa ni envío de datos a
terceros en estas funciones.

### Mensajería y menú local

- **Mensajes:** el directorio y las conversaciones se guardan en
  `intranerd.v2:chat.contacts` y `intranerd.v2:chat.threads`. No hay envío real
  ni respuestas automáticas: es una bandeja local para preparar la integración
  con un backend y un canal en tiempo real.
- **Menú semanal:** `data/menu.js` define rotaciones que se alternan según la
  semana ISO. Los comentarios viven en `intranerd.v2:menu.comments`, separados
  por semana y día para no mezclar opiniones entre menús distintos.

### Persistencia

1. La SPA hidrata cada repositorio desde `localStorage` con namespace
   `intranerd.v2:*`. La decisión de privacidad se guarda en
   `intranerd.v2:legal.cookieConsent` y las preferencias de accesibilidad en
   `intranerd.v2:ui.preferences`; ambas se gestionan desde el footer. El chat y
   el menú usan sus propias claves (`chat.*` y `menu.comments`).
2. Si la API está habilitada (`config.api.enabled`), cada repositorio intenta
   la operación remota mediante los adaptadores de `services/resources.js`.
3. Los errores de red/5xx degradan a almacenamiento local y se emite el evento
   de conexión para que la UI informe el modo activo.
4. Los errores de negocio (400/409/422) no se ocultan: se muestran al usuario.
5. Si la cuota se agota, `storage.js` lanza un `StorageError` con un mensaje
   accionable en lugar de perder datos silenciosamente.

### Accesibilidad y responsive

- Skip link, roles ARIA, `aria-live` para toasts y foco atrapado en modales.
- Navegación lateral colapsable; grids fluidos y targets táctiles ≥ 44 px.
- Contraste AA sobre la paleta institucional (`#1e40af`, `#2563eb`).
- Centro de accesibilidad con tamaño de texto (100/112,5/125 %), alto contraste
  y movimiento reducido. Se aplica como atributos `data-*` en `<html>` desde
  `services/preferences.js` y se traduce en CSS sin tocar los datos.
- Se respetan `prefers-reduced-motion`, `prefers-contrast` y `forced-colors`.
- Declaración de accesibilidad versionada en `data/legal.js` y accesible desde
  el footer.

## 4. Backend

### Capas

```text
routes/*.js       → validación Zod y definición HTTP
controllers/*.js  → lectura de req.validated y respuesta
services/*.js     → reglas puras: promedios, cupos, checklist, feriados
repositories/*.js → SQL preparado y mapeo a camelCase
db/connection.js  → DatabaseSync, PRAGMAs y transacciones
middlewares/      → upload, validate, rate limit, seguridad y errores
```

Cada módulo comparte:

- `validate({ params, query, body })`: convierte errores Zod en `422` con
  detalle por campo.
- `transaction(fn)`: escrituras atómicas con `BEGIN IMMEDIATE` (cupos).
- `ApiError`: errores de negocio con código estable.
- `sendSuccess` / `sendError`: envoltura uniforme.

### Contrato de respuestas

- Éxito: `{ success: true, data, error: null }`.
- Error: `{ success: false, data: null, error, details? }`.
- Listados: `data = { items, pagination }`.
- Cabeceras: `X-Request-Id`, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` y HSTS en producción.
- OpenAPI 3.0.3 en `docs/openapi.yaml` (34 rutas).

## 5. Modelo de datos

```mermaid
erDiagram
    subjects ||--o{ grades : contiene
    teachers ||--o{ teacher_reviews : recibe
    workshops ||--o{ workshop_enrollments : cupos
    tasks ||--o{ task_completions : checklist
```

Tablas principales: `subjects`, `grades`, `missing_persons`, `teachers`,
`teacher_reviews`, `lost_found_items`, `calendar_events`, `workshops`,
`workshop_enrollments`, `announcements`, `tasks`, `task_completions` y
`contact_messages` (bandeja privada de soporte, sin listado público).

Reglas de integridad:

- `grades.value BETWEEN 1.0 AND 7.0`; `semester IN (1,2)`.
- Unicidad `(workshop_id, student_name)` y `(task_id, student_name)`.
- Estados acotados por `CHECK`: tipo de objeto, estado de reporte, rol del
  calendario, categoría de anuncio y rating 1–5.
- Borrados en cascada en tablas hijas (`grades`, reseñas, inscripciones,
  checklist); las claves primarias son TEXT con prefijo legible.

No hay vistas SQL: los promedios y agregados se calculan en la capa de
servicios para mantener una sola fuente de verdad y facilitar las pruebas.

## 6. Flujos críticos

### Inscripción a taller con cupos

```mermaid
sequenceDiagram
    participant A as Alumno
    participant API as Express
    participant DB as SQLite
    A->>API: POST /workshops/:id/enrollments
    API->>DB: BEGIN IMMEDIATE
    API->>DB: SELECT taller + COUNT inscripciones
    alt cupo disponible
        API->>DB: INSERT enrollment
        API->>DB: COMMIT
        API-->>A: 201 { enrolled, availableSpots }
    else sin cupo
        API->>DB: ROLLBACK
        API-->>A: 409 CONFLICT
    end
```

### Registro de nota

1. La SPA agrega la nota al arreglo semestral de la asignatura y persiste en
   `localStorage`.
2. La API expone el flujo equivalente: `POST /grades/subjects` crea la
   asignatura y `POST /grades/subjects/{id}/grades` agrega una entrada.
3. `GET /grades` agrega por asignatura: promedio semestral, promedio final,
   aprobación desde 4.0 y promedio general.
4. La UI muestra indicadores verde/rojo y un resumen por semestre.

### Checklist personal

Cada alumno tiene su propio registro `(task_id, student_name)`; marcar una tarea
no afecta el estado de los demás. La SPA guarda el checklist por perfil local.

## 7. Pruebas

| Nivel       | Herramienta                 | Alcance                                                   |
| ----------- | --------------------------- | --------------------------------------------------------- |
| Unitaria    | Vitest                      | Dominio de notas, formato, feriados, validadores, storage |
| Integración | Supertest + SQLite temporal | CRUD, permisos implícitos, cupos, checklist, errores      |
| Backend     | `node:test`                 | Suite HTTP del backend                                    |
| E2E         | Playwright                  | Navegación, altas, persistencia, responsive               |
| Calidad     | Prettier + lint propio      | Formato, sintaxis, guardrails                             |
| Build       | Docker Compose              | Imágenes, healthchecks, arranque                          |

La cobertura se calcula sobre lógica de negocio (dominio y utilidades), no sobre
CSS ni plantillas.

## 8. Escalabilidad y evolución

- La API es stateless salvo el archivo SQLite; para varias réplicas habría que
  migrar a PostgreSQL o a un servicio gestionado.
- Las imágenes en base de datos deben migrarse a S3/MinIO al crecer; el
  contrato ya acepta URL/ruta.
- Para sincronización offline real se recomienda una cola de mutaciones con
  `idempotency-key` y resolución de conflictos por `updated_at`.
- La autenticación puede añadirse con sesiones/JWT y autorización por rol sin
  cambiar los contratos de los recursos.
