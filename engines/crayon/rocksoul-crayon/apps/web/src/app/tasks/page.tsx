import { WorkflowPage } from '@/workflow-runtime'

export default function TaskPage() {
  return <WorkflowPage adapter={{ model: 'tasks', titleField: 'title', statusField: 'status' }} />
}
