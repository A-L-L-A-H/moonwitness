// Moonwitness Artwork System -- Vector Primitives
// SVG icon primitives used throughout the design system

import React from 'react';

interface SVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

const createIcon = (paths: React.ReactNode, viewBox = '0 0 24 24') => {
  return function Icon({ size = 24, color = 'currentColor', className = '', ...props }: SVGProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {paths}
      </svg>
    );
  };
};

// Crown - authority, leadership
export const Crown = createIcon(
  <>
    <path d="M12 2l3 7h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" />
  </>
);

// Star4 - 4-pointed star (spark, highlight)
export const Star4 = createIcon(
  <>
    <path d="M12 2l1 5h5l-4 3 1 5-5-4-5 4 1-5-4-3h5z" />
  </>
);

// Tape - cassette tape / tape strip
export const Tape = createIcon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="7" cy="12" r="3" />
    <circle cx="17" cy="12" r="3" />
    <path d="M7 12h10" />
  </>
);

// Smiley - friendly, approachable
export const Smiley = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </>
);

// ArrowRight - navigation, forward
export const ArrowRight = createIcon(
  <>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </>
);

// ArrowLeft - navigation, back
export const ArrowLeft = createIcon(
  <>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </>
);

// ArrowUp - navigation, up
export const ArrowUp = createIcon(
  <>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </>
);

// ArrowDown - navigation, down
export const ArrowDown = createIcon(
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </>
);

// CassetteTape - music, audio, nostalgia
export const CassetteTape = createIcon(
  <>
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <circle cx="7" cy="12" r="3" />
    <circle cx="17" cy="12" r="3" />
    <path d="M7 12h10" />
    <rect x="6" y="17" width="12" height="2" rx="1" />
  </>
);

// Sparkles - magic, emphasis
export const Sparkles = createIcon(
  <>
    <path d="M12 2l1 5h5l-4 3 1 5-5-4-5 4 1-5-4-3h5z" />
    <path d="M18 8l1 3h3l-2 2 1 3-3-2-3 2 1-3-2-2h3z" />
    <path d="M6 16l1 2h2l-1-1 1-2-2-1-2 1-1 2 2 1z" />
  </>
);

// Zap - energy, speed, lightning
export const Zap = createIcon(
  <>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </>
);

// Heart - favorites, likes
export const Heart = createIcon(
  <>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </>
);

// Diamond - premium, quality
export const Diamond = createIcon(
  <>
    <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
    <path d="M9 16h6" />
    <path d="M12 14v4" />
  </>
);

// Eye - visibility, watch
export const Eye = createIcon(
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

// EyeOff - hidden, private
export const EyeOff = createIcon(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
);

// Mail - messages, contact
export const Mail = createIcon(
  <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </>
);

// MessageSquare - chat, comments
export const MessageSquare = createIcon(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>
);

// Settings - configuration, preferences
export const Settings = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
);

// Globe - world, network
export const Globe = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>
);

// Shield - security, protection
export const Shield = createIcon(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </>
);

// Lock - locked, secure
export const Lock = createIcon(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
);

// Unlock - unlocked, open
export const Unlock = createIcon(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <line x1="12" y1="16" x2="12" y2="16" />
  </>
);

// User - profile, account
export const User = createIcon(
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

// Users - team, collaboration
export const Users = createIcon(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);

// Menu - navigation menu
export const Menu = createIcon(
  <>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </>
);

// X - close, dismiss
export const X = createIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

// Check - confirm, success
export const Check = createIcon(
  <>
    <polyline points="20 6 9 17 4 12" />
  </>
);

// Plus - add, create
export const Plus = createIcon(
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

// Minus - remove, subtract
export const Minus = createIcon(
  <>
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

// Search - find, filter
export const Search = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
);

// Filter - filter, sort
export const Filter = createIcon(
  <>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>
);

// MoreHorizontal - more options
export const MoreHorizontal = createIcon(
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>
);

// MoreVertical - more options vertical
export const MoreVertical = createIcon(
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>
);

// ChevronRight - expand, next
export const ChevronRight = createIcon(
  <>
    <polyline points="9 18 15 12 9 6" />
  </>
);

// ChevronLeft - collapse, previous
export const ChevronLeft = createIcon(
  <>
    <polyline points="15 18 9 12 15 6" />
  </>
);

// ChevronUp - expand up
export const ChevronUp = createIcon(
  <>
    <polyline points="18 15 12 9 6 15" />
  </>
);

// ChevronDown - expand down
export const ChevronDown = createIcon(
  <>
    <polyline points="6 9 12 15 18 9" />
  </>
);

/** All icons as a registry */
export const vectorIcons = {
  Crown,
  Star4,
  Tape,
  Smiley,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CassetteTape,
  Sparkles,
  Zap,
  Heart,
  Diamond,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Settings,
  Globe,
  Shield,
  Lock,
  Unlock,
  User,
  Users,
  Menu,
  X,
  Check,
  Plus,
  Minus,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} as const;

export type VectorIconName = keyof typeof vectorIcons;
