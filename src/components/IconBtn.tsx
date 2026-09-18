import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const DANGER = "#DC3545";

interface IconBtnProps {
  variant?: 'edit' | 'danger';
  onClick?: () => void;
}

export const IconBtn: React.FC<IconBtnProps> = ({ variant = 'edit', onClick }) => {
  const isDanger = variant === 'danger';

  return (
    <button
      onClick={onClick}
      style={{
        background: isDanger ? `${DANGER}1A` : 'rgba(0,0,0,0.06)',
        border: 'none',
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
      {isDanger ? (
        <Trash2 size={14} color={DANGER} />
      ) : (
        <Pencil size={14} color="#6B6B6B" />
      )}
    </button>
  );
};
