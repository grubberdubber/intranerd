# Plan de pruebas — IntraNerd

Documento de estrategia y trazabilidad de la suite de QA. Complementa
[`tests/README.md`](README.md) (cómo ejecutar) y [`docs/openapi.yaml`](../docs/openapi.yaml)
(contrato de la API).

## 1. Objetivo y alcance

Verificar que los ocho módulos de IntraNerd funcionan de extremo a extremo y
que las reglas de negocio críticas (escala de notas, cupos, promedios,
seguridad escolar y persistencia) se mantienen correctas ante cambios.

**En alcance**

- Lógica pura de notas, fechas/feriados, formato, almacenamiento y seeds.
- API REST bajo `/api/v1`: CRUD, validación, errores, filtros y paginación.
- SPA real: navegación, formularios, modales, persistencia en `localStorage`
  y comportamiento responsive básico.
- Cobertura de código de la lógica de negocio.

**Fuera de alcance**

- Carga/estrés y pruebas de penetración.
- Compatibilidad con navegadores distintos de Chromium (se puede ampliar en
  `playwright.config.js`).
- Servicios externos de correo o almacenamiento (no existen en la app).
- Regresión visual pixel-perfect.

## 2. Estrategia por niveles

| Nivel       | Objetivo                                               | Aislamiento                           | Velocidad |
| ----------- | ------------------------------------------------------ | ------------------------------------- | --------- |
| Unitario    | Detectar errores de cálculo/validación en milisegundos | Sin red, sin DB, sin DOM              | Muy alta  |
| Integración | Contrato HTTP, persistencia SQL y errores reales       | Base SQLite temporal por archivo      | Media     |
| E2E         | Recorridos de usuario y persistencia del navegador     | Contexto de navegador limpio por test | Baja      |

La pirámide se complementa con **cobertura** (Vitest V8) y **lint/formato** en
CI. Los flujos E2E se limitan a los recorridos de mayor valor; la combinatoria
de validaciones se cubre en unitarias e integración para no volver lenta la
suite.

## 3. Matriz de trazabilidad

| Requisito                                      | Cobertura unitaria                                  | Cobertura de integración                | Cobertura E2E                     |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------- | --------------------------------- |
| Notas 1.0–7.0 y promedios semestral/final      | `grades.domain`, `grading.utils`, `frontend.grades` | `grades.api`                            | `grades.spec.js`                  |
| Promedio general y estado aprobado/reprobado   | `grades.domain`, `frontend.grades`                  | `grades.api`                            | `grades.spec.js`                  |
| Asignaturas dinámicas                          | `seeds`                                             | `grades.api`                            | `grades.spec.js`                  |
| Talleres, cupos e inscripción                  | —                                                   | `workshops.api`                         | `modules.spec.js`                 |
| Personas extraviadas: reporte, estado, filtros | `seeds`, `reports`                                  | `missing-persons.api`                   | `modules.spec.js`                 |
| Profesores: estrellas, promedio, opiniones     | `seeds`                                             | `teachers.api`                          | `modules.spec.js`                 |
| Objetos perdidos: paneles, resolución, borrado | `seeds`, `reports`                                  | `lost-found.api`                        | `lostfound.spec.js`               |
| Calendario: fechas, feriados, eventos por rol  | `calendar.holidays`, `calendar.validator`           | `calendar.api`                          | `calendar.spec.js`                |
| Comunicados y fijado                           | `seeds`                                             | `announcements.api`                     | `modules.spec.js`                 |
| Tareas y checklist                             | `seeds`                                             | `tasks.api`                             | `modules.spec.js`                 |
| Persistencia `localStorage`                    | `storage`, `api.resource`, `session`                | —                                       | `grades`, `lostfound`, `calendar` |
| Envoltura de errores y códigos HTTP            | `http`                                              | `health-and-errors` y todos los `*.api` | —                                 |
| Responsive / navegación                        | —                                                   | —                                       | `navigation.mobile.spec.js`       |

## 4. Casos de prueba principales

### 4.1 Unitarias

- Escala: límites 1.0 y 7.0 válidos; 0.9, 7.1, `NaN` y texto inválidos.
- Promedio semestral: redondeo a un decimal; lista vacía → `null`.
- Promedio final: ambos semestres, solo uno, ninguno.
- Aprobación: `>= 4.0`; estados `Aprobado`, `Reprobado`, `Sin notas`.
- Promedio general: ignora asignaturas sin notas.
- Feriados: meses/días válidos para cualquier año; fechas inválidas.
- Fechas: ISO local, comparación de días, días por mes, índice lunes-domingo.
- Storage: namespace, JSON corrupto, cuota agotada, fallback en memoria,
  export/import/clear.
- HTTP: timeout/abort, error de red, JSON y texto, códigos no-2xx.
- Repositorios: API primero, fallback local ante 404/5xx, propagación de 4xx,
  normalización de listas con envoltura `{ success, data }`, `PATCH` en updates.
