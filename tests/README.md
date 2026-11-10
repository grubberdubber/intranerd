# Pruebas de IntraNerd

Suite de pruebas de la plataforma escolar IntraNerd, organizada en tres niveles.
Estado actual: **351 pruebas Vitest** (178 unitarias + 173 de integración),
**11 E2E** y **11 pruebas del backend**.

| Nivel       | Carpeta             | Herramienta        | Qué prueba                                                                                |
| ----------- | ------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Unitario    | `tests/unit`        | Vitest             | Lógica pura: notas, formato, fechas, feriados, storage, HTTP, seeds y dominio del backend |
| Integración | `tests/integration` | Vitest + Supertest | API REST real (`/api/v1`) con una base SQLite temporal aislada por archivo                |
| E2E         | `tests/e2e`         | Playwright         | Flujos completos en la SPA real, en Chromium de escritorio y móvil                        |

## Comandos

```bash
pnpm test                  # Unitarias + integración + reporte de cobertura
pnpm test:unit             # Solo unitarias (178)
pnpm test:integration      # Solo integración (173, no requiere backend levantado)
pnpm test:coverage         # Igual que pnpm test (cobertura explícita)
pnpm test:e2e              # Playwright (11); levanta la SPA en el puerto 8080
pnpm test:e2e:ui           # Playwright en modo interactivo
pnpm test:all              # Cobertura + E2E
pnpm test:e2e:install      # Instala Chromium y dependencias del sistema
pnpm test:backend          # Suite node:test del backend (11)
```

Requisitos:

- Node.js 24+ (el proyecto usa `node:sqlite`) y pnpm 12+.
- Para E2E: `pnpm exec playwright install chromium` (o `pnpm test:e2e:install`).
- Python 3 disponible si se usa el servidor estático por defecto de Playwright.
  También se puede apuntar a otro servidor:

```bash
E2E_BASE_URL=http://localhost:5173 E2E_START_COMMAND="pnpm dev" pnpm test:e2e
```

### Modo de datos en E2E

Por defecto las pruebas E2E desactivan la API (`window.INTRANERD_CONFIG.api.enabled = false`)
y limpian `localStorage` una vez por contexto. Así los flujos son deterministas,
no dependen de un backend y se puede comprobar la persistencia real del navegador
tras `page.reload()`.

Para ejecutar los mismos flujos contra la API real (por ejemplo, con
`docker compose up`):

```bash
E2E_USE_API=1 E2E_BASE_URL=http://localhost:8080 pnpm test:e2e
```

En ese modo conviene usar una base de datos de prueba: los tests crean y borran
registros con un nombre/descripción marcados como `E2E`.

## Cobertura

`pnpm test` genera:

- Resumen en consola (`text`, `text-summary`).
- Reporte HTML navegable en `coverage/index.html`.
- `coverage/lcov.info` para integraciones de CI.
- `coverage/coverage-summary.json` y `coverage/test-results.json`.

La cobertura se mide sobre lógica de negocio y adaptadores testeables:

- `src/utils/{format,grades,id,reports}.js`
- `src/services/{storage,http,api,session,resources}.js`
- `src/data/{constants,seeds}.js`
- `backend/src/domain/**/*.js`

Los módulos que dependen de un DOM real (`src/utils/dom.js`,
`src/utils/files.js`, vistas y estilos) se validan en E2E y se excluyen del
cálculo para no inflar la métrica con stubs. Umbrales mínimos configurados en
`vitest.config.js`: **80 % statements, 75 % branches, 80 % functions, 80 % lines**.

## Contrato de la API usado en integración

Cada archivo de integración llama a `createTestApi()` (`tests/integration/helpers/api.js`),
que:

1. Crea un directorio temporal y una base SQLite nueva.
2. Inicializa el esquema y carga los seeds de demostración.
3. Devuelve un cliente Supertest y cierra/elimina todo en `afterAll`.

Envoltura de éxito:

```json
{ "success": true, "data": {}, "error": null }
```

Envoltura de error:

