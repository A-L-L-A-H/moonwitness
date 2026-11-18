"use client";

import { useState } from "react";
import { Button, Checkbox, Input } from "@moonwitness/ui";
import { useDeleteRadiusUser, useUpdateRadiusUser, type RadiusUser } from "@/lib/api/radius";

export const EMPTY_PROFILE = {
  framed_ip: "",
  vlan_id: "",
  session_timeout: "",
  mac_address: "",
};

export type ProfileDraft = typeof EMPTY_PROFILE;

export function toDraft(user: RadiusUser): ProfileDraft {
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

export function buildProfile(draft: ProfileDraft) {
  return {
    framed_ip: draft.framed_ip.trim() ? draft.framed_ip.trim() : null,
    vlan_id: draft.vlan_id.trim() ? Number(draft.vlan_id) : null,
    session_timeout: draft.session_timeout.trim() ? Number(draft.session_timeout) : null,
    mac_address: draft.mac_address.trim() ? draft.mac_address.trim() : null,
  };
}

export function RadiusFormField({
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
      <Input
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

export function ProfileFields({
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

export function RadiusUserRow({
  user,
  onDeleted,
}: {
  user: RadiusUser;
  onDeleted: (message: string) => void;
}) {
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startEditing}
              className="min-h-9 px-3 py-2 text-xs text-[var(--primary)] border border-[var(--blue)] bg-transparent hover:bg-[var(--blue)]/10"
            >
              Edit
            </Button>
          )}
          {confirmDelete ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void deleteUser.mutateAsync(user.username, {
                    onSuccess: () => onDeleted(`Deleted ${user.username}.`),
                  })
                }
                disabled={deleteUser.isPending}
                className="min-h-9 px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)]"
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteUser.isPending}
                className="min-h-9 h-auto p-0 text-xs text-[var(--muted-foreground)]"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteUser.isPending}
              className="min-h-9 text-xs text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10"
            >
              Delete
            </Button>
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
              <Checkbox
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked === true)}
                disabled={updateUser.isPending}
              />
              Enabled
            </label>
          </div>
          <ProfileFields draft={draft} onChange={setDraft} disabled={updateUser.isPending} />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="outline"
              disabled={updateUser.isPending}
              className="min-h-11 px-4 text-sm text-[var(--accent-foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] hover:bg-[var(--accent)]/90"
            >
              {updateUser.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setEditing(false);
                setPassword("");
                updateUser.reset();
              }}
              disabled={updateUser.isPending}
              className="min-h-11 h-auto p-0 text-xs text-[var(--muted-foreground)]"
            >
              Cancel
            </Button>
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
