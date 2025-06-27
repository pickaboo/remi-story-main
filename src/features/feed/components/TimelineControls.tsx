import React from 'react';

interface NavButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, children, ariaLabel, disabled }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-full transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/50
                ${disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-200 hover:bg-black/50 hover:text-white'}`}
    aria-label={ariaLabel}
    disabled={disabled}
  >
    {children}
  </button>
);

interface TimelineControlsProps {
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  isEditingYear: boolean;
  isEditingMonth: boolean;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  onPrevMonth,
  onNextMonth,
  isPrevDisabled,
  isNextDisabled,
  isEditingYear,
  isEditingMonth
}) => {
  return (
    <div className="flex items-center justify-center mt-1">
      <NavButton 
        onClick={onPrevMonth} 
        ariaLabel="Föregående månad" 
        disabled={isEditingYear || isEditingMonth || isPrevDisabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </NavButton>

      <NavButton 
        onClick={onNextMonth} 
        ariaLabel="Nästa månad" 
        disabled={isEditingYear || isEditingMonth || isNextDisabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </NavButton>
    </div>
  );
}; 