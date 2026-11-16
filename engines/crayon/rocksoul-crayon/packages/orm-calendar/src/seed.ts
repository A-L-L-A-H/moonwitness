export interface CalendarSeedContext {
  now?: string;
}

export const initialCalendarsData = [
  { id: "personal", name: "Personal", color: "#3b82f6", visible: true, type: "personal" },
  { id: "work", name: "Work Schedule", color: "#10b981", visible: true, type: "work" },
  { id: "shared", name: "Team Calendar", color: "#8b5cf6", visible: true, type: "shared" },
  { id: "meetings", name: "Meetings", color: "#f97316", visible: true, type: "work" },
  { id: "events", name: "Events", color: "#ec4899", visible: true, type: "shared" },
];

export const initialCalendarEventsData = [
  { id: 1, calendarId: "work", title: "Team Standup", date: "2026-09-11T09:00:00.000Z", time: "9:00 AM", duration: "30 min", type: "meeting", attendees: ["JD", "SM", "AR"], location: "Conference Room A", color: "bg-blue-500", description: "Daily team standup meeting to discuss progress and blockers" },
  { id: 2, calendarId: "work", title: "Design Review", date: "2026-09-11T14:00:00.000Z", time: "2:00 PM", duration: "1 hour", type: "meeting", attendees: ["ER", "LC"], location: "Virtual", color: "bg-purple-500", description: "Review new UI designs and provide feedback" },
  { id: 3, calendarId: "events", title: "Product Launch", date: "2026-09-15T10:00:00.000Z", time: "10:00 AM", duration: "2 hours", type: "event", attendees: ["TL", "ST"], location: "Main Hall", color: "bg-green-500", description: "Official product launch event with stakeholders" },
  { id: 4, calendarId: "meetings", title: "Client Presentation", date: "2026-09-18T15:30:00.000Z", time: "3:30 PM", duration: "45 min", type: "meeting", attendees: ["AW", "MK"], location: "Client Office", color: "bg-orange-500", description: "Presenting Q3 project deliverables to executive stakeholders" },
  { id: 5, calendarId: "personal", title: "Dentist Appointment", date: "2026-09-20T11:00:00.000Z", time: "11:00 AM", duration: "1 hour", type: "personal", attendees: [], location: "Downtown Clinic", color: "bg-pink-500", description: "Regular dental checkup" },
];

export async function seedCalendars(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: CalendarSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('📅 [orm-calendar] Seeding Calendars & Calendar Events...');

  for (const c of initialCalendarsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO calendars (id, user_id, name, color, visible, type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [c.id, '1', c.name, c.color, c.visible ? 1 : 0, c.type, now, now],
    });
  }

  for (const e of initialCalendarEventsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO calendar_events (
          id, calendar_id, user_id, title, description, date, time, duration, type, attendees, location, color, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        String(e.id),
        e.calendarId,
        '1',
        e.title,
        e.description,
        e.date,
        e.time,
        e.duration,
        e.type,
        JSON.stringify(e.attendees),
        e.location,
        e.color,
        now,
        now,
      ],
    });
  }
}
