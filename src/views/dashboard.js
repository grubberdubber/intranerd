import { NAV_ITEMS } from '../data/constants.js';
import {
  announcementsRepo,
  calendarRepo,
  missingRepo,
  subjectsRepo,
  tasksRepo,
  workshopsRepo,
} from '../services/resources.js';
import { getProfile } from '../services/session.js';
import { el } from '../utils/dom.js';
import { daysUntil, formatDate, formatNumber, relativeTime, toISODate } from '../utils/format.js';
import { generalAverage } from '../utils/grades.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { emptyState, skeletonRows } from '../components/states.js';
import { toast } from '../components/toast.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function statCard({ iconName, label, value, hint, tone = '' }) {
  return el(
    'article',
    { class: 'stat-card' },
    el('span', {
      class: `stat-card__icon${tone ? ` stat-card__icon--${tone}` : ''}`,
      html: icon(iconName, { size: 20 }),
    }),
    el(
      'div',
      { class: 'stat-card__body' },
      el('span', { class: 'stat-card__label', text: label }),
      el('strong', { class: 'stat-card__value', text: value }),
      hint ? el('span', { class: 'stat-card__hint', text: hint }) : null,
    ),
  );
}

function eventWhen(date) {
  const diff = daysUntil(date);
  if (diff === null) return '';
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff > 1) return `En ${diff} días`;
  if (diff === -1) return 'Ayer';
  return `Hace ${Math.abs(diff)} días`;
}

function eventRow(event) {
  return el(
    'div',
    { class: 'activity-item' },
    el('span', { class: 'activity-item__icon', html: icon('calendar', { size: 15 }) }),
    el(
      'div',
      { class: 'activity-item__body' },
      el('span', { class: 'activity-item__title', text: event.title }),
      el('span', {
        class: 'activity-item__meta',
        text: `${formatDate(event.date)} · ${eventWhen(event.date)} · ${event.subject || 'General'}`,
      }),
    ),
    el('span', { class: 'badge badge--warning', text: eventWhen(event.date) }),
  );
}

function announcementRow(post) {
  return el(
    'div',
    { class: 'activity-item' },
    el('span', { class: 'activity-item__icon', html: icon('announcements', { size: 15 }) }),
    el(
      'div',
      { class: 'activity-item__body' },
      el('span', { class: 'activity-item__title', text: post.title }),
      el('span', {
        class: 'activity-item__meta',
        text: `${post.author} · ${relativeTime(post.createdAt)}`,
      }),
    ),
  );
}

function quickLink(item) {
  return el(
    'a',
    { class: 'quick-link', href: `#${item.path}` },
    el('span', { class: 'quick-link__icon', html: icon(item.icon, { size: 18 }) }),
    el(
      'span',
      { class: 'quick-link__body' },
      el('strong', { class: 'quick-link__title', text: item.shortLabel }),
      el('span', { class: 'quick-link__text', text: item.description }),
    ),
  );
}

