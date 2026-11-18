"use client";

import { useMemo, useState } from "react";
import { Button, Checkbox, Input } from "@moonwitness/ui";
import { useCreateRadiusUser, useRadiusUsers } from "@/lib/api/radius";
import {
  buildProfile,
  EMPTY_PROFILE,
  ProfileFields,
  RadiusFormField,
  RadiusUserRow,
  type ProfileDraft,
} from "./radius-user-row";

function CreateUserPanel({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_PROFILE);
  const createUser = useCreateRadiusUser();

  const reset = () => {
    setUsername("");
    setPassword("");
    setEnabled(true);
    setDraft(EMPTY_PROFILE);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;
    void createUser.mutateAsync(
      { username: username.trim(), password, enabled, ...buildProfile(draft) },
      { onSuccess: reset },
    );
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="min-h-11 px-4 text-sm text-[var(--accent-foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        Add user
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Create RADIUS user"
      className="space-y-3 border-2 border-[var(--blue)]/40 bg-[var(--card)] p-4"
    >
      <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
        New RADIUS user
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <RadiusFormField
          label="Username"
          value={username}
          onChange={setUsername}
          required
          disabled={createUser.isPending}
          autoComplete="off"
        />
        <RadiusFormField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          required
          disabled={createUser.isPending}
          autoComplete="new-password"
        />
      </div>
      <ProfileFields draft={draft} onChange={setDraft} disabled={createUser.isPending} />
      <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
          disabled={createUser.isPending}
        />
        Enabled
      </label>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="outline"
          disabled={createUser.isPending || !username.trim() || !password}
          className="min-h-11 px-4 text-sm text-[var(--accent-foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] hover:bg-[var(--accent)]/90"
        >
          {createUser.isPending ? "Creating…" : "Create user"}
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setOpen(false);
            reset();
            createUser.reset();
          }}
          disabled={createUser.isPending}
          className="min-h-11 h-auto p-0 text-xs text-[var(--muted-foreground)]"
        >
          Cancel
        </Button>
        {createUser.isSuccess && (
          <span className="text-xs text-[var(--primary)]" role="status">
            User created.
          </span>
        )}
        {createUser.isError && (
          <span className="text-xs text-[var(--primary)]" role="alert">
            {(createUser.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}

export function RadiusUserManagement({ canWrite }: { canWrite: boolean }) {
  const users = useRadiusUsers();
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const entries = users.data ?? [];
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return entries;
    return entries.filter((user) => user.username.toLocaleLowerCase().includes(needle));
  }, [users.data, query]);

  return (
    <section aria-label="RADIUS users" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
          Users
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[var(--muted-foreground)]">
            <span className="sr-only">Filter users</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter users…"
              className="min-h-10 w-48 border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
            />
          </label>
          {users.data && (
            <span className="text-xs text-[var(--muted-foreground)]">{visible.length} shown</span>
          )}
        </div>
      </div>

      {!canWrite && (
        <p
          className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          Your role cannot manage RADIUS users. Ask an administrator for write access.
        </p>
      )}

      {notice && (
        <p className="text-xs text-[var(--primary)]" role="status">
          {notice}
        </p>
      )}

      {canWrite && <CreateUserPanel disabled={users.isLoading} />}

      {users.isLoading ? (
        <p
          className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          Loading users…
        </p>
      ) : users.isError ? (
        <div role="alert" className="border-2 border-[var(--yellow)]/50 bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--foreground)]">{(users.error as Error).message}</p>
          <Button
            type="button"
            variant="link"
            onClick={() => void users.refetch()}
            className="mt-2 min-h-11 h-auto p-0 text-xs"
          >
            Retry users
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p
          className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          {users.data?.length ? "No users match this filter." : "No RADIUS users are configured."}
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-[var(--border)] bg-[var(--card)] px-4">
          <ul className="divide-y divide-[var(--line)]">
            {visible.map((user) => (
              <RadiusUserRow key={user.id || user.username} user={user} onDeleted={setNotice} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
