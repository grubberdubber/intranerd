/**
 * IntraNerd · Interacciones compartidas
 * Menú móvil, acordeones accesibles y año dinámico del footer.
 */

const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

function setNavOpen(open) {
  if (!navToggle || !nav) return;
  nav.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute(
    'aria-label',
    open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación',
  );
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (event.target.closest('.site-header')) return;
    setNavOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setNavOpen(false);
    navToggle.focus();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) setNavOpen(false);
  });
}

/**
 * Acordeones: el estado vive en aria-expanded y el panel se oculta con hidden.
 * Funciona para preguntas frecuentes y para el detalle de cada solución.
 */
document.querySelectorAll('[data-accordion]').forEach((button) => {
  const panelId = button.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;
  const icon = button.querySelector('[data-accordion-icon]');
  if (!panel) return;

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    if (icon) icon.textContent = isOpen ? '+' : '−';
  });
});

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
