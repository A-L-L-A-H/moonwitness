export interface TaskSeedContext {
  now?: string;
}

export const initialTasksData = [
  { id: "TASK-1001", title: "Implement user authentication with OAuth 2.0 providers", status: "completed", category: "feature", priority: "critical" },
  { id: "TASK-1002", title: "Fix memory leak in dashboard component causing browser slowdown", status: "in progress", category: "bug", priority: "critical" },
  { id: "TASK-1003", title: "Update API documentation for v2 endpoints", status: "todo", category: "documentation", priority: "important" },
  { id: "TASK-1004", title: "Add dark mode support for all UI components", status: "completed", category: "feature", priority: "important" },
  { id: "TASK-1005", title: "Resolve login page not redirecting after successful authentication", status: "in progress", category: "bug", priority: "critical" },
  { id: "TASK-1006", title: "Create onboarding tutorial for new users", status: "pending", category: "documentation", priority: "medium" },
  { id: "TASK-1007", title: "Optimize database queries for analytics dashboard", status: "completed", category: "feature", priority: "important" },
  { id: "TASK-1008", title: "Fix broken layout on mobile viewport for settings page", status: "completed", category: "bug", priority: "critical" },
  { id: "TASK-1009", title: "Integrate payment gateway for international transactions", status: "in progress", category: "feature", priority: "critical" },
  { id: "TASK-1010", title: "Refactor legacy codebase to use modern TypeScript patterns", status: "todo", category: "feature", priority: "important" },
  { id: "TASK-1011", title: "Add export to CSV functionality for reports", status: "completed", category: "feature", priority: "medium" },
  { id: "TASK-1012", title: "Address accessibility issues identified in audit", status: "pending", category: "bug", priority: "medium" },
  { id: "TASK-1013", title: "Set up automated testing pipeline in CI/CD", status: "completed", category: "feature", priority: "critical" },
  { id: "TASK-1014", title: "Investigate and resolve intermittent 500 errors on API", status: "in progress", category: "bug", priority: "critical" },
  { id: "TASK-1015", title: "Design and implement new landing page hero section", status: "completed", category: "feature", priority: "important" },
  { id: "TASK-1016", title: "Write comprehensive unit tests for auth module", status: "todo", category: "documentation", priority: "medium" },
  { id: "TASK-1017", title: "Fix typo in email verification template", status: "completed", category: "bug", priority: "low" },
  { id: "TASK-1018", title: "Implement rate limiting for public API endpoints", status: "todo", category: "feature", priority: "critical" },
  { id: "TASK-1019", title: "Update third-party dependencies with security vulnerabilities", status: "completed", category: "bug", priority: "critical" },
  { id: "TASK-1020", title: "Create user persona documentation for marketing team", status: "completed", category: "documentation", priority: "low" },
];

export async function seedTasks(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: TaskSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('✅ [orm-task] Seeding Tasks (Relational mapping to Projects & Users)...');

  for (let i = 0; i < initialTasksData.length; i++) {
    const t = initialTasksData[i];
    const projectId = i % 2 === 0 ? 'proj_alpha' : 'proj_core';
    const assigneeId = String((i % 12) + 1);

    await client.execute({
      sql: `
        INSERT OR REPLACE INTO tasks (
          id, project_id, title, status, category, priority, assignee_id, due_date, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        t.id,
        projectId,
        t.title,
        t.status,
        t.category,
        t.priority,
        assigneeId,
        '2026-10-15',
        `Task detail for ${t.title}`,
        now,
        now,
      ],
    });
  }
}
