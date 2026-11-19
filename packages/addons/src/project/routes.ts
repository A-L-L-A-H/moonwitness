import type { FastifyInstance } from "fastify";
import {
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import {
  fetchGitHubIssues,
  getProjectBoardSummary,
  parseGitHubIssueWebhookPayload,
  syncGitHubIssuesToOrm,
  type GitHubIssueInput,
  type GitHubIssueWebhookPayload,
} from "./service.js";

export async function registerProjectRoutes(
  scope: FastifyInstance,
  options: { prefix: string; auth: BaseAddonAuthBridge },
): Promise<void> {
  const { prefix, auth } = options;

  scope.get(`${prefix}/project/summary`, { preHandler: auth.authenticate }, async (request) => {
    const tenantId = resolveActorTenantFromBridge(auth, request);
    const query = (request.query ?? {}) as { project_code?: string; projectCode?: string };
    const projectCode = query.project_code?.trim() || query.projectCode?.trim() || undefined;
    return getProjectBoardSummary(tenantId, projectCode);
  });

  scope.post(
    `${prefix}/project/sync/github`,
    { preHandler: [auth.authenticate, auth.requireRole("editor", "admin")] },
    async (request, reply) => {
      const actor = resolveActorContextFromBridge(auth, request, "api");
      const body = (request.body ?? {}) as {
        repo?: string;
        state?: "open" | "closed" | "all";
        issues?: GitHubIssueInput[];
      };
      const repo =
        body.repo?.trim() || process.env.DEFAULT_GITHUB_REPO?.trim() || "A-L-L-A-H/moonwitness";
      try {
        const issues =
          body.issues ??
          (await fetchGitHubIssues(repo, body.state ?? "all", process.env.GITHUB_TOKEN));
        const result = await syncGitHubIssuesToOrm(repo, issues, actor);
        return reply.code(200).send({ ok: true, ...result });
      } catch (error) {
        return reply
          .code(400)
          .send({ error: error instanceof Error ? error.message : "GitHub sync failed" });
      }
    },
  );

  scope.post(
    `${prefix}/project/webhooks/github`,
    { preHandler: [auth.authenticate, auth.requireRole("editor", "admin")] },
    async (request, reply) => {
      const event = String(request.headers["x-github-event"] ?? "issues");
      if (event !== "issues") {
        return reply.code(200).send({ ok: true, ignored: event });
      }
      const parsed = parseGitHubIssueWebhookPayload(
        (request.body ?? {}) as GitHubIssueWebhookPayload,
      );
      if (!parsed) {
        return reply.code(400).send({ error: "Invalid GitHub issues webhook payload" });
      }
      const actor = resolveActorContextFromBridge(auth, request, "api");
      const result = await syncGitHubIssuesToOrm(parsed.repo, [parsed.issue], actor);
      return reply.code(200).send({ ok: true, webhook: true, ...result });
    },
  );
}