export async function mount(container) {
  const profile = getProfile();
  const firstName = profile.name === 'Visitante' ? 'bienvenido/a' : profile.name.split(' ')[0];

  container.replaceChildren(
    pageHeader({
      eyebrow: 'Panel general',
      title: `${greeting()}, ${firstName}`,
      description:
        'Una vista rápida del pulso de tu comunidad escolar: notas, tareas, evaluaciones y avisos.',
    }),
    skeletonRows(4),
  );

  try {
    const results = await Promise.allSettled([
      subjectsRepo.list(),
      tasksRepo.list(),
      missingRepo.list(),
      calendarRepo.list(),
      announcementsRepo.list(),
      workshopsRepo.list(),
    ]);

    const valueOf = (index) => (results[index].status === 'fulfilled' ? results[index].value : []);
    const subjects = valueOf(0);
    const tasks = valueOf(1);
    const missing = valueOf(2);
    const events = valueOf(3);
    const announcements = valueOf(4);
    const workshops = valueOf(5);

    const average = generalAverage(subjects);
    const pendingTasks = tasks.filter((task) => !task.completed);
    const activeMissing = missing.filter((report) => !report.found);
    const today = toISODate();
    const upcoming = events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    const recentPosts = announcements
      .slice()
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt) - new Date(a.createdAt),
      )
      .slice(0, 3);
    const availableWorkshops = workshops.filter(
      (workshop) => (workshop.enrollments?.length || 0) < workshop.capacity,
    ).length;
    const completed = tasks.length - pendingTasks.length;
    const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    const hero = el(
      'section',
      { class: 'hero' },
      el(
        'div',
        { class: 'hero__content' },
        el(
          'span',
          { class: 'hero__eyebrow' },
          el('span', { html: icon('sparkles', { size: 13 }) }),
          'Tu semana escolar',
        ),
        el('h2', { class: 'hero__title', text: 'Todo lo importante, en un solo lugar.' }),
        el('p', {
          class: 'hero__description',
          text:
            'Revisa tus promedios, organiza las próximas evaluaciones, inscríbete en ' +
            'talleres y mantente al día con los comunicados oficiales.',
        }),
        el(
          'div',
          { class: 'hero__actions' },
          el('a', { class: 'btn btn--ghost', href: '#/notas', text: 'Ver mis notas' }),
          el('a', { class: 'btn btn--ghost', href: '#/tareas', text: 'Revisar tareas' }),
        ),
      ),
      el(
        'div',
        { class: 'hero__stats' },
        el(
          'div',
          { class: 'hero-stat' },
          el('strong', {
            class: 'hero-stat__value',
            text: average === null ? '—' : formatNumber(average),
          }),
          el('span', { class: 'hero-stat__label', text: 'Promedio general' }),
        ),
        el(
          'div',
          { class: 'hero-stat' },
          el('strong', { class: 'hero-stat__value', text: String(pendingTasks.length) }),
          el('span', { class: 'hero-stat__label', text: 'Tareas pendientes' }),
        ),
        el(
          'div',
          { class: 'hero-stat' },
          el('strong', { class: 'hero-stat__value', text: String(activeMissing.length) }),
          el('span', { class: 'hero-stat__label', text: 'Reportes activos' }),
        ),
        el(
          'div',
          { class: 'hero-stat' },
          el('strong', { class: 'hero-stat__value', text: String(upcoming.length) }),
          el('span', { class: 'hero-stat__label', text: 'Pruebas próximas' }),
        ),
      ),
    );

    const stats = el(
      'div',
      { class: 'grid-4' },
      statCard({
        iconName: 'grades',
        label: 'Promedio general',
        value: average === null ? 'Sin notas' : formatNumber(average),
        hint: `${subjects.length} ${subjects.length === 1 ? 'asignatura' : 'asignaturas'} registradas`,
        tone: average !== null && average >= 4 ? 'success' : average !== null ? 'danger' : '',
      }),
      statCard({
        iconName: 'tasks',
        label: 'Avance de tareas',
        value: `${completion}%`,
        hint: `${completed} de ${tasks.length} completadas`,
        tone: 'success',
      }),
      statCard({
        iconName: 'workshops',
        label: 'Talleres con cupos',
        value: String(availableWorkshops),
        hint: `${workshops.length} talleres activos`,
        tone: 'warning',
      }),
      statCard({
        iconName: 'announcements',
        label: 'Comunicados',
        value: String(announcements.length),
        hint: 'Avisos oficiales publicados',
        tone: '',
      }),
    );

    const quick = el(
      'section',
      { class: 'section' },
      el(
        'div',
        { class: 'section__header' },
        el(
          'div',
          {},
          el('h2', { class: 'section__title', text: 'Accesos rápidos' }),
          el('p', {
            class: 'section__description',
            text: 'Los ocho módulos de IntraNerd, siempre a un clic.',
          }),
        ),
      ),
      el(
        'div',
        { class: 'quick-grid' },
        ...NAV_ITEMS.filter((item) => item.id !== 'dashboard').map(quickLink),
      ),
    );

    const upcomingCard = el(
      'section',
      { class: 'card' },
      el(
        'header',
        { class: 'card__header' },
        el(
          'div',
          {},
          el(
            'h2',
            { class: 'card__title' },
            el('span', { html: icon('calendar', { size: 18 }) }),
            'Próximas evaluaciones',
          ),
          el('p', { class: 'card__subtitle', text: 'Agenda de pruebas y entregas.' }),
        ),
        el('a', { class: 'btn btn--ghost btn--sm', href: '#/calendario', text: 'Ver calendario' }),
      ),
      el(
        'div',
        { class: 'card__body' },
        upcoming.length
          ? el('div', { class: 'activity-list' }, ...upcoming.map(eventRow))
          : emptyState({
              iconName: 'calendar',
              title: 'Sin evaluaciones próximas',
              text: 'Cuando se programe una prueba aparecerá aquí.',
              compact: true,
            }),
      ),
    );

    const tasksCard = el(
      'section',
      { class: 'card' },
      el(
        'header',
        { class: 'card__header' },
        el(
          'div',
          {},
          el(
            'h2',
            { class: 'card__title' },
            el('span', { html: icon('clipboard', { size: 18 }) }),
            'Tareas pendientes',
          ),
          el('p', { class: 'card__subtitle', text: 'Tu checklist personal.' }),
        ),
        el('a', { class: 'btn btn--ghost btn--sm', href: '#/tareas', text: 'Ver todas' }),
      ),
      el(
        'div',
        { class: 'card__body' },
        el(
          'div',
          { class: 'tasks-progress' },
          el(
            'div',
            { class: 'tasks-progress__label' },
            el('span', { text: 'Progreso semanal' }),
            el('strong', { text: `${completion}%` }),
          ),
          el(
            'div',
            { class: 'tasks-progress__track' },
            el('span', {
              class: 'tasks-progress__fill',
              cssVar: { '--progress': `${completion}%` },
            }),
          ),
        ),
        el(
          'div',
          { class: 'stack stack--sm mt-4' },
          ...(pendingTasks.length
            ? pendingTasks.slice(0, 4).map((task) =>
                el(
                  'div',
                  { class: 'activity-item' },
                  el('span', { class: 'activity-item__icon', html: icon('tasks', { size: 15 }) }),
                  el(
                    'div',
                    { class: 'activity-item__body' },
                    el('span', { class: 'activity-item__title', text: task.title }),
                    el('span', {
                      class: 'activity-item__meta',
                      text: `${task.subject} · vence ${formatDate(task.dueDate)}`,
                    }),
                  ),
                ),
              )
            : [
                emptyState({
                  iconName: 'checkCircle',
                  title: '¡Todo al día!',
                  text: 'No tienes tareas pendientes por ahora.',
                  compact: true,
                }),
              ]),
        ),
      ),
    );

    const announcementsCard = el(
      'section',
      { class: 'card' },
      el(
        'header',
        { class: 'card__header' },
        el(
          'div',
          {},
          el(
            'h2',
            { class: 'card__title' },
            el('span', { html: icon('announcements', { size: 18 }) }),
            'Últimos comunicados',
          ),
          el('p', { class: 'card__subtitle', text: 'Novedades de la comunidad.' }),
        ),
        el('a', { class: 'btn btn--ghost btn--sm', href: '#/comunicados', text: 'Ver tablón' }),
      ),
      el(
        'div',
        { class: 'card__body' },
        recentPosts.length
          ? el('div', { class: 'activity-list' }, ...recentPosts.map(announcementRow))
          : emptyState({
              iconName: 'announcements',
              title: 'Sin comunicados',
              text: 'Los avisos oficiales aparecerán aquí.',
              compact: true,
            }),
      ),
    );

    const columns = el(
      'div',
      { class: 'dashboard-columns' },
      el('div', { class: 'dashboard-stack' }, upcomingCard, announcementsCard),
      el('div', { class: 'dashboard-stack' }, tasksCard),
    );

    container.replaceChildren(
      pageHeader({
        eyebrow: 'Panel general',
        title: `${greeting()}, ${firstName}`,
        description: 'Una vista rápida del pulso de tu comunidad escolar.',
      }),
      hero,
      stats,
      quick,
      columns,
    );
  } catch (error) {
    console.error('[IntraNerd] Error al cargar el panel.', error);
    toast.error('No fue posible cargar el panel general.');
    container.replaceChildren(
      pageHeader({ eyebrow: 'Panel general', title: 'Panel general' }),
      emptyState({
        iconName: 'alert',
        title: 'No pudimos cargar el panel',
        text: 'Revisa la consola o vuelve a intentarlo.',
        action: el('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Reintentar',
          on: { click: () => mount(container) },
        }),
      }),
    );
  }
}
