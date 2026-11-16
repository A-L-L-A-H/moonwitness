import React, { useState, useEffect } from 'react';
import { 
  X, Users, Edit2, Check, Copy, UserPlus, UserMinus, 
  ShieldCheck, ShieldAlert, LogOut, Link as LinkIcon 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GroupInfo } from '../types';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  sessionId: string;
  onShowToast: (msg: string) => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  isOpen,
  onClose,
  groupId,
  sessionId,
  onShowToast,
}) => {
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [newParticipantPhone, setNewParticipantPhone] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  useEffect(() => {
    if (isOpen && groupId && sessionId) {
      loadGroupDetails();
    }
  }, [isOpen, groupId, sessionId]);

  const loadGroupDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.group) {
        setGroupInfo(data.group);
        setNewSubject(data.group.subject || '');
        setNewDesc(data.group.desc || '');
      }
    } catch (err) {
      console.error('Failed to load group details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}/subject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, subject: newSubject.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Nama grup berhasil diubah');
        setIsEditingSubject(false);
        loadGroupDetails();
      } else {
        onShowToast(data.error || 'Gagal mengubah nama grup');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengubah nama grup');
    }
  };

  const handleUpdateDescription = async () => {
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}/description`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, description: newDesc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Deskripsi grup berhasil diubah');
        setIsEditingDesc(false);
        loadGroupDetails();
      } else {
        onShowToast(data.error || 'Gagal mengubah deskripsi');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengubah deskripsi');
    }
  };

  const handleParticipantAction = async (action: 'add' | 'remove' | 'promote' | 'demote', participantJid: string) => {
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action, participants: [participantJid] }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`Peserta berhasil di-${action}`);
        loadGroupDetails();
      } else {
        onShowToast(data.error || `Aksi ${action} gagal`);
      }
    } catch (err: any) {
      onShowToast(err.message || `Aksi ${action} gagal`);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantPhone.trim()) return;
    let clean = newParticipantPhone.replace(/[^0-9]/g, '');
    if (!clean.endsWith('@s.whatsapp.net')) clean = `${clean}@s.whatsapp.net`;
    await handleParticipantAction('add', clean);
    setNewParticipantPhone('');
    setIsAddingParticipant(false);
  };

  const handleGetInviteCode = async () => {
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}/invite-code?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.code) {
        setInviteCode(data.code);
        navigator.clipboard.writeText(`https://chat.whatsapp.com/${data.code}`);
        onShowToast('Tautan undangan disalin ke clipboard!');
      } else {
        onShowToast('Gagal memuat kode undangan');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Gagal memuat kode undangan');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari grup ini?')) return;
    try {
      const res = await fetch(`/api/whatsapp/groups/${encodeURIComponent(groupId)}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Anda telah keluar dari grup');
        onClose();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Gagal keluar dari grup');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Info Grup</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {loading && !groupInfo ? (
        <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground">
          Memuat info grup...
        </div>
      ) : groupInfo ? (
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {/* Group Identity Card */}
          <div className="p-5 flex flex-col items-center text-center bg-card">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-3xl mb-3 shadow-inner">
              {groupInfo.subject?.charAt(0)?.toUpperCase() || 'G'}
            </div>

            {isEditingSubject ? (
              <div className="flex items-center gap-2 w-full mt-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="text-center h-8 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleUpdateSubject}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingSubject(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingSubject(true)}>
                <h2 className="font-semibold text-base text-foreground">{groupInfo.subject}</h2>
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <span className="text-xs text-muted-foreground mt-1">
              Grup · {groupInfo.participants?.length || 0} peserta
            </span>
          </div>

          {/* Description */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deskripsi Grup</span>
              {!isEditingDesc && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingDesc(true)}>
                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  placeholder="Tambahkan deskripsi grup..."
                />
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditingDesc(false)}>
                    Batal
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={handleUpdateDescription}>
                    Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {groupInfo.desc || 'Tidak ada deskripsi.'}
              </p>
            )}
          </div>

          {/* Invite Code / Link */}
          <div className="p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tautan Undangan</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetInviteCode}
              className="w-full justify-start text-xs gap-2 border-dashed"
            >
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              <span>{inviteCode ? `chat.whatsapp.com/${inviteCode}` : 'Undang ke grup via tautan'}</span>
            </Button>
          </div>

          {/* Participants List */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {groupInfo.participants?.length || 0} Peserta
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary gap-1"
                onClick={() => setIsAddingParticipant(!isAddingParticipant)}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah
              </Button>
            </div>

            {isAddingParticipant && (
              <div className="p-2 border border-border rounded-lg bg-muted/30 space-y-2">
                <Input
                  placeholder="Nomor telepon (cth: 628123456789)"
                  value={newParticipantPhone}
                  onChange={(e) => setNewParticipantPhone(e.target.value)}
                  className="text-xs h-8"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingParticipant(false)}>
                    Batal
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={handleAddParticipant}>
                    Tambah Peserta
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {groupInfo.participants?.map((p) => {
                const phone = p.id.split('@')[0];
                const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                        {phone.slice(-2)}
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-foreground">{phone}</span>
                        {isAdmin && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {p.admin === 'superadmin' ? 'Superadmin' : 'Admin'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus status admin"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleParticipantAction('demote', p.id)}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Jadikan admin grup"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => handleParticipantAction('promote', p.id)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Keluarkan dari grup"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleParticipantAction('remove', p.id)}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group */}
          <div className="p-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveGroup}
              className="w-full text-xs gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar dari Grup
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
