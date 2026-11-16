import { BaseLayout } from '@/components/layouts/base-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingSettings() {
  return <BaseLayout title="Plans & Billing" description="Billing integration status."><div className="px-4 lg:px-6"><Card><CardHeader><CardTitle>Billing unavailable</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No authoritative subscription, invoice, or plan-mutation API is registered for this application. No demo billing state is shown.</CardContent></Card></div></BaseLayout>;
}
