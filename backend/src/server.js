import app from './app.js';
import { env } from './config/env.js';
import { closeDatabase, initializeSchema } from './db/connection.js';
import { seedDatabase } from './db/seed.js';

initializeSchema();

if (env.seedOnStart) {
  const result = seedDatabase();
  if (result.seeded) {
    console.log('🌱 Datos de demostración cargados.');
  }
}

const server = app.listen(env.port, () => {
  console.log(`\n🚀 IntraNerd API escuchando en http://localhost:${env.port}`);
  console.log(`   • Health:  http://localhost:${env.port}/api/v1/health`);
  console.log(`   • API:     http://localhost:${env.port}/api/v1`);
  console.log(`   • SQLite:  ${env.dbPath}`);
  console.log(`   • Uploads: ${env.uploadDir}\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${env.port} ya está en uso.`);
  } else {
    console.error('No se pudo iniciar el servidor:', error);
  }
  process.exitCode = 1;
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  // Fuerza el cierre si alguna conexión queda colgada.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
