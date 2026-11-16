import { useState, useCallback, useEffect, useRef } from 'react';
import { aiClient } from '../client.js';
import type { AiMessage, AiAgent, AiRun, MessagePart } from '../types.js';

export interface UseAiChatOptions {
  threadId?: string;
  defaultAgentId?: string;
  projectId?: string;
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>(options.defaultAgentId || 'assistant');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeRun, setActiveRun] = useState<AiRun | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const [threadId, setThreadId] = useState(options.threadId);
  const requestRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => () => { requestRef.current += 1; }, []);

  useEffect(() => {
    if (!threadId) return;
    void aiClient.getThreadMessages(threadId).then((history) => setMessages(history.messages.map((message) => ({ id: message.id ?? `${message.role}-${message.createdAt}`, role: message.role as 'user' | 'assistant', content: message.content, parts: [{ type: 'text', text: message.content }], createdAt: message.createdAt ?? new Date().toISOString() }))));
  }, [threadId]);

  useEffect(() => {
    if (threadId) return;
    void aiClient.listThreads<Array<{ id: string }>>().then((threads) => {
      if (threads[0]?.id) setThreadId(threads[0].id);
    }).catch(() => undefined);
  }, [threadId]);

  // Load available agents
  useEffect(() => {
    aiClient
      .listAgents()
      .then((data) => {
        setAgents(data);
        if (data.length > 0 && !options.defaultAgentId) {
          setSelectedAgent(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch AI agents:', err));
  }, [options.defaultAgentId]);

  const sendMessage = useCallback(
    async (prompt: string, extraContext: Record<string, unknown> = {}) => {
      if (!prompt.trim() || loadingRef.current) return;
      const requestId = ++requestRef.current;
      loadingRef.current = true;

      const userMsg: AiMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        parts: [{ type: 'text', text: prompt }],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setFailedPrompt(null);

      try {
        const run = await aiClient.startRun({
          prompt,
          threadId,
          agentId: selectedAgent,
          projectId: options.projectId,
          metadata: extraContext,
        });
        if (requestId !== requestRef.current) return;

        let currentRun = run;
        setActiveRun(currentRun);
        const returnedThreadId = typeof currentRun.metadata?.threadId === 'string' ? currentRun.metadata.threadId : undefined;
        if (returnedThreadId) setThreadId(returnedThreadId);

        let polls = 0;
        while ((currentRun.status === 'pending' || currentRun.status === 'running') && polls < 300) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (requestId !== requestRef.current) return;
          currentRun = await aiClient.getRun(run.runId);
          if (requestId !== requestRef.current) return;
          setActiveRun(currentRun);
          polls += 1;
        }
        if (currentRun.status === 'pending' || currentRun.status === 'running') throw new Error('AI request timed out');
        if (currentRun.status === 'cancelled') return;
        if (currentRun.status === 'failed') throw new Error(currentRun.error || 'Execution failed');

        // Convert run steps and output into message parts
        const parts: MessagePart[] = [];

        if (currentRun.steps && currentRun.steps.length > 0) {
          currentRun.steps.forEach((s) => {
            if (s.toolCalls) {
              s.toolCalls.forEach((tc) => {
                parts.push({
                  type: 'tool_call',
                  tool: tc.tool,
                  input: tc.input,
                  output: tc.output,
                  status: tc.status || 'success',
                });
              });
            }
          });
        }

        if (currentRun.output) {
          parts.push({ type: 'text', text: currentRun.output });
        }

        const assistantMsg: AiMessage = {
          id: currentRun.runId,
          role: 'assistant',
          content: currentRun.output || 'Response generated.',
          parts,
          createdAt: currentRun.completedAt || new Date().toISOString(),
          agentId: currentRun.agentId,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        if (requestId !== requestRef.current) return;
        setFailedPrompt(prompt);
        const errorMsg: AiMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'AI request failed. Retry the last prompt?',
          parts: [{ type: 'status', text: 'AI request failed. Retry the last prompt.' }],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        if (requestId === requestRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [threadId, options.projectId, selectedAgent]
  );

  const cancelRun = useCallback(async () => {
    if (!activeRun || (activeRun.status !== 'pending' && activeRun.status !== 'running')) return;
    requestRef.current += 1;
    await aiClient.cancelRun(activeRun.runId);
    loadingRef.current = false;
    setActiveRun((current) => current ? { ...current, status: 'cancelled', completedAt: new Date().toISOString() } : current);
    setLoading(false);
  }, [activeRun]);

  const retry = useCallback(() => {
    if (failedPrompt) void sendMessage(failedPrompt);
  }, [failedPrompt, sendMessage]);

  return {
    messages,
    agents,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    loading,
    activeRun,
    cancelRun,
    failedPrompt,
    retry,
    clearMessages: () => setMessages([]),
  };
}
