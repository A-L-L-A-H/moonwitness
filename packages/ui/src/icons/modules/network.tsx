import { resolveIconSvgProps, type DnaIconProps } from "../types";

export function Globe(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M3.5 12 H20.5 M12 3 C15.5 7 15.5 17 12 21 C8.5 17 8.5 7 12 3 Z"
        stroke={accentColor}
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function Lock(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.1"
      />
      <path
        d="M8 10.5 V7.5 C8 5 9.8 3.5 12 3.5 C14.2 3.5 16 5 16 7.5 V10.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="15.5" r="1.5" fill={accentColor} />
    </svg>
  );
}

export function Unlock(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="4.5" y="10.5" width="15" height="10" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M8 10.5 V7 C8 4.8 9.8 3.5 12 3.5 C13.8 3.5 15.2 4.3 15.8 5.8"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="15.5" r="1.5" fill={accentColor} />
    </svg>
  );
}

export function Key(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="7.5,7.5 11.5,9.5 11.5,14.5 7.5,16.5 3.5,14.5 3.5,9.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M11.5 12 H21 V15.5 M17.5 12 V15"
        stroke={accentColor}
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Shield(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 20,6.5 19,14.5 12,21 5,14.5 4,6.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
      <path d="M9 12 L11.5 14.5 L15.5 9.5" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function Eye(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M2.5 12 L7.5 6.5 H16.5 L21.5 12 L16.5 17.5 H7.5 Z"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="2.8" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function EyeOff(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M2.5 12 L7.5 6.5 H16.5 L21.5 12 L16.5 17.5 H7.5 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeOpacity="0.7"
      />
      <path d="M4 4 L20 20" stroke={accentColor} strokeWidth="2.1" strokeLinecap="square" />
    </svg>
  );
}

export function MapPin(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,21 5.5,12 6.5,6.5 12,3.5 17.5,6.5 18.5,12"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
      <circle cx="12" cy="10" r="2.2" fill={accentColor} />
    </svg>
  );
}

export function Navigation(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="3.5,11 20.5,3.5 13,20.5 11,13"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.2"
      />
    </svg>
  );
}

export function Compass(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
      <polygon
        points="15.5,8.5 13.2,13.2 8.5,15.5 10.8,10.8"
        stroke={accentColor}
        strokeWidth="1.7"
        fill={accentColor}
        fillOpacity="0.25"
      />
    </svg>
  );
}

export function Target(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.8" stroke={accentColor} strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Zap(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="13.5,2.5 5,13.5 11.5,13.5 10.5,21.5 19,10.5 12.5,10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.24"
      />
    </svg>
  );
}

export function VpnTunnel(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,2.5 20,7 20,17 12,21.5 4,17 4,7"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.12"
      />
      <path
        d="M8.5 10 H15.5 M13 7.5 L15.5 10 L13 12.5 M15.5 14 H8.5 M11 11.5 L8.5 14 L11 16.5"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function SyslogStream(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M6.5 8.5 H14 M6.5 12 H17.5 M6.5 15.5 H12.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="15.5" y="7.5" width="2" height="2" fill={accentColor} />
      <rect x="15" y="14.5" width="2.5" height="2" fill={accentColor} />
    </svg>
  );
}

export function SnmpProbe(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke={accentColor}
        strokeWidth="1.4"
        strokeDasharray="2 2"
      />
      <path d="M12 12 L17.5 6.5" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function StorageBucket(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 20,7 12,11 4,7"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.18"
      />
      <path d="M4 7 V17 L12 21 L20 17 V7" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4 12 L12 16 L20 12" stroke={accentColor} strokeWidth="1.7" />
    </svg>
  );
}

export function RadiusKey(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,2.5 20,6 20,12.5 12,21.5 4,12.5 4,6"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="10.5" cy="11" r="2.2" stroke={accentColor} strokeWidth="1.8" />
      <path
        d="M12.7 11 H17 M15.5 11 V13.5"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function ArsyRelay(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 8.5 L7.5 21 M12 8.5 L16.5 21 M9 16.5 H15"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="7.5" r="1.8" fill={accentColor} />
      <path
        d="M7.5 4.5 C5 6.8 5 10.2 7.5 12.5 M16.5 4.5 C19 6.8 19 10.2 16.5 12.5"
        stroke={accentColor}
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function SimpulNode(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M6 16 L10.5 9.5 L15 14 L18.5 7.5" stroke={accentColor} strokeWidth="1.9" />
      <circle
        cx="6"
        cy="16"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.25"
      />
      <circle cx="10.5" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18.5" cy="7.5" r="2.2" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function Crosshair(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 2 V6.5 M12 17.5 V22 M2 12 H6.5 M17.5 12 H22"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="2" fill={accentColor} />
    </svg>
  );
}

export function GitBranch(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M6.5 7.5 V16.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M17.5 8.5 V11 L13 14.5 H6.5" stroke={accentColor} strokeWidth="1.9" fill="none" />
      <circle cx="6.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="2" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function GitCommitHorizontal(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M2.5 12 H8.5 M15.5 12 H21.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="3.5" stroke={accentColor} strokeWidth="2" />
    </svg>
  );
}

export function Radio(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M5.5 18.5 A9 9 0 0 1 5.5 5.5 M18.5 5.5 A9 9 0 0 1 18.5 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M8.5 15.5 A5 5 0 0 1 8.5 8.5 M15.5 8.5 A5 5 0 0 1 15.5 15.5"
        stroke={accentColor}
        strokeWidth="1.8"
        fill="none"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function RadioTower(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M7.5 11.5 A6 6 0 0 1 16.5 11.5 M4.5 8.5 A10 10 0 0 1 19.5 8.5"
        stroke={accentColor}
        strokeWidth="1.7"
        fill="none"
      />
      <circle cx="12" cy="11.5" r="1.8" fill="currentColor" />
      <path
        d="M12 13.5 L8 21.5 M12 13.5 L16 21.5 M9.5 18.5 H14.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function ShieldAlert(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 3 L19.5 6 V12 C19.5 16.8 16.2 19.8 12 21.5 C7.8 19.8 4.5 16.8 4.5 12 V6 Z"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M12 8 V13" stroke={accentColor} strokeWidth="2.1" strokeLinecap="square" />
      <circle cx="12" cy="16.5" r="1.2" fill={accentColor} />
    </svg>
  );
}

export function ShieldCheck(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 3 L19.5 6 V12 C19.5 16.8 16.2 19.8 12 21.5 C7.8 19.8 4.5 16.8 4.5 12 V6 Z"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M8.5 12 L11 14.5 L15.8 9.5"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}
