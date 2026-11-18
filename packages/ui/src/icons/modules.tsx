import { resolveIconSvgProps, type DnaIconProps } from "./types";

export function Menu(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3.5 6.5 H20.5 M3.5 12 H17 M3.5 17.5 H20.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <rect x="19" y="11" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function Settings(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="9.5,3 14.5,3 16,6.2 19.5,7.5 21,12 19.5,16.5 16,17.8 14.5,21 9.5,21 8,17.8 4.5,16.5 3,12 4.5,7.5 8,6.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function User(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3.5 15.5,7 12,11 8.5,7"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.18"
      />
      <path
        d="M4.5 20.5 L6.5 15.5 H17.5 L19.5 20.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function LogOut(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M10 4 H4.5 V20 H10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="square" />
      <path
        d="M9.5 12 H20 M15.5 7.5 L20 12 L15.5 16.5"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Bell(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M6.5 16 L8 7.5 L12 4 L16 7.5 L17.5 16 H6.5 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.12"
      />
      <path
        d="M4 16 H20 M10 19.5 H14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Mail(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="5" width="18" height="14" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3 6.5 L12 13 L21 6.5" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function Home(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3 11.5 L12 3.5 L21 11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path d="M5.5 10 V20 H18.5 V10" stroke="currentColor" strokeWidth="1.9" />
      <rect x="10" y="13.5" width="4" height="6.5" stroke={accentColor} strokeWidth="1.7" />
    </svg>
  );
}

export function Copy(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15.5 8.5 V4 H4 V15.5 H8.5" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function Edit(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M13 5 L19 11 L9 20 H4 V15 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
      <path d="M11 7 L17 13" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function Trash2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M4 6.5 H20 M9 6.5 V4 H15 V6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M6.5 6.5 L7.5 20 H16.5 L17.5 6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M10.2 10.5 V16 M13.8 10.5 V16" stroke={accentColor} strokeWidth="1.7" />
    </svg>
  );
}

export function Download(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 3.5 V15.5 M7 11 L12 16 L17 11"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M4 16.5 V20 H20 V16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Upload(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 16 V4.5 M7 9 L12 4 L17 9"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M4 16.5 V20 H20 V16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Share2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M8.5 11 L15.5 7 M8.5 13 L15.5 17" stroke="currentColor" strokeWidth="1.8" />
      <circle
        cx="6"
        cy="12"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.25"
      />
      <circle cx="17.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="18" r="2.5" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function ExternalLink(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M14 4 H20 V10 M11 13 L20 4"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path d="M11 6 H4.5 V19.5 H18 V13" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

export function Info(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,2.5 21.5,12 12,21.5 2.5,12"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.1"
      />
      <path d="M12 11 V16.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <rect x="11" y="7" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function AlertCircle(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="7.5,3 16.5,3 21,7.5 21,16.5 16.5,21 7.5,21 3,16.5 3,7.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M12 7.5 V13" stroke={accentColor} strokeWidth="2.1" strokeLinecap="square" />
      <rect x="11" y="15.5" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export function AlertTriangle(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 21.5,20 2.5,20"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.12"
      />
      <path d="M12 9.5 V14" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <rect x="11" y="16" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function HelpCircle(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="12,2.5 21.5,12 12,21.5 2.5,12" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M9.5 9.5 C9.5 8 10.8 7 12 7 C13.5 7 14.5 8 14.5 9.5 C14.5 11 12 11.5 12 13"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <rect x="11" y="15.5" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function Expand(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M4 9 V4 H9 M15 4 H20 V9 M4 15 V20 H9 M20 15 V20 H15"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="2" stroke={accentColor} strokeWidth="1.6" />
    </svg>
  );
}

export function Minimize(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M9 4 V9 H4 M15 4 V9 H20 M9 20 V15 H4 M15 20 V15 H20"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <rect x="10.8" y="10.8" width="2.4" height="2.4" fill={accentColor} />
    </svg>
  );
}

export function Maximize2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M14 4 H20 V10 M10 20 H4 V14" stroke="currentColor" strokeWidth="1.9" />
      <path d="M20 4 L14 10 M4 20 L10 14" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function Minimize2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M4 14 H10 V20 M20 10 H14 V4" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3.5 20.5 L10 14 M20.5 3.5 L14 10" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function PanelLeft(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 4 V20" stroke="currentColor" strokeWidth="1.9" />
      <rect x="5" y="6.5" width="2" height="11" fill={accentColor} fillOpacity="0.65" />
    </svg>
  );
}

export function PanelRight(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15 4 V20" stroke="currentColor" strokeWidth="1.9" />
      <rect x="17" y="6.5" width="2" height="11" fill={accentColor} fillOpacity="0.65" />
    </svg>
  );
}

