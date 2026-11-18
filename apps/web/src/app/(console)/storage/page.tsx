"use client";

import { useEffect, useState } from "react";
import { IndustrialBatteryArt, SkinOrnament , NativeSelect } from "@moonwitness/ui";
import { StorageBucket } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import {
  useCreateBucket,
  useDeleteBucket,
  useDeleteObject,
  useStorageBuckets,
  useStorageHealth,
  useStorageObjects,
  useUploadObject,
} from "@/lib/api/storage";

const CONTENT_TYPES = [
  "application/octet-stream",
  "text/plain",
  "text/markdown",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "application/pdf",
] as const;

const DEFAULT_CONTENT_TYPE: string = CONTENT_TYPES[0];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const unit = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(unit)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(unit, index)).toFixed(1))} ${units[index]}`;
}

function objectHref(bucket: string, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `/api/v1/storage/buckets/${encodeURIComponent(bucket)}/${encodedKey}`;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="border-2 border-[var(--yellow)]/50 bg-[var(--card)] p-4">
      <p className="text-sm text-[var(--foreground)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-11 text-xs text-[var(--primary)] underline"
      >
        Retry
      </button>
    </div>
  );
}

function CreateBucketForm({ onCreate }: { onCreate: ReturnType<typeof useCreateBucket> }) {
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !confirmed) return;
    void onCreate.mutateAsync(name.trim());
    setName("");
    setConfirmed(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-xs text-[var(--muted-foreground)]">
        New bucket name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={63}
          pattern="^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$"
          title="3-63 chars: lowercase letters, numbers, dots, hyphens."
          className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="accent-[var(--blue)]"
          disabled={onCreate.isPending}
        />
        Create this bucket
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!name.trim() || !confirmed || onCreate.isPending}
          className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {onCreate.isPending ? "Creating…" : "Create bucket"}
        </button>
        {onCreate.isError && (
          <span className="text-xs text-[var(--primary)]" role="alert">
            {(onCreate.error as Error).message}
          </span>
        )}
      </div>
    </form>
  );
}

function BucketList({
  buckets,
  selectedBucket,
  onSelect,
  deleteBucket,
  onCreate,
}: {
  buckets: { name: string; creationDate?: string }[];
  selectedBucket: string | null;
  onSelect: (bucket: string | null) => void;
  deleteBucket: ReturnType<typeof useDeleteBucket>;
  onCreate: ReturnType<typeof useCreateBucket>;
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {buckets.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 border-2 border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          <IndustrialBatteryArt className="h-20 w-20 opacity-85" decorative />
          <p>No buckets exist yet. Create the first bucket below.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-[var(--border)] bg-[var(--card)]">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead className="bg-[var(--background)] font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
              <tr>
                <th scope="col" className="p-3">
                  Bucket
                </th>
                <th scope="col" className="p-3">
                  Created
                </th>
                <th scope="col" className="p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--foreground)]">
              {buckets.map((bucket) => {
                const isSelected = selectedBucket === bucket.name;
                return (
                  <tr key={bucket.name} className={isSelected ? "bg-[var(--blue)]/10" : ""}>
                    <td className="p-3 font-mono">
                      <button
                        type="button"
                        onClick={() => onSelect(isSelected ? null : bucket.name)}
                        className="text-left w-full hover:text-[var(--primary)]"
                      >
                        {bucket.name}
                      </button>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {bucket.creationDate ? new Date(bucket.creationDate).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {pendingDelete === bucket.name ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void deleteBucket.mutateAsync(bucket.name);
                                setPendingDelete(null);
                              }}
                              disabled={deleteBucket.isPending}
                              className="min-h-9 px-3 text-xs text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)] disabled:opacity-50"
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(null)}
                              className="min-h-9 text-xs text-[var(--muted-foreground)] underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(bucket.name)}
                            disabled={deleteBucket.isPending}
                            className="min-h-9 text-xs text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {deleteBucket.isError && (
        <p className="text-xs text-[var(--primary)]" role="alert">
          {(deleteBucket.error as Error).message}
        </p>
      )}
      <CreateBucketForm onCreate={onCreate} />
    </div>
  );
}

function UploadObjectForm({ uploadObject }: { uploadObject: ReturnType<typeof useUploadObject> }) {
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState("");
  const [contentType, setContentType] = useState<string>(DEFAULT_CONTENT_TYPE);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !key.trim()) return;
    void uploadObject.mutateAsync({
      key: key.trim(),
      body: file,
      contentType,
    });
    setFile(null);
    setKey("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="block flex-1 text-xs text-[var(--muted-foreground)]">
        File
        <input
          type="file"
          onChange={(event) => {
            const chosen = event.target.files?.[0] ?? null;
            setFile(chosen);
            if (chosen && !key.trim()) setKey(chosen.name);
            if (chosen?.type) setContentType(chosen.type);
          }}
          className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
        />
      </label>
      <label className="block flex-1 text-xs text-[var(--muted-foreground)]">
        Object key
        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
          maxLength={1024}
          placeholder="path/to/object.bin"
          className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
        />
      </label>
      <label className="block text-xs text-[var(--muted-foreground)] sm:w-56">
        Content-Type
        <NativeSelect
          value={
            (CONTENT_TYPES as readonly string[]).includes(contentType)
              ? contentType
              : DEFAULT_CONTENT_TYPE
          }
          onChange={(event) => setContentType(event.target.value)}
          className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
        >
          {CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </NativeSelect>
      </label>
      <button
        type="submit"
        disabled={!file || !key.trim() || uploadObject.isPending}
        className="min-h-11 px-4 text-sm text-[var(--foreground)] bg-[var(--blue)] border-2 border-[var(--blue)] hover:bg-[var(--blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploadObject.isPending ? "Uploading…" : "Upload"}
      </button>
      {uploadObject.isError && (
        <span className="text-xs text-[var(--primary)]" role="alert">
          {(uploadObject.error as Error).message}
        </span>
      )}
    </form>
  );
}

function ObjectList({
  objects,
  bucket,
  deleteObject,
}: {
  objects: { key: string; etag: string; size: number; lastModified?: string }[];
  bucket: string;
  deleteObject: ReturnType<typeof useDeleteObject>;
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {objects.length === 0 ? (
        <p
          className="border-2 border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          No objects in this bucket. Upload the first object above.
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-[var(--border)] bg-[var(--card)]">
          <table className="w-full min-w-[48rem] text-left text-xs">
            <thead className="bg-[var(--background)] font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
              <tr>
                <th scope="col" className="p-3">
                  Key
                </th>
                <th scope="col" className="p-3">
                  Size
                </th>
                <th scope="col" className="p-3">
                  ETag
                </th>
                <th scope="col" className="p-3">
                  Last modified
                </th>
                <th scope="col" className="p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[var(--foreground)]">
              {objects.map((object) => (
                <tr key={object.key}>
                  <td className="max-w-xs truncate p-3 font-mono" title={object.key}>
                    {object.key}
                  </td>
                  <td className="whitespace-nowrap p-3">{formatBytes(object.size)}</td>
                  <td className="p-3 font-mono text-[var(--muted-foreground)]">
                    {object.etag.slice(0, 12)}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {object.lastModified ? new Date(object.lastModified).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={objectHref(bucket, object.key)}
                        className="min-h-9 px-3 py-2 text-xs text-[var(--primary)] border border-[var(--blue)] bg-transparent hover:bg-[var(--blue)]/10"
                      >
                        Download
                      </a>
                      {pendingDelete === object.key ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              void deleteObject.mutateAsync(object.key);
                              setPendingDelete(null);
                            }}
                            disabled={deleteObject.isPending}
                            className="min-h-9 px-3 py-2 text-xs text-[var(--foreground)] bg-[var(--yellow)]/20 border border-[var(--yellow)] disabled:opacity-50"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(null)}
                            className="min-h-9 text-xs text-[var(--muted-foreground)] underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(object.key)}
                          disabled={deleteObject.isPending}
                          className="min-h-9 text-xs text-[var(--primary)] border border-[var(--yellow)] bg-transparent hover:bg-[var(--yellow)]/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteObject.isError && (
        <p className="text-xs text-[var(--primary)]" role="alert">
          {(deleteObject.error as Error).message}
        </p>
      )}
    </div>
  );
}

function StorageBrowser() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const health = useStorageHealth();
  const buckets = useStorageBuckets();
  const objects = useStorageObjects(selectedBucket, prefix.trim() || undefined);
  const createBucket = useCreateBucket();
  const deleteBucket = useDeleteBucket();
  const uploadObject = useUploadObject(selectedBucket);
  const deleteObject = useDeleteObject(selectedBucket);

  useEffect(() => {
    if (health.data?.status === "ok") void buckets.refetch();
  }, [health.data?.status, buckets]);

  useEffect(() => {
    if (refreshVersion > 0 && selectedBucket) void objects.refetch();
  }, [refreshVersion, selectedBucket, objects]);

  useEffect(() => {
    if (!selectedBucket) return;
    if (deleteBucket.isSuccess) void buckets.refetch();
  }, [deleteBucket.isSuccess, buckets, selectedBucket]);

  useEffect(() => {
    if (createBucket.isSuccess) void buckets.refetch();
  }, [createBucket.isSuccess, buckets]);

  const refreshing =
    health.isFetching || buckets.isFetching || (selectedBucket ? objects.isFetching : false);

  return (
    <ConsoleShellAdapter
      plane="operations"
      breadcrumb="Storage Browser"
      search={{
        value: prefix,
        onChange: setPrefix,
        placeholder: selectedBucket ? "Filter objects by key prefix…" : "Search buckets…",
      }}
    >
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-8">
        <header className="border-b-2 border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <StorageBucket className="h-4 w-4 text-[var(--primary)]" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--primary)]">
              OPERATIONS / ADMIN
            </p>
            <SkinOrnament slot="tag" label="OBJECT STORE" />
          </div>
          <h1 className="mt-2 font-brush text-4xl text-[var(--foreground)]">STORAGE BROWSER</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            S3-compatible bucket and object management. Buckets and object mutations require the
            admin role; reads require any signed-in operator.
          </p>
        </header>

        {refreshing && (health.data || buckets.data || objects.data) && (
          <p role="status" className="text-xs text-[var(--muted-foreground)]">
            Refreshing storage data; previously loaded results remain visible.
          </p>
        )}

        <section
          aria-label="Storage service health"
          className="border-2 border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-brush text-xl text-[var(--foreground)]">SERVICE HEALTH</h2>
            <button
              type="button"
              onClick={() => {
                void health.refetch();
                void buckets.refetch();
                if (selectedBucket) void objects.refetch();
              }}
              className="min-h-11 text-xs text-[var(--primary)] underline"
            >
              Refresh storage
            </button>
          </div>
          {health.isLoading ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]" role="status">
              Checking storage service…
            </p>
          ) : health.isError ? (
            <div className="mt-3">
              <ErrorState
                message={(health.error as Error).message}
                onRetry={() => void health.refetch()}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--foreground)]">
              {health.data?.service ?? "Storage"} · {health.data?.status ?? "Status unavailable"}
              {health.data?.reachable === false ? " · Unreachable" : ""}
            </p>
          )}
        </section>

        <section aria-label="Buckets">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
              Buckets
            </h2>
            {buckets.data && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {buckets.data.length} total
              </span>
            )}
          </div>
          {buckets.isLoading ? (
            <p
              className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
              role="status"
            >
              Loading buckets…
            </p>
          ) : buckets.isError ? (
            <ErrorState
              message={(buckets.error as Error).message}
              onRetry={() => void buckets.refetch()}
            />
          ) : (
            <BucketList
              buckets={buckets.data ?? []}
              selectedBucket={selectedBucket}
              onSelect={setSelectedBucket}
              deleteBucket={deleteBucket}
              onCreate={createBucket}
            />
          )}
        </section>

        {selectedBucket && (
          <section aria-label={`Objects in ${selectedBucket}`} className="pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Objects in {selectedBucket}
              </h2>
              <div className="flex items-center gap-3">
                {objects.data && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {objects.data.length} listed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setRefreshVersion((version) => version + 1)}
                  className="min-h-11 text-xs text-[var(--primary)] underline"
                >
                  Refresh objects
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <UploadObjectForm uploadObject={uploadObject} />
              {objects.isLoading ? (
                <p
                  className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
                  role="status"
                >
                  Loading objects…
                </p>
              ) : objects.isError ? (
                <ErrorState
                  message={(objects.error as Error).message}
                  onRetry={() => void objects.refetch()}
                />
              ) : objects.isFetching && objects.data ? (
                <p className="text-xs text-[var(--muted-foreground)]" role="status">
                  Refreshing object list; previously loaded results remain visible.
                </p>
              ) : (
                <ObjectList
                  objects={objects.data ?? []}
                  bucket={selectedBucket}
                  deleteObject={deleteObject}
                />
              )}
            </div>
          </section>
        )}
      </main>
    </ConsoleShellAdapter>
  );
}

export default function StoragePage() {
  return <StorageBrowser />;
}
