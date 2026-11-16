import { BaseLayout } from '@/components/layouts/base-layout';
import { BrowserWorkspace } from '@/features/ai';

export default function AiBrowserPage() {
  return (
    <BaseLayout
      title="Browser Automation Agent"
      description="Autonomous web exploration, snapshot extraction, and page research."
    >
      <div className="px-4 md:px-6 py-2">
        <BrowserWorkspace />
      </div>
    </BaseLayout>
  );
}
