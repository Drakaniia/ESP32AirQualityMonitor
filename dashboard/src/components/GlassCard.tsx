import React from 'react';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl"
        style={{ 
          boxShadow: 'inset 2px 2px 8px rgba(255, 255, 255, 0.3), inset -2px -2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 0
        }}
      />
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;