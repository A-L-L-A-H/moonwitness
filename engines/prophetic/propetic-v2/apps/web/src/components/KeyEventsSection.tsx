import { useI18n } from "../i18n";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function KeyEventsSection({ events }: { events: Array<Record<string, unknown>> }) {
  const { t } = useI18n();
  if (!events || events.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>{t("profile.keyEvents")}</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {events.map((ev: Record<string, unknown>, idx: number) => (
          <div key={idx} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{String(ev.event ?? "—")}</div>
              <Badge>{String(ev.evidence ?? "—")}</Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {Array.isArray(ev.refs) ? (ev.refs as string[]).map((r: string) => `QS ${r}`).join(" · ") : "—"}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
