import React, { useRef, useState, useEffect } from 'react';
import type { MessageItem, QuickReplyItem } from '../types.js';
import { Avatar, AvatarFallback } from './ui/avatar.js';
import { Button } from './ui/button.js';
import {
  Smile,
  Paperclip,
  Send,
  ShieldCheck,
  CheckCheck,
  Reply,
  Trash2,
  X,
  Mic,
  Search,
  Star,
  Forward,
  MapPin,
  BarChart2,
  User,
  Users,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ChatWindowProps {
  activeJid: string | null;
  activeContactName: string;
  activeSessionStatus: string;
  activeSessionUser: string;
  messages: MessageItem[];
  inputText: string;
  setInputText: (val: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  showAttachMenu: boolean;
  setShowAttachMenu: React.Dispatch<React.SetStateAction<boolean>>;
  popularEmojis: string[];
  replyingTo: MessageItem | null;
  setReplyingTo: (msg: MessageItem | null) => void;
  onSendMessage: () => void;
  onOpenAttach: (type: 'image' | 'document') => void;
  onDirectFileUpload: (file: File) => void;
  onSendReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;

  // Phase 2 Enterprise Props
  onToggleStar?: (messageId: string, currentStarred: boolean) => void;
  onForwardMessage?: (message: MessageItem) => void;
  onOpenGroupInfo?: () => void;
  onOpenPollModal?: () => void;
  onOpenLocationModal?: () => void;
  onOpenContactModal?: () => void;
  onOpenMediaLightbox?: (url: string, type: string, senderName?: string, timestamp?: number) => void;
  presenceText?: string;
  quickReplies?: QuickReplyItem[];
}

function AudioPlayerWithSpeed({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speed, setSpeed] = useState<number>(1);

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-black/20 rounded-lg">
      <audio ref={audioRef} controls src={src} preload="metadata" className="h-8 max-w-[210px]" />
      <button
        type="button"
        onClick={toggleSpeed}
        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
        title="Ubah Kecepatan Putar"
      >
        {speed}x
      </button>
    </div>
  );
}

export function ChatWindow({
  activeJid,
  activeContactName,
  activeSessionStatus,
  messages,
  inputText,
  setInputText,
  showEmojiPicker,
  setShowEmojiPicker,
  showAttachMenu,
  setShowAttachMenu,
  popularEmojis,
  replyingTo,
  setReplyingTo,
  onSendMessage,
  onOpenAttach,
  onDirectFileUpload,
  onSendReaction,
  onDeleteMessage,
  messagesEndRef,
  onLoadMoreMessages,
  hasMoreMessages,
  isLoadingMore,
  onToggleStar,
  onForwardMessage,
  onOpenGroupInfo,
  onOpenPollModal,
  onOpenLocationModal,
  onOpenContactModal,
  onOpenMediaLightbox,
  presenceText,
  quickReplies = [],
}: ChatWindowProps) {
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // In-chat search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isGroup = activeJid?.endsWith('@g.us');

  // Find matching message indices
  const matchingMessageIds = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => m.text?.toLowerCase().includes(q))
      .map((m) => m.id || '')
      .filter(Boolean);
  }, [messages, searchQuery]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      const targetId = matchingMessageIds[currentMatchIndex];
      const el = messageRefs.current.get(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, matchingMessageIds]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  // Quick reply filter
  const isQuickReplyTriggered = inputText.startsWith('/');
  const filteredQuickReplies = isQuickReplyTriggered
    ? quickReplies.filter(
        (qr) =>
          qr.shortcut.toLowerCase().includes(inputText.slice(1).toLowerCase()) ||
          qr.title.toLowerCase().includes(inputText.slice(1).toLowerCase())
      )
    : [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Tidak dapat mengakses mikrofon: ' + (err as Error).message);
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingSeconds(0);

      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeType.includes('mp4') ? '.mp4' : mimeType.includes('ogg') ? '.ogg' : '.webm';
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}${ext}`, { type: mimeType });
      onDirectFileUpload(audioFile);

      recorder.stream.getTracks().forEach((t) => t.stop());
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!activeJid) {
    return (
      <main className="chat-main">
        <div className="doodle-bg"></div>
        <div className="empty-screen">
          <div className="empty-screen-icon">
            <svg viewBox="0 0 308 160" width="260" height="135" fill="none">
              <path
                d="M154 0C69.1 0 0 69.1 0 154c0 29.8 8.6 57.6 23.4 81.1L8.5 299.5l66.4-14.6C98.4 298.1 125.4 308 154 308c84.9 0 154-69.1 154-154S238.9 0 154 0z"
                fill="#202c33"
              />
              <path
                d="M154 28c69.6 0 126 56.4 126 126s-56.4 126-126 126c-22.3 0-43.2-5.8-61.4-16l-4.4-2.5-45.5 10 10.2-44.4-2.8-4.6C40.6 204.3 35 180 35 154c0-69.6 56.4-126 126-126z"
                fill="#2a3942"
              />
              <path
                d="M198.8 178.6c-2.4 6.9-12.1 12.6-19.8 13.2-5.3.4-12.2.6-35.3-8.9-29.6-12.2-48.6-42.3-50.1-44.3-1.5-2-12-16-12-30.5s7.6-21.7 10.3-24.6c2.7-2.9 5.9-3.6 7.9-3.6 2 0 4 .1 5.7.2 1.8.1 4.3-.7 6.7 5.1 2.5 5.9 8.4 20.6 9.1 22.1.7 1.5 1.2 3.3.2 5.3s-1.5 3.3-3 5c-1.5 1.8-3.1 4-4.5 5.3-1.5 1.5-3 3.1-1.3 6.1 1.7 3 7.6 12.5 16.3 20.2 11.2 9.9 20.6 13 23.6 14.5 3 1.5 4.7 1.3 6.5-.7 1.8-2 7.6-8.9 9.6-11.9 2-3 4-2.5 6.7-1.5 2.7 1 17.2 8.1 20.2 9.6 3 1.5 5 2.2 5.7 3.5.7 1.2.7 7.2-1.7 14.1z"
                fill="#00a884"
              />
            </svg>
          </div>
          <h2 className="empty-screen-title">WhatsApp Web & Gateway</h2>
          <p className="empty-screen-subtitle">
            Kirim dan terima pesan tanpa harus membiarkan ponsel Anda tetap online.
            <br />
            Pilih kontak atau mulai percakapan baru di bilah sisi.
          </p>
          <div className="empty-screen-lock">
            <ShieldCheck size={14} /> Terenkripsi secara end-to-end
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="chat-main"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) onDirectFileUpload(file);
      }}
    >
      <div className="doodle-bg"></div>

      {/* HEADER */}
      <header className="chat-header justify-between">
        <div className="chat-header-info cursor-pointer" onClick={isGroup ? onOpenGroupInfo : undefined}>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{activeContactName[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="chat-header-text">
            <h3 className="flex items-center gap-1.5">
              {activeContactName}
              {isGroup && <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Grup</span>}
            </h3>
            <span className={`chat-header-status ${presenceText?.includes('mengetik') ? 'text-primary font-medium animate-pulse' : ''}`}>
              {presenceText || (activeSessionStatus === 'open' ? 'online' : activeSessionStatus)}
            </span>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${isSearchOpen ? 'text-primary bg-primary/10' : 'text-[#aebac1]'} hover:text-white`}
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            title="Cari dalam chat"
          >
            <Search size={18} />
          </Button>

          {isGroup && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-[#aebac1] hover:text-white"
              onClick={onOpenGroupInfo}
              title="Info Grup"
            >
              <Users size={18} />
            </Button>
          )}
        </div>
      </header>

      {/* IN-CHAT SEARCH BAR */}
      {isSearchOpen && (
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border text-xs animate-in slide-in-from-top-2 duration-150 z-20">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-background px-2.5 py-1.5 rounded-lg border border-border">
            <Search size={14} className="text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari kata kunci dalam pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs flex-1 text-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">
              {matchingMessageIds.length > 0
                ? `${currentMatchIndex + 1} dari ${matchingMessageIds.length}`
                : searchQuery
                ? 'Tidak ada hasil'
                : ''}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded"
              onClick={handlePrevMatch}
              disabled={matchingMessageIds.length === 0}
              title="Hasil sebelumnya"
            >
              <ChevronUp size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded"
              onClick={handleNextMatch}
              disabled={matchingMessageIds.length === 0}
              title="Hasil berikutnya"
            >
              <ChevronDown size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded hover:text-destructive"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="messages-container">
        {hasMoreMessages && (
          <div className="load-more-container">
            <button
              className="load-more-btn"
              onClick={onLoadMoreMessages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Memuat riwayat lama...' : '⬆️ Muat riwayat chat sebelumnya'}
            </button>
          </div>
        )}

        {messages.map((m, idx) => {
          const isMe = m.fromMe;
          const time = new Date(m.timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          const isMatching = searchQuery.trim() && m.id && matchingMessageIds[currentMatchIndex] === m.id;

          const reactionList: string[] = [];
          if (m.reactions) {
            try {
              const parsed = typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions;
              if (Array.isArray(parsed)) {
                reactionList.push(...parsed);
              } else if (typeof parsed === 'object') {
                reactionList.push(...Object.values(parsed as Record<string, string>));
              }
            } catch {
              // ignore
            }
          }

          // Parse poll / location / contact if available
          let poll = m.pollData;
          if (typeof poll === 'string') {
            try {
              poll = JSON.parse(poll);
            } catch {}
          }

          let loc = m.locationData;
          if (typeof loc === 'string') {
            try {
              loc = JSON.parse(loc);
            } catch {}
          }

          let vcard = m.vcardData;
          if (typeof vcard === 'string') {
            try {
              vcard = JSON.parse(vcard);
            } catch {}
          }

          return (
            <div
              key={m.id || idx}
              ref={(el) => {
                if (el && m.id) messageRefs.current.set(m.id, el);
              }}
              className={`message-row ${isMe ? 'out' : 'in'} ${isMatching ? 'ring-2 ring-primary rounded-lg p-1 transition-all' : ''}`}
            >
              <div className={`message-bubble ${isMe ? 'out' : 'in'}`} style={{ position: 'relative' }}>
                {/* Forwarded Indicator */}
                {m.isForwarded && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic mb-1 select-none">
                    <Forward size={12} className="rotate-180" />
                    <span>Diteruskan</span>
                  </div>
                )}

                {/* Quoted Bubble */}
                {m.quotedText && (
                  <div className="quoted-bubble">
                    <div className="quoted-sender">{m.quotedSender || 'Balasan'}</div>
                    <div className="quoted-text">{m.quotedText}</div>
                  </div>
                )}

                {/* POLL CARD */}
                {poll && poll.name && (
                  <div className="p-2.5 rounded-lg bg-card/60 border border-border/60 mb-2 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-foreground">
                      <BarChart2 size={16} className="text-primary" />
                      <span>{poll.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {(poll.values || poll.options || []).map((opt: any, i: number) => {
                        const optText = typeof opt === 'string' ? opt : opt.name || opt.optionName;
                        const votes = poll.votes?.[optText] || 0;
                        return (
                          <div
                            key={i}
                            className="p-2 rounded border border-border/40 bg-background/50 text-xs flex flex-col gap-1 cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{optText}</span>
                              <span className="text-[10px] text-muted-foreground">{votes} suara</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, votes * 25)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LOCATION CARD */}
                {loc && (
                  <div className="p-2 rounded-lg bg-card/60 border border-border/60 mb-2 min-w-[240px]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                      <MapPin size={15} />
                      <span>{loc.name || 'Lokasi Terbagi'}</span>
                    </div>
                    {loc.address && <p className="text-[11px] text-muted-foreground mb-2">{loc.address}</p>}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${loc.degreesLatitude || loc.latitude},${loc.degreesLongitude || loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded transition-colors"
                    >
                      <ExternalLink size={12} />
                      Buka di Google Maps
                    </a>
                  </div>
                )}

                {/* VCARD CONTACT CARD */}
                {vcard && (
                  <div className="p-3 rounded-lg bg-card/60 border border-border/60 mb-2 min-w-[220px] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      <User size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-xs truncate">{vcard.displayName || 'Kontak'}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{vcard.phone || 'Nomor Kontak'}</div>
                    </div>
                  </div>
                )}

                {/* MEDIA VIEW */}
                {m.mediaUrl && (
                  <div>
                    {m.mediaType === 'image' ? (
                      <img
                        src={m.mediaUrl}
                        alt="Media"
                        className="bubble-image cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() =>
                          onOpenMediaLightbox
                            ? onOpenMediaLightbox(m.mediaUrl!, 'image', m.senderName, m.timestamp * 1000)
                            : window.open(m.mediaUrl, '_blank')
                        }
                      />
                    ) : m.mediaType === 'audio' ? (
                      <AudioPlayerWithSpeed src={m.mediaUrl} />
                    ) : m.mediaType === 'video' ? (
                      <div className="relative group cursor-pointer">
                        <video
                          controls
                          src={m.mediaUrl}
                          className="bubble-image"
                          style={{ maxHeight: '240px' }}
                        />
                      </div>
                    ) : (
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bubble-doc-card"
                      >
                        <span className="bubble-doc-icon">📄</span>
                        <div className="bubble-doc-info">
                          <span className="bubble-doc-name">
                            {m.text && !m.text.startsWith('📄') ? m.text : 'Dokumen'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#8696a0' }}>Klik untuk unduh</span>
                        </div>
                      </a>
                    )}
                  </div>
                )}

                {(!m.mediaUrl ||
                  (m.text &&
                    !['📷 Foto', '🎵 Pesan Suara'].includes(m.text) &&
                    !m.text.startsWith('📄 '))) &&
                  !poll && (
                    <div className="bubble-text">{m.text}</div>
                  )}

                <div className="bubble-meta flex items-center gap-1">
                  {m.isStarred && <Star size={11} className="fill-amber-400 text-amber-400" />}
                  <span className="bubble-time">{time}</span>
                  {isMe && (
                    <span className="check-marks">
                      <CheckCheck size={14} />
                    </span>
                  )}
                </div>

                {reactionList.length > 0 && (
                  <div className="bubble-reactions">{reactionList.join(' ')}</div>
                )}
              </div>

              {/* Message Action Menu */}
              <div className="message-actions-btn" style={{ display: 'flex', gap: '3px' }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-[#8696a0] hover:text-white"
                  title="Balas pesan"
                  onClick={() => setReplyingTo(m)}
                >
                  <Reply size={13} />
                </Button>

                {onToggleStar && m.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-full ${m.isStarred ? 'text-amber-400' : 'text-[#8696a0]'} hover:text-amber-300`}
                    title={m.isStarred ? 'Hapus bintang' : 'Beri bintang'}
                    onClick={() => onToggleStar(m.id!, !!m.isStarred)}
                  >
                    <Star size={13} className={m.isStarred ? 'fill-amber-400' : ''} />
                  </Button>
                )}

                {onForwardMessage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-[#8696a0] hover:text-white"
                    title="Teruskan pesan"
                    onClick={() => onForwardMessage(m)}
                  >
                    <Forward size={13} />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-[#8696a0] hover:text-white text-xs"
                  title="Beri reaksi 👍"
                  onClick={() => m.id && onSendReaction(m.id, '👍')}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-[#8696a0] hover:text-white text-xs"
                  title="Beri reaksi ❤️"
                  onClick={() => m.id && onSendReaction(m.id, '❤️')}
                >
                  ❤️
                </Button>

                {isMe && m.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-[#8696a0] hover:text-destructive"
                    title="Hapus"
                    onClick={() => onDeleteMessage(m.id!)}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <span className="reply-preview-sender">
              Membalas {replyingTo.senderName || (replyingTo.fromMe ? 'Saya' : replyingTo.senderNumber)}
            </span>
            <span className="reply-preview-text">{replyingTo.text}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-[#8696a0] hover:text-white"
            onClick={() => setReplyingTo(null)}
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {/* QUICK REPLIES AUTO-COMPLETE POPUP */}
      {isQuickReplyTriggered && filteredQuickReplies.length > 0 && (
        <div className="px-4 py-2 bg-card border-t border-border flex flex-col gap-1 max-h-44 overflow-y-auto animate-in slide-in-from-bottom-2">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
            <Sparkles size={12} className="text-primary" />
            <span>Balasan Cepat (Quick Replies)</span>
          </div>
          {filteredQuickReplies.map((qr) => (
            <div
              key={qr.id}
              onClick={() => setInputText(qr.content)}
              className="px-3 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer text-xs flex justify-between items-center transition-colors group"
            >
              <div>
                <span className="font-semibold text-primary">/{qr.shortcut}</span>
                <span className="text-muted-foreground ml-2">{qr.title}</span>
              </div>
              <span className="text-[11px] text-muted-foreground italic truncate max-w-xs">{qr.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="chat-footer">
        <input
          type="file"
          ref={hiddenFileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onDirectFileUpload(file);
            e.target.value = '';
          }}
        />

        {isRecording ? (
          <div className="chat-footer-recording">
            <div className="recording-indicator">
              <div className="pulsing-dot" />
              <span>{formatSeconds(recordingSeconds)}</span>
            </div>
            <div style={{ flex: 1 }} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-red-400 hover:bg-red-950"
              onClick={cancelRecording}
              title="Batalkan rekaman"
            >
              <Trash2 size={18} />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]"
              onClick={stopRecordingAndSend}
              title="Kirim pesan suara"
            >
              <Send size={16} />
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-[#aebac1] hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              title="Emoji"
            >
              <Smile size={22} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-[#aebac1] hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              title="Lampirkan"
            >
              <Paperclip size={22} />
            </Button>
            <div className="chat-input-wrapper">
              <input
                type="text"
                className="chat-input"
                placeholder="Ketik pesan (atau ketik / untuk balasan cepat)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={(e) => {
                  const file = e.clipboardData?.files?.[0];
                  if (file) {
                    e.preventDefault();
                    onDirectFileUpload(file);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSendMessage();
                  }
                }}
              />
            </div>
            {inputText.trim() ? (
              <Button
                variant="default"
                size="icon"
                className="rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]"
                onClick={onSendMessage}
                title="Kirim (Enter)"
              >
                <Send size={18} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-[#8696a0] hover:text-white"
                onClick={startRecording}
                title="Rekam Pesan Suara"
              >
                <Mic size={20} />
              </Button>
            )}
          </>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker-popup" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-grid">
              {popularEmojis.map((emoji, i) => (
                <span
                  key={i}
                  className="emoji-btn emoji-item"
                  onClick={() => setInputText(inputText + emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {showAttachMenu && (
          <div className="attach-menu-popup" onClick={(e) => e.stopPropagation()}>
            <div
              className="attach-item"
              onClick={() => {
                setShowAttachMenu(false);
                hiddenFileInputRef.current?.click();
              }}
            >
              <div className="attach-icon-circle" style={{ background: '#ac44cf' }}>📁</div>
              <span>Upload dari PC</span>
            </div>
            <div className="attach-item" onClick={() => onOpenAttach('image')}>
              <div className="attach-icon-circle" style={{ background: '#00a884' }}>📷</div>
              <span>URL Foto</span>
            </div>
            <div className="attach-item" onClick={() => onOpenAttach('document')}>
              <div className="attach-icon-circle" style={{ background: '#5f66cd' }}>📄</div>
              <span>URL Dokumen</span>
            </div>
            {onOpenPollModal && (
              <div
                className="attach-item"
                onClick={() => {
                  setShowAttachMenu(false);
                  onOpenPollModal();
                }}
              >
                <div className="attach-icon-circle" style={{ background: '#f59e0b' }}>📊</div>
                <span>Buat Polling</span>
              </div>
            )}
            {onOpenLocationModal && (
              <div
                className="attach-item"
                onClick={() => {
                  setShowAttachMenu(false);
                  onOpenLocationModal();
                }}
              >
                <div className="attach-icon-circle" style={{ background: '#10b981' }}>📍</div>
                <span>Bagikan Lokasi</span>
              </div>
            )}
            {onOpenContactModal && (
              <div
                className="attach-item"
                onClick={() => {
                  setShowAttachMenu(false);
                  onOpenContactModal();
                }}
              >
                <div className="attach-icon-circle" style={{ background: '#0284c7' }}>👤</div>
                <span>Bagikan Kontak</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