```json
{ "success": false, "data": null, "error": "Mensaje legible" }
```

Códigos verificados: `200`, `201`, `400` (JSON malformado), `404`, `409`
(conflicto de negocio) y `422` (validación). Los deletes responden `200` con
`{ "id": "…" }`.

> Los tests de integración importan el backend de forma dinámica **después** de
> definir `DATABASE_PATH`, `UPLOAD_DIR`, `SEED_ON_START` y `RATE_LIMIT_MAX`,
> porque `backend/src/config/env.js` congela el entorno al cargarse.

## Contrato de selectores E2E

Las specs usan selectores estables y accesibles, no clases de estilo:

| Flujo            | Selectores principales                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navegación       | `a.nav-link[data-route="…"]`, `.view[data-route="…"]`, `#app[data-ready="true"]`                                                                        |
| Notas            | `#new-subject-name`, `#new-subject-s1`, `#new-subject-s2`, `.subject-card`, `.semester__average`, `.subject-card__final-value`, `.subject-card__status` |
| Objetos perdidos | `#item-by`, `#item-contact`, `#item-desc`, `#item-place`, `#item-category`, `#lost-list .item-card`                                                     |
| Calendario       | `#calendar-role`, `#calendar-name`, `[data-date="YYYY-MM-DD"]`, `#event-title`, `#event-subject`, `#event-description`, `.day-event-item`               |
| Contacto         | `#contact-name`, `#contact-email`, `#contact-role`, `#contact-topic`, `#contact-subject`, `#contact-message`, `#contact-consent`, `.contact-success`    |
| Modales          | `.modal[role="dialog"]`, `aria-label="Cerrar ventana"`, botones por nombre accesible                                                                    |

Reglas para nuevas specs:

- Usar `test` y `expect` exportados desde `tests/e2e/fixtures.js`.
- Navegar con `goToModule(page, routeId)` para validar también el menú.
- No depender de datos demo concretos: crear datos únicos (`E2E`) y limpiar lo
  creado dentro del mismo test.
- Esperar por roles/estados visibles (`expect(...).toBeVisible()`), no por
  `waitForTimeout`.
- Si la SPA no arranca, la fixture marca la prueba como **skipped** en local con
  el mensaje y la URL actual. En CI falla para evitar un verde falso; se puede
  forzar el skip con `E2E_SKIP_IF_UNAVAILABLE=1`.

## Estructura

```text
tests/
├── unit/
│   ├── helpers/fake-browser.js      # window/localStorage/fetch falsos
│   ├── setup-env.js                 # entorno Node para Vitest
│   └── *.test.js                    # 16 archivos
├── integration/
│   ├── helpers/api.js               # base SQLite temporal + Supertest
│   └── *.test.js                    # 10 archivos
└── e2e/
    ├── fixtures.js                  # app lista, localStorage limpio, navegación
    ├── grades.spec.js               # notas → promedios → aprobación
    ├── lostfound.spec.js            # publicar → resolver → eliminar
    ├── calendar.spec.js             # profesor programa → alumno visualiza
    ├── contact.spec.js              # validación → folio → respaldo local
    ├── modules.spec.js              # humo de seguridad, profesores, talleres, comunicados y tareas
    └── navigation.mobile.spec.js    # smoke test responsive
```

## Solución de problemas

| Síntoma                               | Causa probable                            | Solución                                                             |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `Executable doesn't exist`            | Chromium no instalado                     | `pnpm test:e2e:install`                                              |
| E2E todo skipped                      | La SPA no marca `#app[data-ready="true"]` | Revisar consola del navegador; comprobar `src/main.js` y el servidor |
| `EADDRINUSE` en 8080                  | Otro servidor ocupa el puerto             | `E2E_BASE_URL`/`E2E_START_COMMAND` o liberar el puerto               |
| Integración falla al importar backend | Variables de entorno definidas tarde      | Usar siempre `createTestApi()`                                       |
| Cobertura bajo el umbral              | Se agregó lógica sin tests                | Añadir unitarias o justificar la exclusión en `vitest.config.js`     |
