import * as React from "react";
import {
  api,
  type EventNode,
  type GenealogyRelation,
  type JsonObject,
  type ProphetListItem,
  type ProvenanceClaim,
} from "./lib/api";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { TabsList, TabsTrigger } from "./components/ui/tabs";
import { Table, TBody, Td, Th, THead, Tr } from "./components/ui/table";
import { Loading, ErrorState } from "./components/loading";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ProfileView } from "./components/ProfileView";
import { MuhammadProfileView } from "./components/MuhammadProfileView";
import { useI18n } from "./i18n";
import { title } from "./lib/utils";

type View = "profile" | "provenance" | "timeline" | "leaderboards" | "corpus" | "docs";

const VIEWS: Array<{ id: View; label: string }> = [
  { id: "profile", label: "profile" },
  { id: "provenance", label: "provenance" },
  { id: "timeline", label: "timeline" },
  { id: "leaderboards", label: "leaderboards" },
  { id: "corpus", label: "corpus" },
  { id: "docs", label: "docs" },
];

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: React.DependencyList = []): AsyncState<T> {
  const [state, setState] = React.useState<AsyncState<T>>({ data: null, error: null, loading: true });

  React.useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: null, loading: true });
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ data: null, error: String(error), loading: false });
      });
    return () => controller.abort();
    // Loader intentionally captures values represented by deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export default function App() {
  const { t } = useI18n();
  const [view, setView] = React.useState<View>(() => {
    const hash = location.hash.replace("#", "") as View;
    return VIEWS.some((item) => item.id === hash) ? hash : "profile";
  });
  const [selected, setSelected] = React.useState("muhammad");
  const [query, setQuery] = React.useState("");

  const health = useAsync((signal) => api.health(signal), []);
  const prophets = useAsync((signal) => api.prophets(signal), []);
  const prophet = useAsync((signal) => api.prophet(selected, signal), [selected]);

  const changeView = (next: View) => {
    setView(next);
    history.replaceState(null, "", `#${next}`);
  };

  const list = (prophets.data ?? []).filter((item) =>
    `${item.display_name} ${item.quranic_name} ${item.rid_root}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <div className="eyebrow">{t("app.eyebrow")}</div>
            <div className="truncate text-lg font-semibold">{t("app.title")}</div>
          </div>
          <Badge className="hidden sm:inline-flex">v2.3.2</Badge>
          <Badge className="hidden md:inline-flex">SQLite</Badge>
          <Badge
            className={
              health.error
                ? "border-red-500/40 text-red-300"
                : health.data?.ok
                  ? "border-emerald-500/40 text-emerald-300"
                  : "border-amber-500/40 text-amber-300"
            }
          >
            {health.error ? t("app.health.offline") : health.data?.ok ? t("app.health.online") : t("app.health.loading")}
          </Badge>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="space-y-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("sidebar.cardTitle")}</CardTitle>
              <CardDescription>{t("sidebar.cardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={query} onChange={(event: { target: { value: string } }) => setQuery(event.target.value)} placeholder={t("sidebar.searchPlaceholder")} aria-label="Search prophets" />
              {prophets.error ? <ErrorState message={prophets.error} /> : null}
              {prophets.loading ? <Loading label={t("sidebar.loadingProfiles")} /> : null}
              {!prophets.loading && !prophets.error ? (
                <div className="grid gap-1">
                  {list.map((item: ProphetListItem) => (
                    <Button
                      key={item.id}
                      variant={selected === item.id ? "secondary" : "ghost"}
                      className="h-auto justify-start py-2 text-left"
                      aria-pressed={selected === item.id}
                      onClick={() => setSelected(item.id)}
                    >
                      <span>
                        <span className="block font-medium">{item.display_name}</span>
                        <span className="block text-xs text-muted-foreground">{item.rid_root}</span>
                      </span>
                    </Button>
                  ))}
                  {list.length === 0 ? <div className="p-3 text-sm text-muted-foreground">{t("sidebar.noMatch")}</div> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="min-w-max">
              {VIEWS.map((item) => (
                <TabsTrigger
                  key={item.id}
                  id={`tab-${item.id}`}
                  aria-controls={`panel-${item.id}`}
                  active={view === item.id}
                  onClick={() => changeView(item.id)}
                >
                  {t(`views.${item.id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {view === "profile" ? (
            <ViewPanel view="profile">
              {prophet.error ? <ErrorState message={prophet.error} /> : null}
              {prophet.loading ? <Loading label={t("profile.loading")} /> : null}
              {prophet.data ? (selected === "muhammad" ? <MuhammadProfileView profile={prophet.data} /> : <ProfileView prophet={prophet.data} />) : null}
            </ViewPanel>
          ) : null}
          {view === "provenance" ? (
            <ViewPanel view="provenance"><ProvenanceView selected={selected} /></ViewPanel>
          ) : null}
          {view === "timeline" ? (
            <ViewPanel view="timeline"><TimelineView selected={selected} /></ViewPanel>
          ) : null}
          {view === "leaderboards" ? (
            <ViewPanel view="leaderboards"><LeaderboardView /></ViewPanel>
          ) : null}
          {view === "corpus" ? (
            <ViewPanel view="corpus"><CorpusView /></ViewPanel>
          ) : null}
          {view === "docs" ? (
            <ViewPanel view="docs"><DocsView /></ViewPanel>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function ViewPanel({ view, children }: { view: View; children: React.ReactNode }) {
  return <section id={`panel-${view}`} role="tabpanel" aria-labelledby={`tab-${view}`}>{children}</section>;
}

function ProvenanceView({ selected }: { selected: string }) {
  const { t } = useI18n();
  const result = useAsync((signal) => api.prophetProvenance(selected, signal), [selected]);
  if (result.error) return <ErrorState message={result.error} />;
  if (result.loading || !result.data) return <Loading label={t("provenance.loading")} />;
  const claims = result.data.claims ?? [];
  return (
    <Card>
      <CardHeader><CardTitle>{t("provenance.title")}</CardTitle><CardDescription>{t("provenance.description", { count: claims.length })}</CardDescription></CardHeader>
      <CardContent>
        {claims.length === 0 ? <div className="text-sm text-muted-foreground">{t("provenance.empty")}</div> : (
          <Table>
            <THead><Tr><Th>{t("provenance.table.category")}</Th><Th>{t("provenance.table.statement")}</Th><Th>{t("provenance.table.evidence")}</Th><Th>{t("provenance.table.confidence")}</Th></Tr></THead>
            <TBody>{claims.map((claim: ProvenanceClaim) => <Tr key={claim.id}><Td><Badge>{claim.category}</Badge></Td><Td className="max-w-xl">{claim.statement}</Td><Td>{claim.refs.map((ref) => <div key={`${ref.source_id}:${ref.ref}`} className="text-xs">{ref.source_id.toUpperCase()} · {ref.ref} · {ref.evidence}</div>)}</Td><Td>{Math.round(Number(claim.confidence ?? 0) * 100)}%</Td></Tr>)}</TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineView({ selected }: { selected: string }) {
  const { t } = useI18n();
  const timeline = useAsync((signal) => api.prophetTimeline(selected, signal), [selected]);
  const relations = useAsync((signal) => api.prophetRelations(selected, signal), [selected]);
  const events = useAsync((signal) => api.prophetEvents(selected, signal), [selected]);
  const error = timeline.error ?? relations.error ?? events.error;
  if (error) return <ErrorState message={error} />;
  if (timeline.loading || relations.loading || events.loading || !timeline.data || !relations.data || !events.data) return <Loading label={t("timeline.loading")} />;

  const era = isRecord(timeline.data.era) ? timeline.data.era : timeline.data;
  const rel = relations.data.relations ?? [];
  const ev = events.data.events ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{t("timeline.era.title")}</CardTitle><CardDescription>{t("timeline.era.description")}</CardDescription></CardHeader>
        <CardContent><div className="metric">{String(era.era ?? "UNKNOWN")}</div><div className="mt-2 text-sm text-muted-foreground">{t("timeline.era.confidence", { pct: Math.round(Number(era.confidence ?? 0) * 100) })}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("timeline.relations.title")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rel.length ? rel.map((item: GenealogyRelation) => <div key={item.id} className="rounded-lg border p-3"><div className="flex gap-2"><Badge>{item.kind}</Badge><Badge>{item.confidence}</Badge></div><div className="mt-2 text-sm">{item.from} → {item.to}</div><div className="mt-1 text-xs text-muted-foreground">{item.refs.join(" · ")}</div></div>) : <div className="text-sm text-muted-foreground">{t("timeline.relations.empty")}</div>}
        </CardContent>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>{t("timeline.events.title")}</CardTitle><CardDescription>{t("timeline.events.description", { count: ev.length })}</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ev.map((item: EventNode) => <div key={item.id} className="rounded-lg border p-3"><div className="eyebrow">{item.slot ?? "event"}</div><div className="mt-2 text-sm font-medium">{item.summary ?? item.id}</div><div className="mt-2 text-xs text-muted-foreground">{item.refs.join(" · ")}</div></div>)}</CardContent>
      </Card>
    </div>
  );
}

function LeaderboardView() {
  const { t } = useI18n();
  const result = useAsync((signal) => api.leaderboards(signal), []);
  if (result.error) return <ErrorState message={result.error} />;
  if (result.loading || !result.data) return <Loading label={t("leaderboards.loading")} />;
  const sections = Object.entries(result.data).filter(([, value]) => Array.isArray(value));
  const preference=isRecord(result.data.human_preference)?result.data.human_preference:{};
  const composite=isRecord(result.data.composite)?result.data.composite:{};
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-2">{sections.map(([name, rawRows]) => {
    const rows = rawRows as JsonObject[];
    return <Card key={name}><CardHeader><CardTitle>{title(name)}</CardTitle><CardDescription>{t("leaderboards.meaning")}</CardDescription></CardHeader><CardContent><Table><THead><Tr><Th>{t("leaderboards.table.rank")}</Th><Th>{t("leaderboards.table.prophet")}</Th><Th>{t("leaderboards.table.score")}</Th><Th>{t("leaderboards.table.band")}</Th></Tr></THead><TBody>{rows.slice(0, 10).map((row, index) => {const score=typeof row.score==="number"?row.score:typeof row.context_score==="number"?row.context_score:null;return <Tr key={`${name}-${String(row.prophet_id ?? index)}`}><Td>{String(row.rank ?? index + 1)}</Td><Td>{String(row.prophet_name ?? row.display_name ?? row.prophet_id ?? "—")}</Td><Td className="font-semibold">{score===null?"—":score.toFixed(2)}</Td><Td><Badge>{String(row.band ?? row.metric ?? "—")}</Badge></Td></Tr>;})}</TBody></Table></CardContent></Card>;
  })}</div><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>{t("leaderboards.humanPreference")}</CardTitle><CardDescription>{String(preference.status??"UNAVAILABLE")}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">{String(preference.note??"Requires external observations before calibration.")}</CardContent></Card><Card><CardHeader><CardTitle>{t("leaderboards.composite")}</CardTitle><CardDescription>{t("leaderboards.compositeDesc")}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Composite remains disabled until preference calibration is independently supported.</CardContent></Card></div></div>;
}

function CorpusView() {
  const { t } = useI18n();
  const result = useAsync((signal) => api.corpus(signal), []);
  if (result.error) return <ErrorState message={result.error} />;
  if (result.loading || !result.data) return <Loading label={t("corpus.loading")} />;
  const sources = Array.isArray(result.data.sources) ? result.data.sources.filter(isRecord) : [];
  return <div className="grid gap-4 md:grid-cols-2">{sources.map((source) => <Card key={String(source.id)}><CardHeader><div className="flex items-center justify-between"><div className="eyebrow">{t("corpus.priority", { priority: String(source.priority) })}</div><Badge>{String(source.role ?? "—")}</Badge></div><CardTitle className="text-2xl">{String(source.book ?? "—")}</CardTitle><CardDescription>{String(source.working_witness ?? "Primary Qur'anic corpus")}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div><span className="text-muted-foreground">{t("corpus.reference")}</span> {String(source.reference_scheme ?? "—")}</div><div><span className="text-muted-foreground">{t("corpus.policy")}</span> {String(source.text_policy ?? "—")}</div><div className="rounded-lg border p-3 text-muted-foreground">{String(source.claim_guardrail ?? "—")}</div></CardContent></Card>)}</div>;
}

function DocsView() {
  const { t } = useI18n();
  const result = useAsync((signal) => api.docs(signal), []);
  if (result.error) return <ErrorState message={result.error} />;
  if (result.loading || !result.data) return <Loading label={t("docs.loading")} />;
  const documents = Array.isArray(result.data.documents) ? result.data.documents.filter(isRecord) : [];
  const grouped = documents.reduce<Record<string, JsonObject[]>>((acc, document) => {
    const category = String(document.category ?? "other");
    (acc[category] ??= []).push(document);
    return acc;
  }, {});
  return <div className="space-y-4"><Card><CardHeader><CardTitle>{t("docs.title")}</CardTitle><CardDescription>{t("docs.status", { status: String(result.data.status ?? "—"), version: String(result.data.version ?? "—") })}</CardDescription></CardHeader></Card>{Object.entries(grouped).map(([category, items]) => <Card key={category}><CardHeader><CardTitle>{title(category)}</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{items.map((document) => <div key={String(document.id)} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><div className="font-medium">{String(document.title ?? "—")}</div><Badge>{String(document.status ?? "—")}</Badge></div><div className="mono mt-2 break-all text-xs text-muted-foreground">{String(document.path ?? "—")}</div></div>)}</CardContent></Card>)}</div>;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
