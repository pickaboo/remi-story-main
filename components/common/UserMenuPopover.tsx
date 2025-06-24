
import React, { useState, useEffect, useRef } from 'react';
import { User, SphereInvitation, Sphere } from '../../types';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { getPendingInvitationsForEmail, getSphereById } from '../../services/storageService';
import { getUserById } from '../../services/userService';
import { SphereDisplay } from './SphereDisplay';

type ThemePreference = User['themePreference'];

interface UserMenuPopoverProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  onSaveThemePreference: (theme: ThemePreference) => Promise<void>; // New prop
}

interface InvitationDisplayData extends SphereInvitation {
  inviterName?: string;
  sphereName?: string;
  sphereDetails?: Sphere; // Store full sphere for SphereDisplay
}

const EnvelopeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: "Systemstandard", value: "system" },
    { label: "Ljust", value: "light" },
    { label: "Mörkt", value: "dark" },
];

export const UserMenuPopover: React.FC<UserMenuPopoverProps> = ({
  currentUser,
  isOpen,
  onClose,
  anchorRef,
  onAcceptInvitation,
  onDeclineInvitation,
  onSaveThemePreference,
}) => {
  const [invitations, setInvitations] = useState<InvitationDisplayData[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(currentUser.themePreference || 'system');


  useEffect(() => {
    const fetchInvitations = async () => {
      if (isOpen && currentUser.email) {
        setIsLoadingInvitations(true);
        try {
          const pendingRawInvitations = await getPendingInvitationsForEmail(currentUser.email);
          const enrichedInvitations: InvitationDisplayData[] = await Promise.all(
            pendingRawInvitations.map(async (inv) => {
              const inviter = await getUserById(inv.inviterUserId);
              const sphere = await getSphereById(inv.sphereId);
              return {
                ...inv,
                inviterName: inviter?.name || 'Okänd användare',
                sphereName: sphere?.name || 'Okänd sfär',
                sphereDetails: sphere || undefined,
              };
            })
          );
          setInvitations(enrichedInvitations);
        } catch (error) {
          console.error("Error fetching invitations:", error);
          setInvitations([]);
        } finally {
          setIsLoadingInvitations(false);
        }
      }
    };

    if (isOpen) {
        fetchInvitations();
        setSelectedTheme(currentUser.themePreference || 'system');
    }
  }, [isOpen, currentUser.email, currentUser.themePreference]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    setActionInProgress(prev => ({ ...prev, [invitationId]: true }));
    if (action === 'accept') {
      await onAcceptInvitation(invitationId);
    } else {
      await onDeclineInvitation(invitationId);
    }
    // App.tsx will refresh user data and thus invitations.
    setActionInProgress(prev => ({ ...prev, [invitationId]: false }));
  };

  const handleThemeChange = async (theme: ThemePreference) => {
    setSelectedTheme(theme); // Optimistically update UI
    setIsSavingTheme(true);
    try {
      await onSaveThemePreference(theme);
    } catch (error) {
        console.error("Failed to save theme preference:", error);
        // Optionally revert selectedTheme or show error message
        setSelectedTheme(currentUser.themePreference || 'system'); // Revert on error
    } finally {
        setIsSavingTheme(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-border-color dark:border-slate-700 z-[70]"
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="p-3 border-b border-border-color dark:border-slate-700">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Hej, {currentUser.name.split(' ')[0]}!</p>
        <p className="text-xs text-muted-text dark:text-slate-400">{currentUser.email}</p>
      </div>

      <div className="p-3 max-h-60 overflow-y-auto no-scrollbar">
        <h4 className="text-xs font-semibold uppercase text-muted-text dark:text-slate-500 mb-2 flex items-center">
            <EnvelopeIcon className="w-3.5 h-3.5 mr-1.5" />
            Sfärinbjudningar
        </h4>
        {isLoadingInvitations ? (
          <LoadingSpinner message="Laddar inbjudningar..." size="sm" />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-text dark:text-slate-400 py-3 text-center">Inga väntande inbjudningar.</p>
        ) : (
          <ul className="space-y-2.5">
            {invitations.map((inv) => (
              <li key={inv.id} className="p-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg shadow-sm border border-border-color dark:border-slate-600">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        {inv.sphereDetails ? <SphereDisplay sphere={inv.sphereDetails} size="sm" /> : <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"></div>}
                        <span className="text-sm font-semibold text-primary dark:text-blue-400 truncate" title={inv.sphereName}>{inv.sphereName}</span>
                    </div>
                    <span className="text-xs text-muted-text dark:text-slate-400">från {inv.inviterName}</span>
                </div>
                {inv.message && <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2 border-l-2 border-slate-300 dark:border-slate-500 pl-2 py-1">"{inv.message}"</p>}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs !py-1 !px-2 border-danger text-danger hover:bg-danger/10 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400/10"
                    onClick={() => handleInvitationAction(inv.id, 'decline')}
                    isLoading={actionInProgress[inv.id]}
                    disabled={actionInProgress[inv.id]}
                  >
                    Neka
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    className="text-xs !py-1 !px-2"
                    onClick={() => handleInvitationAction(inv.id, 'accept')}
                    isLoading={actionInProgress[inv.id]}
                    disabled={actionInProgress[inv.id]}
                  >
                    Acceptera
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <hr className="my-1 border-border-color dark:border-slate-700 mx-3" />
      <div className="p-3">
        <h4 className="text-xs font-semibold uppercase text-muted-text dark:text-slate-500 mb-2">App Tema</h4>
        <fieldset className="space-y-1.5" disabled={isSavingTheme}>
            <legend className="sr-only">Välj app tema</legend>
            {THEME_OPTIONS.map((option) => (
            <label 
                key={option.value} 
                htmlFor={`theme-popover-${option.value}`} 
                className={`flex items-center space-x-2.5 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer
                            ${selectedTheme === option.value ? 'bg-primary/10 dark:bg-blue-400/10 ring-1 ring-primary/50 dark:ring-blue-400/50' : ''}`}
            >
                <input
                type="radio"
                id={`theme-popover-${option.value}`}
                name="theme-popover-selection"
                value={option.value}
                checked={selectedTheme === option.value}
                onChange={() => handleThemeChange(option.value)}
                className="form-radio h-3.5 w-3.5 text-primary dark:text-blue-400 border-gray-300 dark:border-slate-500 focus:ring-primary dark:focus:ring-offset-0 bg-transparent dark:bg-slate-700"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{option.label}</span>
            </label>
            ))}
        </fieldset>
        {isSavingTheme && <p className="text-xs text-muted-text dark:text-slate-400 mt-1.5 text-right">Sparar tema...</p>}
      </div>
    </div>
  );
};
