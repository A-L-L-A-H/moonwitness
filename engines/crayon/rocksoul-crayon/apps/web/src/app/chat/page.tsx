import { useEffect, useRef, useState } from "react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Chat } from "./components/chat"
import { type Conversation, type Message, type User } from "./use-chat"
import { app } from "@/lib/app-client"
import { apiErrorMessage } from "@/lib/api-error-state"

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState<string>()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    const loadData = async () => {
      try {
        // Attempt live fetch from Fastify backend API
        const liveConvs = await app.resources.for('chat_conversations').list({ limit: 50 })
        if (liveConvs && liveConvs.items && liveConvs.items.length > 0) {
          const mappedConvs: Conversation[] = liveConvs.items.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            name: String(c.name || 'Chat Channel'),
            type: (c.type === 'group' ? 'group' : 'direct') as 'group' | 'direct',
            avatar: String(c.avatar || ''),
            lastMessage: {
              id: `msg-${c.id}`,
              content: String(c.lastMessageContent || 'No messages yet'),
              timestamp: String(c.lastMessageTime || c.updatedAt || new Date().toISOString()),
              senderId: String(c.createdBy || 'system'),
            },
            unreadCount: Number(c.unreadCount || 0),
            participants: [],
            isPinned: Boolean(c.isPinned),
            isMuted: Boolean(c.isMuted),
          }))
          setConversations(mappedConvs)
          const messageResult = await app.resources.for('chat_messages').list({ limit: 500 })
          const grouped = Object.fromEntries(mappedConvs.map(conversation => [conversation.id, [] as Message[]]))
          messageResult.items.forEach((message: Record<string, unknown>) => {
            const conversationId = String(message.conversationId ?? '')
            if (!grouped[conversationId]) return
            grouped[conversationId].push({
              id: String(message.id),
              content: String(message.content ?? ''),
              timestamp: String(message.createdAt ?? new Date().toISOString()),
              senderId: String(message.senderId ?? 'system'),
              type: (message.type === 'image' || message.type === 'file' ? message.type : 'text') as Message['type'],
              isEdited: Boolean(message.isEdited),
              reactions: [],
              replyTo: message.replyToId ? String(message.replyToId) : null,
            })
          })
          setMessages(grouped)
        } else {
          setConversations([])
          setUnavailable(undefined)
        }
        setUsers([])
      } catch (error) {
        loadedRef.current = false
        setConversations([])
        setMessages({})
        setUsers([])
        setUnavailable(apiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const createConversation = async () => {
    try {
      const created = await app.resources.for('chat_conversations').create({ name: 'New conversation', type: 'direct' })
      setConversations(current => [...current, { id: String(created.id), name: String(created.name ?? 'New conversation'), type: 'direct', avatar: '', lastMessage: { id: `msg-${created.id}`, content: 'No messages yet', timestamp: String(created.createdAt ?? new Date().toISOString()), senderId: 'current-user' }, unreadCount: 0, participants: [], isPinned: false, isMuted: false }])
    } catch (error) { setUnavailable(apiErrorMessage(error)) }
  }

  if (loading) {
    return (
      <BaseLayout title="Chat" description="Team communication and messaging">
        <div className="flex items-center justify-center h-96" role="status" aria-live="polite">
          <div className="text-muted-foreground">Loading chat...</div>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout title="Chat" description="Team communication and messaging">
      <div className="px-4 md:px-6">{unavailable && conversations.length === 0 ? <div role="alert" className="grid min-h-80 place-items-center rounded-lg border border-dashed text-center"><div><p className="font-medium">Chat unavailable</p><p className="mt-1 text-sm text-muted-foreground">{unavailable}</p></div></div> : <Chat conversations={conversations} messages={messages} users={users} canSend onNewConversation={() => void createConversation()} />}</div>
    </BaseLayout>
  )
}
