import { resolveIconSvgProps, type DnaIconProps } from "./types";

export function ChevronDown(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M5.5 9 L12 15.5 L18.5 9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="12,11 13.4,12.4 12,13.8 10.6,12.4" fill={accentColor} fillOpacity="0.75" />
    </svg>
  );
}

export function ChevronUp(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M5.5 15 L12 8.5 L18.5 15"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="12,10.2 13.4,11.6 12,13 10.6,11.6" fill={accentColor} fillOpacity="0.75" />
    </svg>
  );
}

export function ChevronLeft(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M15 5.5 L8.5 12 L15 18.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="11.6,10.6 13,12 11.6,13.4 10.2,12" fill={accentColor} fillOpacity="0.75" />
    </svg>
  );
}

export function ChevronRight(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M9 5.5 L15.5 12 L9 18.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="12.4,10.6 13.8,12 12.4,13.4 11,12" fill={accentColor} fillOpacity="0.75" />
    </svg>
  );
}

export function ChevronsUpDown(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M7.5 9.5 L12 5 L16.5 9.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <path
        d="M7.5 14.5 L12 19 L16.5 14.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="1.2" fill={accentColor} />
    </svg>
  );
}

export function ChevronsLeftRight(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M9.5 7.5 L5 12 L9.5 16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <path
        d="M14.5 7.5 L19 12 L14.5 16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="1.2" fill={accentColor} />
    </svg>
  );
}

export function ArrowRight(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M3.5 12 H19.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <path
        d="M13.5 6 L20 12 L13.5 18"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="3,10.5 6.5,12 3,13.5" fill={accentColor} />
    </svg>
  );
}

export function ArrowLeft(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M20.5 12 H4.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <path
        d="M10.5 6 L4 12 L10.5 18"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="21,10.5 17.5,12 21,13.5" fill={accentColor} />
    </svg>
  );
}

export function ArrowUp(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M12 20.5 V4.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <path
        d="M6 10.5 L12 4 L18 10.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="10.5,21 12,17.5 13.5,21" fill={accentColor} />
    </svg>
  );
}

export function ArrowDown(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M12 3.5 V19.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <path
        d="M6 13.5 L12 20 L18 13.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <polygon points="10.5,3 12,6.5 13.5,3" fill={accentColor} />
    </svg>
  );
}

export function ArrowUpRight(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M6 18 L18 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <path d="M9 6 H18 V15" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <circle cx="6" cy="18" r="1.5" fill={accentColor} />
    </svg>
  );
}

export function ArrowUpDown(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M8 4 V19 M4.5 7.5 L8 4 L11.5 7.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <path
        d="M16 20 V5 M12.5 16.5 L16 20 L19.5 16.5"
        stroke={accentColor}
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function X(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <rect x="11" y="11" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function Check(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
      <circle cx="19.5" cy="6.5" r="1.3" fill={accentColor} />
    </svg>
  );
}

export function Plus(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 4.5 V19.5 M4.5 12 H19.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="1.4" fill={accentColor} />
    </svg>
  );
}

export function Minus(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path d="M5 12 H19" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      <rect x="11" y="11" width="2" height="2" fill={accentColor} />
    </svg>
  );
}

export function Circle(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,3 20,8 20,16 12,21 4,16 4,8"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.16"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function GripVertical(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <rect x="7.5" y="5" width="2.4" height="2.4" fill="currentColor" />
      <rect x="14.1" y="5" width="2.4" height="2.4" fill={accentColor} />
      <rect x="7.5" y="10.8" width="2.4" height="2.4" fill={accentColor} />
      <rect x="14.1" y="10.8" width="2.4" height="2.4" fill="currentColor" />
      <rect x="7.5" y="16.6" width="2.4" height="2.4" fill="currentColor" />
      <rect x="14.1" y="16.6" width="2.4" height="2.4" fill={accentColor} />
    </svg>
  );
}

export function MoreHorizontal(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="5,10 7,12 5,14 3,12" fill="currentColor" />
      <polygon points="12,9.8 14.2,12 12,14.2 9.8,12" fill={accentColor} />
      <polygon points="19,10 21,12 19,14 17,12" fill="currentColor" />
    </svg>
  );
}

export function MoreVertical(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon points="12,3 14,5 12,7 10,5" fill="currentColor" />
      <polygon points="12,9.8 14.2,12 12,14.2 9.8,12" fill={accentColor} />
      <polygon points="12,17 14,19 12,21 10,19" fill="currentColor" />
    </svg>
  );
}

export function Search(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="10.5,3.5 15.5,5.5 17.5,10.5 15.5,15.5 10.5,17.5 5.5,15.5 3.5,10.5 5.5,5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.1"
      />
      <circle cx="10.5" cy="10.5" r="2.2" stroke={accentColor} strokeWidth="1.4" />
      <path
        d="M15.8 15.8 L20.5 20.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Loader2(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M12 3 A9 9 0 1 1 5.6 18.4"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      <circle cx="12" cy="3" r="1.6" fill={accentColor} />
      <circle cx="12" cy="12" r="2.4" stroke={accentColor} strokeWidth="1.3" strokeOpacity="0.7" />
    </svg>
  );
}

export function Calendar(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <path
        d="M4 5.5 H20 V20 H4 Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={accentColor}
        fillOpacity="0.08"
      />
      <path d="M4 9.5 H20 M8 3 V6 M16 3 V6" stroke="currentColor" strokeWidth="1.9" />
      <polygon points="12,12 14.5,14.5 12,17 9.5,14.5" fill={accentColor} />
    </svg>
  );
}

export function Clock(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,2.5 19.5,7 21.5,12 19.5,17 12,21.5 4.5,17 2.5,12 4.5,7"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M12 7 V12 L15.5 14" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Clock3(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="12,2.5 19.5,7 21.5,12 19.5,17 12,21.5 4.5,17 2.5,12 4.5,7"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M12 6.5 V12 H17" stroke={accentColor} strokeWidth="2" strokeLinecap="square" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Pencil(props: DnaIconProps) {
  const { accentColor, svgProps } = resolveIconSvgProps(props);
  return (
    <svg {...svgProps}>
      <polygon
        points="16.5,3.5 20.5,7.5 8,20 3.5,20.5 4,16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="miter"
      />
      <path d="M13.5 6.5 L17.5 10.5" stroke={accentColor} strokeWidth="2" />
    </svg>
  );
}
