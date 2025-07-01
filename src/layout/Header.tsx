import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { View } from '../types'; 
import { DiaryPopover } from '../features/diary/components/DiaryPopover'; 
import { UserMenuPopover } from '../common/components/UserMenuPopover';
import { useUser } from '../context/UserContext';
import { usePendingInvites } from '../features/spheres/hooks/usePendingInvites';

interface HeaderProps {
  isSidebarExpanded: boolean;
  logoUrl?: string; 
}

// Icons
const BookOpenIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const ArrowRightOnRectangleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ 
    isSidebarExpanded, 
    logoUrl, 
}) => {
  const navigate = useNavigate();
  
  // Use context instead of props
  const { 
    currentUser, 
    handleLogout, 
    handleSaveThemePreference, 
    handleAcceptInvitation,
    handleDeclineInvitation
  } = useUser();
  
  // Use custom hook for pending invites
  const { inviteCount } = usePendingInvites(currentUser?.email);
  
  // Header internal state
  const leftOffsetClass = isSidebarExpanded ? 'left-60' : 'left-20';
  const [isDiaryPopoverOpen, setIsDiaryPopoverOpen] = useState(false);
  const diaryButtonRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLDivElement>(null);

  // Handle navigation
  const handleNavigate = (view: View) => {
    switch (view) {
      case View.Home:
        navigate('/');
        break;
      case View.Diary:
        navigate('/diary');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <header className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm fixed top-0 ${leftOffsetClass} right-0 z-30 h-16 flex items-center justify-between border-b border-border-color dark:border-slate-700 px-4 sm:px-6 lg:px-8 shadow-sm`}>
      {/* Left Spacer for balance - can be empty or used for other header elements if needed */}
      <div className="w-1/3"></div>

      {/* Centered Logo */}
      <div className="flex-grow text-center">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); handleNavigate(View.Home);}} 
          className="inline-block hover:opacity-80 transition-opacity"
          aria-label="REMI Story Hem"
        >
        {logoUrl ? (
            <img src={logoUrl} alt="REMI Story Logotyp" className="h-7 sm:h-8 w-auto mx-auto dark:brightness-0 dark:invert" />
        ) : (
            <span className="font-bold text-xl sm:text-2xl text-slate-700 dark:text-slate-200">REMI Story</span>
        )}
        </a>
      </div>

      {/* Right-aligned controls */}
      <div className="w-1/3 flex items-center justify-end h-full space-x-3 sm:space-x-4">
          {currentUser && (
            <div className="relative" ref={diaryButtonRef}>
              <div className="flex rounded-lg border border-border-color dark:border-slate-600 shadow-sm">
                <button
                  onClick={() => handleNavigate(View.Diary)}
                  className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 rounded-l-md transition-colors"
                  title="Öppna Dagbok"
                  aria-label="Öppna Dagbok"
                >
                  <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setIsDiaryPopoverOpen(prev => !prev)}
                  className="px-1 sm:px-1.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 rounded-r-md border-l border-border-color dark:border-slate-600 transition-colors"
                  aria-haspopup="true"
                  aria-expanded={isDiaryPopoverOpen}
                  title="Snabbanteckning i dagboken"
                  aria-label="Öppna snabbanteckning för dagboken"
                >
                  <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <DiaryPopover 
                isOpen={isDiaryPopoverOpen} 
                onClose={() => setIsDiaryPopoverOpen(false)}
                anchorRef={diaryButtonRef as React.RefObject<HTMLElement>}
              />
            </div>
          )}

          {/* Current User Menu */}
          {currentUser && (
            <div className="relative" ref={userMenuButtonRef}>
              <button
                id="user-menu-button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 transition-colors"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
                aria-controls="user-menu-popover"
                title="Användarmeny"
              >
                <div 
                  className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-sm font-semibold shadow-sm`}
                >
                  {currentUser.initials}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline truncate max-w-[100px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                {inviteCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">
                            {inviteCount > 9 ? '9+' : inviteCount}
                        </span>
                    </span>
                )}
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <UserMenuPopover
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                  anchorRef={userMenuButtonRef as React.RefObject<HTMLElement>}
                  onAcceptInvitation={handleAcceptInvitation}
                  onDeclineInvitation={handleDeclineInvitation}
                  onSaveThemePreference={handleSaveThemePreference}
                />
              )}
            </div>
          )}

          {/* Logout Button */}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-danger dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-danger dark:focus:ring-red-400 transition-colors"
              title="Logga ut"
              aria-label="Logga ut"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
    </header>
  );
};
