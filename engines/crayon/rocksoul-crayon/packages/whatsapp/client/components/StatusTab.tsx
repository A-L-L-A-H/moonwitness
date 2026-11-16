import React from 'react';
import type { StatusItem, ProfileInfo } from '../types.js';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar.js';
import { Plus } from 'lucide-react';

interface StatusTabProps {
  statusList: StatusItem[];
  profileInfo: ProfileInfo | null;
  searchQuery: string;
  onOpenNewStatus: () => void;
  onViewStatus: (status: StatusItem) => void;
}

export function StatusTab({
  statusList,
  profileInfo,
  searchQuery,
  onOpenNewStatus,
  onViewStatus,
}: StatusTabProps) {
  const filtered = statusList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.senderName || '').toLowerCase().includes(q) ||
      (s.text || '').toLowerCase().includes(q) ||
      s.senderNumber.includes(q)
    );
  });

  return (
    <div className="status-list-container">
      {/* My Status Card */}
      <div className="chat-item" onClick={onOpenNewStatus}>
        <div className="my-status-avatar" style={{ position: 'relative', marginRight: '15px' }}>
          <Avatar
            className="w-12 h-12 border-2 border-[#00a884]"
            style={{ width: '48px', height: '48px' }}
          >
            {profileInfo?.imgUrl ? (
              <AvatarImage src={profileInfo.imgUrl} alt="My Status" />
            ) : null}
            <AvatarFallback>WA</AvatarFallback>
          </Avatar>
          <div className="status-plus-badge">
            <Plus size={11} strokeWidth={3} />
          </div>
        </div>
        <div className="chat-item-content">
          <div className="chat-item-row1">
            <span className="chat-item-title">Status Saya</span>
          </div>
          <div className="chat-item-row2">
            <span className="chat-item-msg">Ketuk untuk menambahkan pembaruan status</span>
          </div>
        </div>
      </div>

      <div className="status-section-header">Pembaruan Terkini</div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            padding: '30px 20px',
            fontSize: '0.88rem',
          }}
        >
          Belum ada pembaruan status dari kontak Anda.<br />
          Klik <strong>Status Saya</strong> untuk membuat status pertama!
        </div>
      ) : (
        filtered.map((s) => {
          const displayName = s.senderName || `+${s.senderNumber}`;
          const initial = displayName[0]?.toUpperCase() || '?';
          const timeStr = new Date(s.timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const snippet =
            s.text ||
            (s.mediaType === 'image'
              ? '📷 Foto'
              : s.mediaType === 'video'
              ? '📹 Video'
              : 'Status');

          return (
            <div
              key={s.id}
              className="chat-item status-item"
              onClick={() => onViewStatus(s)}
            >
              <div style={{ marginRight: '15px' }}>
                <Avatar
                  className="w-12 h-12 border-2 border-[#00a884] ring-2 ring-[#00a884]/30"
                  style={{ width: '48px', height: '48px', backgroundColor: '#056162' }}
                >
                  {s.thumbnail || s.mediaUrl ? (
                    <AvatarImage src={s.thumbnail || s.mediaUrl} alt={displayName} style={{ objectFit: 'cover' }} />
                  ) : null}
                  <AvatarFallback style={{ backgroundColor: '#056162' }}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="chat-item-content">
                <div className="chat-item-row1">
                  <span className="chat-item-title">{displayName}</span>
                  <span className="chat-item-time">{timeStr}</span>
                </div>
                <div className="chat-item-row2">
                  <span className="chat-item-msg">{snippet}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
