import { asyncHandler } from '../middlewares/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { calendarService, holidaysForYear } from '../services/calendar.service.js';

export const calendarController = {
  getYear: asyncHandler((req, res) => {
    return sendSuccess(res, calendarService.getYear(req.validated.query.year));
  }),

  listEvents: asyncHandler((req, res) => {
    return sendSuccess(res, calendarService.listEvents(req.validated.query));
  }),

  getEvent: asyncHandler((req, res) => {
    return sendSuccess(res, calendarService.getEvent(req.validated.params.id));
  }),

  createEvent: asyncHandler((req, res) => {
    return sendSuccess(res, calendarService.createEvent(req.validated.body), 201);
  }),

  updateEvent: asyncHandler((req, res) => {
    return sendSuccess(
      res,
      calendarService.updateEvent(req.validated.params.id, req.validated.body),
    );
  }),

  removeEvent: asyncHandler((req, res) => {
    calendarService.removeEvent(req.validated.params.id);
    return sendSuccess(res, { id: req.validated.params.id });
  }),

  holidays: asyncHandler((req, res) => {
    const { year } = req.validated.query;
    return sendSuccess(res, { year, holidays: holidaysForYear(year) });
  }),
};
