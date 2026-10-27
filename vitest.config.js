import { defineConfig } from 'vitest/config';

/**
 * Configuración central de Vitest.
 *
 * Se usan dos "projects" para separar pruebas unitarias de integración:
 *  - unit:        lógica pura, sin red ni base de datos.
 *  - integration: API REST real (Express + PostgreSQL) mediante Supertest.
 *
 * La cobertura se calcula sobre la lógica de negocio (frontend y backend),
 * no sobre vistas/estilos, para que el umbral mida lo que realmente importa.
 * Los módulos que dependen de un DOM real (utils/dom.js, utils/files.js) se
 * validan en E2E con un navegador; incluirlos aquí solo mediría stubs.
 */
export default defineConfig({
  test: {
    globals: false,
    restoreMocks: true,
    clearMocks: true,
    reporters: ['default', 'json'],
    outputFile: {
      json: './coverage/test-results.json',
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.js'],
          environment: 'node',
          setupFiles: ['./tests/unit/setup-env.js'],
          testTimeout: 5_000,
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.js'],
          environment: 'node',
          testTimeout: 20_000,
          hookTimeout: 120_000,
          // Cada archivo levanta su propia API con una base SQLite temporal.
          // Se ejecutan en serie para mantener estable el uso de archivos.
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/format.js',
        'src/utils/grades.js',
        'src/utils/id.js',
        'src/utils/reports.js',
        'src/services/storage.js',
        'src/services/http.js',
        'src/services/api.js',
        'src/services/session.js',
        'src/services/resources.js',
        'src/data/constants.js',
        'src/data/seeds.js',
        'backend/src/domain/**/*.js',
      ],
      exclude: ['**/node_modules/**', '**/*.test.js', '**/index.js', '**/*.config.js'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
      reportOnFailure: true,
      skipFull: false,
    },
  },
});
