import React, { useState } from 'react';
import type { ChatItem, ContactItem, ChatMeta } from '../types.js';
import { Avatar, AvatarFallback } from './ui/avatar.js';
import { Badge } from './ui/badge.js';
import { 
  Megaphone, Pin, VolumeX, Archive, Tag, MoreVertical, 
  CheckCheck 
} from 'lucide-react';
import { Button } from './ui/button.js';

interface ChatListProps {
  activeTab: 'chats' | 'contacts' | 'channels';
  chats: ChatItem[];
  contacts: ContactItem[];
  activeJid: string | null;
  searchQuery: string;
  unreadFilter: boolean;
  onSelectChat: (jid: string, name: string) => void;

  // Phase 2 Metadata & Action props
  chatMetas?: Record<string, ChatMeta>;
  onUpdateChatMeta?: (jid: string, updates: Partial<ChatMeta>) => void;
  onOpenLabelModal?: (jid: string) => void;
  showArchivedFilter?: boolean;
}

export function ChatList({
  activeTab,
  chats,
  contacts,
  activeJid,
  searchQuery,
  unreadFilter,
  onSelectChat,
  chatMetas = {},
  onUpdateChatMeta,
  onOpenLabelModal,
  showArchivedFilter = false,
}: ChatListProps) {
  const [contextMenuJid, setContextMenuJid] = useState<string | null>(null);

  if (activeTab === 'channels') {
    const channelChats = chats.filter((c) => {
      const isChannel = c.remoteJid.endsWith('@newsletter');
      if (!isChannel) return false;
      const q = searchQuery.toLowerCase();
      return (c.name || c.remoteJid).toLowerCase().includes(q);
    });

    if (channelChats.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            padding: '40px 20px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.7 }}>
            <Megaphone size={36} />
          </div>
          Tidak ada saluran WhatsApp aktif.<br />
          Saluran / newsletter yang Anda ikuti akan muncul di sini secara otomatis.
        </div>
      );
    }

    return (
      <>
        {channelChats.map((c) => {
          const displayName = c.name || 'Saluran WhatsApp';
          const initial = displayName[0]?.toUpperCase() || '📢';
          const isActive = c.remoteJid === activeJid;
          const timeStr = c.lastMessageTimestamp
            ? new Date(c.lastMessageTimestamp * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div
              key={c.remoteJid}
              className={`chat-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectChat(c.remoteJid, displayName)}
            >
              <div style={{ marginRight: '15px' }}>
                <Avatar style={{ width: '48px', height: '48px', backgroundColor: '#005c4b' }}>
                  <AvatarFallback style={{ backgroundColor: '#005c4b', color: '#fff' }}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="chat-item-content">
                <div className="chat-item-row1">
                  <span className="chat-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Megaphone size={14} color="#00a884" />
                    {displayName}
                  </span>
                  <span className="chat-item-time">{timeStr}</span>
                </div>
                <div className="chat-item-row2">
                  <span className="chat-item-msg">{c.lastMessageText || 'Pembaruan saluran'}</span>
                  {c.unreadCount > 0 && <Badge>{c.unreadCount}</Badge>}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (activeTab === 'contacts') {
    const filteredContacts = contacts.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.notify || '').toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });

    if (contacts.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            padding: '40px 20px',
            fontSize: '0.88rem',
          }}
        >
          Sedang menyinkronkan kontak dari WhatsApp...<br />
          Ketik nomor di <strong>Obrolan Baru</strong> untuk langsung chat!
        </div>
      );
    }

    return (
      <>
        {filteredContacts.map((c) => {
          const contactId = c.id || '';
          const phoneDisplay = contactId.includes('@') ? contactId.split('@')[0] : contactId;
          const displayName = c.name || c.verifiedName || c.notify || phoneDisplay || 'Kontak';
          const initial = displayName[0]?.toUpperCase() || '?';
          const isActive = contactId === activeJid;

          return (
            <div
              key={contactId}
              className={`chat-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectChat(contactId, displayName)}
            >
              <div style={{ marginRight: '15px' }}>
                <Avatar style={{ width: '48px', height: '48px', backgroundColor: '#056162' }}>
                  <AvatarFallback style={{ backgroundColor: '#056162' }}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="chat-item-content">
                <div className="chat-item-row1">
                  <span className="chat-item-title">{displayName}</span>
                </div>
                <div className="chat-item-row2">
                  <span className="chat-item-msg">{phoneDisplay ? `+${phoneDisplay}` : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // Chats tab (exclude @newsletter which have their own Saluran tab)
  const filteredChats = chats
    .filter((c) => {
      if (c.remoteJid.endsWith('@newsletter')) return false;
      const meta = chatMetas[c.remoteJid] || {};

      // Archived filter
      if (showArchivedFilter) {
        if (!meta.isArchived) return false;
      } else {
        if (meta.isArchived) return false;
      }

      const matchSearch = (c.name || c.remoteJid).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (unreadFilter) return (c.unreadCount || 0) > 0 || !!meta.isUnreadManual;
      return true;
    })
    .sort((a, b) => {
      const aMeta = chatMetas[a.remoteJid];
      const bMeta = chatMetas[b.remoteJid];
      const aPinned = aMeta?.isPinned ? 1 : 0;
      const bPinned = bMeta?.isPinned ? 1 : 0;

      if (aPinned !== bPinned) return bPinned - aPinned; // Pinned first

      const aTime = a.lastMessageTimestamp || 0;
      const bTime = b.lastMessageTimestamp || 0;
      return bTime - aTime;
    });

  if (filteredChats.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          padding: '40px 20px',
          fontSize: '0.88rem',
        }}
      >
        {showArchivedFilter ? (
          <>Tidak ada chat yang diarsipkan.</>
        ) : (
          <>
            Tidak ada percakapan aktif.<br />
            Klik tab <strong>Kontak</strong> atau tombol <strong>+</strong> untuk memulai!
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {filteredChats.map((c) => {
        const initial = (c.name || c.remoteJid)[0]?.toUpperCase() || '?';
        const isActive = c.remoteJid === activeJid;
        const meta = chatMetas[c.remoteJid] || {};
        const timeStr = c.lastMessageTimestamp
          ? new Date(c.lastMessageTimestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        const hasUnread = c.unreadCount > 0 || meta.isUnreadManual;

        return (
          <div
            key={c.remoteJid}
            className={`chat-item relative group ${isActive ? 'active' : ''}`}
            onClick={() => onSelectChat(c.remoteJid, c.name || '')}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuJid(contextMenuJid === c.remoteJid ? null : c.remoteJid);
            }}
          >
            <div style={{ marginRight: '15px' }}>
              <Avatar style={{ width: '48px', height: '48px', backgroundColor: '#6b7c85' }}>
                <AvatarFallback style={{ backgroundColor: '#6b7c85' }}>
                  {initial}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="chat-item-content">
              <div className="chat-item-row1">
                <span className="chat-item-title flex items-center gap-1">
                  {c.name || (c.remoteJid && c.remoteJid.includes('@') ? c.remoteJid.split('@')[0] : c.remoteJid || 'Chat')}
                  {meta.isMuted && <VolumeX size={12} className="text-muted-foreground ml-1 inline" />}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="chat-item-time">{timeStr}</span>
                  {meta.isPinned && <Pin size={12} className="text-primary fill-primary rotate-45" />}
                </div>
              </div>

              <div className="chat-item-row2">
                <span className="chat-item-msg">{c.lastMessageText || ''}</span>
                <div className="flex items-center gap-1">
                  {meta.labels && meta.labels.length > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                      {meta.labels[0]}
                    </span>
                  )}
                  {hasUnread && (
                    <Badge className="h-5 min-w-[20px] px-1 text-[11px] flex items-center justify-center">
                      {c.unreadCount || 1}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action button on hover */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card/90 backdrop-blur rounded p-0.5 shadow border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Menu aksi chat"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuJid(contextMenuJid === c.remoteJid ? null : c.remoteJid);
                }}
              >
                <MoreVertical size={13} />
              </Button>
            </div>

            {/* Action Popup Menu */}
            {contextMenuJid === c.remoteJid && onUpdateChatMeta && (
              <div
                className="absolute right-4 top-10 z-50 w-48 bg-card border border-border shadow-xl rounded-lg py-1 text-xs divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    onUpdateChatMeta(c.remoteJid, { isPinned: !meta.isPinned });
                    setContextMenuJid(null);
                  }}
                >
                  <Pin size={13} />
                  <span>{meta.isPinned ? 'Lepas Sematan' : 'Sematkan Chat'}</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    onUpdateChatMeta(c.remoteJid, { isArchived: !meta.isArchived });
                    setContextMenuJid(null);
                  }}
                >
                  <Archive size={13} />
                  <span>{meta.isArchived ? 'Buka Arsip' : 'Arsipkan Chat'}</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    onUpdateChatMeta(c.remoteJid, { isMuted: !meta.isMuted });
                    setContextMenuJid(null);
                  }}
                >
                  <VolumeX size={13} />
                  <span>{meta.isMuted ? 'Bunyikan Chat' : 'Bisukan Notifikasi'}</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    onUpdateChatMeta(c.remoteJid, { isUnreadManual: !meta.isUnreadManual });
                    setContextMenuJid(null);
                  }}
                >
                  <CheckCheck size={13} />
                  <span>{meta.isUnreadManual ? 'Tandai Sudah Dibaca' : 'Tandai Belum Dibaca'}</span>
                </button>

                {onOpenLabelModal && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-primary"
                    onClick={() => {
                      onOpenLabelModal(c.remoteJid);
                      setContextMenuJid(null);
                    }}
                  >
                    <Tag size={13} />
                    <span>Kelola Label & Catatan CRM</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
