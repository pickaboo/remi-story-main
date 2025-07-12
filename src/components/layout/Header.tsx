import React, { useState, useRef, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Views } from '../../constants/viewEnum';
import type { View } from '../../constants/viewEnum';
import { ViewParams } from '../../types';
import { DiaryPopover, UserMenuPopover } from '../modals';
import { useAppContext } from '../../context/AppContext';
import { applyThemePreference } from '../../utils/themeUtils';

type ThemePreference = User['themePreference']; // Define ThemePreference type

interface HeaderProps {
  currentUser: User | null;
  isSidebarExpanded: boolean;
  onNavigate: (view: View, params?: ViewParams) => void;
  logoUrl?: string; 
  onLogout?: () => void; 
  onAcceptInvitation: (invitationId: string) => Promise<void>; 
  onDeclineInvitation: (invitationId: string) => Promise<void>; 
  onSaveThemePreference: (theme: ThemePreference) => Promise<void>; // Added
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

const TargetIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-label="bucket-list-target">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.25-9H21M3 12h2.25m12.364-6.364l-1.591 1.591m-9.192 9.192l-1.591 1.591m12.364 0l-1.591-1.591m-9.192-9.192L4.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);
const MoonIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
  </svg>
);


export const Header: React.FC<HeaderProps> = memo(({ 
    currentUser, 
    isSidebarExpanded, 
    onNavigate, 
    logoUrl, 
    onLogout,
    onAcceptInvitation, 
    onDeclineInvitation,
    onSaveThemePreference, // Added
}) => {
  const navigate = useNavigate();
  const leftOffsetClass = isSidebarExpanded ? 'left-60' : 'left-20';
  const [isDiaryPopoverOpen, setIsDiaryPopoverOpen] = useState(false);
  const diaryButtonRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLDivElement>(null);
  const { handleOpenBucketListModal, themePreference } = useAppContext();

  // Determine if dark mode is active based on theme preference and system preference
  const isDarkMode = React.useMemo(() => {
    if (themePreference === 'dark') return true;
    if (themePreference === 'light') return false;
    // For 'system', check if system prefers dark mode
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [themePreference]);

  return (
    <header className={`bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm fixed top-0 ${leftOffsetClass} right-0 z-30 h-16 flex items-center justify-between border-b border-border-color dark:border-dark-bg/50 px-4 sm:px-6 lg:px-8 shadow-sm`} role="banner">
      {/* Left Spacer for balance - can be empty or used for other header elements if needed */}
      <div className="w-1/3"></div>

      {/* Centered Logo */}
      <div className="flex-grow text-center">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/home');}} 
          className="inline-block hover:opacity-80 transition-opacity"
          aria-label="REMI Story Hem"
        >
          {/* Dynamisk logotyp baserat på tema */}
          <img 
            src={isDarkMode ? '/images/Slogan_neg.gif' : '/images/Slogan_pos.gif'} 
            alt="REMI Story Logotyp" 
            className="h-7 sm:h-8 w-auto mx-auto"
          />
        </a>
      </div>

      {/* Right-aligned controls */}
      <div className="w-1/3 flex items-center justify-end h-full space-x-3 sm:space-x-4">
          {currentUser && (
            <>
              <div className="relative" ref={diaryButtonRef}>
                <div className="flex rounded-lg border border-border-color dark:border-dark-bg/30 shadow-sm">
                  <button
                    onClick={() => navigate('/diary')}
                    className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 rounded-l-md transition-colors"
                    title="Öppna Dagbok"
                    aria-label="Öppna Dagbok"
                  >
                    <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setIsDiaryPopoverOpen(prev => !prev)}
                    className="px-1 sm:px-1.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 rounded-r-md border-l border-border-color dark:border-dark-bg/30 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={isDiaryPopoverOpen}
                    title="Snabbanteckning i dagboken"
                    aria-label="Öppna snabbanteckning för dagboken"
                  >
                    <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
                <DiaryPopover 
                  currentUser={currentUser} 
                  isOpen={isDiaryPopoverOpen} 
                  onClose={() => setIsDiaryPopoverOpen(false)}
                  anchorRef={diaryButtonRef.current}
                />
              </div>

              {currentUser.enabledFeatures?.bucketList && (
                <button
                  onClick={handleOpenBucketListModal}
                  className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent rounded-lg border border-border-color dark:border-dark-bg/30 transition-colors ml-2"
                  title="Öppna Bucketlist"
                  aria-label="Öppna Bucketlist"
                >
                  <TargetIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Current User Menu */}
              <div className="relative" ref={userMenuButtonRef}>
                <button
                  id="user-menu-button"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400 transition-colors"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  aria-controls="user-menu-popover"
                  title="Användarmeny"
                >
                  {currentUser.profileImageUrl ? (
                    <img
                      src={`${currentUser.profileImageUrl}?t=${currentUser.updatedAt}`}
                      alt="Profilbild"
                      className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                      key={currentUser.profileImageUrl}
                    />
                  ) : (
                    <div 
                      className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-sm font-semibold shadow-sm`}
                      aria-hidden="true"
                    >
                      {currentUser.initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  {Number(currentUser.pendingInvitationCount) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4" aria-label={`${currentUser.pendingInvitationCount} väntande inbjudningar`}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" aria-hidden="true"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">
                              {currentUser.pendingInvitationCount! > 9 ? '9+' : currentUser.pendingInvitationCount}
                          </span>
                      </span>
                  )}
                  <ChevronDownIcon className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isUserMenuOpen && (
                  <UserMenuPopover
                    currentUser={currentUser}
                    isOpen={isUserMenuOpen}
                    onClose={() => setIsUserMenuOpen(false)}
                    anchorRef={userMenuButtonRef.current}
                    onAcceptInvitation={onAcceptInvitation}
                    onDeclineInvitation={onDeclineInvitation}
                    onSaveThemePreference={onSaveThemePreference} // Pass down the prop
                    onLogout={onLogout}
                  />
                )}
              </div>

              {/* Theme toggle button (moved here) */}
              <button
                onClick={() => {
                  const newTheme = isDarkMode ? 'light' : 'dark';
                  applyThemePreference(newTheme);
                  // Save to localStorage
                  localStorage.setItem('themePreference', newTheme);
                  // Call the callback to save to database if user is logged in
                  if (currentUser) {
                    onSaveThemePreference(newTheme);
                  }
                }}
                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-accent transition-colors ml-2"
                aria-label={isDarkMode ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
                title={isDarkMode ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
              >
                {/* Visa symbolen för det tema man kan byta till */}
                {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
              </button>
            </>
          )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
