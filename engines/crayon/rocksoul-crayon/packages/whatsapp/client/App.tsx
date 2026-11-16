import React, { useState, useEffect, useRef } from 'react';
import type {
  SessionItem,
  ChatItem,
  ContactItem,
  MessageItem,
  StatusItem,
  ProfileInfo,
  ChatMeta,
  PresenceInfo,
  AutoReplyItem,
  QuickReplyItem,
  ScheduledMessageItem,
} from './types.js';
import { SidebarHeader } from './components/SidebarHeader.js';
import { StatusTab } from './components/StatusTab.js';
import { ChatList } from './components/ChatList.js';
import { ChatWindow } from './components/ChatWindow.js';
import { Modals } from './components/Modals.js';
import { MediaLightbox } from './components/MediaLightbox.js';
import { GroupInfoDrawer } from './components/GroupInfoDrawer.js';
import { Search } from 'lucide-react';

const POPULAR_EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍',
  '🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴',
  '😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓',
  '👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','🤙','💪','❤️',
  '🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖',
  '🔥','✨','🎉','🎊','🚀','⭐','💡','📌','🎯','💯','✅','⚠️','❌','☕','🍕'
];

export function App() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<string>('');
  const [activeSessionStatus, setActiveSessionStatus] = useState<string>('idle');
  const [activeSessionUser, setActiveSessionUser] = useState<string>('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'channels' | 'contacts' | 'status'>('chats');
  const [activeJid, setActiveJid] = useState<string | null>(null);
  const [activeContactName, setActiveContactName] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadFilter, setUnreadFilter] = useState(false);

  // Phase 2 Metadata & Presence states
  const [chatMetas, setChatMetas] = useState<Record<string, ChatMeta>>({});
  const [presences, setPresences] = useState<Record<string, PresenceInfo>>({});
  const [showArchived, setShowArchived] = useState(false);

  // Phase 2 Interactive & Lightbox states
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: string;
    senderName?: string;
    timestamp?: number;
  } | null>(null);
  const [groupDrawerJid, setGroupDrawerJid] = useState<string | null>(null);

  // Phase 2 Modals states
  const [showPollModal, setShowPollModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<MessageItem | null>(null);
  const [labelModalJid, setLabelModalJid] = useState<string | null>(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  // Phase 2 Enterprise Entities states
  const [autoReplies, setAutoReplies] = useState<AutoReplyItem[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageItem[]>([]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status/Story states
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [showNewStatusModal, setShowNewStatusModal] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusImgUrl, setNewStatusImgUrl] = useState('');
  const [viewingStatus, setViewingStatus] = useState<StatusItem | null>(null);

  // Profile modal & states
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editProfilePhotoUrl, setEditProfilePhotoUrl] = useState('');
  const [editProfileStatus, setEditProfileStatus] = useState('');
  const [editProfileName, setEditProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Popups & modals
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [attachType, setAttachType] = useState<'image' | 'document'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);

  // Group modal & states
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupParticipants, setNewGroupParticipants] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Cursor pagination states
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Audio Context for sound chimes
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Sound Chime for Incoming Messages
  const playIncomingSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // ignore
    }
  };

  // Sound Pop for Outgoing Messages
  const playOutgoingSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  };

  // Fetch / refresh sessions list
  const loadSessions = async () => {
    try {
      const res = await fetch('/sessions');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setSessions(json.data);
        if (!activeSession) {
          setActiveSession(json.data[0].sessionId);
        }
        const active = json.data.find((s: SessionItem) => s.sessionId === (activeSession || json.data[0].sessionId));
        if (active) {
          setActiveSessionStatus(active.status);
          setActiveSessionUser(active.status === 'open' ? active.sessionId : '');
        }
      } else {
        setSessions([{ sessionId: 'default', status: 'idle' }]);
        if (!activeSession) setActiveSession('default');
      }
    } catch {
      setSessions([{ sessionId: 'default', status: 'idle' }]);
      if (!activeSession) setActiveSession('default');
    }
  };

  // Load chat metas
  const loadChatMetas = async (sessId: string) => {
    if (!sessId) return;
    try {
      const res = await fetch(`/api/sessions/${sessId}/chats-meta`);
      const json = await res.json();
      if (json.success && json.data) {
        setChatMetas(json.data);
      }
    } catch (err) {
      console.error('Failed to load chat metas:', err);
    }
  };

  // Load Enterprise Gateway data
  const loadEnterpriseData = async () => {
    try {
      const [arRes, qrRes, smRes] = await Promise.all([
        fetch('/api/whatsapp/auto-replies'),
        fetch('/api/whatsapp/quick-replies'),
        fetch('/api/whatsapp/scheduled-messages'),
      ]);
      const [ar, qr, sm] = await Promise.all([
        arRes.json(),
        qrRes.json(),
        smRes.json(),
      ]);
      if (ar.data) setAutoReplies(ar.data);
      if (qr.data) setQuickReplies(qr.data);
      if (sm.data) setScheduledMessages(sm.data);
    } catch (err) {
      console.error('Failed to load enterprise data:', err);
    }
  };

  // Initial loads
  useEffect(() => {
    void loadSessions();
    void loadEnterpriseData();
  }, []);

  // Periodic refresh
  useEffect(() => {
    const timer = setInterval(() => {
      void loadSessions();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSession]);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        if (type === 'new_message') {
          const { sessionId, message } = payload;
          if (sessionId === activeSession) {
            if (!message.fromMe) {
              playIncomingSound();
            }
            if (activeJid && message.remoteJid === activeJid) {
              setMessages((prev) => [...prev, message]);
            }
            void loadChats(activeSession);
          }
        } else if (type === 'presence' || type === 'presence_update') {
          const { jid, presence, lastSeen } = payload || {};
          if (jid) {
            setPresences((prev) => ({
              ...prev,
              [jid]: { jid, presence, lastSeen },
            }));
          }
        } else if (type === 'chat_meta_updated') {
          const { remoteJid, meta } = payload || {};
          if (remoteJid && meta) {
            setChatMetas((prev) => ({
              ...prev,
              [remoteJid]: meta,
            }));
          }
        } else if (type === 'chats_updated' || type === 'connection_update' || type === 'session_ready') {
          if (!payload || payload.sessionId === activeSession) {
            void loadChats(activeSession);
            void loadContacts(activeSession);
            void loadSessions();
          }
        } else if (type === 'contacts_updated') {
          if (!payload || payload.sessionId === activeSession) {
            void loadContacts(activeSession);
            void loadChats(activeSession);
          }
        } else if (type === 'status_update') {
          if (!payload || payload.sessionId === activeSession) {
            void loadStatusUpdates(activeSession);
          }
        } else if (type === 'reaction_updated') {
          const { sessionId, messageId, emoji } = payload || {};
          if (sessionId === activeSession) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === messageId) {
                  let arr: string[] = [];
                  try {
                    if (m.reactions) arr = JSON.parse(m.reactions);
                  } catch {
                    arr = [];
                  }
                  if (emoji && !arr.includes(emoji)) arr.push(emoji);
                  return { ...m, reactions: JSON.stringify(arr) };
                }
                return m;
              })
            );
          }
        } else if (type === 'message_deleted') {
          const { sessionId, messageId } = payload || {};
          if (sessionId === activeSession) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId ? { ...m, text: '🚫 Pesan ini telah dihapus', mediaUrl: undefined, mediaType: undefined } : m
              )
            );
          }
        } else if (type === 'session_disconnected') {
          void loadSessions();
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeSession, activeJid]);

  // Load chats on session change
  const loadChats = async (sessId: string) => {
    if (!sessId) return;
    try {
      const res = await fetch(`/api/sessions/${sessId}/chats`);
      const json = await res.json();
      if (json.success) {
        setChats(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  // Load contacts for session
  const loadContacts = async (sessId: string) => {
    if (!sessId) return;
    try {
      const res = await fetch(`/api/sessions/${sessId}/contacts`);
      const json = await res.json();
      if (json.success) {
        setContacts(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  // Load status/stories updates for session
  const loadStatusUpdates = async (sessId: string) => {
    if (!sessId) return;
    try {
      const res = await fetch(`/api/sessions/${sessId}/status-updates`);
      const json = await res.json();
      if (json.success) {
        setStatusList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load status updates:', err);
    }
  };

  // Load profile info
  const loadProfile = async (sessId: string) => {
    if (!sessId) return;
    try {
      const res = await fetch(`/api/sessions/${sessId}/profile`);
      const json = await res.json();
      if (json.success && json.data) {
        setProfileInfo(json.data);
        setEditProfileName(json.data.name || '');
        setEditProfileStatus(json.data.statusText || '');
        setEditProfilePhotoUrl(json.data.imgUrl || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (activeSession) {
      void loadChats(activeSession);
      void loadContacts(activeSession);
      void loadStatusUpdates(activeSession);
      void loadProfile(activeSession);
      void loadChatMetas(activeSession);

      const active = sessions.find((s) => s.sessionId === activeSession);
      if (active) {
        setActiveSessionStatus(active.status);
        setActiveSessionUser(active.status === 'open' ? activeSession : '');
      }
    }
  }, [activeSession]);

  useEffect(() => {
    if (activeTab === 'status' && activeSession) {
      void loadStatusUpdates(activeSession);
    }
  }, [activeTab]);

  // Load messages when selecting chat
  const handleSelectChat = async (jid: string, name: string) => {
    setActiveJid(jid);
    setActiveContactName(name || jid.split('@')[0]);
    setReplyingTo(null);

    // Read receipt
    try {
      void fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(jid)}/read`, { method: 'POST' });
    } catch {}

    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(jid)}/messages?limit=50`);
      const json = await res.json();
      if (json.success) {
        const msgs = json.data || [];
        setMessages(msgs);
        setHasMoreMessages(msgs.length >= 50);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Load older messages
  const handleLoadMoreMessages = async () => {
    if (!activeSession || !activeJid || messages.length === 0 || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const oldestTimestamp = messages[0]?.timestamp;
      const res = await fetch(
        `/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/messages?limit=50&before=${oldestTimestamp}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length === 0) {
          setHasMoreMessages(false);
        } else {
          setMessages((prev) => [...json.data, ...prev]);
          setHasMoreMessages(json.data.length >= 50);
        }
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (!isLoadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMore]);

  // Send text message
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeSession || !activeJid) return;

    setInputText('');
    const currentReply = replyingTo;
    setReplyingTo(null);

    const optimisticMsg: MessageItem = {
      sessionId: activeSession,
      remoteJid: activeJid,
      senderNumber: activeSession,
      fromMe: true,
      text,
      quotedId: currentReply?.id,
      quotedText: currentReply?.text,
      quotedSender: currentReply?.senderName || (currentReply?.fromMe ? 'Saya' : currentReply?.senderNumber),
      timestamp: Math.floor(Date.now() / 1000),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    playOutgoingSound();

    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          name: activeContactName,
          quotedMessageId: currentReply?.id,
          quotedText: currentReply?.text,
          quotedSender: currentReply?.senderName || (currentReply?.fromMe ? 'Saya' : currentReply?.senderNumber),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Gagal mengirim pesan:', data.error);
      }
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
    }
  };

  // Direct File Upload
  const handleDirectFileUpload = async (file: File) => {
    if (!file || !activeSession || !activeJid) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        playOutgoingSound();
      } else {
        alert(data.error || 'Gagal mengunggah berkas');
      }
    } catch (err) {
      alert('Gagal mengunggah berkas: ' + (err as Error).message);
    }
  };

  // Send Reaction
  const handleSendReaction = async (messageId: string, emoji: string) => {
    if (!messageId || !activeSession || !activeJid) return;
    try {
      await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/messages/${encodeURIComponent(messageId)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch (err) {
      console.error('Gagal mengirim reaksi:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId || !activeSession || !activeJid) return;
    if (!confirm('Tarik / hapus pesan ini untuk semua orang?')) return;
    try {
      await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Gagal menghapus pesan:', err);
    }
  };

  // Star / Unstar message
  const handleToggleStar = async (messageId: string, currentStarred: boolean) => {
    if (!activeSession || !activeJid || !messageId) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/messages/${encodeURIComponent(messageId)}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ star: !currentStarred }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isStarred: !currentStarred } : m))
        );
        showToast(!currentStarred ? 'Pesan dibintangi ⭐' : 'Bintang pesan dihapus');
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  // Send Poll
  const handleSendPoll = async (question: string, options: string[]) => {
    if (!activeSession || !activeJid) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: question, values: options }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Polling berhasil dikirim 📊');
        playOutgoingSound();
      } else {
        alert(data.error || 'Gagal mengirim polling');
      }
    } catch (err: any) {
      alert('Gagal mengirim polling: ' + err.message);
    }
  };

  // Send Location
  const handleSendLocation = async (lat: number, lng: number, name: string, address: string) => {
    if (!activeSession || !activeJid) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          name: name || undefined,
          address: address || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Lokasi berhasil dibagikan 📍');
        playOutgoingSound();
      } else {
        alert(data.error || 'Gagal mengirim lokasi');
      }
    } catch (err: any) {
      alert('Gagal mengirim lokasi: ' + err.message);
    }
  };

  // Send Contact (vCard)
  const handleSendContact = async (displayName: string, phoneNumber: string) => {
    if (!activeSession || !activeJid) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Kontak berhasil dibagikan 👤');
        playOutgoingSound();
      } else {
        alert(data.error || 'Gagal mengirim kontak');
      }
    } catch (err: any) {
      alert('Gagal mengirim kontak: ' + err.message);
    }
  };

  // Forward Message
  const handleConfirmForward = async (targetJid: string, message: MessageItem) => {
    if (!activeSession || !targetJid || !message) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(targetJid)}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Pesan berhasil diteruskan ↗️');
      } else {
        alert(data.error || 'Gagal meneruskan pesan');
      }
    } catch (err: any) {
      alert('Gagal meneruskan pesan: ' + err.message);
    }
  };

  // Update Chat Metadata
  const handleUpdateChatMeta = async (jid: string, updates: Partial<ChatMeta>) => {
    if (!activeSession || !jid) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(jid)}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.meta) {
        setChatMetas((prev) => ({
          ...prev,
          [jid]: data.meta,
        }));
        showToast('Pengaturan chat diperbarui');
      }
    } catch (err) {
      console.error('Failed to update chat meta:', err);
    }
  };

  // Enterprise Gateway Handlers
  const handleAddAutoReply = async (triggerKeyword: string, matchType: 'exact' | 'contains' | 'regex', replyText: string) => {
    try {
      const res = await fetch('/api/whatsapp/auto-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerKeyword, matchType, replyText }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Auto-reply berhasil disimpan 🤖');
        void loadEnterpriseData();
      }
    } catch (err: any) {
      alert('Gagal menambah auto-reply: ' + err.message);
    }
  };

  const handleDeleteAutoReply = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/auto-replies/${id}`, { method: 'DELETE' });
      showToast('Auto-reply dihapus');
      void loadEnterpriseData();
    } catch {}
  };

  const handleAddQuickReply = async (shortcut: string, title: string, content: string) => {
    try {
      const res = await fetch('/api/whatsapp/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcut, title, content }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Quick reply berhasil disimpan ⚡');
        void loadEnterpriseData();
      }
    } catch (err: any) {
      alert('Gagal menambah quick reply: ' + err.message);
    }
  };

  const handleDeleteQuickReply = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/quick-replies/${id}`, { method: 'DELETE' });
      showToast('Quick reply dihapus');
      void loadEnterpriseData();
    } catch {}
  };

  const handleAddScheduledMessage = async (remoteJid: string, text: string, scheduledAt: number) => {
    try {
      const res = await fetch('/api/whatsapp/scheduled-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession, remoteJid, text, scheduledAt }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Pesan berhasil dijadwalkan 📅');
        void loadEnterpriseData();
      }
    } catch (err: any) {
      alert('Gagal menjadwalkan pesan: ' + err.message);
    }
  };

  const handleCancelScheduledMessage = async (id: string) => {
    try {
      await fetch(`/api/whatsapp/scheduled-messages/${id}/cancel`, { method: 'POST' });
      showToast('Jadwal pesan dibatalkan');
      void loadEnterpriseData();
    } catch {}
  };

  // Send Media message
  const handleSubmitMedia = async () => {
    if (!mediaUrl.trim() || !activeSession || !activeJid) return;

    setShowMediaModal(false);
    try {
      const res = await fetch(`/api/sessions/${activeSession}/chats/${encodeURIComponent(activeJid)}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: attachType,
          mediaUrl: mediaUrl.trim(),
          caption: mediaCaption.trim() || undefined,
          name: activeContactName,
        }),
      });
      const data = await res.json();
      setMediaUrl('');
      setMediaCaption('');
      if (!data.success) {
        alert(data.error || 'Gagal mengirim media');
      }
    } catch (err) {
      alert('Gagal mengirim media: ' + (err as Error).message);
    }
  };

  // Start new chat
  const handleStartNewChat = () => {
    const phone = newChatPhone.trim();
    if (!phone) return;

    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    const jid = `${digits}@s.whatsapp.net`;

    setShowNewChatModal(false);
    setNewChatPhone('');
    void handleSelectChat(jid, `+${digits}`);
  };

  // Create new group
  const handleCreateGroup = async () => {
    if (!activeSession || !newGroupSubject.trim() || newGroupParticipants.length === 0) return;
    setCreatingGroup(true);

    try {
      const res = await fetch(`/api/sessions/${activeSession}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newGroupSubject.trim(),
          participants: newGroupParticipants,
        }),
      });
      const data = await res.json();
      if (data.success && data.group?.id) {
        setShowNewGroupModal(false);
        setNewGroupSubject('');
        setNewGroupParticipants([]);
        await loadChats(activeSession);
        void handleSelectChat(data.group.id, newGroupSubject.trim());
      } else {
        alert(data.error || 'Gagal membuat grup');
      }
    } catch (err) {
      alert('Gagal membuat grup: ' + (err as Error).message);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Post Status / Story
  const handlePostStatus = async () => {
    if (!newStatusText.trim() && !newStatusImgUrl.trim()) return;
    if (!activeSession) return;

    try {
      const res = await fetch(`/api/sessions/${activeSession}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newStatusText.trim() || undefined,
          imageUrl: newStatusImgUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewStatusModal(false);
        setNewStatusText('');
        setNewStatusImgUrl('');
        void loadStatusUpdates(activeSession);
      } else {
        alert(data.error || 'Gagal memposting status');
      }
    } catch (err) {
      alert('Gagal memposting status: ' + (err as Error).message);
    }
  };

  // Save profile info
  const handleSaveProfile = async () => {
    if (!activeSession) return;
    setProfileSaving(true);

    try {
      if (editProfilePhotoUrl.trim() && editProfilePhotoUrl !== (profileInfo?.imgUrl || '')) {
        await fetch(`/api/sessions/${activeSession}/profile/photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: editProfilePhotoUrl.trim() }),
        });
      }

      if (editProfileStatus.trim()) {
        await fetch(`/api/sessions/${activeSession}/profile/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editProfileStatus.trim() }),
        });
      }

      if (editProfileName.trim()) {
        await fetch(`/api/sessions/${activeSession}/profile/name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editProfileName.trim() }),
        });
      }

      await loadProfile(activeSession);
      setShowProfileModal(false);
    } catch (err) {
      alert('Gagal menyimpan profil: ' + (err as Error).message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Determine presence text for active JID
  const currentPresence = activeJid ? presences[activeJid] : undefined;
  const presenceText = currentPresence
    ? currentPresence.presence === 'composing'
      ? 'sedang mengetik...'
      : currentPresence.presence === 'recording'
      ? 'merekam audio...'
      : currentPresence.presence === 'available'
      ? 'online'
      : undefined
    : undefined;

  return (
    <div
      className="app-shell"
      onClick={() => {
        setShowEmojiPicker(false);
        setShowAttachMenu(false);
      }}
    >
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-card border border-primary text-foreground shadow-2xl text-xs font-medium animate-in slide-in-from-bottom-5 duration-200">
          {toastMessage}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <SidebarHeader
          sessions={sessions}
          activeSession={activeSession}
          onSelectSession={(id) => {
            setActiveSession(id);
            setActiveJid(null);
          }}
          profileInfo={profileInfo}
          onOpenProfile={() => {
            if (activeSession) void loadProfile(activeSession);
            setShowProfileModal(true);
          }}
          onOpenNewStatus={() => setShowNewStatusModal(true)}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenNewGroup={() => setShowNewGroupModal(true)}
          onOpenGateway={() => setShowGatewayModal(true)}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(!showArchived)}
        />

        {/* SEARCH & TABS */}
        <div className="sidebar-search-area">
          <div className="search-box">
            <Search size={16} color="var(--text-secondary)" style={{ marginRight: '12px' }} />
            <input
              type="text"
              placeholder={
                activeTab === 'contacts'
                  ? 'Cari kontak...'
                  : activeTab === 'status'
                  ? 'Cari status update...'
                  : 'Cari chat atau saluran...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-chips-row">
            <button
              className={`filter-chip ${activeTab === 'chats' && !unreadFilter && !showArchived ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('chats');
                setUnreadFilter(false);
                setShowArchived(false);
              }}
            >
              Semua
            </button>
            <button
              className={`filter-chip ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('channels');
                setUnreadFilter(false);
                setShowArchived(false);
              }}
            >
              Saluran {chats.filter(c => c.remoteJid.endsWith('@newsletter')).length > 0 ? `(${chats.filter(c => c.remoteJid.endsWith('@newsletter')).length})` : ''}
            </button>
            <button
              className={`filter-chip ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('status');
                setUnreadFilter(false);
                setShowArchived(false);
              }}
            >
              Status {statusList.length > 0 ? `(${statusList.length})` : ''}
            </button>
            <button
              className={`filter-chip ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('contacts');
                setUnreadFilter(false);
                setShowArchived(false);
              }}
            >
              Kontak ({contacts.length})
            </button>
            <button
              className={`filter-chip ${unreadFilter ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('chats');
                setUnreadFilter(!unreadFilter);
                setShowArchived(false);
              }}
            >
              Belum dibaca
            </button>
            {showArchived && (
              <button
                className="filter-chip active"
                onClick={() => setShowArchived(false)}
              >
                Diarsipkan 📁
              </button>
            )}
          </div>
        </div>

        {/* LIST AREA */}
        <div className="chat-list">
          {activeTab === 'status' ? (
            <StatusTab
              statusList={statusList}
              profileInfo={profileInfo}
              searchQuery={searchQuery}
              onOpenNewStatus={() => setShowNewStatusModal(true)}
              onViewStatus={(status) => setViewingStatus(status)}
            />
          ) : (
            <ChatList
              activeTab={activeTab}
              chats={chats}
              contacts={contacts}
              activeJid={activeJid}
              searchQuery={searchQuery}
              unreadFilter={unreadFilter}
              onSelectChat={(jid, name) => void handleSelectChat(jid, name)}
              chatMetas={chatMetas}
              onUpdateChatMeta={handleUpdateChatMeta}
              onOpenLabelModal={(jid) => setLabelModalJid(jid)}
              showArchivedFilter={showArchived}
            />
          )}
        </div>
      </aside>

      {/* MAIN CHAT */}
      <ChatWindow
        activeJid={activeJid}
        activeContactName={activeContactName}
        activeSessionStatus={activeSessionStatus}
        activeSessionUser={activeSessionUser}
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        showAttachMenu={showAttachMenu}
        setShowAttachMenu={setShowAttachMenu}
        popularEmojis={POPULAR_EMOJIS}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        onSendMessage={() => void handleSendMessage()}
        onOpenAttach={(type) => {
          setAttachType(type);
          setShowAttachMenu(false);
          setShowMediaModal(true);
        }}
        onDirectFileUpload={(file) => void handleDirectFileUpload(file)}
        onSendReaction={(msgId, emoji) => void handleSendReaction(msgId, emoji)}
        onDeleteMessage={(msgId) => void handleDeleteMessage(msgId)}
        onLoadMoreMessages={() => void handleLoadMoreMessages()}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isLoadingMore}
        messagesEndRef={messagesEndRef}
        onToggleStar={handleToggleStar}
        onForwardMessage={(msg) => setForwardTarget(msg)}
        onOpenGroupInfo={() => activeJid && setGroupDrawerJid(activeJid)}
        onOpenPollModal={() => setShowPollModal(true)}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onOpenContactModal={() => setShowContactModal(true)}
        onOpenMediaLightbox={(url, type, sender, ts) =>
          setLightboxMedia({ url, type, senderName: sender, timestamp: ts })
        }
        presenceText={presenceText}
        quickReplies={quickReplies}
      />

      {/* MEDIA LIGHTBOX */}
      {lightboxMedia && (
        <MediaLightbox
          isOpen={!!lightboxMedia}
          onClose={() => setLightboxMedia(null)}
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          senderName={lightboxMedia.senderName}
          timestamp={lightboxMedia.timestamp}
        />
      )}

      {/* GROUP INFO DRAWER */}
      {groupDrawerJid && (
        <GroupInfoDrawer
          isOpen={!!groupDrawerJid}
          onClose={() => setGroupDrawerJid(null)}
          groupId={groupDrawerJid}
          sessionId={activeSession}
          onShowToast={showToast}
        />
      )}

      {/* MODALS */}
      <Modals
        showNewChatModal={showNewChatModal}
        setShowNewChatModal={setShowNewChatModal}
        newChatPhone={newChatPhone}
        setNewChatPhone={setNewChatPhone}
        onStartNewChat={handleStartNewChat}

        showNewGroupModal={showNewGroupModal}
        setShowNewGroupModal={setShowNewGroupModal}
        newGroupSubject={newGroupSubject}
        setNewGroupSubject={setNewGroupSubject}
        newGroupParticipants={newGroupParticipants}
        setNewGroupParticipants={setNewGroupParticipants}
        onCreateGroup={() => void handleCreateGroup()}
        creatingGroup={creatingGroup}
        contacts={contacts}
        chats={chats}

        showMediaModal={showMediaModal}
        setShowMediaModal={setShowMediaModal}
        attachType={attachType}
        mediaUrl={mediaUrl}
        setMediaUrl={setMediaUrl}
        mediaCaption={mediaCaption}
        setMediaCaption={setMediaCaption}
        onSubmitMedia={() => void handleSubmitMedia()}

        showNewStatusModal={showNewStatusModal}
        setShowNewStatusModal={setShowNewStatusModal}
        newStatusText={newStatusText}
        setNewStatusText={setNewStatusText}
        newStatusImgUrl={newStatusImgUrl}
        setNewStatusImgUrl={setNewStatusImgUrl}
        onPostStatus={() => void handlePostStatus()}

        viewingStatus={viewingStatus}
        setViewingStatus={setViewingStatus}

        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        profileInfo={profileInfo}
        activeSession={activeSession}
        editProfilePhotoUrl={editProfilePhotoUrl}
        setEditProfilePhotoUrl={setEditProfilePhotoUrl}
        editProfileName={editProfileName}
        setEditProfileName={setEditProfileName}
        editProfileStatus={editProfileStatus}
        setEditProfileStatus={setEditProfileStatus}
        profileSaving={profileSaving}
        onSaveProfile={() => void handleSaveProfile()}

        // Phase 2 Modals
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        onSubmitPoll={handleSendPoll}

        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        onSubmitLocation={handleSendLocation}

        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
        onSubmitContact={handleSendContact}

        forwardMessageTarget={forwardTarget}
        setForwardMessageTarget={setForwardTarget}
        onConfirmForward={handleConfirmForward}

        labelModalJid={labelModalJid}
        setLabelModalJid={setLabelModalJid}
        chatMeta={labelModalJid ? chatMetas[labelModalJid] : undefined}
        onSaveChatMeta={(jid, meta) => handleUpdateChatMeta(jid, meta)}

        showGatewayModal={showGatewayModal}
        setShowGatewayModal={setShowGatewayModal}
        autoReplies={autoReplies}
        onAddAutoReply={handleAddAutoReply}
        onDeleteAutoReply={handleDeleteAutoReply}
        quickReplies={quickReplies}
        onAddQuickReply={handleAddQuickReply}
        onDeleteQuickReply={handleDeleteQuickReply}
        scheduledMessages={scheduledMessages}
        onAddScheduledMessage={handleAddScheduledMessage}
        onCancelScheduledMessage={handleCancelScheduledMessage}
      />
    </div>
  );
}
