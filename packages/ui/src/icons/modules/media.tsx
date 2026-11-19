import { resolveIconSvgProps, type DnaIconProps } from "../types";

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