export function PanelTop(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3 9.5 H21" stroke="currentColor" strokeWidth="1.9" />
      <rect x="5.5" y="6" width="13" height="1.8" fill={accentColor} fillOpacity="0.65" />
    </svg>
  );
}

export function PanelBottom(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3 14.5 H21" stroke="currentColor" strokeWidth="1.9" />
      <rect x="5.5" y="16.2" width="13" height="1.8" fill={accentColor} fillOpacity="0.65" />
    </svg>
  );
}

export function Sidebar(props: DnaIconProps) {
  return <PanelLeft {...props} />;
}

export function Layout(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path d="M3 9.5 H21 M9.5 9.5 V20" stroke="currentColor" strokeWidth="1.8" />
      <rect x="5" y="11.5" width="2.5" height="6.5" fill={accentColor} fillOpacity="0.45" />
    </svg>
  );
}

export function Grid(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3.5" y="3.5" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" stroke={accentColor} strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" stroke={accentColor} strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function List(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M8.5 6.5 H20.5 M8.5 12 H20.5 M8.5 17.5 H20.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <rect x="3.5" y="5.5" width="2.5" height="2.2" fill={accentColor} />
      <rect x="3.5" y="11" width="2.5" height="2.2" fill="currentColor" />
      <rect x="3.5" y="16.5" width="2.5" height="2.2" fill={accentColor} />
    </svg>
  );
}

export function FileText(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="5,3 14.5,3 19,7.5 19,21 5,21" stroke="currentColor" strokeWidth="1.9" />
      <path d="M14 3 V8 H19" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12 H15.5 M8.5 16 H13.5" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function Folder(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3 5.5 H9.5 L11.5 8 H21 V19.5 H3 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.1"
      />
      <path d="M6 12 H18" stroke={accentColor} strokeWidth="1.6" />
    </svg>
  );
}

export function Image(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3.5" y="4.5" width="17" height="15" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M3.5 16 L8.5 11 L13 15.5 L16 12.5 L20.5 17"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <polygon points="8.5,7 10,8.5 8.5,10 7,8.5" fill={accentColor} />
    </svg>
  );
}

export function Video(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="2.5" y="6" width="13.5" height="12" stroke="currentColor" strokeWidth="1.9" />
      <polygon
        points="16,10 21.5,7 21.5,17 16,14"
        stroke={accentColor}
        strokeWidth="1.8"
        fill={accentColor}
        fillOpacity="0.2"
      />
    </svg>
  );
}

export function Music(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M9 17.5 V6 L19 4 V15.5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="6.5" cy="17.5" r="2.5" stroke={accentColor} strokeWidth="1.8" />
      <circle cx="16.5" cy="15.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Code(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M8.5 7 L3.5 12 L8.5 17 M15.5 7 L20.5 12 L15.5 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path d="M13.5 5.5 L10.5 18.5" stroke={accentColor} strokeWidth="1.9" />
    </svg>
  );
}

export function Terminal(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M6.5 9 L10.5 12 L6.5 15"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path d="M12.5 15 H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function Database(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <ellipse
        cx="12"
        cy="6"
        rx="7.5"
        ry="2.8"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
      <path
        d="M4.5 6 V18 C4.5 19.6 7.8 21 12 21 C16.2 21 19.5 19.6 19.5 18 V6"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M4.5 12 C4.5 13.6 7.8 15 12 15 C16.2 15 19.5 13.6 19.5 12"
        stroke={accentColor}
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function Server(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3.5" y="4" width="17" height="6.5" stroke="currentColor" strokeWidth="1.9" />
      <rect x="3.5" y="13.5" width="17" height="6.5" stroke="currentColor" strokeWidth="1.9" />
      <rect x="6.5" y="6.3" width="2" height="2" fill={accentColor} />
      <rect x="6.5" y="15.8" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function Cloud(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M6.5 18 H18 C19.9 18 21.5 16.4 21.5 14.5 C21.5 12.7 20.1 11.2 18.3 11 C17.6 7.6 14.6 5.5 11.3 5.5 C7.5 5.5 4.5 8.5 4.5 12.2 C3.4 12.8 2.5 14 2.5 15.2 C2.5 16.8 4 18 6.5 18 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.12"
      />
    </svg>
  );
}

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

export function Filter(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="3.5,5 20.5,5 14,13 14,19.5 10,17.5 10,13"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.14"
      />
    </svg>
  );
}

export function SortAsc(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M6.5 19 V5 M3.5 8 L6.5 5 L9.5 8" stroke={accentColor} strokeWidth="1.9" />
      <path d="M12 7 H20.5 M12 12 H18 M12 17 H15.5" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

export function SortDesc(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M6.5 5 V19 M3.5 16 L6.5 19 L9.5 16" stroke={accentColor} strokeWidth="1.9" />
      <path d="M12 7 H20.5 M12 12 H18 M12 17 H15.5" stroke="currentColor" strokeWidth="1.9" />
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

export function Archive(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="4.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4.5 8.5 V19.5 H19.5 V8.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9.5 12.5 H14.5" stroke={accentColor} strokeWidth="2" />
    </svg>
  );
}

export function Inbox(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="5.5,4.5 18.5,4.5 20.5,13 20.5,19.5 3.5,19.5 3.5,13"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M3.5 13 H8.5 L10 15.5 H14 L15.5 13 H20.5" stroke={accentColor} strokeWidth="1.8" />
    </svg>
  );
}

export function Send(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="3.5,11 20.5,3.5 14,20.5 10.5,13.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.16"
      />
      <path d="M10.5 13.5 L20.5 3.5" stroke={accentColor} strokeWidth="1.7" />
    </svg>
  );
}

