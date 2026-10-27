import { APP_NAME } from './config.js';
import { createLayout } from './components/layout.js';
import { createRouter } from './router.js';
import { migrateLegacyData } from './services/migrate.js';
import { toast } from './components/toast.js';
import { el } from './utils/dom.js';

/**
 * Punto de entrada de IntraNerd.
 *
 * Orden de arranque:
 *  1. Migrar datos de los HTML originales (si existen).
 *  2. Construir el layout (sidebar, topbar, perfil, estado de conexión).
 *  3. Iniciar el router por hash y montar la primera vista.
 */
function boot() {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('No se encontró el contenedor #app.');
  }

  migrateLegacyData();

  const layout = createLayout(root);
  const router = createRouter(layout);
  router.start();

  root.dataset.ready = 'true';
  document.documentElement.dataset.app = 'ready';

  // Diagnóstico útil en desarrollo: permite navegar sin conocer el hash.
  window.intranerd = { layout, router };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[IntraNerd] Promesa rechazada sin manejar.', event.reason);
  });

  window.addEventListener('error', (event) => {
    if (event.error) console.error('[IntraNerd] Error no controlado.', event.error);
  });

  console.info(`[IntraNerd] ${APP_NAME} iniciado.`);
}

try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
} catch (error) {
  console.error('[IntraNerd] Falló el arranque de la aplicación.', error);
  const root = document.getElementById('app');
  if (root) {
    root.replaceChildren(
      el(
        'div',
        { class: 'boot-error' },
        el('h1', { text: 'No pudimos iniciar IntraNerd' }),
        el('p', { text: 'Revisa la consola del navegador y recarga la página.' }),
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Recargar',
          on: { click: () => window.location.reload() },
        }),
      ),
    );
  }
  toast.error('No fue posible iniciar la aplicación.');
}
