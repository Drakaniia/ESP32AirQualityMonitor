import React from 'react';

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`aq-panel ${className}`}>{children}</div>;
};

export default GlassCard;
