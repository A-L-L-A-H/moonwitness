import React, { useState, useRef, useEffect } from 'react';
import { useAiChat } from '../hooks/useAiChat.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Send,
  Wrench,
  Bot,
  User,
  RefreshCw,
  Terminal,
  XCircle,
} from 'lucide-react';

export interface ChatShellProps {
  initialAgentId?: string;
  projectId?: string;
  className?: string;
}

export function ChatShell({ initialAgentId = 'assistant', projectId, className = '' }: ChatShellProps) {
  const {
    messages,
    agents,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    loading,
    clearMessages,
    failedPrompt,
    retry,
    activeRun,
    cancelRun,
  } = useAiChat({ defaultAgentId: initialAgentId, projectId });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const prompt = input;
    setInput('');
    sendMessage(prompt);
  };

  const handleQuickChip = (promptText: string) => {
    sendMessage(promptText);
  };

  return (
    <div className={`flex flex-col h-[650px] bg-card border rounded-xl overflow-hidden shadow-sm ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none">Rocksoul AI Workspace</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Autonomous Multi-Agent Copilot</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Agent Selector */}
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger aria-label="Select AI agent" className="h-10 w-[180px] bg-background text-xs sm:h-8">
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>{agent.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase">
                      {agent.status === 'IMPLEMENTED' ? 'Active' : 'Foundation'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" aria-label="Clear chat" className="size-10 sm:size-9" onClick={clearMessages} title="Clear Chat">
            <RefreshCw className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="AI conversation" aria-live="polite" aria-relevant="additions" aria-busy={loading}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 bg-primary/5 rounded-full text-primary">
              <Bot className="size-8" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">How can I assist you today?</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Select an agent or ask about project metrics, tasks, code analysis, or server runtime information.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 text-xs sm:h-8"
                onClick={() => handleQuickChip('Check current system status and server time')}
              >
                ⚡ System Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 text-xs sm:h-8"
                onClick={() => handleQuickChip('Analyze active project tasks and summary')}
              >
                📋 Task Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 text-xs sm:h-8"
                onClick={() => handleQuickChip('Inspect codebase workspace and packages')}
              >
                💻 Code Workspace
              </Button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-4" aria-hidden="true" />
                </div>
              )}

              <div className={`flex flex-col max-w-[80%] space-y-2`}>
                {/* Parts rendering (Tool Calls, Status, Text) */}
                {msg.parts &&
                  msg.parts.map((part, pIdx) => {
                    if (part.type === 'tool_call') {
                      return (
                        <Card key={pIdx} className="bg-muted/40 border-muted">
                          <CardContent className="p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-mono">
                              <Wrench className="size-3.5 text-primary" aria-hidden="true" />
                              <span className="font-semibold">{part.tool}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                              {part.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    }

                    if (part.type === 'code') {
                      return (
                        <div key={pIdx} className="rounded-md bg-muted p-2.5 font-mono text-xs overflow-x-auto">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                            <Terminal className="size-3" aria-hidden="true" />
                            <span>{part.language}</span>
                          </div>
                          <pre>{part.code}</pre>
                        </div>
                      );
                    }

                    if (part.type === 'approval') {
                      return <Card key={pIdx} className="border-amber-500/40 bg-amber-500/5" role="status"><CardContent className="space-y-1 p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold">Approval: {part.tool}</span><Badge variant="outline">{part.status}</Badge></div><p className="text-muted-foreground">{part.reason}</p></CardContent></Card>;
                    }

                    if (part.type === 'artifact') {
                      return <Card key={pIdx} className="border-primary/30 bg-primary/5"><CardContent className="space-y-1 p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{part.title}</span><Badge variant="outline">{part.kind}</Badge></div><pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px]">{part.content}</pre></CardContent></Card>;
                    }

                    if (part.type === 'status') {
                      return <p key={pIdx} className="text-xs text-muted-foreground" role="status">{part.text}</p>;
                    }

                    return (
                      <div
                        key={pIdx}
                        className={`rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/60 text-foreground border'
                        }`}
                      >
                        {part.type === 'text' ? part.text : part.type === 'markdown' ? part.content : ''}
                      </div>
                    );
                  })}
              </div>

              {msg.role === 'user' && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <User className="size-4" aria-hidden="true" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground" role="status" aria-live="polite">
            <RefreshCw className="size-3.5 animate-spin text-primary" aria-hidden="true" />
            <span>AI Copilot is processing request...</span>
            {activeRun && (activeRun.status === 'pending' || activeRun.status === 'running') && (
              <Button type="button" size="sm" variant="outline" className="min-h-10 sm:h-8" onClick={() => void cancelRun()}>
                <XCircle className="mr-1 size-3.5" aria-hidden="true" /> Cancel
              </Button>
            )}
          </div>
        )}
        {failedPrompt && !loading && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            <span>AI execution failed. Retry the last prompt?</span>
            <Button type="button" size="sm" variant="outline" className="min-h-10 sm:h-8" onClick={retry}>Retry</Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-background flex items-center gap-2">
        <Input
          aria-label={`Message ${selectedAgent}`}
          placeholder={`Message ${selectedAgent}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 h-9 text-sm"
        />
        <Button type="submit" size="sm" aria-label="Send message" disabled={!input.trim() || loading} className="min-h-10 px-3.5 sm:h-9">
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
