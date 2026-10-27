import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess } from '../utils/response.js';
import gradesRoutes from './grades.routes.js';
import missingPersonsRoutes from './missingPersons.routes.js';
import teachersRoutes from './teachers.routes.js';
import lostFoundRoutes from './lostFound.routes.js';
import calendarRoutes from './calendar.routes.js';
import workshopsRoutes from './workshops.routes.js';
import announcementsRoutes from './announcements.routes.js';
import tasksRoutes from './tasks.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  db.prepare('SELECT 1 AS ok').get();
  return sendSuccess(res, {
    status: 'ok',
    service: 'intranerd-api',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/', (_req, res) => {
  return sendSuccess(res, {
    name: 'IntraNerd API',
    version: 'v1',
    documentation: 'Consulta backend/README.md para la referencia completa.',
    modules: [
      '/api/v1/grades',
      '/api/v1/missing-persons',
      '/api/v1/teachers',
      '/api/v1/lost-found',
      '/api/v1/calendar',
      '/api/v1/workshops',
      '/api/v1/announcements',
      '/api/v1/tasks',
    ],
  });
});

router.use('/grades', gradesRoutes);
router.use('/missing-persons', missingPersonsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/lost-found', lostFoundRoutes);
router.use('/calendar', calendarRoutes);
router.use('/workshops', workshopsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/tasks', tasksRoutes);

export default router;
