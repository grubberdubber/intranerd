import { CHAT_ROLES, MENU_COMMENT_TYPES } from '../data/constants.js';
import { MENU_ROTATIONS } from '../data/menu.js';
import { addMenuComment, listMenuComments } from '../services/menu.js';
import { getProfile } from '../services/session.js';
import {
  addDays,
  commentCount,
  commentsFor,
  latestComment,
  menuForWeek,
  startOfWeek,
  weekDays,
} from '../utils/menu.js';
import { toISODate } from '../utils/format.js';
import { el, qs, setFieldError } from '../utils/dom.js';
import { pluralize, relativeTime, truncate } from '../utils/format.js';
import { icon } from '../components/icon.js';
import { openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState } from '../components/states.js';
import { toast } from '../components/toast.js';

/**
 * Módulo 11 · Menú semanal de la cafetería.
 *
 * La rotación cambia automáticamente cada semana. Cada día abre una ficha con
 * el detalle del menú y un hilo de comentarios y sugerencias por semana.
 */

const ROLE_LABELS = Object.fromEntries(CHAT_ROLES.map((role) => [role.id, role.label]));
const TYPE_MAP = Object.fromEntries(MENU_COMMENT_TYPES.map((type) => [type.id, type]));

function roleLabel(roleId) {
  return ROLE_LABELS[roleId] || 'Comunidad';
}

function commentNode(comment) {
  const type = TYPE_MAP[comment.type] || TYPE_MAP.comentario;
  return el(
    'article',
    { class: `menu-comment menu-comment--${comment.type}` },
    el(
      'header',
      { class: 'menu-comment__header' },
      el('strong', { class: 'menu-comment__author', text: comment.author }),
      el('span', { class: 'menu-comment__role', text: roleLabel(comment.role) }),
      el(
        'span',
        { class: `badge${type.id === 'sugerencia' ? ' badge--warning' : ' badge--info'}` },
        el('span', { html: icon(type.icon, { size: 12 }) }),
        el('span', { text: type.label }),
      ),
      el('span', { class: 'menu-comment__time', text: relativeTime(comment.createdAt) }),
    ),
    el('p', { class: 'menu-comment__body', text: comment.body }),
  );
}

function renderComments(host, menu, dayId, countLabel) {
  const list = commentsFor(menu.comments, menu.weekKey, dayId);
  if (countLabel) countLabel.textContent = pluralize(list.length, 'comentario');

  if (!list.length) {
    host.replaceChildren(
      emptyState({
        iconName: 'coffee',
        title: 'Sé la primera persona en opinar',
        text: 'Cuéntanos qué te pareció el menú o qué te gustaría ver en la cafetería.',
        compact: true,
      }),
    );
    return;
  }

  host.replaceChildren(...list.map(commentNode));
}

