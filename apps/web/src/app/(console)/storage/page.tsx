"use client";

import { useEffect, useState } from "react";
import { Button, SkinOrnament } from "@moonwitness/ui";
import { StorageBucket } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import {
  BucketList,
  ObjectList,
  StorageErrorState,
  UploadObjectForm,
} from "@/components/storage/storage-panels";
import {
  useCreateBucket,
  useDeleteBucket,
  useDeleteObject,
  useStorageBuckets,
  useStorageHealth,
  useStorageObjects,
  useUploadObject,
} from "@/lib/api/storage";

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
            <Button
              type="button"
              variant="link"
              onClick={() => {
                void health.refetch();
                void buckets.refetch();
                if (selectedBucket) void objects.refetch();
              }}
              className="min-h-11 h-auto p-0 text-xs"
            >
              Refresh storage
            </Button>
          </div>
          {health.isLoading ? (
            <p className="mt-3 text-sm text-[var(--muted-foreground)]" role="status">
              Checking storage service…
            </p>
          ) : health.isError ? (
            <div className="mt-3">
              <StorageErrorState
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
            <StorageErrorState
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
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setRefreshVersion((version) => version + 1)}
                  className="min-h-11 h-auto p-0 text-xs"
                >
                  Refresh objects
                </Button>
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
                <StorageErrorState
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