- Reportes: normalización de búsqueda, coincidencia por nombre/lugar/contacto/
  descripción, orden activos→encontrados y por fecha, filtros por estado y
  categoría, y no mutación de los arreglos originales.
- Seeds: integridad referencial, conteos, promedios esperados de profesores.

### 4.2 Integración (API)

- Healthcheck y 404 de ruta desconocida.
- JSON malformado → `400`; validación de payload → `422`; recurso inexistente → `404`.
- CRUD completo por módulo y códigos `200/201`.
- Conflictos de negocio: cupo lleno, inscripción duplicada, reseña duplicada,
  transición de estado inválida → `409`.
- Filtros, búsqueda, paginación y ordenamientos.
- Reglas de autorización/rol cuando el endpoint las exige.
- Recálculo de agregados (promedio de notas, rating de profesores, cupos).

### 4.3 E2E

1. **Notas:** crear asignatura → registrar notas en ambos semestres → promedios
   6.0 / 4.0 / 5.0 → estado `Aprobado` → promedio general consistente →
   persistencia tras recargar. Caso negativo: nota 8.5 rechazada.
2. **Objetos perdidos:** publicar aviso → aparece en el panel de perdidos →
   marcar `Resuelto` → badge y botón `Reabrir` → persistencia → eliminar con
   confirmación → desaparece también tras recargar.
3. **Calendario:** rol profesor + nombre → abrir 12 de marzo → programar prueba
   → título visible en la cuadrícula → persistencia → cambiar a rol alumno →
   abrir el mismo día → título, descripción y autoría visibles.
4. **Responsive:** abrir menú hamburguesa → navegar a notas → sin desborde
   horizontal en Pixel 7.

## 5. Datos de prueba

- Unitarias: fixtures en memoria y seeds deterministas; no tocan archivos.
- Integración: base SQLite en `os.tmpdir()`, esquema + seeds por archivo.
  Nunca se usa `backend/data/intranerd.db`.
- E2E: `localStorage` limpio por contexto, API desactivada por defecto y datos
  creados con el sufijo `E2E`. Cada test elimina lo que crea.
- Fechas: se usa el año que muestra el calendario y una fecha no feriada
  (12 de marzo) para evitar dependencias del reloj.
- Zona horaria fijada en `America/Santiago` y locale `es-CL`.

## 6. Criterios de entrada y salida

**Entrada**

- Dependencias instaladas y esquema del backend inicializable.
- `npm run lint` sin errores.
- Chromium disponible para E2E.

**Salida**

- 100 % de tests unitarios e integración en verde.
- E2E de los tres flujos críticos y del humo de módulos en verde en Chromium
  de escritorio.
- Smoke test móvil en verde.
- Cobertura ≥ umbrales: statements 80 %, branches 75 %, functions 80 %,
  lines 80 %.
- Sin `test.skip` inesperados: el skip por SPA no disponible solo se acepta en
  local (en CI el arranque roto falla) o si el entorno no soporta el proyecto.

## 7. Riesgos y mitigaciones

| Riesgo                                      | Impacto | Mitigación                                                                                     |
| ------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Seeds cambian y rompen expectativas rígidas | Alto    | Los E2E calculan promedios desde la UI y usan datos propios; los seeds se validan en unitarias |
| Backend y SPA se desincronizan              | Alto    | Suite de integración sobre la API real + E2E sobre la SPA real                                 |
| Dependencia de un backend levantado en E2E  | Medio   | Modo local determinista por defecto; `E2E_USE_API=1` para el modo real                         |
| Tests acoplados a clases de estilo          | Medio   | Selectores por `id`, `data-*`, roles y nombres accesibles                                      |
| Latencias/timeout en CI                     | Medio   | Timeouts explícitos, `workers=1` en CI, reintentos solo en CI                                  |
| Datos residuales entre tests                | Medio   | Contexto nuevo de Playwright y limpieza única de `localStorage`                                |
| Cuota de `localStorage` por imágenes        | Bajo    | `storage` tiene fallback y mensaje de cuota probado en unitarias                               |

## 8. Reporte y evidencias

- Cobertura: `coverage/index.html` + `coverage/lcov.info` +
  `coverage/coverage-summary.json`.
- E2E: `playwright-report/` (HTML), `test-results/junit.xml`, capturas y trazas
  solo en fallos.
- CI: `.github/workflows/ci.yml` publica `coverage/`, `playwright-report/` y
  `test-results/` como artefactos por 7 días.

## 9. Mantenimiento

- Al agregar un endpoint: caso feliz, validación `422`, `404` y conflicto si
  aplica, en `tests/integration`.
- Al agregar una regla de negocio pura: unitaria en `tests/unit`.
- Al agregar un flujo de usuario crítico: E2E con `fixtures.js`, datos únicos y
  limpieza.
- Al cambiar selectores: actualizar `tests/README.md` y la spec afectada en el
  mismo commit.
- Revisar los umbrales de cobertura solo con justificación; no bajarlos para
  “hacer pasar” un cambio.
