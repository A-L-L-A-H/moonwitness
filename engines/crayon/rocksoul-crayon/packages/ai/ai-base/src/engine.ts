import { AiStorage, MemoryService } from '@rocksoul/ai-memory';
import { ModelRegistry } from '@rocksoul/ai-models';
import {
  ToolRegistry,
  systemInfoTool,
  timeNowTool,
  calculatorTool,
} from '@rocksoul/ai-tools';
import {
  AssistantAgent,
  CoderAgent,
  ResearcherAgent,
  BrowserAgent,
  SupervisorAgent,
} from '@rocksoul/ai-agents';
import { Orchestrator } from '@rocksoul/ai-orchestrator';
import { WorkflowEngine } from '@rocksoul/ai-workflows';
import { TelemetryCollector, DefaultLogger, type ILogger } from '@rocksoul/ai-observability';
import type {
  ExecutionContext,
  RunResult,
  AgentDefinition,
  AgentRunOptions,
} from '@rocksoul/ai-core';

export interface AiEngineConfig {
  storageUrl?: string;
  logger?: ILogger;
}

export class AiEngine {
  public readonly storage: AiStorage;
  public readonly models: ModelRegistry;
  public readonly memory: MemoryService;
  public readonly tools: ToolRegistry;
  public readonly orchestrator: Orchestrator;
  public readonly workflows: WorkflowEngine;
  public readonly telemetry: TelemetryCollector;
  public readonly logger: ILogger;

  // Primary agents
  public readonly assistant: AssistantAgent;
  public readonly coder: CoderAgent;
  public readonly researcher: ResearcherAgent;
  public readonly browser: BrowserAgent;
  public readonly supervisor: SupervisorAgent;

  private isInitialized = false;

  constructor(config: AiEngineConfig = {}) {
    this.logger = config.logger || new DefaultLogger('[Rocksoul-AI]');
    this.telemetry = new TelemetryCollector(this.logger);

    // 1. Storage & Memory (isolated from business chat data)
    this.storage = new AiStorage({ url: config.storageUrl || process.env.AI_STORAGE_URL });
    this.memory = new MemoryService(this.storage);
    this.models = ModelRegistry.fromEnvironment();

    // 2. Tools
    this.tools = new ToolRegistry();
    this.tools.register(systemInfoTool);
    this.tools.register(timeNowTool);
    this.tools.register(calculatorTool);

    // 3. Agents
    this.assistant = new AssistantAgent(this.models, this.memory, this.tools);
    this.coder = new CoderAgent(this.models);
    this.researcher = new ResearcherAgent(this.models);
    this.browser = new BrowserAgent(this.models);
    this.supervisor = new SupervisorAgent(this.models);

    // 4. Orchestration & Workflows
    this.orchestrator = new Orchestrator();
    this.orchestrator.registerAgent(this.assistant);
    this.orchestrator.registerAgent(this.coder);
    this.orchestrator.registerAgent(this.researcher);
    this.orchestrator.registerAgent(this.browser);
    this.orchestrator.registerAgent(this.supervisor);

    this.workflows = new WorkflowEngine();
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.logger.info('Initializing Rocksoul AI Runtime storage...');
    await this.storage.init();
    this.isInitialized = true;
    this.logger.info('Rocksoul AI Runtime initialized successfully.');
  }

  // Public API Facade
  getAgents(): AgentDefinition[] {
    return this.orchestrator.listAgents().map((a) => a.definition);
  }

  async chat(options: {
    prompt: string;
    context: ExecutionContext;
    threadId?: string;
    agentId?: string;
  }): Promise<RunResult> {
    await this.init();

    this.telemetry.recordAgentStart(
      options.threadId || 'transient',
      options.agentId || 'orchestrator',
      options.context,
      options.prompt
    );

    const run = await this.orchestrator.routeAndExecute({
      prompt: options.prompt,
      context: options.context,
      threadId: options.threadId,
      targetAgentId: options.agentId,
    });

    this.telemetry.recordAgentComplete(
      run.runId,
      run.agentId,
      options.context,
      run
    );

    return run;
  }

  stream(options: { prompt: string; context: ExecutionContext; threadId?: string; agentId?: string }): AsyncIterable<string> {
    const agentId = options.agentId || this.orchestrator.classifyIntent(options.prompt);
    const agent = this.orchestrator.getAgent(agentId) || this.orchestrator.getAgent('assistant');
    if (!agent?.stream) throw new Error('AI_STREAM_UNAVAILABLE');
    return agent.stream({ prompt: options.prompt, context: options.context, threadId: options.threadId });
  }

  start(options: { prompt: string; context: ExecutionContext; threadId?: string; agentId?: string }): RunResult {
    const run = this.orchestrator.startAndExecute({ prompt: options.prompt, context: options.context, threadId: options.threadId, targetAgentId: options.agentId });
    return run;
  }

  getRun(runId: string): RunResult | undefined {
    return this.orchestrator.getRun(runId);
  }

  cancelRun(runId: string): boolean {
    return this.orchestrator.cancelRun(runId);
  }
}

// Centralized Singleton
let globalAiEngineInstance: AiEngine | null = null;

export function getAiEngine(config?: AiEngineConfig): AiEngine {
  if (!globalAiEngineInstance) {
    globalAiEngineInstance = new AiEngine(config);
  }
  return globalAiEngineInstance;
}

export const ai = getAiEngine();
