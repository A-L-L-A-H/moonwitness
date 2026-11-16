import { randomUUID } from 'node:crypto';
import type { ExecutionContext, RunResult } from '@rocksoul/ai-core';
import type { IAgent } from '@rocksoul/ai-core';

export interface WorkflowStep {
  id: string;
  name: string;
  agent: IAgent;
  transformPrompt?: (input: string, prevResult?: RunResult) => string;
}

export class Workflow {
  private steps: WorkflowStep[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string
  ) {}

  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }

  getSteps(): WorkflowStep[] {
    return [...this.steps];
  }

  async execute(initialPrompt: string, context: ExecutionContext): Promise<RunResult[]> {
    const results: RunResult[] = [];
    let currentInput = initialPrompt;

    for (const step of this.steps) {
      const prompt = step.transformPrompt
        ? step.transformPrompt(currentInput, results[results.length - 1])
        : currentInput;

      const run = await step.agent.generate({
        prompt,
        context,
      });

      results.push(run);
      if (run.output) {
        currentInput = run.output;
      }
    }

    return results;
  }
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  get(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  list(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}
