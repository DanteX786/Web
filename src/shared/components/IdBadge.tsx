import React from 'react';

const GOLD = "#C9A227";

interface IdBadgeProps {
  id: string;
}

export const IdBadge: React.FC<IdBadgeProps> = ({ id }) => {
  return (
    <span style={{
      background: GOLD + "1F", 
      color: GOLD,
      fontFamily: "monospace", 
      fontWeight: 700, 
      fontSize: 11,
      padding: "3px 8px", 
      borderRadius: 6, 
      display: "inline-flex"
    }}>
      {id}
    </span>
  );
};