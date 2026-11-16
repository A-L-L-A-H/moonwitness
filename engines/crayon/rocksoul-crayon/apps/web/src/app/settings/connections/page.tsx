import { BaseLayout } from '@/components/layouts/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConnectionSettings() {
  return <BaseLayout title="Connections" description="External integration status."><div className="px-4 lg:px-6"><Card><CardHeader><CardTitle>Connections unavailable</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No authoritative OAuth, webhook, or external-connection API is registered for this application. Connection toggles and credentials are not fabricated.</CardContent></Card></div></BaseLayout>;
}
