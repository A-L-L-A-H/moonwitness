import { resolveIconSvgProps, type DnaIconProps } from "../types";

export function Heart(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,20 4,12 4,7.5 7.5,4.5 12,8 16.5,4.5 20,7.5 20,12"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.18"
      />
    </svg>
  );
}

export function Star(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 14.5,9 21,9.6 16,13.8 17.5,20.2 12,16.8 6.5,20.2 8,13.8 3,9.6 9.5,9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.22"
      />
    </svg>
  );
}

export function Flag(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M5.5 3.5 V20.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" />
      <polygon
        points="5.5,4.5 19.5,4.5 17,8.5 19.5,12.5 5.5,12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.22"
      />
    </svg>
  );
}

export function Bookmark(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="6,3.5 18,3.5 18,20.5 12,15.5 6,20.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
    </svg>
  );
}

export function Tag(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="4,4 12,4 20.5,12.5 12.5,20.5 4,12" stroke="currentColor" strokeWidth="1.9" />
      <rect x="7" y="7" width="2.2" height="2.2" fill={accentColor} />
    </svg>
  );
}

export function Sun(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle
        cx="12"
        cy="12"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.18"
      />
      <path
        d="M12 2 V4.5 M12 19.5 V22 M4.93 4.93 L6.7 6.7 M17.3 17.3 L19.07 19.07 M2 12 H4.5 M19.5 12 H22 M4.93 19.07 L6.7 17.3 M17.3 6.7 L19.07 4.93"
        stroke={accentColor}
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function MtimeHorizon(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M2.5 17.5 H21.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" />
      <path
        d="M5.5 17.5 C6 11.5 10 8 15 8"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeDasharray="2 2"
      />
      <path
        d="M16.2 13.8 C13.6 14.2 11.5 12.1 11.5 9.5 C11.5 7.9 12.4 6.5 13.8 5.8 C11.3 6.1 9.5 8.2 9.5 10.7 C9.5 13.4 11.7 15.6 14.4 15.6 C16 15.6 17.5 14.8 18.4 13.6 C17.7 13.8 16.9 13.9 16.2 13.8 Z"
        fill={accentColor}
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function ScriptureFolio(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3 5 H10.5 L12 7 L13.5 5 H21 V19 H13.5 L12 20.5 L10.5 19 H3 Z"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M12 7 V20.5" stroke={accentColor} strokeWidth="1.8" />
      <path
        d="M5.5 9.5 H9.5 M5.5 13 H9.5 M14.5 9.5 H18.5 M14.5 13 H18.5"
        stroke={accentColor}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function MemoryTapeNode(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="2.5" y="5.5" width="19" height="13" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="8" cy="12" r="2.2" stroke={accentColor} strokeWidth="1.7" />
      <circle cx="16" cy="12" r="2.2" stroke={accentColor} strokeWidth="1.7" />
      <path d="M8 14.2 H16" stroke="currentColor" strokeWidth="1.6" />
      <polygon points="12,2.5 14,5.5 10,5.5" fill={accentColor} />
    </svg>
  );
}

export function MyceliumSpore(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 12 L6 6 M12 12 L18.5 7.5 M12 12 L6.5 18 M12 12 L18 17.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.8" fill={accentColor} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="1.8" stroke={accentColor} strokeWidth="1.6" />
      <circle cx="18.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6.5" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="17.5" r="1.8" stroke={accentColor} strokeWidth="1.6" />
    </svg>
  );
}

export function SkinPalette(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 20.5,8 12,13 3.5,8"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.22"
      />
      <path d="M3.5 12.5 L12 17.5 L20.5 12.5" stroke={accentColor} strokeWidth="1.8" />
      <path d="M3.5 16.5 L12 21.5 L20.5 16.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Sparkles(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="11,3 13,8.5 18.5,10.5 13,12.5 11,18 9,12.5 3.5,10.5 9,8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <polygon
        points="18.5,14 19.5,16.5 22,17.5 19.5,18.5 18.5,21 17.5,18.5 15,17.5 17.5,16.5"
        fill={accentColor}
      />
    </svg>
  );
}

export function Swords(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M14.5 17.5 L20.5 11.5 V4 H13 L7 10 M5 14 L9 18 M3.5 19.5 L6.5 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path
        d="M9.5 17.5 L3.5 11.5 V4 H11 L17 10 M19 14 L15 18 M20.5 19.5 L17.5 16.5"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Workflow(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="3.5" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="13.5" width="7" height="7" stroke={accentColor} strokeWidth="1.8" />
      <path d="M6.5 10.5 V17 H14" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}
