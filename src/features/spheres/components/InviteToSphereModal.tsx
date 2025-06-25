import React, { useState } from 'react';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { TextArea } from '../../../../components/common/TextArea'; // Added TextArea
import { Sphere } from '../../../../types';

interface InviteToSphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, message?: string) => Promise<{success: boolean, message: string}>; // Updated to include message
  sphereToInviteTo: Sphere | null;
}

export const InviteToSphereModal: React.FC<InviteToSphereModalProps> = ({ isOpen, onClose, onInvite, sphereToInviteTo }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // Added state for message
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !sphereToInviteTo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!email.trim()) {
      setFeedback({ type: 'error', message: "E-postadress måste anges." });
      return;
    }
    setIsInviting(true);
    const result = await onInvite(email.trim(), message.trim() || undefined); // Pass message
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setEmail(''); 
      setMessage(''); // Clear message on success
      setTimeout(() => {
        onClose();
        setFeedback(null); 
      }, 2000); 
    }
    setIsInviting(false);
  };

  const handleCloseModal = () => {
    if (isInviting) return; 
    setEmail('');
    setMessage(''); // Clear message on close
    setFeedback(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="invite-to-sphere-modal-title">
      <div className="bg-card-bg dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <h2 id="invite-to-sphere-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Bjud in till "{sphereToInviteTo.name}"
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCloseModal} className="!rounded-full !p-2" aria-label="Stäng modal" disabled={isInviting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-grow overflow-y-auto"> {/* Reduced space-y */}
          <p className="text-sm text-muted-text dark:text-slate-400">
            Ange e-postadressen till den användare du vill bjuda in till sfären <span className="font-semibold text-slate-700 dark:text-slate-200">"{sphereToInviteTo.name}"</span>. 
            {/* Removed "Användaren måste redan ha ett konto" as invitations can be for new users too */}
          </p>
          <Input
            id="inviteeEmail"
            label="E-postadress till användaren"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={isInviting}
            maxLength={100}
          />
           <TextArea // Added TextArea for message
            id="inviteMessage"
            label="Personligt meddelande (valfritt)"
            placeholder="Skriv ett meddelande som visas i inbjudan..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="text-sm min-h-[60px] max-h-32 !rounded-lg"
            disabled={isInviting}
            maxLength={200}
          />
          
          {feedback && (
            <p className={`text-sm ${feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-danger dark:text-red-400'}`}>
              {feedback.message}
            </p>
          )}
        </form>

        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isInviting}>Avbryt</Button>
            <Button 
                variant="primary" 
                type="submit" 
                onClick={handleSubmit} 
                isLoading={isInviting} 
                disabled={!email.trim() || isInviting}
            >
              Bjud in Användare
            </Button>
        </footer>
      </div>
    </div>
  );
};