import React, { useState, useEffect } from 'react';
import { Button, Input, TextArea, LoadingSpinner, SphereDisplay } from '../ui';
import { Sphere, User } from '../../types';
import { isPersonalSphere } from '../../utils/sphereUtils';

interface ManageSphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSphere: Sphere | null;
  currentUser: User | null;
  allUsers: User[]; 
  onInviteUser: (email: string, sphereId: string, message?: string) => Promise<{ success: boolean; message: string }>; // Updated prop
  onRemoveUserFromSphere: (userIdToRemove: string, sphereId: string) => Promise<boolean>;
}

interface CrownIconProps {
    className?: string;
    title?: string;
}
const CrownIcon: React.FC<CrownIconProps> = ({ className = "w-4 h-4", title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden={!title} role={title ? "img" : undefined}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324h5.383c.467 0 .727.537.36.883l-4.133 3.468a.563.563 0 00-.168.618l1.602 5.006a.563.563 0 01-.84.623l-4.25-3.5a.563.563 0 00-.652 0l-4.25 3.5a.563.563 0 01-.84-.623l1.602-5.006a.563.563 0 00-.168-.618L2.983 9.817c-.367-.346-.107-.883.36-.883h5.383a.563.563 0 00.475-.324L11.48 3.5z" />
    </svg>
);


export const ManageSphereModal: React.FC<ManageSphereModalProps> = ({
  isOpen,
  onClose,
  activeSphere,
  currentUser,
  allUsers, 
  onInviteUser,
  onRemoveUserFromSphere,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState(''); // Added state for invite message
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false); 

  useEffect(() => {
    if (isOpen && activeSphere) {
      setIsLoadingMembers(true);
      const sphereMembers = allUsers.filter(user => user.sphereIds.includes(activeSphere.id));
      setMembers(sphereMembers);
      setIsLoadingMembers(false);
      setInviteEmail('');
      setInviteMessage(''); // Reset message
      setInviteFeedback(null);
    }
  }, [isOpen, activeSphere, allUsers]);

  if (!isOpen || !activeSphere || !currentUser) return null;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteFeedback(null);
    if (!inviteEmail.trim()) {
      setInviteFeedback({ type: 'error', message: "E-postadress måste anges." });
      return;
    }
    setIsInviting(true);
    const result = await onInviteUser(inviteEmail.trim(), activeSphere.id, inviteMessage.trim() || undefined); // Pass message
    setInviteFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setInviteEmail(''); 
      setInviteMessage(''); // Clear message on success
    }
    setIsInviting(false);
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!activeSphere) return;
    if (window.confirm(`Är du säker på att du vill ta bort denna medlem från sfären "${activeSphere.name}"?`)) {
      const success = await onRemoveUserFromSphere(userIdToRemove, activeSphere.id);
      if (!success) {
        alert("Kunde inte ta bort medlemmen.");
      }
      // Member list will update via useEffect listening to allUsers prop change from App.tsx
    }
  };
  
  const isCurrentUserOwner = activeSphere.ownerId === currentUser.id;
  const isPersonal = isPersonalSphere(activeSphere);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="manage-sphere-modal-title">
      <div className="bg-card-bg dark:bg-dark-bg rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <SphereDisplay sphere={activeSphere} size="lg" />
            <h2 id="manage-sphere-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              Hantera Sfären "{activeSphere.name}"
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="!rounded-full !p-2" aria-label="Stäng modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto space-y-6">
          {/* Personal Sphere Warning */}
          {isPersonal && (
            <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Personlig Sfär</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Detta är din personliga sfär. Du kan inte bjuda in andra användare till denna sfär. 
                    Skapa en ny sfär om du vill dela innehåll med andra.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Member List Section */}
          <section>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Medlemmar ({members.length})</h3>
            {isLoadingMembers ? (
              <LoadingSpinner message="Laddar medlemmar..." />
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-text dark:text-slate-400">Inga medlemmar i denna sfär än.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {members.map(member => (
                  <li key={member.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-dark-bg/50 rounded-lg shadow-sm border border-border-color dark:border-dark-bg/30">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${member.avatarColor} text-white flex items-center justify-center text-xs font-semibold shadow-sm`}>
                        {member.initials}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{member.name}</span>
                      {member.id === activeSphere.ownerId && (
                        <CrownIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" title="Sfärägare" />
                      )}
                    </div>
                    {isCurrentUserOwner && member.id !== currentUser.id && (
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleRemoveMember(member.id)}
                        className="!text-xs !py-1 !px-2"
                      >
                        Ta bort
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Invite User Section - Only show for non-personal spheres */}
          {isCurrentUserOwner && !isPersonal && (
            <section className="pt-4 border-t border-border-color dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Bjud in Ny Medlem</h3>
              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <Input
                  id="inviteMemberEmail"
                  label="E-postadress till användaren"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={isInviting}
                  placeholder="användare@exempel.com"
                />
                <TextArea // Added TextArea for message
                  id="inviteMemberMessage"
                  label="Personligt meddelande (valfritt)"
                  placeholder="Skriv ett meddelande som visas i inbjudan..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={2}
                  className="text-sm min-h-[50px] max-h-28 !rounded-lg"
                  disabled={isInviting}
                  maxLength={200}
                />
                <Button 
                  type="submit" 
                  variant="accent" 
                  isLoading={isInviting} 
                  disabled={!inviteEmail.trim() || isInviting}
                  className="w-full sm:w-auto"
                >
                  Skicka Inbjudan
                </Button>
                {inviteFeedback && (
                  <p className={`text-sm mt-2 ${inviteFeedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-danger dark:text-red-400'}`}>
                    {inviteFeedback.message}
                  </p>
                )}
              </form>
            </section>
          )}
        </div>

        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Stäng</Button>
        </footer>
      </div>
    </div>
  );
};