function openDayModal(menu, day, { initialType = 'comentario', onComment = null } = {}) {
  const menuDay = day.menu;
  if (!menuDay) return;

  const profile = getProfile();
  const author = profile.name === 'Visitante' ? 'Comunidad' : profile.name;
  const commentsHost = el('div', { class: 'menu-comments', id: 'menu-comments' });
  const commentsTitle = el('h3', {
    class: 'menu-modal__section-title',
    id: 'menu-comments-title',
    text: 'Comentarios',
  });
  const countLabel = el('span', { class: 'menu-modal__count', text: '0 comentarios' });

  const typeSelect = el(
    'select',
    { class: 'select', id: 'menu-comment-type' },
    ...MENU_COMMENT_TYPES.map((type) =>
      el('option', {
        value: type.id,
        text: type.label,
        selected: type.id === initialType,
      }),
    ),
  );

  const bodyInput = el('textarea', {
    class: 'textarea',
    id: 'menu-comment-body',
    rows: '4',
    maxlength: '500',
    placeholder: 'Ej: Me gustó la alternativa vegetariana, pero faltó ensalada…',
    required: true,
    attrs: { 'aria-describedby': 'menu-comment-help' },
  });

  const status = el('p', {
    class: 'menu-comment-form__status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });

  const form = el(
    'form',
    { class: 'form menu-comment-form', id: 'menu-comment-form', novalidate: true },
    el(
      'div',
      { class: 'form-grid' },
      el(
        'div',
        { class: 'field' },
        el('label', { class: 'field__label', attrs: { for: 'menu-comment-type' } }, 'Tipo'),
        typeSelect,
      ),
      el(
        'div',
        { class: 'field' },
        el('span', { class: 'field__label', text: 'Autoría' }),
        el('p', { class: 'menu-comment-form__author' }, `${author} · ${roleLabel(profile.role)}`),
      ),
    ),
    el(
      'div',
      { class: 'field' },
      el(
        'label',
        { class: 'field__label', attrs: { for: 'menu-comment-body' } },
        'Tu comentario o sugerencia',
      ),
      bodyInput,
      el('span', {
        class: 'field__hint',
        id: 'menu-comment-help',
        text: 'Máximo 500 caracteres. Sé respetuoso y concreto; la cafetería leerá las sugerencias.',
      }),
    ),
    status,
    el(
      'div',
      { class: 'form-actions' },
      el('button', {
        class: 'btn btn--primary',
        type: 'submit',
        html: `${icon('send', { size: 16 })}<span>Publicar</span>`,
      }),
    ),
  );

  const menuSummary = el(
    'div',
    { class: 'menu-modal__summary' },
    el(
      'div',
      {},
      el('span', { class: 'menu-modal__eyebrow', text: 'Menú del día' }),
      el('h3', { class: 'menu-modal__dish', text: menuDay.main }),
      el('p', { class: 'menu-modal__description', text: menuDay.description }),
    ),
    el(
      'dl',
      { class: 'menu-modal__details' },
      el('div', {}, el('dt', { text: 'Acompañamiento' }), el('dd', { text: menuDay.side })),
      el(
        'div',
        {},
        el('dt', { text: 'Alternativa vegetariana' }),
        el('dd', { text: menuDay.vegetarian }),
      ),
      el('div', {}, el('dt', { text: 'Postre' }), el('dd', { text: menuDay.dessert })),
    ),
    menuDay.allergens.length
      ? el(
          'p',
          { class: 'menu-modal__allergens' },
          el('span', { text: 'Alérgenos declarados: ' }),
          ...menuDay.allergens.map((allergen) =>
            el('span', { class: 'badge badge--warning', text: allergen }),
          ),
        )
      : el(
          'p',
          { class: 'menu-modal__allergens menu-modal__allergens--clear' },
          'Sin alérgenos declarados.',
        ),
  );

  const commentsSection = el(
    'section',
    { class: 'menu-modal__comments', attrs: { 'aria-labelledby': 'menu-comments-title' } },
    el('div', { class: 'menu-modal__section-header' }, commentsTitle, countLabel),
    commentsHost,
  );

  const modal = openModal({
    title: `${day.label} · ${day.dateLabel}`,
    eyebrow: `${menu.rotation?.name || 'Menú semanal'} · ${menu.rangeLabel}`,
    description: 'Detalle del menú, comentarios y sugerencias de la comunidad.',
    body: el('div', { class: 'menu-modal' }, menuSummary, commentsSection, form),
    size: 'lg',
    footer: [
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Cerrar',
        on: { click: () => modal.close() },
      }),
    ],
  });

  renderComments(commentsHost, menu, day.id, countLabel);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const body = bodyInput.value.trim();
    if (body.length < 3) {
      setFieldError(bodyInput, 'Escribe al menos 3 caracteres para publicar.');
      bodyInput.focus();
      return;
    }

    try {
      addMenuComment({
        weekKey: menu.weekKey,
        dayId: day.id,
        type: typeSelect.value,
        body,
        author,
        role: profile.role,
      });
      menu.comments = listMenuComments();
      if (typeof onComment === 'function') onComment(menu.comments);
      renderComments(commentsHost, menu, day.id, countLabel);
      form.reset();
      typeSelect.value = initialType;
      status.textContent = 'Publicado. Gracias por ayudar a mejorar la cafetería.';
      bodyInput.focus();
      toast.success('Comentario publicado.');
    } catch (error) {
      console.error('[IntraNerd] No se pudo publicar el comentario del menú.', error);
      setFieldError(bodyInput, error.message || 'No se pudo publicar el comentario.');
      bodyInput.focus();
    }
  });

  requestAnimationFrame(() => bodyInput.focus());
}

