export interface MailSeedContext {
  now?: string;
}

export const initialMailsData = [
  { id: "mail-1", userId: "1", name: "William Smith", email: "williamsmith@example.com", subject: "Meeting Tomorrow", text: "Hi, let's have a meeting tomorrow to discuss the project. Please come prepared with any questions or insights you may have.", folder: "inbox", read: true, labels: ["meeting", "work", "important"], date: "2024-10-22T09:00:00" },
  { id: "mail-2", userId: "1", name: "Alice Smith", email: "alicesmith@example.com", subject: "Re: Project Update", text: "Thank you for the project update. It looks great! The team has done a fantastic job, and I appreciate the hard work everyone has put in.", folder: "inbox", read: true, labels: ["work", "important"], date: "2024-10-22T10:30:00" },
  { id: "mail-3", userId: "1", name: "Bob Johnson", email: "bobjohnson@example.com", subject: "Weekend Plans", text: "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It has been a while since we had some outdoor fun.", folder: "inbox", read: true, labels: ["personal"], date: "2024-04-10T11:45:00" },
  { id: "mail-4", userId: "1", name: "Emily Davis", email: "emilydavis@example.com", subject: "Re: Question about Budget", text: "I have a question about the budget for the upcoming project. I identified a few areas where we might be able to optimize spending.", folder: "inbox", read: false, labels: ["work", "budget"], date: "2024-03-25T13:15:00" },
  { id: "mail-5", userId: "1", name: "Michael Wilson", email: "michaelwilson@example.com", subject: "Important Announcement", text: "I have an important announcement to make during our team meeting regarding strategic improvements to our development cycle.", folder: "inbox", read: false, labels: ["meeting", "work", "important"], date: "2024-03-10T15:00:00" },
];

export async function seedMail(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: MailSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('✉️ [orm-mail] Seeding Mailbox...');

  for (const m of initialMailsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO mails (id, user_id, name, email, subject, text, folder, read, labels, date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [m.id, m.userId, m.name, m.email, m.subject, m.text, m.folder, m.read ? 1 : 0, JSON.stringify(m.labels), m.date, now, now],
    });
  }
}
