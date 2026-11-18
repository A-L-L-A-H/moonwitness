import type { BrandLogoId } from "./meta";

export function BrandGlyph({ id }: { id: BrandLogoId }) {
  const sw = "var(--mw-icon-stroke, 2.2)";
  switch (id) {
    case "moonwitness":
      return (
        <g>
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="6"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <path
            d="M15 16L19 11L24 15L29 11L33 16"
            stroke="var(--primary)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.5 18.5A9.5 9.5 0 1 0 32 32A8.5 8.5 0 0 1 27.5 18.5Z"
            fill="var(--primary)"
          />
          <circle cx="30" cy="23" r="2.2" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "01-imperium-lumen":
      return (
        <g>
          <polygon
            points="24,3 43,14 43,34 24,45 5,34 5,14"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="24,9 36,24 24,39 12,24"
            stroke="var(--foreground)"
            strokeWidth={sw}
            fill="none"
          />
          <line x1="24" y1="6" x2="24" y2="42" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="4" fill="var(--primary)" />
        </g>
      );
    case "02-lunar-chronicles":
      return (
        <g>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <circle
            cx="24"
            cy="24"
            r="14"
            stroke="var(--primary)"
            strokeWidth={sw}
            strokeDasharray="4 3"
          />
          <path
            d="M28 14A10 10 0 1 0 31 32A8.5 8.5 0 0 1 28 14Z"
            fill="var(--primary)"
          />
          <circle cx="33" cy="17" r="2" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "03-rocksoul":
      return (
        <g>
          <polygon
            points="10,6 38,6 44,24 38,42 10,42 4,24"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polyline
            points="11,26 16,26 19,15 24,33 29,18 32,26 37,26"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="14" y1="11" x2="34" y2="11" stroke="var(--secondary, var(--primary))" strokeWidth={sw} />
        </g>
      );
    case "04-nexus-paradox":
      return (
        <g>
          <rect
            x="5"
            y="5"
            width="38"
            height="38"
            rx="4"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <path
            d="M14 14H28L34 20V34H20L14 28V14Z"
            stroke="var(--primary)"
            strokeWidth={sw}
            fill="none"
          />
          <line x1="14" y1="34" x2="34" y2="14" stroke="var(--secondary, var(--foreground))" strokeWidth={sw} />
          <circle cx="14" cy="14" r="2.5" fill="var(--primary)" />
          <circle cx="34" cy="34" r="2.5" fill="var(--primary)" />
          <circle cx="24" cy="24" r="3" fill="var(--foreground)" />
        </g>
      );
    case "05-riot-anarchy":
      return (
        <g>
          <polygon
            points="6,9 42,5 40,39 8,43"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="14,34 24,10 34,34 27,34 24,25 21,34"
            fill="var(--primary)"
          />
          <line
            x1="10"
            y1="26"
            x2="38"
            y2="20"
            stroke="var(--secondary, var(--foreground))"
            strokeWidth={sw}
            strokeLinecap="square"
          />
        </g>
      );
    case "06-mycelium":
      return (
        <g>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <line x1="24" y1="24" x2="24" y2="11" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="24" x2="13" y2="31" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="24" x2="35" y2="31" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="4.5" fill="var(--primary)" />
          <circle cx="24" cy="11" r="3" fill="var(--secondary, var(--foreground))" />
          <circle cx="13" cy="31" r="3" fill="var(--secondary, var(--foreground))" />
          <circle cx="35" cy="31" r="3" fill="var(--secondary, var(--foreground))" />
        </g>
      );
    case "09-simpul-nusantara":
      return (
        <g>
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="8"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="24,11 37,24 24,37 11,24"
            stroke="var(--secondary, var(--foreground))"
            strokeWidth={sw}
            fill="none"
          />
          <polygon
            points="24,16 32,24 24,32 16,24"
            fill="var(--primary)"
            fillOpacity="0.85"
          />
          <circle cx="24" cy="24" r="2.2" fill="var(--background)" />
        </g>
      );
    case "arsy":
      return (
        <g>
          <polygon
            points="24,4 44,24 24,44 4,24"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polyline
            points="16,29 24,13 32,29"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="18" y1="24" x2="30" y2="24" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="13" r="2.3" fill="var(--secondary, var(--primary))" />
        </g>
      );
    case "memory":
      return (
        <g>
          <rect
            x="4"
            y="10"
            width="40"
            height="28"
            rx="4"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <rect
            x="10"
            y="16"
            width="28"
            height="12"
            rx="2"
            stroke="var(--border)"
            strokeWidth="1.5"
            fill="var(--background)"
          />
          <circle cx="17" cy="22" r="3.2" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <circle cx="31" cy="22" r="3.2" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <line x1="20.2" y1="22" x2="27.8" y2="22" stroke="var(--secondary, var(--foreground))" strokeWidth="1.5" />
          <polygon points="14,38 34,38 31,33 17,33" fill="var(--foreground)" fillOpacity="0.2" stroke="var(--border)" strokeWidth="1.2" />
        </g>
      );
    case "mission-control":
      return (
        <g>
          <rect x="4" y="4" width="40" height="40" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="13" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="5" fill="var(--primary)" />
          <line x1="24" y1="6" x2="24" y2="14" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="24" y1="34" x2="24" y2="42" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="6" y1="24" x2="14" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="34" y1="24" x2="42" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
        </g>
      );
    case "dock-chronicle":
      return (
        <g>
          <rect x="5" y="6" width="38" height="36" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <line x1="12" y1="16" x2="36" y2="16" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="12" y1="24" x2="32" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="12" y1="32" x2="28" y2="32" stroke="var(--secondary, var(--accent))" strokeWidth={sw} />
          <circle cx="34" cy="32" r="3" fill="var(--primary)" />
        </g>
      );
    case "scriptures-codex":
      return (
        <g>
          <rect x="6" y="7" width="36" height="34" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="7" x2="24" y2="41" stroke="var(--primary)" strokeWidth="1.6" />
          <polygon points="15,15 19,20 15,25 11,20" fill="var(--primary)" />
          <polygon points="33,15 37,20 33,25 29,20" fill="var(--foreground)" fillOpacity="0.6" />
          <line x1="11" y1="32" x2="19" y2="32" stroke="var(--border)" strokeWidth="1.6" />
          <line x1="29" y1="32" x2="37" y2="32" stroke="var(--border)" strokeWidth="1.6" />
        </g>
      );
    case "mtime-horizon":
      return (
        <g>
          <circle cx="24" cy="24" r="19" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <path d="M9 28H39" stroke="var(--foreground)" strokeWidth={sw} />
          <path d="M16 28A8 8 0 0 1 32 28" fill="var(--primary)" />
          <circle cx="33" cy="14" r="2.5" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "id-lab":
      return (
        <g>
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="24" cy="19" r="6" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <path d="M14 36C15.5 29.5 19 27 24 27C29 27 32.5 29.5 34 36" stroke="var(--foreground)" strokeWidth={sw} fill="none" />
        </g>
      );
    case "addon-studio":
      return (
        <g>
          <rect x="6" y="6" width="16" height="16" rx="2" fill="var(--primary)" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="26" y="6" width="16" height="16" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <rect x="6" y="26" width="16" height="16" rx="2" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="26" y="26" width="16" height="16" rx="2" fill="var(--secondary, var(--accent))" stroke="var(--border)" strokeWidth="1.5" />
        </g>
      );
    case "shadow-frequency":
      return (
        <g>
          <rect x="5" y="5" width="38" height="38" rx="19" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <polyline points="10,24 16,14 21,33 27,12 32,30 38,24" stroke="var(--primary)" strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "noc-gateway":
      return (
        <g>
          <rect x="5" y="9" width="38" height="30" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="14" cy="24" r="3.5" fill="var(--green)" />
          <circle cx="24" cy="24" r="3.5" fill="var(--primary)" />
          <circle cx="34" cy="24" r="3.5" fill="var(--secondary, var(--accent))" />
          <line x1="14" y1="15" x2="34" y2="15" stroke="var(--border)" strokeWidth="1.5" />
        </g>
      );
  }
}
