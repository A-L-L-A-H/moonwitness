// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { isWriteRole, normalizeRole } from "../src/lib/roles";
import { buildCsrfLogoutInit, normalizeAuthUser } from "../src/lib/api/auth";
import {
  archiveTimelineEvent,
  createTimelineEvent,
  fetchTimelineEventHistory,
} from "../src/lib/api/timeline";

describe("web platform gap integration helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "mw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("normalizes canonical and control roles while keeping root invalid", () => {
    expect(normalizeRole("superadmin")).toBe("admin");
    expect(normalizeRole("readonly")).toBe("viewer");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("editor")).toBe("editor");
    expect(normalizeRole("viewer")).toBe("viewer");
    expect(normalizeRole("root")).toBeNull();
    expect(isWriteRole("superadmin")).toBe(true);
    expect(isWriteRole("readonly")).toBe(false);
  });

  it("normalizes auth user display name and role across control/api shapes", () => {
    const normalized = normalizeAuthUser({
      id: 7,
      username: "crew7",
      email: "crew7@moonwitness.org",
      role: "superadmin",
      display_name: "Crew Seven",
    });
    expect(normalized).toEqual({
      id: "7",
      username: "crew7",
      name: "Crew Seven",
      displayName: "Crew Seven",
      email: "crew7@moonwitness.org",
      role: "admin",
      active: true,
    });
  });

  it("omits headers when mw_csrf cookie is absent and attaches x-csrf-token when present", () => {
    expect(buildCsrfLogoutInit()).toEqual({
      method: "POST",
      credentials: "include",
    });

    document.cookie = "mw_csrf=csrf-token-123; path=/";
    expect(buildCsrfLogoutInit()).toEqual({
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": "csrf-token-123" },
    });
  });

  it("sends timeline create, archive, and history requests with credentials", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            id: "evt-new",
            kind: "PROJECT",
            date: "2026-11-18",
            era: "expansions",
            title: "Test Event",
            excerpt: "",
            body: "",
            location: "",
            tags: [],
            sources: 0,
            notes: 0,
            image: "hero-witness",
            related: [],
          },
        }),
      )
      .mockResolvedValueOnce(Response.json({ data: { id: "evt-new" } }))
      .mockResolvedValueOnce(Response.json({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await createTimelineEvent({
      kind: "PROJECT",
      date: "2026-11-18",
      era: "expansions",
      title: "Test Event",
    });
    await archiveTimelineEvent("evt-new");
    await fetchTimelineEventHistory("evt-new");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/timeline/events",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/timeline/events/evt-new/archive",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/v1/timeline/events/evt-new/history",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
