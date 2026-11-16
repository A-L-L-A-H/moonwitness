import { calendars } from './schema/calendars.js';
import { calendarEvents } from './schema/events.js';

export * from './schema/calendars.js';
export * from './schema/events.js';
export * from './seed.js';


export const calendarSchema = {
  calendars,
  calendarEvents,
};
