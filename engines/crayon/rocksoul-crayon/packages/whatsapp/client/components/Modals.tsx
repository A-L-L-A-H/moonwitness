import React, { useState } from 'react';
import type { 
  StatusItem, 
  ProfileInfo, 
  ContactItem, 
  ChatItem, 
  MessageItem, 
  ChatMeta,
  AutoReplyItem,
  QuickReplyItem,
  ScheduledMessageItem
} from '../types.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Textarea } from './ui/textarea.js';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar.js';
import { 
  X, Play, Image as ImageIcon, Video, Plus, Trash2, 
  Tag, Calendar, Bot, Zap, Globe, FileCode, Check, 
  MapPin, BarChart2, User, Send, Forward 
} from 'lucide-react';

interface ModalsProps {
  // New Chat
  showNewChatModal: boolean;
  setShowNewChatModal: (show: boolean) => void;
  newChatPhone: string;
  setNewChatPhone: (phone: string) => void;
  onStartNewChat: () => void;

  // New Group
  showNewGroupModal?: boolean;
  setShowNewGroupModal?: (show: boolean) => void;
  newGroupSubject?: string;
  setNewGroupSubject?: (val: string) => void;
  newGroupParticipants?: string[];
  setNewGroupParticipants?: React.Dispatch<React.SetStateAction<string[]>>;
  onCreateGroup?: () => void;
  creatingGroup?: boolean;
  contacts?: ContactItem[];
  chats?: ChatItem[];

  // Media
  showMediaModal: boolean;
  setShowMediaModal: (show: boolean) => void;
  attachType: 'image' | 'document';
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  mediaCaption: string;
  setMediaCaption: (caption: string) => void;
  onSubmitMedia: () => void;

  // New Status
  showNewStatusModal: boolean;
  setShowNewStatusModal: (show: boolean) => void;
  newStatusText: string;
  setNewStatusText: (text: string) => void;
  newStatusImgUrl: string;
  setNewStatusImgUrl: (url: string) => void;
  onPostStatus: () => void;

  // View Status
  viewingStatus: StatusItem | null;
  setViewingStatus: (status: StatusItem | null) => void;

  // Profile
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  profileInfo: ProfileInfo | null;
  activeSession: string;
  editProfilePhotoUrl: string;
  setEditProfilePhotoUrl: (url: string) => void;
  editProfileName: string;
  setEditProfileName: (name: string) => void;
  editProfileStatus: string;
  setEditProfileStatus: (status: string) => void;
  profileSaving: boolean;
  onSaveProfile: () => void;

  // Phase 2: Poll Modal
  showPollModal?: boolean;
  setShowPollModal?: (show: boolean) => void;
  onSubmitPoll?: (question: string, options: string[]) => void;

  // Phase 2: Location Modal
  showLocationModal?: boolean;
  setShowLocationModal?: (show: boolean) => void;
  onSubmitLocation?: (lat: number, lng: number, name: string, address: string) => void;

  // Phase 2: Contact Modal
  showContactModal?: boolean;
  setShowContactModal?: (show: boolean) => void;
  onSubmitContact?: (displayName: string, phoneNumber: string) => void;

  // Phase 2: Forward Modal
  forwardMessageTarget?: MessageItem | null;
  setForwardMessageTarget?: (msg: MessageItem | null) => void;
  onConfirmForward?: (targetJid: string, message: MessageItem) => void;

  // Phase 2: CRM Label & Notes Modal
  labelModalJid?: string | null;
  setLabelModalJid?: (jid: string | null) => void;
  chatMeta?: ChatMeta;
  onSaveChatMeta?: (jid: string, meta: Partial<ChatMeta>) => void;

  // Phase 2: Enterprise Gateway Management Modal
  showGatewayModal?: boolean;
  setShowGatewayModal?: (show: boolean) => void;
  autoReplies?: AutoReplyItem[];
  onAddAutoReply?: (trigger: string, type: 'exact' | 'contains' | 'regex', reply: string) => void;
  onDeleteAutoReply?: (id: string) => void;
  quickReplies?: QuickReplyItem[];
  onAddQuickReply?: (shortcut: string, title: string, content: string) => void;
  onDeleteQuickReply?: (id: string) => void;
  scheduledMessages?: ScheduledMessageItem[];
  onAddScheduledMessage?: (remoteJid: string, text: string, scheduledAt: number) => void;
  onCancelScheduledMessage?: (id: string) => void;
}

