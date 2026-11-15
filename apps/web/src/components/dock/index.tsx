"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EraId, TimelineEvent } from "@moonwitness/types";
import { EmpireShell } from "../shell";
import { Star4 } from "@moonwitness/ui/icons";
import { EraBand } from "@moonwitness/ui";
import { DockHero } from "./hero";
import { FilterBar, type SortKey } from "./filter-bar";
import { EventList } from "./event-list";
import { EventDetailPanel } from "./event-detail-panel";
import {
  useTimelineEras,
  useTimelineEvent,
  useTimelineEvents,
  useTimelineRelatedEvents,
  useTimelineStats,
} from "@/lib/api/timeline";

const PAGE_SIZE = 12;
const EMPTY_EVENTS: TimelineEvent[] = [];
type DockSearchKey = "q" | "era" | "sort" | "page" | "event";

function readPage(rawPage: string | null): number {
  const page = Number(rawPage);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function Dock() {
  const params = useSearchParams();
  const router = useRouter();
  const paramsString = params.toString();
  const queryFromUrl = params.get("q") ?? "";
  const rawEra = params.get("era");
  const era = (rawEra ?? "all") as EraId | "all";
  const sort: SortKey = params.get("sort") === "oldest" ? "oldest" : "newest";
  const page = readPage(params.get("page"));
  const eventId = params.get("event") || null;
  const [queryInput, setQueryInput] = useState(queryFromUrl);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(eventId));
  const [isDesktopXl, setIsDesktopXl] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [origin, setOrigin] = useState("");

  const updateSearchParams = useCallback(
    (
      updates: Partial<Record<DockSearchKey, string | null>>,
      history: "push" | "replace" = "replace",
    ) => {
      const nextParams = new URLSearchParams(paramsString);
      for (const [key, value] of Object.entries(updates)) {
        if (value) nextParams.set(key, value);
        else nextParams.delete(key);
      }
      const query = nextParams.toString();
      const url = query ? `/dock?${query}` : "/dock";
      if (history === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [paramsString, router],
  );

  const eventsQuery = useTimelineEvents({
    era: rawEra ?? undefined,
    q: queryFromUrl || undefined,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const erasQuery = useTimelineEras();
  const statsQuery = useTimelineStats();
  const timelineEvents = eventsQuery.data?.data ?? EMPTY_EVENTS;
  const eras = erasQuery.data?.data ?? [];
  const selectedFromList = timelineEvents[0] ?? null;
  const selectedInList = eventId
    ? (timelineEvents.find((event) => event.id === eventId) ?? null)
    : null;
  const selectedDetailQuery = useTimelineEvent(eventId);
  const selected = eventId ? (selectedDetailQuery.data?.data ?? selectedInList) : selectedFromList;
  const relatedQuery = useTimelineRelatedEvents(selected?.related ?? []);
  const relatedEvents = relatedQuery.data ?? EMPTY_EVENTS;
  const selectedEra = selected
    ? (eras.find((availableEra) => availableEra.id === selected.era) ?? null)
    : null;
  const total = eventsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedListId = eventId ?? selectedFromList?.id ?? null;

  useEffect(() => {
    setQueryInput(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    setDrawerOpen(Boolean(eventId));
  }, [eventId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncViewport = () => setIsDesktopXl(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    const query = queryInput.trim();
    if (query === queryFromUrl) return;
    const timeout = window.setTimeout(
      () => updateSearchParams({ q: query || null, page: null }),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [queryFromUrl, queryInput, updateSearchParams]);

  useEffect(() => {
    if (eventsQuery.isSuccess && page > totalPages) {
      updateSearchParams({ page: totalPages > 1 ? String(totalPages) : null });
    }
  }, [eventsQuery.isSuccess, page, totalPages, updateSearchParams]);

  const shareUrl = useMemo(() => {
    if (!selected) return "";
    const shareParams = new URLSearchParams(paramsString);
    shareParams.set("event", selected.id);
    return `${origin}/dock?${shareParams.toString()}`;
  }, [origin, paramsString, selected]);

  function selectEvent(id: string) {
    updateSearchParams({ event: id }, "push");
    setDrawerOpen(true);
  }

  function resetFilters() {
    setQueryInput("");
    updateSearchParams({ q: null, era: null, sort: null, page: null, event: null });
    setDrawerOpen(false);
  }

  const retryAll = () => {
    void eventsQuery.refetch();
    void erasQuery.refetch();
    void statsQuery.refetch();
  };

  if (eventsQuery.isError || erasQuery.isError || statsQuery.isError) {
    return (
      <EmpireShell
        breadcrumb="Dock / Lighthouse"
        search={{
          value: queryInput,
          onChange: setQueryInput,
          placeholder: "Search timeline events…",
        }}
      >
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="font-brush text-xl text-[var(--pink)]">THE ARCHIVE SIGNAL WAS LOST…</p>
          <p className="text-sm text-zinc-400">
            We couldn&apos;t load the timeline. Check your connection and try again.
          </p>
          <button type="button" onClick={retryAll} className="btn-zine btn-blue px-5 py-2 text-sm">
            Retry
          </button>
        </div>
      </EmpireShell>
    );
  }

  if (eventsQuery.isLoading || erasQuery.isLoading || statsQuery.isLoading) {
    return (
      <EmpireShell
        breadcrumb="Dock / Lighthouse"
        search={{
          value: queryInput,
          onChange: setQueryInput,
          placeholder: "Search timeline events…",
        }}
      >
        <div
          className="flex h-[60vh] items-center justify-center font-brush text-xl text-[var(--pink)]"
          role="status"
          aria-live="polite"
        >
          LOADING THE DOCK…
        </div>
      </EmpireShell>
    );
  }

  const stats = statsQuery.data?.data;
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <EmpireShell
      breadcrumb="Dock / Lighthouse"
      search={{
        value: queryInput,
        onChange: setQueryInput,
        placeholder: "Search timeline events…",
      }}
    >
      <DockHero visibleCount={timelineEvents.length} total={total} />

      <div className="space-y-5 px-4 py-6 sm:px-8">
        <section
          aria-label="Timeline archive statistics"
          className="grid grid-cols-3 gap-3 text-center"
        >
          <div className="zine-card-rough p-3">
            <p className="font-brush text-2xl text-[var(--yellow)]">{stats?.total ?? "—"}</p>
            <p className="text-[10px] tracking-widest text-zinc-400">ARCHIVE EVENTS</p>
          </div>
          <div className="zine-card-rough p-3">
            <p className="font-brush text-2xl text-[var(--blue)]">{eras.length}</p>
            <p className="text-[10px] tracking-widest text-zinc-400">ERAS</p>
          </div>
          <div className="zine-card-rough p-3">
            <p className="font-brush text-2xl text-[var(--pink)]">
              {Object.keys(stats?.byKind ?? {}).length}
            </p>
            <p className="text-[10px] tracking-widest text-zinc-400">EVENT TYPES</p>
          </div>
        </section>

        <FilterBar
          eras={eras}
          era={era}
          onEraChange={(nextEra) =>
            updateSearchParams({
              era: nextEra === "all" ? null : nextEra,
              page: null,
            })
          }
          sort={sort}
          onSortChange={(nextSort) =>
            updateSearchParams({
              sort: nextSort === "newest" ? null : nextSort,
              page: null,
            })
          }
          view={view}
          onViewChange={setView}
        />

        <EraBand
          eras={eras}
          active={era}
          onSelect={(nextEra) =>
            updateSearchParams({
              era: nextEra === "all" ? null : nextEra,
              page: null,
            })
          }
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <EventList
              events={timelineEvents}
              total={total}
              pageStart={pageStart}
              pageEnd={pageEnd}
              page={page}
              totalPages={totalPages}
              view={view}
              selectedId={selectedListId}
              query={queryFromUrl}
              onOpen={selectEvent}
              onReset={resetFilters}
              onPageChange={(nextPage) =>
                updateSearchParams({
                  page: nextPage > 1 ? String(nextPage) : null,
                  event: null,
                })
              }
            />
            {eventId && !selected && selectedDetailQuery.isError && (
              <p className="mt-4 text-sm text-[var(--yellow)]" role="alert">
                The selected event could not be loaded from the archive.
              </p>
            )}
          </div>

          {selected && selectedEra ? (
            <EventDetailPanel
              variant="aside"
              event={selected}
              era={selectedEra}
              relatedEvents={relatedEvents}
              shareUrl={shareUrl}
              onRelated={selectEvent}
            />
          ) : eventId && selectedDetailQuery.isLoading ? (
            <p className="p-5 text-sm text-zinc-400" role="status">
              Loading event details…
            </p>
          ) : null}
        </div>
      </div>

      {!isDesktopXl && drawerOpen && selected && selectedEra && (
        <EventDetailPanel
          variant="drawer"
          event={selected}
          era={selectedEra}
          relatedEvents={relatedEvents}
          shareUrl={shareUrl}
          onRelated={selectEvent}
          onClose={() => {
            setDrawerOpen(false);
            updateSearchParams({ event: null });
          }}
        />
      )}

      <Star4 className="pointer-events-none fixed bottom-24 right-6 hidden h-6 w-6 text-[var(--yellow)] opacity-50 xl:block" />
    </EmpireShell>
  );
}
