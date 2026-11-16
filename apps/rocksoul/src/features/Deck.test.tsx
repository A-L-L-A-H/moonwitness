import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Deck from "./Deck";

describe("Deck", () => {
  it("renders loading/unavailable state when data is not ready", () => {
    render(
      <Deck
        issues={[]}
        repositories={[]}
        events={[]}
        dataReady={false}
        loading={true}
        onCreate={vi.fn()}
        onStatusChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getAllByText("READING LOCAL WORKSPACE.")).toHaveLength(3);
  });

  it("renders active issues, repositories, events, and triggers actions when ready", () => {
    const onCreate = vi.fn();
    const onNavigate = vi.fn();

    render(
      <Deck
        issues={[
          {
            id: "i1",
            issue_key: "RS-1",
            title: "Ship release",
            status: "open",
            priority: "P1",
            description: "",
            assignee: "",
            repository_id: null,
            repository_name: null,
            updated_at: "2026-11-16T01:00:00Z",
            project_id: null,
          },
        ]}
        repositories={[{ id: "r1", name: "moonwitness", branch: "main", path: "/test/path", remote_url: "", default_branch: "main" }]}
        events={[{ id: "e1", kind: "git", message: "Committed fix", created_at: "2026-11-16T01:00:00Z" }]}
        dataReady={true}
        loading={false}
        onCreate={onCreate}
        onStatusChange={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("Ship release")).toBeInTheDocument();
    expect(screen.getByText("moonwitness")).toBeInTheDocument();
    expect(screen.getByText("Committed fix")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ALL TASKS/i }));
    expect(onNavigate).toHaveBeenCalledWith("pit");

    fireEvent.click(screen.getByRole("button", { name: /ADD TO THE PILE/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
