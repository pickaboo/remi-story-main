import React, { useState, useEffect, useRef, memo } from 'react';
import { User, SphereInvitation, Sphere } from '../../types';
import { Button } from '../ui';
import { LoadingSpinner } from '../ui';
import { getPendingInvitationsForEmail, getSphereById } from '../../services/storageService';
import { getUserById, updateUserProfileImage } from '../../services/userService';
import { SphereDisplay } from '../ui';

import { ProfileSettingsModal } from './ProfileSettingsModal';
import { useAppContext } from '../../context/AppContext';

interface UserMenuPopoverProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: HTMLElement | null;
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  onLogout?: () => void;
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

const ArrowRightOnRectangleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);



export const UserMenuPopover: React.FC<UserMenuPopoverProps> = memo(({
  currentUser,
  isOpen,
  onClose,
  anchorRef,
  onAcceptInvitation,
  onDeclineInvitation,
  onLogout,
}) => {
  const [invitations, setInvitations] = useState<InvitationDisplayData[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { setCurrentUser } = useAppContext();


  useEffect(() => {
    const fetchInvitations = async () => {
      if (isOpen && currentUser.email) {
        setIsLoadingInvitations(true);
        try {
          const pendingRawInvitations = await getPendingInvitationsForEmail(currentUser.email);
          const enrichedInvitations: InvitationDisplayData[] = await Promise.all(
            pendingRawInvitations.map(async (inv) => {
              const inviter = await getUserById(inv.invitedByUserId);
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
    }
  }, [isOpen, currentUser.email, currentUser.themePreference]);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef &&
        !anchorRef.contains(event.target as Node)
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
    setActionInProgress(prev => ({ ...prev, [invitationId]: false }));
    onClose(); // Stäng dropdownen direkt efter åtgärd
  };




  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-bg rounded-xl shadow-2xl border border-border-color dark:border-dark-bg/50 z-[70]"
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
              <li key={inv.id} className="p-2.5 bg-slate-50 dark:bg-dark-bg/60 rounded-lg shadow-sm border border-border-color dark:border-dark-bg/30">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        {inv.sphereDetails ? <SphereDisplay sphere={inv.sphereDetails} size="sm" /> : <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-dark-bg flex-shrink-0"></div>}
                        <span className="text-sm font-semibold text-primary dark:text-blue-400 truncate" title={inv.sphereName}>{inv.sphereName}</span>
                    </div>
                    <span className="text-xs text-muted-text dark:text-slate-400">från {inv.inviterName}</span>
                </div>

                {inv.message && (
                  <div className="mb-2 p-2 bg-white dark:bg-dark-bg/40 rounded border border-border-color dark:border-dark-bg/20">
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{inv.message}"
                    </p>
                  </div>
                )}

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
      <div className="p-3">
        <button
          className="w-full py-2 px-4 rounded bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          onClick={() => setIsProfileModalOpen(true)}
        >
          Redigera profil
        </button>
      </div>
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={currentUser.id}
        currentName={currentUser.name}
        currentImageUrl={currentUser.profileImageUrl}
        currentAvatarColor={currentUser.avatarColor}
        onNameSave={(newName) => { 
          // TODO: Implement name update
        }}
        onImageUpload={async (url) => {
          await updateUserProfileImage(currentUser.id, url);
          setCurrentUser({ 
            ...currentUser, 
            profileImageUrl: url,
            updatedAt: new Date().toISOString()
          });
        }}
        onAvatarColorChange={async (color) => { 
          // TODO: Implement avatar color update
          console.log('Spara ny avatarfärg:', color);
        }}
      />
      {onLogout && (
        <div className="p-3 border-t border-border-color dark:border-slate-700">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-danger text-white font-medium hover:bg-danger/90 transition-colors"
            onClick={onLogout}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
});

UserMenuPopover.displayName = 'UserMenuPopover';
