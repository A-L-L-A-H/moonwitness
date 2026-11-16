import React from 'react';

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button
      type={type}
      className={`${baseClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  className = '',
  onKeyDown,
  type = 'text',
}: {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="modal-label">{label}</label>}
      <input
        type={type}
        className={`modal-input ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

export function Avatar({
  name,
  imgUrl,
  size = 40,
  className = '',
  onClick,
}: {
  name?: string;
  imgUrl?: string | null;
  size?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const initial = (name || '?')[0]?.toUpperCase() || '?';
  return (
    <div
      className={`my-avatar ${className}`}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {!imgUrl && initial}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success';
}) {
  return <div className="unread-badge">{children}</div>;
}
