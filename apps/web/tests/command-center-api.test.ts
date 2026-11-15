import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type CommandCenterApiError,
  createCommandCenterWorkflow,
  dismissCommandCenterAlert,
  fetchCommandCenterState,
  toggleCommandCenterWorkflow,
} from "../src/lib/api/command-center";

describe("Command Center persistence client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads workflows and alerts using credentials", async () => {
    const snapshot = {
      workflows: [{ id: "wf-1", name: "Watcher", detail: "Live", status: "Running" }],
      alerts: [{ id: "a-1", text: "Signal spike", ago: "5m ago", level: "high" }],
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchCommandCenterState();
    expect(res).toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/command-center/state",
      expect.objectContaining({ method: "GET", credentials: "include", cache: "no-store" }),
    );
  });

  it("propagates HTTP status errors cleanly without silent fakes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      createCommandCenterWorkflow({ name: "Run", detail: "Detail" }),
    ).rejects.toMatchObject<Partial<CommandCenterApiError>>({
      status: 401,
      message: "Not authenticated",
    });
  });

  it("dispatches toggle and alert dismissal endpoints", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            workflow: { id: "wf-1", name: "Watcher", detail: "Live", status: "Paused" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dismissed: true, id: "a-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const toggled = await toggleCommandCenterWorkflow("wf-1");
    expect(toggled.status).toBe("Paused");

    const dismissed = await dismissCommandCenterAlert("a-1");
    expect(dismissed).toEqual({ dismissed: true, id: "a-1" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/command-center/workflows/wf-1/toggle",
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/command-center/alerts/a-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
