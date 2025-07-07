import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { User } from '../../types';

interface ImageBankSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveShowImageMetadataPreference: (show: boolean) => Promise<void>;
}

export const ImageBankSettingsModal: React.FC<ImageBankSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveShowImageMetadataPreference,
}) => {
  const [showImageMetadata, setShowImageMetadata] = useState<boolean>(!!currentUser.showImageMetadataInBank);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowImageMetadata(!!currentUser.showImageMetadataInBank);
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSaveShowImageMetadataPreference(showImageMetadata);
      // Potentially show success feedback before closing, or let App.tsx handle it
      // For now, just close on successful save.
      onClose(); 
    } catch (err: any) {
      setError(err.message || "Kunde inte spara inställningen för bildbank.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="image-bank-settings-modal-title">
      <div className="bg-card-bg dark:bg-dark-bg rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <h2 id="image-bank-settings-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Inställningar för Bildbanken
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!rounded-full !p-2" aria-label="Stäng modal" disabled={isSaving}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <div className="p-4 sm:p-5 space-y-6 flex-grow overflow-y-auto">
          <section>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Metadata Visning</h3>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border-color dark:border-dark-bg/30 bg-slate-50 dark:bg-dark-bg/50">
                <label htmlFor="showImageMetadataToggle" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    Visa teknisk metadata för bilder i bildbanken
                </label>
                <button
                    id="showImageMetadataToggle"
                    type="button"
                    role="switch"
                    aria-checked={showImageMetadata}
                    onClick={() => setShowImageMetadata(!showImageMetadata)}
                    className={`
                        relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800 dark:focus:ring-blue-400
                        ${showImageMetadata ? 'bg-primary dark:bg-blue-500' : 'bg-slate-300 dark:bg-dark-bg'}
                    `}
                    disabled={isSaving}
                >
                    <span className="sr-only">Visa teknisk metadata för bilder i bildbanken</span>
                    <span
                        className={`
                            inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out
                            ${showImageMetadata ? 'translate-x-6' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>
             <p className="text-xs text-muted-text dark:text-slate-400 mt-2 px-1">
                Visar en info-ikon på bilder i bildbanken som vid klick expanderar och visar filnamn, typ, dimensioner, EXIF-data etc.
            </p>
          </section>
          
          {error && <p className="text-sm text-danger dark:text-red-400 mt-4">{error}</p>}
        </div>

        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>Avbryt</Button>
            <Button variant="primary" type="button" onClick={handleSave} isLoading={isSaving}>
              Spara Inställningar
            </Button>
        </footer>
      </div>
    </div>
  );
};
