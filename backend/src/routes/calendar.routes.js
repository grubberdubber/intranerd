import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  calendarListQuery,
  calendarParams,
  calendarYearQuery,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../validators/calendar.validator.js';

const router = Router();

router.get('/holidays', validate({ query: calendarYearQuery }), calendarController.holidays);

router.get('/events', validate({ query: calendarListQuery }), calendarController.listEvents);

router.post(
  '/events',
  validate({ body: createCalendarEventSchema }),
  calendarController.createEvent,
);

router.get('/events/:id', validate({ params: calendarParams }), calendarController.getEvent);

router.patch(
  '/events/:id',
  validate({ params: calendarParams, body: updateCalendarEventSchema }),
  calendarController.updateEvent,
);

router.delete('/events/:id', validate({ params: calendarParams }), calendarController.removeEvent);

router.get('/', validate({ query: calendarYearQuery }), calendarController.getYear);

export default router;
