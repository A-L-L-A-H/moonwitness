"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, X, UserPlus } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ConversationList } from "./conversation-list"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { useChat, type Conversation, type Message, type User } from "@/app/chat/use-chat"
import { app } from "@/lib/app-client"
import { apiErrorMessage } from "@/lib/api-error-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatProps {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  users: User[]
  canSend?: boolean
  onNewConversation?: () => void
}

export function Chat({
  conversations,
  messages,
  users,
  canSend = false,
  onNewConversation,
}: ChatProps) {
  const {
    selectedConversation,
    messages: liveMessages,
    setSelectedConversation,
    setConversations,
    setMessages,
    setUsers,
    addMessage,
    toggleMute,
  } = useChat()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const closeSidebarButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarWasOpen = useRef(false)
  const [sendError, setSendError] = useState<string>()
  const [failedContent, setFailedContent] = useState<string>()
  const [sending, setSending] = useState(false)
  const [retryQueue, setRetryQueue] = useState<Array<{ conversationId: string; content: string; idempotencyKey: string }>>(() => { if (typeof window === 'undefined') return []; try { const stored = JSON.parse(localStorage.getItem('rocksoul:chat:retry-queue') ?? '[]') as Array<{ conversationId?: unknown; content?: unknown; idempotencyKey?: unknown }>; return stored.filter(item => typeof item.conversationId === 'string' && typeof item.content === 'string' && typeof item.idempotencyKey === 'string') as Array<{ conversationId: string; content: string; idempotencyKey: string }> } catch { return [] } })
  const sendingRef = useRef(false)
  useEffect(() => { localStorage.setItem('rocksoul:chat:retry-queue', JSON.stringify(retryQueue)) }, [retryQueue])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isSidebarOpen) closeSidebarButtonRef.current?.focus()
    else if (sidebarWasOpen.current) mobileMenuButtonRef.current?.focus()
    sidebarWasOpen.current = isSidebarOpen
  }, [isSidebarOpen])

  useEffect(() => {
    if (!isSidebarOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  // Initialize data
  useEffect(() => {
    setConversations(conversations)
    setUsers(users)
    
    // Set messages for all conversations
    Object.entries(messages).forEach(([conversationId, conversationMessages]) => {
      setMessages(conversationId, conversationMessages)
    })

    // Auto-select first conversation if none selected
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].id)
    }
  }, [conversations, messages, users, selectedConversation, setConversations, setMessages, setUsers, setSelectedConversation])

  const currentConversation = conversations.find(conv => conv.id === selectedConversation)
  const currentMessages = selectedConversation ? liveMessages[selectedConversation] || [] : []

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation || !canSend || sendingRef.current) return
    const existingQueued = retryQueue.find(item => item.conversationId === selectedConversation && item.content === content)
    const idempotencyKey = existingQueued?.idempotencyKey ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sendingRef.current = true
    setSendError(undefined)
    setFailedContent(undefined)
    setSending(true)
    try {
      const execution = await app.chat.send({
        conversationId: selectedConversation,
        content,
        type: 'text',
      }, { idempotencyKey })
      const created = await execution.result() as Record<string, unknown>
      addMessage(selectedConversation, {
        id: String(created.id),
        content: String(created.content ?? content),
        timestamp: String(created.createdAt ?? new Date().toISOString()),
        senderId: String(created.senderId ?? 'current-user'),
        type: 'text',
        isEdited: Boolean(created.isEdited),
        reactions: [],
        replyTo: created.replyToId ? String(created.replyToId) : null,
      })
      setRetryQueue(current => current.filter(item => item.idempotencyKey !== idempotencyKey))
    } catch (error) {
      setSendError(apiErrorMessage(error))
      setFailedContent(content)
      setRetryQueue(current => current.some(item => item.idempotencyKey === idempotencyKey) ? current : [...current, { conversationId: selectedConversation, content, idempotencyKey }])
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }, [addMessage, canSend, retryQueue, selectedConversation])

  useEffect(() => {
    const retryQueued = () => {
      if (!navigator.onLine || sending || !selectedConversation) return
      const queued = retryQueue.find(item => item.conversationId === selectedConversation)
      if (queued) void handleSendMessage(queued.content)
    }
    window.addEventListener('online', retryQueued)
    return () => window.removeEventListener('online', retryQueued)
  }, [handleSendMessage, retryQueue, selectedConversation, sending])

  const handleToggleMute = () => {
    if (selectedConversation) {
      toggleMute(selectedConversation)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full min-h-[600px] max-h-[calc(100vh-200px)] flex rounded-lg border overflow-hidden bg-background">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close conversations"
            className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Conversations Sidebar - Responsive */}
        <div
          role={isSidebarOpen ? 'dialog' : undefined}
          aria-modal={isSidebarOpen ? true : undefined}
          aria-label={isSidebarOpen ? 'Conversations' : undefined}
          className={`
          w-full max-w-sm border-r bg-background flex-shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:relative lg:block
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
        `}>
          {/* Sidebar Header with Close Button (Mobile Only) */}
          <div className="lg:hidden p-4 border-b flex items-center justify-between bg-background">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              ref={closeSidebarButtonRef}
              variant="ghost"
              size="sm"
              type="button"
              aria-label="Close conversations"
              onClick={() => setIsSidebarOpen(false)}
              className="size-10 cursor-pointer sm:size-9"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={(id) => {
              setSelectedConversation(id)
              setIsSidebarOpen(false) // Close sidebar on mobile after selection
            }}
            onNewConversation={onNewConversation}
          />
        </div>

        {/* Chat Panel - Flexible Width */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Chat Header with Hamburger Menu */}
          <div className="flex items-center h-16 px-4 border-b bg-background">
            {/* Hamburger Menu Button - Only visible when sidebar is hidden on mobile */}
            <div className="flex items-center gap-1 lg:hidden mr-2">
              <Button ref={mobileMenuButtonRef} variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="size-10 cursor-pointer sm:size-9" aria-label="Open conversations">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-10 cursor-pointer sm:size-9" aria-label="Chat actions"><UserPlus className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem className="min-h-10 cursor-pointer" disabled={!onNewConversation} onClick={onNewConversation}><UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />{onNewConversation ? 'New Chat' : 'New Chat unavailable'}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                users={users}
                onToggleMute={handleToggleMute}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <MessageList
                  messages={currentMessages}
                  users={users}
                />
                
                {/* Message Input */}
                {(sendError || retryQueue.some(item => item.conversationId === selectedConversation)) && <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm text-destructive" role="alert"><p>{sendError ?? `${retryQueue.filter(item => item.conversationId === selectedConversation).length} message(s) waiting to retry.`}</p>{failedContent && <Button variant="outline" size="sm" onClick={() => void handleSendMessage(failedContent)} disabled={sending}>Retry</Button>}</div>}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!canSend || sending}
                  placeholder={canSend ? (sending ? "Sending..." : `Message ${currentConversation?.name || ""}...`) : "Messaging is not enabled for this account"}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Welcome to Chat</h3>
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
