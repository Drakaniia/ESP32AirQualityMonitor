import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  href,
  onClick,
  className = '',
  disabled = false
}) => {
  const baseClasses = 'btn-glass flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200 w-full text-white';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const combinedClasses = `${baseClasses} ${disabledClasses} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={combinedClasses} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClasses} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default GlassButton;