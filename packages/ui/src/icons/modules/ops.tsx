import { resolveIconSvgProps, type DnaIconProps } from "../types";

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
