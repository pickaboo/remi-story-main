import React, { memo, useMemo, useCallback } from 'react';
import { Sphere } from '../../types';

interface SphereDisplayProps {
  sphere: Sphere;
  size?: 'sm' | 'md' | 'lg' | 'xs'; // xs: 24px, sm: 32px, md: 64px, lg: 80px
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  ariaLabel?: string;
  showName?: boolean;
  isActive?: boolean; // For different text sizes
}

export const SphereDisplay: React.FC<SphereDisplayProps> = memo(({
  sphere,
  size = 'md',
  className = '',
  onClick,
  tabIndex,
  ariaLabel,
  showName = false,
  isActive = false,
}) => {
  // Early return if sphere is not provided
  if (!sphere) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src="/images/Remi_symbol.gif" 
          alt="REMI Symbol" 
          className="w-16 h-16"
        />
        <span className="text-sm text-gray-600">Standard Sfär</span>
      </div>
    );
  }

  const sizeClasses = useMemo(() => ({
    xs: 'w-6 h-6', // 24px (for collapsed sidebar)
    sm: 'w-8 h-8', // 32px
    md: 'w-16 h-16', // 64px
    lg: 'w-20 h-20', // 80px (for sidebar main display)
  }), []);

  const commonClasses = useMemo(() => 
    `flex items-center gap-2 ${className}`,
    [className]
  );

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={commonClasses}
        tabIndex={tabIndex}
        aria-label={ariaLabel || sphere.name || 'Sphere'}
        title={sphere.name || 'Sphere'}
      >
        <img 
          src="/images/Remi_symbol.gif" 
          alt="REMI Symbol" 
          className={sizeClasses[size]}
        />
        {showName && (
          <span className={`${isActive ? 'text-lg font-bold' : 'text-sm font-medium'} text-slate-700 dark:text-slate-200 truncate max-w-[120px]`}>
            {sphere.name} {isActive ? '(AKTIV)' : ''}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={commonClasses}
      title={sphere.name || 'Sphere'}
      aria-label={ariaLabel || sphere.name || 'Sphere'}
      role="img"
    >
      <img 
        src="/images/Remi_symbol.gif" 
        alt="REMI Symbol" 
        className={sizeClasses[size]}
      />
              {showName && (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
            {sphere.name}
          </span>
        )}
    </div>
  );
});

SphereDisplay.displayName = 'SphereDisplay';