export function Modals({
  showNewChatModal,
  setShowNewChatModal,
  newChatPhone,
  setNewChatPhone,
  onStartNewChat,

  showNewGroupModal,
  setShowNewGroupModal,
  newGroupSubject,
  setNewGroupSubject,
  newGroupParticipants,
  setNewGroupParticipants,
  onCreateGroup,
  creatingGroup,
  contacts = [],
  chats = [],

  showMediaModal,
  setShowMediaModal,
  attachType,
  mediaUrl,
  setMediaUrl,
  mediaCaption,
  setMediaCaption,
  onSubmitMedia,

  showNewStatusModal,
  setShowNewStatusModal,
  newStatusText,
  setNewStatusText,
  newStatusImgUrl,
  setNewStatusImgUrl,
  onPostStatus,

  viewingStatus,
  setViewingStatus,

  showProfileModal,
  setShowProfileModal,
  profileInfo,
  activeSession,
  editProfilePhotoUrl,
  setEditProfilePhotoUrl,
  editProfileName,
  setEditProfileName,
  editProfileStatus,
  setEditProfileStatus,
  profileSaving,
  onSaveProfile,

  showPollModal,
  setShowPollModal,
  onSubmitPoll,

  showLocationModal,
  setShowLocationModal,
  onSubmitLocation,

  showContactModal,
  setShowContactModal,
  onSubmitContact,

  forwardMessageTarget,
  setForwardMessageTarget,
  onConfirmForward,

  labelModalJid,
  setLabelModalJid,
  chatMeta,
  onSaveChatMeta,

  showGatewayModal,
  setShowGatewayModal,
  autoReplies = [],
  onAddAutoReply,
  onDeleteAutoReply,
  quickReplies = [],
  onAddQuickReply,
  onDeleteQuickReply,
  scheduledMessages = [],
  onAddScheduledMessage,
  onCancelScheduledMessage,
}: ModalsProps) {
  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Pilihan 1', 'Pilihan 2']);

  // Location state
  const [locLat, setLocLat] = useState(-6.2088);
  const [locLng, setLocLng] = useState(106.8456);
  const [locName, setLocName] = useState('Jakarta');
  const [locAddress, setLocAddress] = useState('DKI Jakarta, Indonesia');

  // Contact state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Forward state
  const [forwardFilter, setForwardFilter] = useState('');

  // CRM Label state
  const [selectedLabels, setSelectedLabels] = useState<string[]>(chatMeta?.labels || []);
  const [internalNotes, setInternalNotes] = useState(chatMeta?.internalNotes || '');
  const [newLabelInput, setNewLabelInput] = useState('');

  // Gateway Modal tabs
  const [gatewayTab, setGatewayTab] = useState<'autoreply' | 'quickreply' | 'scheduler' | 'api'>('autoreply');
  // New autoreply state
  const [arTrigger, setArTrigger] = useState('');
  const [arType, setArType] = useState<'exact' | 'contains' | 'regex'>('contains');
  const [arReply, setArReply] = useState('');
  // New quick reply state
  const [qrShortcut, setQrShortcut] = useState('');
  const [qrTitle, setQrTitle] = useState('');
  const [qrContent, setQrContent] = useState('');
  // New scheduler state
  const [schedJid, setSchedJid] = useState('');
  const [schedText, setSchedText] = useState('');
  const [schedMinutes, setSchedMinutes] = useState(5);

  return (
    <>
      {/* 1. NEW CHAT MODAL */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Obrolan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs text-[#8696a0] font-medium block">
              Nomor WhatsApp Tujuan (dengan kode negara)
            </label>
            <Input
              placeholder="contoh: 08123456789 atau 628123456789"
              value={newChatPhone}
              onChange={(e) => setNewChatPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onStartNewChat()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChatModal(false)}>
              Batal
            </Button>
            <Button variant="default" onClick={onStartNewChat}>
              Buka Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. MEDIA MODAL */}
      <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {attachType === 'image' ? 'Kirim Foto / Gambar' : 'Kirim File Dokumen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8696a0] font-medium block mb-1">
                URL Media (Foto atau File Dokumen)
              </label>
              <Input
                placeholder="https://example.com/file.jpg atau .pdf"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[#8696a0] font-medium block mb-1">
                Keterangan / Caption (Opsional)
              </label>
              <Input
                placeholder="Pesan keterangan..."
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmitMedia()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMediaModal(false)}>
              Batal
            </Button>
            <Button variant="default" onClick={onSubmitMedia}>
              Kirim Media
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. NEW STATUS MODAL */}
      <Dialog open={showNewStatusModal} onOpenChange={setShowNewStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Pembaruan Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8696a0] font-medium block mb-1">
                Teks Status
              </label>
              <Textarea
                placeholder="Tulis status yang ingin Anda bagikan..."
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[#8696a0] font-medium block mb-1">
                URL Gambar (Opsional jika ingin status gambar)
              </label>
              <Input
                placeholder="https://example.com/status-photo.jpg"
                value={newStatusImgUrl}
                onChange={(e) => setNewStatusImgUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStatusModal(false)}>
              Batal
            </Button>
            <Button variant="default" onClick={onPostStatus}>
              Bagikan Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. STATUS VIEWER MODAL */}
      {viewingStatus && (
        <div className="modal-backdrop" onClick={() => setViewingStatus(null)}>
          <div className="status-viewer-box" onClick={(e) => e.stopPropagation()}>
            <div className="status-viewer-header">
              <div className="status-viewer-sender">
                <span className="status-viewer-name">
                  {viewingStatus.senderName || `+${viewingStatus.senderNumber}`}
                </span>
                <span className="status-viewer-time">
                  {new Date(viewingStatus.timestamp * 1000).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-[#8696a0] hover:text-white"
                onClick={() => setViewingStatus(null)}
                title="Tutup"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="status-viewer-content">
              {viewingStatus.mediaUrl || viewingStatus.thumbnail ? (
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={viewingStatus.mediaUrl || viewingStatus.thumbnail}
                    alt="Status Media"
                    className="status-viewer-image"
                  />
                  {viewingStatus.mediaType === 'video' && !viewingStatus.mediaUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      padding: '16px',
                      color: '#fff'
                    }}>
                      <Play size={32} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="status-viewer-text-card">
                  {viewingStatus.mediaType === 'image' && (
                    <div style={{ marginBottom: '12px', opacity: 0.8 }}><ImageIcon size={36} /></div>
                  )}
                  {viewingStatus.mediaType === 'video' && (
                    <div style={{ marginBottom: '12px', opacity: 0.8 }}><Video size={36} /></div>
                  )}
                  <p>{viewingStatus.text || viewingStatus.caption || (viewingStatus.mediaType === 'video' ? 'Status Video' : viewingStatus.mediaType === 'image' ? 'Status Foto' : 'Status WhatsApp')}</p>
                </div>
              )}
              {(viewingStatus.caption || viewingStatus.text) && (viewingStatus.mediaUrl || viewingStatus.thumbnail) && (
                <div className="status-viewer-caption">
                  {viewingStatus.caption || viewingStatus.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PROFILE & PHOTO MODAL */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil & Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center mb-4">
            <Avatar className="w-24 h-24 border-2 border-[#00a884] shadow-lg mb-2">
              {editProfilePhotoUrl ? (
                <AvatarImage src={editProfilePhotoUrl} alt="Preview" />
              ) : profileInfo?.imgUrl ? (
                <AvatarImage src={profileInfo.imgUrl} alt="Avatar" />
              ) : null}
              <AvatarFallback className="text-2xl bg-[#00a884]">
                WA
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              +{profileInfo?.phone || activeSession}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                URL Foto Profil Baru
              </label>
              <Input
                placeholder="https://example.com/my-avatar.jpg"
                value={editProfilePhotoUrl}
                onChange={(e) => setEditProfilePhotoUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Nama Tampilan
              </label>
              <Input
                placeholder="Nama Anda..."
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Info / Status (About)
              </label>
              <Input
                placeholder="Ada panggilan saja / Sibuk / Tersedia..."
                value={editProfileStatus}
                onChange={(e) => setEditProfileStatus(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={onSaveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. NEW GROUP MODAL */}
      <Dialog open={!!showNewGroupModal} onOpenChange={setShowNewGroupModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Buat Grup Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Subjek / Nama Grup
              </label>
              <Input
                placeholder="cth. Tim Kerja Rocksoul"
                value={newGroupSubject || ''}
                onChange={(e) => setNewGroupSubject?.(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Pilih Peserta ({newGroupParticipants?.length || 0} dipilih)
              </label>
              <div className="group-participants-list max-h-52 overflow-y-auto space-y-1">
                {contacts && contacts.length > 0 ? (
                  contacts.map((c) => {
                    const contactId = c.id || '';
                    const isSelected = newGroupParticipants?.includes(contactId);
                    const phoneDisplay = contactId.includes('@') ? contactId.split('@')[0] : contactId;
                    return (
                      <div
                        key={contactId}
                        className="group-participant-item flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                        onClick={() => {
                          if (!setNewGroupParticipants) return;
                          if (isSelected) {
                            setNewGroupParticipants((prev) => prev.filter((id) => id !== contactId));
                          } else {
                            setNewGroupParticipants((prev) => [...prev, contactId]);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => {}}
                          className="accent-primary"
                        />
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>{(c.name || phoneDisplay || 'U')[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-medium text-foreground">
                            {c.name || phoneDisplay}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {phoneDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Belum ada kontak tersinkron. Masukkan kontak terlebih dahulu.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupModal?.(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={onCreateGroup}
              disabled={creatingGroup || !newGroupSubject?.trim() || !newGroupParticipants?.length}
            >
              {creatingGroup ? 'Membuat Grup...' : 'Buat Grup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. POLL CREATION MODAL */}
      <Dialog open={!!showPollModal} onOpenChange={setShowPollModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Buat Polling WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Pertanyaan Polling
              </label>
              <Input
                placeholder="cth: Jadwal rapat tim berikutnya?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Opsi Pilihan (Minimal 2)
              </label>
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Pilihan ${i + 1}`}
                      className="text-xs h-8"
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-primary gap-1"
                onClick={() => setPollOptions([...pollOptions, `Pilihan ${pollOptions.length + 1}`])}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pilihan
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPollModal?.(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (onSubmitPoll && pollQuestion.trim() && pollOptions.filter(Boolean).length >= 2) {
                  onSubmitPoll(pollQuestion.trim(), pollOptions.filter(Boolean));
                  setShowPollModal?.(false);
                  setPollQuestion('');
                  setPollOptions(['Pilihan 1', 'Pilihan 2']);
                }
              }}
              disabled={!pollQuestion.trim() || pollOptions.filter(Boolean).length < 2}
            >
              Kirim Polling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. LOCATION SHARING MODAL */}
      <Dialog open={!!showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Bagikan Lokasi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Nama Tempat</label>
              <Input
                placeholder="Kantor Rocksoul / Monas"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Alamat Lengkap</label>
              <Input
                placeholder="Jl. Medan Merdeka Barat No. 12, Jakarta"
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={locLat}
                  onChange={(e) => setLocLat(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={locLng}
                  onChange={(e) => setLocLng(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationModal?.(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (onSubmitLocation) {
                  onSubmitLocation(locLat, locLng, locName, locAddress);
                  setShowLocationModal?.(false);
                }
              }}
            >
              Bagikan Lokasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. CONTACT SHARING MODAL */}
      <Dialog open={!!showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Bagikan Kontak (vCard)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Nama Kontak</label>
              <Input
                placeholder="Budi Santoso"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Nomor Telepon</label>
              <Input
                placeholder="628123456789"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactModal?.(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (onSubmitContact && contactName.trim() && contactPhone.trim()) {
                  onSubmitContact(contactName.trim(), contactPhone.trim());
                  setShowContactModal?.(false);
                  setContactName('');
                  setContactPhone('');
                }
              }}
              disabled={!contactName.trim() || !contactPhone.trim()}
            >
              Kirim Kontak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. FORWARD MESSAGE MODAL */}
      <Dialog open={!!forwardMessageTarget} onOpenChange={(open) => !open && setForwardMessageTarget?.(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="w-5 h-5 text-primary" />
              Teruskan Pesan Ke...
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Cari obrolan atau kontak..."
              value={forwardFilter}
              onChange={(e) => setForwardFilter(e.target.value)}
              className="text-xs"
            />
            <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-border/30">
              {chats
                .filter((c) => (c.name || c.remoteJid).toLowerCase().includes(forwardFilter.toLowerCase()))
                .map((c) => (
                  <div
                    key={c.remoteJid}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer group"
                    onClick={() => {
                      if (onConfirmForward && forwardMessageTarget) {
                        onConfirmForward(c.remoteJid, forwardMessageTarget);
                        setForwardMessageTarget?.(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>{(c.name || c.remoteJid)[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate text-foreground">
                        {c.name || c.remoteJid.split('@')[0]}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-primary opacity-0 group-hover:opacity-100">
                      Kirim
                    </Button>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardMessageTarget?.(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 11. CRM LABELS & NOTES MODAL */}
      <Dialog open={!!labelModalJid} onOpenChange={(open) => !open && setLabelModalJid?.(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Kelola Label & Catatan CRM
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Label Chat Saat Ini
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedLabels.map((lbl) => (
                  <span
                    key={lbl}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1"
                  >
                    {lbl}
                    <button
                      type="button"
                      onClick={() => setSelectedLabels(selectedLabels.filter((l) => l !== lbl))}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tambah label baru (cth: VIP, Lead, Follow-up)..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newLabelInput.trim()) {
                      setSelectedLabels([...selectedLabels, newLabelInput.trim()]);
                      setNewLabelInput('');
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (newLabelInput.trim()) {
                      setSelectedLabels([...selectedLabels, newLabelInput.trim()]);
                      setNewLabelInput('');
                    }
                  }}
                >
                  Tambah
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Catatan Internal CRM (Hanya terlihat oleh tim Anda)
              </label>
              <Textarea
                placeholder="Tulis catatan penting seputar klien ini..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabelModalJid?.(null)}>
              Batal
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (labelModalJid && onSaveChatMeta) {
                  onSaveChatMeta(labelModalJid, { labels: selectedLabels, internalNotes });
                  setLabelModalJid?.(null);
                }
              }}
            >
              Simpan Metadata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 12. ENTERPRISE GATEWAY & AUTOMATION MANAGER MODAL */}
      <Dialog open={!!showGatewayModal} onOpenChange={setShowGatewayModal}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Enterprise Gateway & Otomasi
            </DialogTitle>
          </DialogHeader>

          {/* Tab Navigation */}
          <div className="flex border-b border-border text-xs">
            <button
              className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 ${gatewayTab === 'autoreply' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setGatewayTab('autoreply')}
            >
              <Bot className="w-3.5 h-3.5" />
              Auto-Reply ({autoReplies.length})
            </button>
            <button
              className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 ${gatewayTab === 'quickreply' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setGatewayTab('quickreply')}
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Replies ({quickReplies.length})
            </button>
            <button
              className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 ${gatewayTab === 'scheduler' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setGatewayTab('scheduler')}
            >
              <Calendar className="w-3.5 h-3.5" />
              Scheduler ({scheduledMessages.length})
            </button>
            <button
              className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 ${gatewayTab === 'api' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setGatewayTab('api')}
            >
              <FileCode className="w-3.5 h-3.5" />
              API & Docs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-4">
            {/* AUTO REPLY TAB */}
            {gatewayTab === 'autoreply' && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                  <span className="text-xs font-semibold block">Tambah Aturan Auto-Reply</span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Kata Kunci Trigger"
                      value={arTrigger}
                      onChange={(e) => setArTrigger(e.target.value)}
                      className="text-xs h-8"
                    />
                    <select
                      value={arType}
                      onChange={(e) => setArType(e.target.value as any)}
                      className="text-xs h-8 rounded border border-border bg-background px-2"
                    >
                      <option value="contains">Teks Mengandung</option>
                      <option value="exact">Sama Persis</option>
                      <option value="regex">Regex</option>
                    </select>
                    <Input
                      placeholder="Teks Balasan Otomatis"
                      value={arReply}
                      onChange={(e) => setArReply(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (onAddAutoReply && arTrigger.trim() && arReply.trim()) {
                        onAddAutoReply(arTrigger.trim(), arType, arReply.trim());
                        setArTrigger('');
                        setArReply('');
                      }
                    }}
                    disabled={!arTrigger.trim() || !arReply.trim()}
                  >
                    Tambah Auto-Reply
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {autoReplies.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada aturan auto-reply aktif.</p>
                  ) : (
                    autoReplies.map((ar) => (
                      <div key={ar.id} className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs">
                        <div>
                          <span className="font-semibold text-foreground">Trigger: "{ar.triggerKeyword}"</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({ar.matchType})</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ar.replyText}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteAutoReply?.(ar.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* QUICK REPLIES TAB */}
            {gatewayTab === 'quickreply' && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                  <span className="text-xs font-semibold block">Tambah Balasan Cepat (Ketik / di chat)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Shortcut (cth: ongkir, rek, halo)"
                      value={qrShortcut}
                      onChange={(e) => setQrShortcut(e.target.value.replace('/', ''))}
                      className="text-xs h-8"
                    />
                    <Input
                      placeholder="Judul / Kategori"
                      value={qrTitle}
                      onChange={(e) => setQrTitle(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <Textarea
                    placeholder="Isi pesan lengkap yang akan disisipkan saat shortcut dipilih..."
                    value={qrContent}
                    onChange={(e) => setQrContent(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (onAddQuickReply && qrShortcut.trim() && qrContent.trim()) {
                        onAddQuickReply(qrShortcut.trim(), qrTitle.trim() || qrShortcut.trim(), qrContent.trim());
                        setQrShortcut('');
                        setQrTitle('');
                        setQrContent('');
                      }
                    }}
                    disabled={!qrShortcut.trim() || !qrContent.trim()}
                  >
                    Simpan Quick Reply
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {quickReplies.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada quick reply tersimpan.</p>
                  ) : (
                    quickReplies.map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs">
                        <div>
                          <span className="font-semibold text-primary">/{qr.shortcut}</span>
                          <span className="font-medium text-foreground ml-2">{qr.title}</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-md">{qr.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteQuickReply?.(qr.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCHEDULER TAB */}
            {gatewayTab === 'scheduler' && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                  <span className="text-xs font-semibold block">Jadwalkan Pesan Otomatis</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nomor Penerima (cth: 628123456789)"
                      value={schedJid}
                      onChange={(e) => setSchedJid(e.target.value)}
                      className="text-xs h-8"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Kirim dalam:</span>
                      <Input
                        type="number"
                        min="1"
                        value={schedMinutes}
                        onChange={(e) => setSchedMinutes(parseInt(e.target.value) || 1)}
                        className="text-xs h-8 w-20"
                      />
                      <span className="text-xs text-muted-foreground">menit</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Isi pesan yang dijadwalkan..."
                    value={schedText}
                    onChange={(e) => setSchedText(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (onAddScheduledMessage && schedJid.trim() && schedText.trim()) {
                        let cleanJid = schedJid.replace(/[^0-9]/g, '');
                        if (!cleanJid.includes('@')) cleanJid = `${cleanJid}@s.whatsapp.net`;
                        const targetTime = Date.now() + schedMinutes * 60 * 1000;
                        onAddScheduledMessage(cleanJid, schedText.trim(), targetTime);
                        setSchedJid('');
                        setSchedText('');
                      }
                    }}
                    disabled={!schedJid.trim() || !schedText.trim()}
                  >
                    Jadwalkan Pesan
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {scheduledMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Tidak ada pesan yang sedang dijadwalkan.</p>
                  ) : (
                    scheduledMessages.map((sm) => (
                      <div key={sm.id} className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs">
                        <div>
                          <span className="font-semibold text-foreground">Ke: {sm.remoteJid.split('@')[0]}</span>
                          <span className="text-[10px] ml-2 px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                            Status: {sm.status}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{sm.text}</p>
                          <span className="text-[10px] text-muted-foreground">
                            Dijadwalkan: {new Date(sm.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {sm.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onCancelScheduledMessage?.(sm.id)}
                            title="Batalkan jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* API & DOCS TAB */}
            {gatewayTab === 'api' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-primary" />
                    OpenAPI Swagger Documentation
                  </h4>
                  <p className="text-muted-foreground">
                    Dokumentasi API interaktif lengkap dengan REST endpoints, parameter request/response, dan pengujian API langsung.
                  </p>
                  <a
                    href="/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Buka Swagger OpenAPI (/api/docs)
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                  <h4 className="font-semibold text-foreground">Prometheus Metrics</h4>
                  <p className="text-muted-foreground">
                    Endpoint monitoring uptime server, HTTP request rates, active Baileys socket connections, dan latency.
                  </p>
                  <a
                    href="/metrics"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    Lihat Prometheus Metrics (/metrics)
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                  <h4 className="font-semibold text-foreground">Database SQLite Backup Snapshot</h4>
                  <p className="text-muted-foreground">
                    Unduh snapshot file database `whatsapp.db` secara langsung untuk pencadangan berkala.
                  </p>
                  <a
                    href="/api/admin/backup"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    Download Database Backup (/api/admin/backup)
                  </a>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGatewayModal?.(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
