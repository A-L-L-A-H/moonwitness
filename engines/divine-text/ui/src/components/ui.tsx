import type { ReactNode, CSSProperties } from 'react';

type CardProps = { title?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties };
export function Card({ title, children, className = '', style }: CardProps) {
  return <section className={`card ${className}`} style={style}>{title && <div className="card-title">{title}</div>}{children}</section>;
}
export function Badge({ children, tone = 'neutral', style }: { children: ReactNode; tone?: 'neutral'|'good'|'warn'|'danger'; style?: CSSProperties }) {
  return <span className={`badge badge-${tone}`} style={style}>{children}</span>;
}
export function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return <div className="progress"><div className="progress-fill" style={{ width: `${v}%` }} /></div>;
}
