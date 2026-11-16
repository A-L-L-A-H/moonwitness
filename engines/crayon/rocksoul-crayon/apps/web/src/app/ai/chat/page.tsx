import { BaseLayout } from '@/components/layouts/base-layout';
import { ChatShell } from '@/features/ai';

export default function AiChatPage() {
  return (
    <BaseLayout
      title="AI Copilot & Multi-Agent Workspace"
      description="Autonomous assistance powered by the Rocksoul AI Runtime."
    >
      <div className="px-4 md:px-6 py-2">
        <ChatShell />
      </div>
    </BaseLayout>
  );
}
