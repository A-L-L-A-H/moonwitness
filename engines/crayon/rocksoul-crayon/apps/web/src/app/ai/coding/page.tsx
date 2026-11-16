import { BaseLayout } from '@/components/layouts/base-layout';
import { CodingWorkspace } from '@/features/ai';

export default function AiCodingPage() {
  return (
    <BaseLayout
      title="Codex Coding Workspace"
      description="Interactive repository explorer, code analysis, diff viewer, and coding copilot."
    >
      <div className="px-4 md:px-6 py-2">
        <CodingWorkspace />
      </div>
    </BaseLayout>
  );
}
