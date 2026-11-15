import React from "react";

export interface AgentPortraitProps {
  variant?: string;
}

export default function AgentPortrait({ variant = "commander" }: AgentPortraitProps) {
  return (
    <div className={`agent-portrait ${variant}`} aria-hidden="true">
      <svg viewBox="0 0 160 132" role="img">
        <defs>
          <pattern id={`dots-${variant}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" opacity=".26" />
          </pattern>
        </defs>
        <path d="M22 120 L28 60 L48 22 L112 17 L139 56 L145 120 Z" fill="#242424" stroke="currentColor" strokeWidth="4" />
        <path d="M38 62 L50 30 L111 28 L129 62 L118 101 L45 104 Z" fill="#111" stroke="#f3ebd9" strokeWidth="3" />
        <path d="M49 58 L66 48 L73 63 L61 77 Z M89 62 L100 47 L116 58 L105 77 Z" fill="currentColor" />
        <path d="M64 89 L97 89 L88 98 L72 98 Z" fill="#f3ebd9" />
        <path d="M20 38 L43 15 L49 40 M116 27 L137 7 L132 43" fill="none" stroke="currentColor" strokeWidth="7" />
        <path d="M29 107 L12 120 M131 106 L148 120" stroke="#f3ebd9" strokeWidth="6" strokeLinecap="square" />
        <path d="M22 20 L138 20 L138 112 L22 112 Z" fill={`url(#dots-${variant})`} />
      </svg>
      <span className="portrait-glare" />
    </div>
  );
}
