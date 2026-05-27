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
  disabled = false,
}) => {
  const baseClasses = 'aq-button w-full';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const combinedClasses =
    `${baseClasses} ${disabledClasses} ${className}`.trim();

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
