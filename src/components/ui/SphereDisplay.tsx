import React, { memo, useMemo, useCallback } from 'react';
import { Sphere } from '../../types';

interface SphereDisplayProps {
  sphere: Sphere;
  size?: 'sm' | 'md' | 'lg'; // sm: 24px, md: 32px, lg: 40px
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  ariaLabel?: string;
  showName?: boolean; 
}

export const SphereDisplay: React.FC<SphereDisplayProps> = memo(({
  sphere,
  size = 'md',
  className = '',
  onClick,
  tabIndex,
  ariaLabel,
  showName = false,
}) => {
  // Early return if sphere is not provided
  if (!sphere) {
    return (
      <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm text-gray-600 ${className}`}>
        SP
      </div>
    );
  }

  const sizeClasses = useMemo(() => ({
    sm: 'w-6 h-6 text-xs', // 24px
    md: 'w-8 h-8 text-sm', // 32px
    lg: 'w-10 h-10 text-base', // 40px (for sidebar main display)
  }), []);

  const gradientStyle: React.CSSProperties = useMemo(() => {
    // Ensure gradientColors exists and has at least 2 colors
    if (!sphere.gradientColors || sphere.gradientColors.length < 2) {
      // Fallback to a default gradient if gradientColors is missing or incomplete
      return {
        backgroundImage: 'linear-gradient(to right, #3B82F6, #1E40AF)',
      };
    }
    
    return {
      backgroundImage: `linear-gradient(to right, ${sphere.gradientColors[0]}, ${sphere.gradientColors[1]})`,
    };
  }, [sphere.gradientColors]);

  const initials = useMemo(() => {
    if (!sphere.name) {
      return 'SP'; // Default initials if sphere name is missing
    }
    
    return sphere.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [sphere.name]);

  const commonButtonClasses = useMemo(() => 
    `rounded-full flex items-center justify-center font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 ease-in-out hover:opacity-90 active:scale-95 ${sizeClasses[size]} ${className}`,
    [sizeClasses, size, className]
  );

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={commonButtonClasses}
        style={gradientStyle}
        tabIndex={tabIndex}
        aria-label={ariaLabel || sphere.name || 'Sphere'}
        title={sphere.name || 'Sphere'}
      >
        {initials}
        {showName && <span className="sr-only">{sphere.name || 'Sphere'}</span>}
      </button>
    );
  }

  return (
    <div
      className={commonButtonClasses}
      style={gradientStyle}
      title={sphere.name || 'Sphere'}
      aria-label={ariaLabel || sphere.name || 'Sphere'}
      role="img"
    >
      {initials}
      {showName && <span className="sr-only">{sphere.name || 'Sphere'}</span>}
    </div>
  );
});

SphereDisplay.displayName = 'SphereDisplay';
