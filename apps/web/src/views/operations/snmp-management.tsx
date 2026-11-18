"use client";

import { useState } from "react";
import {
  useCreateSnmpDevice,
  useCreateSnmpTarget,
  useDeleteSnmpDevice,
  useDeleteSnmpTarget,
  type SafeSnmpDevice,
} from "@/lib/api/snmp-poller";

function Labeled({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={
        wide
          ? "block text-xs text-[var(--muted-foreground)] sm:col-span-2"
          : "block text-xs text-[var(--muted-foreground)]"
      }
    >
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)] disabled:opacity-50";

function CreateDevicePanel({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("161");
  const [version, setVersion] = useState("2c");
  const [community, setCommunity] = useState("");
  const createDevice = useCreateSnmpDevice();

  const reset = () => {
    setName("");
    setHost("");
    setPort("161");
    setVersion("2c");
    setCommunity("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add device
      </button>
    );
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !host.trim()) return;
    const portNumber = Number(port);
    void createDevice.mutateAsync(
      {
        name: name.trim(),
        host: host.trim(),
        port: Number.isFinite(portNumber) && portNumber > 0 ? portNumber : 161,
        version: version.trim() || "2c",
        ...(community ? { community } : {}),
      },
      { onSuccess: reset },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Create SNMP device"
      className="space-y-3 border-2 border-[var(--blue)]/40 bg-[var(--card)] p-4"
    >
      <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
        New SNMP device
      </h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Labeled label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={createDevice.isPending}
            autoComplete="off"
          />
        </Labeled>
        <Labeled label="Host">
          <input
            className={inputClass}
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="192.0.2.10"
            required
            disabled={createDevice.isPending}
            autoComplete="off"
          />
        </Labeled>
        <Labeled label="Port">
          <input
            className={inputClass}
            value={port}
            onChange={(event) => setPort(event.target.value)}
            inputMode="numeric"
            disabled={createDevice.isPending}
          />
        </Labeled>
        <Labeled label="SNMP version">
          <input
            className={inputClass}
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            disabled={createDevice.isPending}
          />
        </Labeled>
        <Labeled label="Community (write-only, never shown back)" wide>
          <input
            className={inputClass}
            value={community}
            onChange={(event) => setCommunity(event.target.value)}
            type="password"
            disabled={createDevice.isPending}
            autoComplete="new-password"
          />
        </Labeled>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={createDevice.isPending || !name.trim() || !host.trim()}
          className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createDevice.isPending ? "Creating…" : "Create device"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
            createDevice.reset();
          }}
          disabled={createDevice.isPending}
          className="min-h-11 text-xs text-[var(--muted-foreground)] underline"
        >
          Cancel
        </button>
        {createDevice.isSuccess && (
          <span className="text-xs text-[var(--primary)]" role="status">
            Device created.
          </span>
        )}
        {createDevice.isError && (
          <span className="text-xs text-[var(--primary)]" role="alert">
            {(createDevice.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}

function CreateTargetForm({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [oid, setOid] = useState("");
  const [interval, setIntervalValue] = useState("");
  const createTarget = useCreateSnmpTarget(deviceId);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={createTarget.isPending}
        className="min-h-9 px-3 py-2 text-xs text-[var(--primary)] border border-[var(--blue)] bg-transparent hover:bg-[var(--blue)]/10 disabled:opacity-50"
      >
        Add target
      </button>
    );
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !oid.trim()) return;
    const intervalNumber = Number(interval);
    void createTarget.mutateAsync(
      {
        name: name.trim(),
        oid: oid.trim(),
        ...(interval.trim() && Number.isFinite(intervalNumber) && intervalNumber > 0
          ? { poll_interval: intervalNumber }
          : {}),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setOid("");
          setIntervalValue("");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Create target for ${deviceId}`}
      className="mt-3 space-y-3 border-2 border-[var(--border)] bg-[var(--muted)]/60 p-3"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Labeled label="Target name">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={createTarget.isPending}
          />
        </Labeled>
        <Labeled label="OID">
          <input
            className={inputClass}
            value={oid}
            onChange={(event) => setOid(event.target.value)}
            placeholder=".1.3.6.1.2.1.1.3.0"
            required
            disabled={createTarget.isPending}
          />
        </Labeled>
        <Labeled label="Poll interval (s, optional)">
          <input
            className={inputClass}
            value={interval}
            onChange={(event) => setIntervalValue(event.target.value)}
            inputMode="numeric"
            disabled={createTarget.isPending}
          />
        </Labeled>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={createTarget.isPending || !name.trim() || !oid.trim()}
          className="min-h-9 px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--blue)] border border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTarget.isPending ? "Creating…" : "Create target"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={createTarget.isPending}
          className="min-h-9 text-xs text-[var(--muted-foreground)] underline"
        >
          Cancel
        </button>
        {createTarget.isError && (
          <span className="text-xs text-[var(--primary)]" role="alert">
            {(createTarget.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}

function DeviceManagementActions({
  device,
  canWrite,
}: {
  device: SafeSnmpDevice;
  canWrite: boolean;
}) {
  const deleteDevice = useDeleteSnmpDevice();
  const [confirming, setConfirming] = useState(false);

  if (!canWrite) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            void deleteDevice.mutateAsync(device.id, { onSuccess: () => setConfirming(false) })
          }
          disabled={deleteDevice.isPending}
          className="min-h-9 px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)] disabled:opacity-50"
        >
          Confirm delete device
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleteDevice.isPending}
          className="min-h-9 text-xs text-[var(--muted-foreground)] underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={deleteDevice.isPending}
        className="min-h-9 text-xs text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10 disabled:opacity-50"
      >
        Delete
      </button>
      {deleteDevice.isError && (
        <span className="text-[10px] text-[var(--primary)]" role="alert">
          {(deleteDevice.error as Error).message}
        </span>
      )}
    </div>
  );
}

function TargetManagementActions({
  targetId,
  targetName,
  canWrite,
}: {
  targetId: string;
  targetName: string;
  canWrite: boolean;
}) {
  const deleteTarget = useDeleteSnmpTarget();
  const [confirming, setConfirming] = useState(false);

  if (!canWrite) return null;

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            void deleteTarget.mutateAsync(targetId, { onSuccess: () => setConfirming(false) })
          }
          disabled={deleteTarget.isPending}
          className="min-h-8 px-2 py-1 text-[11px] text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)] disabled:opacity-50"
        >
          Confirm delete {targetName}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleteTarget.isPending}
          className="text-[11px] text-[var(--muted-foreground)] underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={deleteTarget.isPending}
        className="min-h-8 text-[11px] text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10 disabled:opacity-50"
      >
        Delete
      </button>
      {deleteTarget.isError && (
        <span className="text-[10px] text-[var(--primary)]" role="alert">
          {(deleteTarget.error as Error).message}
        </span>
      )}
    </div>
  );
}

export function SnmpManagementHeader({ canWrite }: { canWrite: boolean }) {
  return <CreateDevicePanel disabled={!canWrite} />;
}

export { CreateTargetForm, DeviceManagementActions, TargetManagementActions };
