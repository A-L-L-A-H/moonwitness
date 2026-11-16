import { api } from '@/lib/api-client';
import type { AiAgent, AiRun } from './types.js';

export class FrontendAiClient {
  async listAgents(): Promise<AiAgent[]> {
    return await api.ai.getAgents<AiAgent[]>();
  }

  async sendChat(params: {
    prompt: string;
    threadId?: string;
    agentId?: string;
    projectId?: string;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AiRun> {
    return await api.ai.chat<AiRun>(params);
  }

  async getRun(runId: string): Promise<AiRun> {
    return await api.ai.getRun<AiRun>(runId);
  }

  async startRun(params: {
    prompt: string;
    threadId?: string;
    agentId?: string;
    projectId?: string;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AiRun> {
    return await api.ai.startRun<AiRun>(params);
  }

  async cancelRun(runId: string): Promise<{ runId: string; status: string }> {
    return await api.ai.cancelRun<{ runId: string; status: string }>(runId);
  }

  async getThreadMessages<T = { messages: Array<{ id?: string; role: string; content: string; createdAt?: string }> }>(threadId: string): Promise<T> {
    return await api.ai.getThreadMessages<T>(threadId);
  }

  async listThreads<T = Array<{ id: string; metadata: Record<string, unknown>; createdAt: string; updatedAt: string }>>(): Promise<T> {
    return await api.ai.listThreads<T>();
  }
}

export const aiClient = new FrontendAiClient();
