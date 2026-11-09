import React from 'react';
import { LucideIcon } from 'lucide-react';

const DANGER = "#DC3545";

interface IconBtnProps {
  icon?: LucideIcon;
  variant?: 'edit' | 'danger';
  danger?: boolean;
  dark?: boolean;
  onClick?: () => void;
}

export const IconBtn: React.FC<IconBtnProps> = ({ 
  icon: Icon, 
  variant, 
  danger, 
  dark, 
  onClick 
}) => {
  const isDanger = variant === 'danger' || danger;

  return (
    <button
      onClick={onClick}
      style={{
        background: isDanger 
          ? `${DANGER}1A` 
          : dark ? '#2A2A2A' : 'rgba(0,0,0,0.06)',
        border: dark ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderRadius: 8,
        padding: 6,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {Icon ? (
        <Icon size={14} color={isDanger ? DANGER : (dark ? '#D1D5DB' : '#6B6B6B')} />
      ) : null}
    </button>
  );
};