function dayCard(menu, day, onComment) {
  const count = commentCount(menu.comments, menu.weekKey, day.id);
  const last = latestComment(menu.comments, menu.weekKey, day.id);
  const menuDay = day.menu;

  const card = el(
    'article',
    {
      class: `menu-day${day.isToday ? ' is-today' : ''}`,
      dataset: { day: day.id },
      attrs: { 'aria-labelledby': `menu-day-${day.id}` },
    },
    el(
      'header',
      { class: 'menu-day__header' },
      el('span', { class: 'menu-day__name', text: day.label }),
      el('span', { class: 'menu-day__date', text: day.dateLabel }),
      day.isToday ? el('span', { class: 'badge badge--solid', text: 'Hoy' }) : null,
    ),
  );

  if (!menuDay) {
    card.appendChild(
      emptyState({
        iconName: 'coffee',
        title: 'Menú por confirmar',
        text: 'La cafetería todavía no publicó este día.',
        compact: true,
      }),
    );
    return card;
  }

  card.append(
    el('h2', { class: 'menu-day__dish', id: `menu-day-${day.id}`, text: menuDay.main }),
    el('p', { class: 'menu-day__description', text: menuDay.description }),
    el(
      'dl',
      { class: 'menu-day__details' },
      el('div', {}, el('dt', { text: 'Acompaña' }), el('dd', { text: menuDay.side })),
      el('div', {}, el('dt', { text: 'Vegetariano' }), el('dd', { text: menuDay.vegetarian })),
      el('div', {}, el('dt', { text: 'Postre' }), el('dd', { text: menuDay.dessert })),
    ),
    el(
      'div',
      { class: 'menu-day__allergens' },
      menuDay.allergens.length
        ? menuDay.allergens.map((allergen) =>
            el('span', { class: 'badge badge--warning', text: allergen }),
          )
        : el('span', { class: 'badge badge--success', text: 'Sin alérgenos declarados' }),
    ),
    last
      ? el('p', {
          class: 'menu-day__latest',
          text: `${last.author}: ${truncate(last.body, 72)}`,
        })
      : null,
    el(
      'div',
      { class: 'menu-day__footer' },
      el(
        'span',
        { class: 'menu-day__count' },
        el('span', { html: icon('chat', { size: 13 }), attrs: { 'aria-hidden': 'true' } }),
        el('span', { text: pluralize(count, 'comentario') }),
      ),
      el('button', {
        class: 'btn btn--secondary btn--sm menu-day__open',
        type: 'button',
        html: `${icon('plus', { size: 14 })}<span>Ver y comentar</span>`,
        on: { click: () => openDayModal(menu, day, { onComment }) },
      }),
    ),
  );

  return card;
}

