import React from 'react';
import type { SessionItem, ProfileInfo } from '../types.js';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar.js';
import { Button } from './ui/button.js';
import { Plus, MessageSquarePlus, Settings, Users, Zap, Archive } from 'lucide-react';

interface SidebarHeaderProps {
  sessions: SessionItem[];
  activeSession: string;
  onSelectSession: (id: string) => void;
  profileInfo: ProfileInfo | null;
  onOpenProfile: () => void;
  onOpenNewStatus: () => void;
  onOpenNewChat: () => void;
  onOpenNewGroup?: () => void;
  onOpenGateway?: () => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
}

export function SidebarHeader({
  sessions,
  activeSession,
  onSelectSession,
  profileInfo,
  onOpenProfile,
  onOpenNewStatus,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenGateway,
  showArchived = false,
  onToggleArchived,
}: SidebarHeaderProps) {
  const initial = (profileInfo?.name || activeSession || 'WA')[0]?.toUpperCase() || 'W';

  return (
    <div className="sidebar-header">
      <div className="sidebar-profile">
        <div
          className="clickable"
          onClick={onOpenProfile}
          title="Klik untuk Edit Profil & Foto"
          style={{ cursor: 'pointer' }}
        >
          <Avatar className="cursor-pointer">
            {profileInfo?.imgUrl ? (
              <AvatarImage src={profileInfo.imgUrl} alt={profileInfo?.name || 'Profile'} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </div>

        <select
          className="device-picker"
          value={activeSession}
          onChange={(e) => onSelectSession(e.target.value)}
        >
          {sessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {s.sessionId} ({s.status})
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-actions">
        {onToggleArchived && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${showArchived ? 'text-primary bg-primary/10' : ''}`}
            onClick={onToggleArchived}
            title={showArchived ? 'Kembali ke Semua Chat' : 'Lihat Chat Diarsipkan'}
          >
            <Archive size={19} />
          </Button>
        )}

        {onOpenGateway && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
            onClick={onOpenGateway}
            title="Enterprise Gateway & Otomasi"
          >
            <Zap size={19} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onOpenNewStatus}
          title="Buat Status / Story Baru"
        >
          <Plus size={20} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onOpenNewChat}
          title="Obrolan Baru"
        >
          <MessageSquarePlus size={20} />
        </Button>

        {onOpenNewGroup && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onOpenNewGroup}
            title="Buat Grup Baru"
          >
            <Users size={20} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          asChild
        >
          <a href="/dashboard" title="Pengaturan & API Keys">
            <Settings size={20} />
          </a>
        </Button>
      </div>
    </div>
  );
}