export function Reply(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M9 7 L4 12 L9 17" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
      <path d="M4.5 12 H15.5 C18.5 12 20 14 20 17.5 V19" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

export function Forward(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M15 7 L20 12 L15 17" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
      <path d="M19.5 12 H8.5 C5.5 12 4 14 4 17.5 V19" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

export function RefreshCw(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M20 4.5 V9.5 H15" stroke={accentColor} strokeWidth="1.9" strokeLinecap="square" />
      <path
        d="M19.5 9.5 C18.2 6.2 15.2 4 11.8 4 C7.3 4 3.8 7.6 3.8 12 C3.8 16.4 7.3 20 11.8 20 C15.2 20 18.2 17.8 19.3 14.8"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function RotateCcw(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M4 4.5 V9.5 H9" stroke={accentColor} strokeWidth="1.9" strokeLinecap="square" />
      <path
        d="M4.5 9.5 C5.8 6.2 8.8 4 12.2 4 C16.7 4 20.2 7.6 20.2 12 C20.2 16.4 16.7 20 12.2 20 C8.8 20 5.8 17.8 4.7 14.8"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function Undo(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M8.5 6 L4 10.5 L8.5 15"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M4.5 10.5 H15.5 C18 10.5 20 12.4 20 15 C20 17.6 18 19 15.5 19 H12"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function Redo(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M15.5 6 L20 10.5 L15.5 15"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M19.5 10.5 H8.5 C6 10.5 4 12.4 4 15 C4 17.6 6 19 8.5 19 H12"
        stroke="currentColor"
        strokeWidth="1.9"
      />
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

export function Activity(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polyline
        points="2,12 6,12 9,4.5 14.5,19.5 18,12 22,12"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      <circle cx="18" cy="12" r="1.6" fill={accentColor} />
    </svg>
  );
}

export function AudioLines(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3 10 V14 M7.5 6 V18 M12 3 V21 M16.5 7 V17 M21 10 V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path d="M12 5 V19" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function Command(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M15 6 V18 A2.5 2.5 0 1 0 17.5 15.5 H6.5 A2.5 2.5 0 1 0 9 18 V6 A2.5 2.5 0 1 0 6.5 8.5 H17.5 A2.5 2.5 0 1 0 15 6 Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="10.8" y="10.8" width="2.4" height="2.4" fill={accentColor} />
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

export function FolderGit2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3 6.5 V18.5 H21 V8.5 H12.5 L10 6.5 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="miter"
      />
      <circle cx="11" cy="14" r="1.5" stroke={accentColor} strokeWidth="1.6" />
      <circle cx="16.5" cy="12" r="1.5" stroke={accentColor} strokeWidth="1.6" />
      <path d="M12.5 14 H14.5 L15.5 13" stroke={accentColor} strokeWidth="1.6" />
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

export function HardDrive(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M4 13.5 H20 L18.5 5.5 H5.5 Z" stroke="currentColor" strokeWidth="1.9" />
      <rect x="4" y="13.5" width="16" height="5.5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="8" cy="16.2" r="1.1" fill={accentColor} />
      <path d="M14 16.2 H17.5" stroke={accentColor} strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function Layers3(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="12,3 20.5,7.5 12,12 3.5,7.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12 L12 16.5 L20.5 12" stroke={accentColor} strokeWidth="1.8" />
      <path d="M3.5 16.5 L12 21 L20.5 16.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ListChecks(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M3.5 7 L5.5 9 L9 5 M3.5 15.5 L5.5 17.5 L9 13.5"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M12 7 H20.5 M12 15.5 H20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function LogIn(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M14 4 H19.5 V20 H14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <path
        d="M4 12 H15 M11 7.5 L15.5 12 L11 16.5"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Play(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="6.5,4.5 19.5,12 6.5,19.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.2"
      />
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

export function Square(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.16"
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
