import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | string;
  senderName?: string;
  timestamp?: number;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  senderName,
  timestamp,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, mediaUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPrev, hasNext, onPrev, onNext, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = `whatsapp-media-${Date.now()}`;
    targetBlankDownload(a);
  };

  const targetBlankDownload = (a: HTMLAnchorElement) => {
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-border/20 select-none">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground/90">{senderName || 'Media Viewer'}</span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
                title="Perkecil (-)"
                className="text-white hover:bg-white/10"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
                title="Perbesar (+)"
                className="text-white hover:bg-white/10"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                title="Putar 90°"
                className="text-white hover:bg-white/10"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download Media"
            className="text-white hover:bg-white/10"
          >
            <Download className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Tutup (Esc)"
            className="text-white hover:bg-destructive/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
        {hasPrev && onPrev && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-110 transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {hasNext && onNext && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/60 text-white hover:bg-black/80 hover:scale-110 transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-150 ease-out select-none">
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt="Lightbox Preview"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: '82vh',
                maxWidth: '90vw',
                objectFit: 'contain',
              }}
              className="rounded shadow-2xl transition-transform cursor-grab active:cursor-grabbing"
              draggable={false}
            />
          ) : mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[82vh] max-w-[90vw] rounded shadow-2xl"
            />
          ) : (
            <audio src={mediaUrl} controls autoPlay className="w-96" />
          )}
        </div>
      </div>
    </div>
  );
};