export async function mount(container) {
  let weekStart = startOfWeek(new Date());
  let comments = listMenuComments();
  let modal = null;
  let grid = null;
  let weekNumber = null;
  let weekRange = null;
  let rotationName = null;
  let rotationDescription = null;
  let totalComments = null;
  let todayButton = null;

  function currentMenu() {
    const menu = menuForWeek(weekStart, MENU_ROTATIONS);
    menu.comments = comments;
    return menu;
  }

  function handleComment(nextComments) {
    comments = nextComments;
    render();
  }

  function render() {
    const menu = currentMenu();
    weekNumber.textContent = menu.weekKey.split('-W')[1];
    weekRange.textContent = menu.rangeLabel;
    rotationName.textContent = menu.rotation?.name || 'Menú de la semana';
    rotationDescription.textContent =
      menu.rotation?.description || 'Revisa los platos disponibles cada día.';
    const total = MENU_ROTATIONS.length
      ? weekDays(weekStart).reduce(
          (sum, day) => sum + commentCount(comments, menu.weekKey, day.id),
          0,
        )
      : 0;
    totalComments.textContent = pluralize(total, 'comentario', 'comentarios');
    todayButton.disabled = toISODate(weekStart) === toISODate(startOfWeek(new Date()));
    grid.replaceChildren(...menu.days.map((day) => dayCard(menu, day, handleComment)));
  }

  function changeWeek(days) {
    const next = startOfWeek(addDays(weekStart, days));
    if (toISODate(next) === toISODate(weekStart)) return;
    modal?.close();
    modal = null;
    weekStart = next;
    comments = listMenuComments();
    render();
  }

  const previous = el('button', {
    class: 'btn btn--ghost btn--sm menu-week__button',
    type: 'button',
    attrs: { 'aria-label': 'Ver la semana anterior' },
    html: `${icon('chevronLeft', { size: 16 })}<span>Anterior</span>`,
    on: { click: () => changeWeek(-7) },
  });

  const next = el('button', {
    class: 'btn btn--ghost btn--sm menu-week__button',
    type: 'button',
    attrs: { 'aria-label': 'Ver la semana siguiente' },
    html: `<span>Siguiente</span>${icon('chevronRight', { size: 16 })}`,
    on: { click: () => changeWeek(7) },
  });

  todayButton = el('button', {
    class: 'btn btn--ghost btn--sm',
    type: 'button',
    text: 'Esta semana',
    on: {
      click: () => {
        if (toISODate(weekStart) === toISODate(startOfWeek(new Date()))) return;
        modal?.close();
        modal = null;
        weekStart = startOfWeek(new Date());
        comments = listMenuComments();
        render();
      },
    },
  });

  const toolbar = el(
    'section',
    { class: 'menu-toolbar', attrs: { 'aria-label': 'Navegación por semana' } },
    el(
      'div',
      { class: 'menu-week' },
      previous,
      el(
        'div',
        { class: 'menu-week__label' },
        el('span', { class: 'menu-week__eyebrow' }, 'Semana ', el('strong', { text: '—' })),
        el('strong', { class: 'menu-week__range', text: '—' }),
      ),
      next,
    ),
    todayButton,
  );

  // Referencias estables para actualizar la cabecera sin volver a crearla.
  const weekNumberHost = qs('.menu-week__eyebrow', toolbar);
  weekNumber = el('strong', { text: '—' });
  weekNumberHost.replaceChildren(document.createTextNode('Semana '), weekNumber);
  weekRange = qs('.menu-week__range', toolbar);

  grid = el('div', { class: 'menu-grid', id: 'menu-grid' });

  const rotationCard = el(
    'section',
    { class: 'menu-rotation', attrs: { 'aria-labelledby': 'menu-rotation-title' } },
    el(
      'div',
      { class: 'menu-rotation__icon' },
      el('span', { html: icon('coffee', { size: 22 }), attrs: { 'aria-hidden': 'true' } }),
    ),
    el(
      'div',
      { class: 'menu-rotation__body' },
      el(
        'div',
        { class: 'menu-rotation__top' },
        el('span', { class: 'menu-rotation__eyebrow', text: 'Menú rotativo' }),
        el('span', { class: 'menu-rotation__count', text: '0 comentarios' }),
      ),
      el('h2', {
        class: 'menu-rotation__title',
        id: 'menu-rotation-title',
        text: 'Menú de la semana',
      }),
      el('p', { class: 'menu-rotation__text', text: '' }),
    ),
  );
  rotationName = qs('.menu-rotation__title', rotationCard);
  rotationDescription = qs('.menu-rotation__text', rotationCard);
  totalComments = qs('.menu-rotation__count', rotationCard);

  container.replaceChildren(
    pageHeader({
      eyebrow: 'Bienestar y alimentación',
      title: 'Menú semanal',
      description:
        'Revisa el menú de cada día, conoce las alternativas vegetarianas ' +
        'y comparte comentarios o sugerencias con la cafetería.',
      actions: [
        el('button', {
          class: 'btn btn--primary',
          type: 'button',
          html: `${icon('sparkles', { size: 16 })}<span>Sugerir un plato</span>`,
          on: {
            click: () => {
              const menu = currentMenu();
              const day = menu.days.find((item) => item.isToday) || menu.days[0];
              openDayModal(menu, day, {
                initialType: 'sugerencia',
                onComment: handleComment,
              });
            },
          },
        }),
      ],
    }),
    el('div', { class: 'stack menu-page' }, toolbar, rotationCard, grid),
  );

  render();
}
