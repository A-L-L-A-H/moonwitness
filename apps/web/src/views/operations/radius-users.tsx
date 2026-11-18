"use client";

import { useMemo, useState } from "react";
import {
  useCreateRadiusUser,
  useDeleteRadiusUser,
  useRadiusUsers,
  useUpdateRadiusUser,
  type RadiusUser,
} from "@/lib/api/radius";

const EMPTY_PROFILE = {
  framed_ip: "",
  vlan_id: "",
  session_timeout: "",
  mac_address: "",
};

type ProfileDraft = typeof EMPTY_PROFILE;

function toDraft(user: RadiusUser): ProfileDraft {
  return {
    framed_ip: user.framed_ip ?? "",
    vlan_id: user.vlan_id === null || user.vlan_id === undefined ? "" : String(user.vlan_id),
    session_timeout:
      user.session_timeout === null || user.session_timeout === undefined
        ? ""
        : String(user.session_timeout),
    mac_address: user.mac_address ?? "",
  };
}

function buildProfile(draft: ProfileDraft) {
  return {
    framed_ip: draft.framed_ip.trim() ? draft.framed_ip.trim() : null,
    vlan_id: draft.vlan_id.trim() ? Number(draft.vlan_id) : null,
    session_timeout: draft.session_timeout.trim() ? Number(draft.session_timeout) : null,
    mac_address: draft.mac_address.trim() ? draft.mac_address.trim() : null,
  };
}

function RadiusFormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-xs text-[var(--muted-foreground)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)] disabled:opacity-50"
      />
    </label>
  );
}

function ProfileFields({
  draft,
  onChange,
  disabled,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <RadiusFormField
        label="Framed IP"
        value={draft.framed_ip}
        onChange={(framed_ip) => onChange({ ...draft, framed_ip })}
        placeholder="192.0.2.50"
        disabled={disabled}
      />
      <RadiusFormField
        label="VLAN ID"
        value={draft.vlan_id}
        onChange={(vlan_id) => onChange({ ...draft, vlan_id })}
        placeholder="120"
        disabled={disabled}
      />
      <RadiusFormField
        label="Session timeout (s)"
        value={draft.session_timeout}
        onChange={(session_timeout) => onChange({ ...draft, session_timeout })}
        placeholder="3600"
        disabled={disabled}
      />
      <RadiusFormField
        label="MAC address"
        value={draft.mac_address}
        onChange={(mac_address) => onChange({ ...draft, mac_address })}
        placeholder="00:11:22:33:44:55"
        disabled={disabled}
      />
    </div>
  );
}

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add user
      </button>
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
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          disabled={createUser.isPending}
          className="accent-[var(--blue)]"
        />
        Enabled
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={createUser.isPending || !username.trim() || !password}
          className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createUser.isPending ? "Creating…" : "Create user"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
            createUser.reset();
          }}
          disabled={createUser.isPending}
          className="min-h-11 text-xs text-[var(--muted-foreground)] underline"
        >
          Cancel
        </button>
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

function UserRow({ user, onDeleted }: { user: RadiusUser; onDeleted: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(user));
  const [enabled, setEnabled] = useState(user.enabled);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateUser = useUpdateRadiusUser();
  const deleteUser = useDeleteRadiusUser();

  const startEditing = () => {
    setDraft(toDraft(user));
    setEnabled(user.enabled);
    setPassword("");
    setEditing(true);
    updateUser.reset();
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const profile = buildProfile(draft);
    void updateUser.mutateAsync(
      {
        username: user.username,
        enabled,
        ...profile,
        ...(password ? { password } : {}),
      },
      {
        onSuccess: () => {
          setEditing(false);
          setPassword("");
        },
      },
    );
  };

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--foreground)]">{user.username}</p>
          <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
            {user.enabled ? "enabled" : "disabled"}
            {user.framed_ip ? ` · framed ${user.framed_ip}` : ""}
            {user.vlan_id === null || user.vlan_id === undefined ? "" : ` · vlan ${user.vlan_id}`}
            {user.session_timeout === null || user.session_timeout === undefined
              ? ""
              : ` · timeout ${user.session_timeout}s`}
            {user.mac_address ? ` · mac ${user.mac_address}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? null : (
            <button
              type="button"
              onClick={startEditing}
              className="min-h-9 px-3 py-2 text-xs text-[var(--primary)] border border-[var(--blue)] bg-transparent hover:bg-[var(--blue)]/10"
            >
              Edit
            </button>
          )}
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() =>
                  void deleteUser.mutateAsync(user.username, {
                    onSuccess: () => onDeleted(`Deleted ${user.username}.`),
                  })
                }
                disabled={deleteUser.isPending}
                className="min-h-9 px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)] disabled:opacity-50"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteUser.isPending}
                className="min-h-9 text-xs text-[var(--muted-foreground)] underline"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteUser.isPending}
              className="min-h-9 text-xs text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          aria-label={`Edit ${user.username}`}
          className="space-y-3 border-2 border-[var(--border)] bg-[var(--muted)]/60 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <RadiusFormField
              label="New password (leave blank to keep current)"
              value={password}
              onChange={setPassword}
              type="password"
              disabled={updateUser.isPending}
              autoComplete="new-password"
            />
            <label className="flex items-end gap-2 pb-2 text-xs text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                disabled={updateUser.isPending}
                className="accent-[var(--blue)]"
              />
              Enabled
            </label>
          </div>
          <ProfileFields draft={draft} onChange={setDraft} disabled={updateUser.isPending} />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateUser.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setPassword("");
                updateUser.reset();
              }}
              disabled={updateUser.isPending}
              className="min-h-11 text-xs text-[var(--muted-foreground)] underline"
            >
              Cancel
            </button>
            {updateUser.isSuccess && (
              <span className="text-xs text-[var(--primary)]" role="status">
                Saved.
              </span>
            )}
            {updateUser.isError && (
              <span className="text-xs text-[var(--primary)]" role="alert">
                {(updateUser.error as Error).message}
              </span>
            )}
          </div>
        </form>
      )}
      {deleteUser.isError && (
        <p className="text-xs text-[var(--primary)]" role="alert">
          {(deleteUser.error as Error).message}
        </p>
      )}
    </li>
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
            <input
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
          <button
            type="button"
            onClick={() => void users.refetch()}
            className="mt-2 min-h-11 text-xs text-[var(--primary)] underline"
          >
            Retry users
          </button>
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
              <UserRow key={user.id || user.username} user={user} onDeleted={setNotice} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
